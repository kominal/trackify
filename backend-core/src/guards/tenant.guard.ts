import { ALL_PERMISSIONS, MembershipEntity, MembershipModel, MembershipPermission, MembershipStatus } from '@entities/membership.entity';
import { TenantEntity, TenantModel } from '@entities/tenant.entity';
import { UserGuard } from '@guards/user.guard';
import { UserContext } from '@helpers/context.decorator';
import { AccessTokenModel as CommonAccessTokenModel, MembershipModel as CommonMembershipModel, TenantGuard as CommonTenantGuard, UserGuard as CommonUserGuard, TenantGuardAccessTokenResult } from '@kominal/common-nestjs';
import { ExecutionContext, HttpException, Injectable, Logger, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: MembershipPermission[]) => SetMetadata(PERMISSIONS_KEY, permissions);

// Same shape as flow's guard: the shared TenantGuard does the authentication flow, this subclass
// supplies trackify's entities and the @Permissions check. Trackify has no user access tokens, so the
// `AccessToken` scheme is always refused.
@Injectable()
export class TenantGuard extends CommonTenantGuard {
  private readonly logger = new Logger(TenantGuard.name);

  private readonly memberships: MembershipModel;

  public constructor(
    @InjectModel(MembershipEntity.name) membershipModel: MembershipModel,
    @InjectModel(TenantEntity.name) private tenantModel: TenantModel,
    private reflector: Reflector,
    userGuard: UserGuard,
  ) {
    super(membershipModel as unknown as CommonMembershipModel, undefined as unknown as CommonAccessTokenModel, userGuard as unknown as CommonUserGuard);
    this.memberships = membershipModel;
  }

  protected override async beforeAuthentication(_context: ExecutionContext, tenantId: string): Promise<void> {
    await this.tenantModel.findOne({ uuid: tenantId }).orFail(new HttpException('exception.notFound', 404));
  }

  protected override async resolveMembership(tenantId: string, userId: string): Promise<MembershipEntity> {
    return this.memberships.findOne({ tenantId, userId, status: MembershipStatus.ACTIVE }).orFail(new HttpException('exception.notFound', 404));
  }

  protected override authenticateAccessToken(): Promise<TenantGuardAccessTokenResult | false> {
    return Promise.resolve(false);
  }

  protected override authorize(context: ExecutionContext, tenantId: string, userContext: UserContext, membership?: MembershipEntity): Promise<boolean> {
    if (userContext.admin) {
      return Promise.resolve(true);
    }

    if (!membership) {
      return Promise.resolve(false);
    }

    const required = this.reflector.getAllAndOverride<MembershipPermission[] | undefined>(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!required || required.length === 0 || required.some((permission) => membership.permissions.includes(permission))) {
      return Promise.resolve(true);
    }

    this.logger.warn(`Permission denied: user ${userContext.userId} in tenant ${tenantId} lacks any of [${required.join(', ')}]`);

    throw new HttpException('exception.forbidden', 403);
  }
}

export { ALL_PERMISSIONS };
