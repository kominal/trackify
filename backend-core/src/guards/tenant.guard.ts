import { CanActivate, ExecutionContext, HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Membership, MembershipModel } from '../entities/membership.entity';
import { UserGuard } from './user.guard';

@Injectable()
export class TenantGuard implements CanActivate {
  public constructor(
    @InjectModel(Membership.name) private membershipModel: MembershipModel,
    private userGuard: UserGuard,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const { tenantId } = req.params;

    if (!tenantId) {
      return false;
    }

    const bearerHeader = req.headers.authorization;

    if (!bearerHeader) {
      return false;
    }

    const [type, token] = bearerHeader.split(' ');

    if (type === 'Bearer') {
      const userContext = await this.userGuard.populateUserContext(context);

      if (!userContext) {
        return false;
      }

      if (userContext.admin) {
        return true;
      }

      await this.membershipModel.exists({ tenantId, userId: userContext.userId }).orFail(new HttpException('exception.notFound', 404));

      return true;
    }

    return false;
  }
}
