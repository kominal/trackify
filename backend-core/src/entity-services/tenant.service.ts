import { ClientEntity, ClientModel } from '@entities/client.entity';
import { ALL_PERMISSIONS, MembershipEntity, MembershipModel, MembershipStatus } from '@entities/membership.entity';
import { ProjectEntity, ProjectModel } from '@entities/project.entity';
import { TaskEntity, TaskModel } from '@entities/task.entity';
import { TenantCreateRequest, TenantEntity, TenantModel, TenantUpdateRequest } from '@entities/tenant.entity';
import { TimeEntryEntity, TimeEntryModel } from '@entities/time-entry.entity';
import { TrackingSessionEntity, TrackingSessionModel } from '@entities/tracking-session.entity';
import { UserContext } from '@helpers/context.decorator';
import { created, parseFilter } from '@helpers/entity-service.helper';
import { getTenantCreation } from '@helpers/environment';
import { ListParams, ListResponse } from '@models/list.model';
import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { RootFilterQuery } from 'mongoose';

@Injectable()
export class TenantService {
  public constructor(
    @InjectModel(TenantEntity.name) private readonly tenantModel: TenantModel,
    @InjectModel(MembershipEntity.name) private readonly membershipModel: MembershipModel,
    @InjectModel(ClientEntity.name) private readonly clientModel: ClientModel,
    @InjectModel(ProjectEntity.name) private readonly projectModel: ProjectModel,
    @InjectModel(TaskEntity.name) private readonly taskModel: TaskModel,
    @InjectModel(TimeEntryEntity.name) private readonly timeEntryModel: TimeEntryModel,
    @InjectModel(TrackingSessionEntity.name) private readonly trackingSessionModel: TrackingSessionModel,
  ) {}

  public async create(userContext: UserContext, tenantCreateRequest: TenantCreateRequest): Promise<TenantEntity> {
    if (getTenantCreation() === 'ADMIN' && !userContext.admin) {
      throw new HttpException('exception.forbidden', 403);
    }

    const tenant = await this.tenantModel.create(created<TenantEntity>(userContext, { name: tenantCreateRequest.name }));

    await this.membershipModel.create(
      created<MembershipEntity>(userContext, {
        userId: userContext.userId,
        tenantId: tenant.uuid,
        email: userContext.email?.toLocaleLowerCase(),
        status: MembershipStatus.ACTIVE,
        permissions: ALL_PERMISSIONS,
      }),
    );

    return tenant.toObject();
  }

  public async read(uuid: string): Promise<TenantEntity> {
    return this.tenantModel.findOne({ uuid }).lean<TenantEntity>().orFail(new HttpException('exception.notFound', 404));
  }

  public async list(userContext: UserContext, { active, direction, pageIndex, pageSize, filter }: ListParams): Promise<ListResponse<TenantEntity>> {
    const evaluatedFilter: RootFilterQuery<TenantEntity> & { uuid?: { $in: string[] } } = { ...parseFilter(filter) };

    // Tenants are listed by membership only, also for administrators: the tenant picker shows the
    // user's own organisations (administrators can still open any tenant by its address).
    const memberships = await this.membershipModel.find({ userId: userContext.userId, status: MembershipStatus.ACTIVE });
    evaluatedFilter.uuid = { $in: memberships.map((membership) => membership.tenantId) };

    let query = this.tenantModel.find(evaluatedFilter).sort({ [active ?? 'name']: direction ?? 'asc' });

    if (pageIndex && pageSize) {
      query = query.skip(pageIndex * pageSize);
    }
    if (pageSize) {
      query = query.limit(pageSize);
    }

    const items = await query.lean<TenantEntity[]>();
    const count = await this.tenantModel.countDocuments(evaluatedFilter);
    return { items, count };
  }

  public async update(userContext: UserContext, tenantId: string, body: TenantUpdateRequest): Promise<void> {
    const { matchedCount } = await this.tenantModel.updateOne({ uuid: tenantId }, { name: body.name, changedAt: new Date(), changedBy: userContext.email, $inc: { version: 1 } });
    if (matchedCount === 0) {
      throw new HttpException('exception.notFound', 404);
    }
  }

  // Deleting an organisation is restricted to global administrators (Keycloak `administrator` role).
  // Window activity belongs to users, not to organisations, and stays.
  public async delete(userContext: UserContext, uuid: string): Promise<void> {
    if (!userContext.admin) {
      throw new HttpException('exception.forbidden', 403);
    }

    const path = { tenantId: uuid };
    await this.tenantModel.deleteOne({ uuid });
    await this.trackingSessionModel.deleteMany(path);
    await this.timeEntryModel.deleteMany(path);
    await this.taskModel.deleteMany(path);
    await this.projectModel.deleteMany(path);
    await this.clientModel.deleteMany(path);
    await this.membershipModel.deleteMany(path);
  }
}
