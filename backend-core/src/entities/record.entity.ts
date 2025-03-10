import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { OmitType } from '@nestjs/swagger';
import { Model } from 'mongoose';
import { TECHNICAL_KEYS, TenantEntity } from '../models/core/entity.model';

@Schema()
export class Record extends TenantEntity {
  @Prop() public taskId: string;
  @Prop() public name: string;
  @Prop() public duration: number;
}

export type RecordModel = Model<Record>;

export const RecordSchema = SchemaFactory.createForClass(Record).index({ tenantId: 1 }).index({ tenantId: 1, uuid: 1 }, { unique: true });

export class RecordRequest extends OmitType(Record, TECHNICAL_KEYS) {}
