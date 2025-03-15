import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { OmitType } from '@nestjs/swagger';
import { Model } from 'mongoose';
import { TECHNICAL_KEYS, TenantEntity } from '../models/core/entity.model';

@Schema()
export class TrackingSession extends TenantEntity {
  @Prop() public userId: string;
  @Prop() public taskId: string;
  @Prop() public start: Date;
}

export type TrackingSessionModel = Model<TrackingSession>;

export const TrackingSessionSchema = SchemaFactory.createForClass(TrackingSession).index({ tenantId: 1 }).index({ tenantId: 1, uuid: 1 }, { unique: true });

export class TrackingSessionRequest extends OmitType(TrackingSession, [...TECHNICAL_KEYS, 'start', 'userId']) {}
