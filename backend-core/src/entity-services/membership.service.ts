import { ALL_PERMISSIONS, MembershipCreateRequest, MembershipEntity, MembershipModel, MembershipPermission, MembershipStatus, MembershipUpdateRequest } from '@entities/membership.entity';
import { TenantEntity, TenantModel } from '@entities/tenant.entity';
import { UserEntity, UserModel } from '@entities/user.entity';
import { noteInvitationIssued } from '@guards/user.guard';
import { UserContext } from '@helpers/context.decorator';
import { parseFilter } from '@helpers/entity-service.helper';
import { getBaseUrl } from '@helpers/environment';
import { ListParams, ListResponse } from '@models/list.model';
import { TenantEntitiesPathParams, TenantEntityPathParams } from '@models/path.model';
import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { MailService } from '@services/mail.service';
import { v4 } from 'uuid';

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

@Injectable()
export class MembershipService {
  public constructor(
    @InjectModel(TenantEntity.name) private readonly tenantModel: TenantModel,
    @InjectModel(MembershipEntity.name) private readonly model: MembershipModel,
    @InjectModel(UserEntity.name) private readonly userModel: UserModel,
    private readonly mailService: MailService,
  ) {}

  public async create(userContext: UserContext, entitiesPathParams: TenantEntitiesPathParams, membershipCreateRequest: MembershipCreateRequest): Promise<void> {
    const email = membershipCreateRequest.email.toLocaleLowerCase();

    const tenant = await this.tenantModel.findOne({ uuid: entitiesPathParams.tenantId }).orFail(new HttpException('exception.notFound', 404));

    const users = await this.userModel.find({ email });

    if (users.length > 0) {
      for (const user of users) {
        await this.model.updateOne(
          { tenantId: tenant.uuid, userId: user.userId },
          {
            email,
            status: MembershipStatus.ACTIVE,
            uuid: v4(),
            createdAt: new Date(),
            createdBy: userContext.email,
            changedAt: new Date(),
            changedBy: userContext.email,
            permissions: membershipCreateRequest.permissions,
          },
          { upsert: true },
        );
      }
    } else {
      await this.model.updateOne(
        { tenantId: entitiesPathParams.tenantId, email },
        {
          status: MembershipStatus.INVITED,
          uuid: v4(),
          createdAt: new Date(),
          createdBy: userContext.email,
          changedAt: new Date(),
          changedBy: userContext.email,
          permissions: membershipCreateRequest.permissions,
        },
        { upsert: true },
      );
    }

    // The invited person may already be signed in: let the user guard re-check invitations at once.
    noteInvitationIssued();

    const link = `https://${getBaseUrl()}/tenants/${tenant.uuid}`;

    await this.mailService.sendMail(email, 'Einladung zu Kominal Trackify', `<p>Du wurdest in die Organisation <b>${escapeHtml(tenant.name)}</b> bei Kominal Trackify eingeladen.</p><p><a href="${link}">${link}</a></p>`);
  }

  public async list(entitiesPathParams: TenantEntitiesPathParams, { active, direction, pageIndex, pageSize, filter }: ListParams): Promise<ListResponse<MembershipEntity>> {
    const evaluatedFilter = { ...parseFilter(filter), ...entitiesPathParams };

    let query = this.model.find(evaluatedFilter).sort({ [active ?? 'email']: direction ?? 'asc' });

    if (pageIndex && pageSize) {
      query = query.skip(pageIndex * pageSize);
    }
    if (pageSize) {
      query = query.limit(pageSize);
    }

    const items = await query.lean<MembershipEntity[]>();
    const count = await this.model.countDocuments(evaluatedFilter);
    return { items, count };
  }

  public async read(params: TenantEntityPathParams): Promise<MembershipEntity> {
    return this.model.findOne(params).lean<MembershipEntity>().orFail(new HttpException('exception.notFound', 404));
  }

  public async readCurrentMembership(userContext: UserContext, entitiesPathParams: TenantEntitiesPathParams): Promise<MembershipEntity> {
    if (userContext.admin) {
      const membership = await this.model.findOne({ ...entitiesPathParams, userId: userContext.userId }).lean<MembershipEntity>();
      // Global administrators may enter tenants they are not a member of — synthesize a full-permission membership.
      return (
        membership ??
        ({
          uuid: v4(),
          tenantId: entitiesPathParams.tenantId,
          userId: userContext.userId,
          email: userContext.email,
          permissions: ALL_PERMISSIONS,
          status: MembershipStatus.ACTIVE,
        } as MembershipEntity)
      );
    }
    return this.model
      .findOne({ ...entitiesPathParams, userId: userContext.userId })
      .lean<MembershipEntity>()
      .orFail(new HttpException('exception.notFound', 404));
  }

  public async update(userContext: UserContext, entityPathParams: TenantEntityPathParams, body: MembershipUpdateRequest): Promise<void> {
    const membership = await this.model.findOne(entityPathParams).orFail(new HttpException('exception.notFound', 404));

    // A user must not demote themselves out of MANAGE_MEMBERSHIPS — the organisation could end up unmanageable.
    if (!userContext.admin && membership.userId === userContext.userId && !body.permissions.includes(MembershipPermission.MANAGE_MEMBERSHIPS)) {
      throw new HttpException('exception.forbidden', 403);
    }

    membership.permissions = body.permissions;
    membership.changedAt = new Date();
    membership.changedBy = userContext.email;

    await membership.save();
  }

  public async delete(userContext: UserContext, entityPathParams: TenantEntityPathParams): Promise<void> {
    const membership = await this.model.findOne(entityPathParams).orFail(new HttpException('exception.notFound', 404));
    if (membership.userId === userContext.userId) {
      return;
    }

    await this.model.deleteOne(entityPathParams);
  }
}
