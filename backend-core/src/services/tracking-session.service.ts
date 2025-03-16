import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Record, RecordModel } from '../entities/record.entity';
import { TrackingSession, TrackingSessionModel, TrackingSessionRequest } from '../entities/tracking-session.entity';
import { UserContext } from '../helpers/context.decorator';
import { EntitiesPathParams } from '../helpers/entity-service.helper';
import { RecordService } from './record.service';

@Injectable()
export class TrackingSessionService {
  public constructor(
    @InjectModel(TrackingSession.name) private trackingSessionModel: TrackingSessionModel,
    @InjectModel(Record.name) private recordModel: RecordModel,
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
      const latestRecord = await this.recordModel.findOne({ ...params, taskId: trackingSession.taskId, userId: userContext.userId });
      if (latestRecord && latestRecord.start.getTime() === start.getTime()) {
        await latestRecord.updateOne({ end });
      } else if (duration > 5 * 60 * 1000) {
        await this.recordService.create(userContext, params, { taskId: trackingSession.taskId, start, end, userId: userContext.userId });
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

    let start = new Date();

    const latestRecord = await this.recordModel.findOne({ ...params, taskId: createRequest.taskId, userId: userContext.userId });
    if (latestRecord && new Date().getTime() - latestRecord.end.getTime() < 5 * 60 * 1000) {
      start = latestRecord.start;
    }

    await this.trackingSessionModel.updateOne({ ...params, userId: userContext.userId }, { ...createRequest, userId: userContext.userId, start }, { upsert: true, new: true });
  }

  public async delete(userContext: UserContext, params: EntitiesPathParams): Promise<void> {
    await this.stopTracking(userContext, params);
  }
}
