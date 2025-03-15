import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { TrackingSession, TrackingSessionModel, TrackingSessionRequest } from '../entities/tracking-session.entity';
import { UserContext } from '../helpers/context.decorator';
import { EntitiesPathParams } from '../helpers/entity-service.helper';
import { RecordService } from './record.service';

@Injectable()
export class TrackingSessionService {
  public constructor(
    @InjectModel(TrackingSession.name) private trackingSessionModel: TrackingSessionModel,
    private recordService: RecordService,
  ) {}

  private getCurrentMinute(): Date {
    const now = new Date();
    now.setSeconds(0);
    now.setMilliseconds(0);
    return now;
  }

  public async read(userContext: UserContext, params: EntitiesPathParams): Promise<TrackingSession | null> {
    return this.trackingSessionModel.findOne({ ...params, userId: userContext.userId }).lean();
  }

  private async stopTracking(userContext: UserContext, params: EntitiesPathParams): Promise<void> {
    const trackingSession = await this.read(userContext, params);
    if (trackingSession) {
      const start = trackingSession.start;
      start.setSeconds(0);
      start.setMilliseconds(0);
      start.setMinutes(start.getMinutes() + 1);
      const end = this.getCurrentMinute();
      const duration = end.getTime() - start.getTime();
      if (duration > 5 * 60 * 1000) {
        await this.recordService.create(userContext, params, { taskId: trackingSession.taskId, start, end });
      }
    }
    await this.trackingSessionModel.deleteOne({ ...params, userId: userContext.userId }).lean();
  }

  public async upsert(userContext: UserContext, params: EntitiesPathParams, createRequest: TrackingSessionRequest): Promise<void> {
    const trackingSession = await this.read(userContext, params);

    if (trackingSession && trackingSession.taskId === createRequest.taskId) {
      return;
    }

    await this.stopTracking(userContext, params);
    await this.trackingSessionModel
      .updateOne({ ...params, userId: userContext.userId }, { ...createRequest, userId: userContext.userId, start: new Date() }, { upsert: true, new: true })
      .lean();
  }

  public async delete(userContext: UserContext, params: EntitiesPathParams): Promise<void> {
    await this.stopTracking(userContext, params);
  }
}
