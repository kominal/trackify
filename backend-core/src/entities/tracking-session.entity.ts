import { DateTransform, WithTenantEntity } from '@models/entity.model';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsDate, IsString, IsUUID } from 'class-validator';
import { Model } from 'mongoose';

// The timer that is running right now: at most one per user and organisation.
@Schema({ collection: 'tracking-sessions' })
export class TrackingSessionEntity extends WithTenantEntity {
  @Prop() @IsString() public userId: string;
  @Prop() @IsUUID() public taskId: string;
  @Prop() @IsDate() @DateTransform public start: Date;
}

export const TrackingSessionSchema = SchemaFactory.createForClass(TrackingSessionEntity).index({ tenantId: 1, userId: 1 }, { unique: true });
export type TrackingSessionModel = Model<TrackingSessionEntity>;

export class TrackingSessionRequest {
  @IsUUID() public taskId: string;
}
