import { Color } from '@models/color.model';
import { TECHNICAL_KEYS_TENANT_ENTITY, WithTenantEntity } from '@models/entity.model';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { Model } from 'mongoose';

@Schema({ collection: 'tasks' })
export class TaskEntity extends WithTenantEntity {
  @Prop() @IsUUID() public projectId: string;
  @Prop() @IsString() @MinLength(1) @MaxLength(120) public name: string;
  // Overrides the project's colour when set.
  @Prop() @ApiProperty({ enum: Color, enumName: 'Color', required: false }) @IsOptional() @IsEnum(Color) public color?: Color;
  // Order of the task tiles on the tracking page (and of the shortcut cycle), ascending.
  @Prop({ default: 0 }) @IsInt() public priority: number;
  @Prop({ default: false }) @IsBoolean() public archived: boolean;
}

export const TaskSchema = SchemaFactory.createForClass(TaskEntity).index({ tenantId: 1, uuid: 1 }, { unique: true }).index({ tenantId: 1, projectId: 1 });
export type TaskModel = Model<TaskEntity>;

export class TaskRequest extends OmitType(TaskEntity, [...TECHNICAL_KEYS_TENANT_ENTITY, 'uuid', 'version']) {
  // Required for updates (optimistic locking), ignored on create.
  @ApiProperty({ required: false }) @IsOptional() @IsInt() public version?: number;
}
