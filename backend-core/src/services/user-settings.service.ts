import { DEFAULT_REMINDER_MINUTES, UserEntity, UserModel, UserSettings } from '@entities/user.entity';
import { UserContext } from '@helpers/context.decorator';
import { DEFAULT_TIME_ZONE, isValidTimeZone } from '@helpers/time-zone.helper';
import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class UserSettingsService {
  public constructor(@InjectModel(UserEntity.name) private readonly userModel: UserModel) {}

  public async read(userContext: UserContext): Promise<UserSettings> {
    const user = await this.userModel.findOne({ userId: userContext.userId }).lean<UserEntity>();
    return {
      timeZone: isValidTimeZone(user?.timeZone) ? user.timeZone : DEFAULT_TIME_ZONE,
      reminderMinutes: user?.reminderMinutes ?? DEFAULT_REMINDER_MINUTES,
    };
  }

  public async update(userContext: UserContext, { timeZone, reminderMinutes }: UserSettings): Promise<void> {
    if (!isValidTimeZone(timeZone)) {
      throw new HttpException('exception.invalidTimeZone', 400);
    }
    // The user guard creates the document on the first request, so it exists here.
    await this.userModel.updateOne({ userId: userContext.userId }, { timeZone, reminderMinutes, changedAt: new Date(), changedBy: userContext.email });
  }
}
