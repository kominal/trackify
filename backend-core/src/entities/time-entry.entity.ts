import { DateTransform, TECHNICAL_KEYS_TENANT_ENTITY, WithTenantEntity } from '@models/entity.model';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsDate, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { Model } from 'mongoose';

// A finished block of tracked time. Always owned by one user: every query filters by userId.
@Schema({ collection: 'time-entries' })
export class TimeEntryEntity extends WithTenantEntity {
  @Prop() @IsUUID() public taskId: string;
  @Prop() @IsString() public userId: string;
  @Prop() @IsDate() @DateTransform public start: Date;
  @Prop() @IsDate() @DateTransform public end: Date;
  @Prop() @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(500) public note?: string;
}

export const TimeEntrySchema = SchemaFactory.createForClass(TimeEntryEntity).index({ tenantId: 1, uuid: 1 }, { unique: true }).index({ tenantId: 1, userId: 1, start: 1 }).index({ tenantId: 1, userId: 1, taskId: 1, end: -1 });
export type TimeEntryModel = Model<TimeEntryEntity>;

export class TimeEntryRequest extends OmitType(TimeEntryEntity, [...TECHNICAL_KEYS_TENANT_ENTITY, 'uuid', 'version', 'userId']) {}
