import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { OmitType } from '@nestjs/swagger';
import { Model } from 'mongoose';
import { TECHNICAL_KEYS, TenantEntity } from '../models/core/entity.model';

@Schema()
export class Task extends TenantEntity {
  @Prop() public projectId: string;
  @Prop() public name: string;
  @Prop() public color: string;
}

export type TaskModel = Model<Task>;

export const TaskSchema = SchemaFactory.createForClass(Task).index({ tenantId: 1 }).index({ tenantId: 1, uuid: 1 }, { unique: true });

export class TaskRequest extends OmitType(Task, TECHNICAL_KEYS) {}
