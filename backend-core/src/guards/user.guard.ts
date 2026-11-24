import { MembershipEntity, MembershipModel, MembershipStatus } from '@entities/membership.entity';
import { UserEntity, UserModel } from '@entities/user.entity';
import { UserContext } from '@helpers/context.decorator';
import { AuthService } from '@services/auth.service';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { v4 } from 'uuid';

export const USER_GUARD_THROTTLE_MS = 5 * 60 * 1000;

let invitationGeneration = 0;

export function noteInvitationIssued(): void {
  invitationGeneration += 1;
}

interface ThrottledRun {
  at: number;
  generation: number;
  done: Promise<void>;
}

@Injectable()
export class UserGuard implements CanActivate {
  private readonly runs = new Map<string, ThrottledRun>();

  public constructor(
    @InjectModel(UserEntity.name) private userModel: UserModel,
    private authService: AuthService,
    @InjectModel(MembershipEntity.name) private membershipModel: MembershipModel,
  ) {}

  public async populateUserContext(context: ExecutionContext): Promise<UserContext | undefined> {
    const req = context.switchToHttp().getRequest();

    const userContext = await this.authService.getUserContext(req.headers.authorization);

    if (!userContext) {
      return undefined;
    }

    req.userContext = userContext;

    await this.throttled(`activity:${userContext.userId}`, 0, () => this.recordActivity(userContext));

    if (userContext.emailVerified && userContext.email) {
      const email = userContext.email.toLocaleLowerCase();
      await this.throttled(`invitations:${userContext.userId}:${email}`, invitationGeneration, () => this.acceptInvitations(userContext.userId, email));
    }

    return userContext;
  }

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const userContext = await this.populateUserContext(context);
    return !!userContext;
  }

  private async recordActivity(userContext: UserContext): Promise<void> {
    await this.userModel.updateOne(
      { userId: userContext.userId },
      {
        lastActivity: new Date(),
        email: userContext.email?.toLocaleLowerCase(),
        $setOnInsert: {
          uuid: v4(),
          createdAt: new Date(),
          createdBy: userContext.email,
          changedAt: new Date(),
          changedBy: userContext.email,
          version: 0,
        },
      },
      { upsert: true },
    );
  }

  private async acceptInvitations(userId: string, email: string): Promise<void> {
    const invitations = await this.membershipModel.find({ email, status: MembershipStatus.INVITED });
    await Promise.all(invitations.map(async (invitation) => invitation.updateOne({ userId, status: MembershipStatus.ACTIVE })));
  }

  private throttled(key: string, generation: number, task: () => Promise<void>): Promise<void> {
    const now = Date.now();
    const last = this.runs.get(key);
    if (last?.generation === generation && now - last.at < USER_GUARD_THROTTLE_MS) {
      return last.done;
    }

    for (const [runKey, entry] of this.runs) {
      if (now - entry.at >= USER_GUARD_THROTTLE_MS) {
        this.runs.delete(runKey);
      }
    }

    const run: ThrottledRun = { at: now, generation, done: Promise.resolve() };
    run.done = task().catch((error: unknown) => {
      if (this.runs.get(key) === run) {
        this.runs.delete(key);
      }
      throw error;
    });
    this.runs.set(key, run);
    return run.done;
  }
}
