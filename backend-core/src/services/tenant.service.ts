import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Membership, MembershipModel, MembershipStatus } from '../entities/membership.entity';
import { Tenant, TenantCreateRequest, TenantModel, TenantUpdateRequest } from '../entities/tenant.entity';
import { UserContext } from '../helpers/context.decorator';
import { created, EntityService, GlobalEntityPathParams, ListParams } from '../helpers/entity-service.helper';

@Injectable()
export class TenantService extends EntityService<Tenant, {}, GlobalEntityPathParams> {
  public constructor(
    @InjectModel(Tenant.name) private tenantModel: TenantModel,
    @InjectModel(Membership.name) private membershipModel: MembershipModel,
  ) {
    super(tenantModel);
  }

  public async createForUser(userContext: UserContext, request: TenantCreateRequest): Promise<Tenant> {
    const { name } = request;

    const tenant = await this.create(userContext, {}, { name });

    await this.membershipModel.create(
      created<Membership>(userContext, {
        tenantId: tenant.uuid,
        userId: userContext.userId,
        email: userContext.email,
        status: MembershipStatus.ACTIVE,
      }),
    );

    return tenant;
  }

  public async readForUser(uuid: string): Promise<Tenant> {
    return this.tenantModel.findOne({ uuid }).orFail(new HttpException('Tenant not found', 404));
  }

  public async listForUser(userContext: UserContext, listParams: ListParams): Promise<Tenant[]> {
    if (userContext.admin) {
      return this.tenantModel
        .find()
        .select(listParams.select || '')
        .exec();
    }

    const memberships = await this.membershipModel.find({ userId: userContext.userId });
    return this.tenantModel.find({ uuid: { $in: memberships.map((membership) => membership.tenantId) } });
  }

  public async updateForUser(userContext: UserContext, tenantId: string, request: TenantUpdateRequest): Promise<void> {
    return this.update(userContext, { uuid: tenantId }, { name: request.name, logo: request.logo });
  }
}
