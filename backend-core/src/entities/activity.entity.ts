import { DateTransform } from '@models/entity.model';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsDate, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Model } from 'mongoose';

export const ACTIVITY_RETENTION_DAYS = 180;

// What was in focus on the user's PC, reported by the desktop app. Belongs to the user, not to an
// organisation (the PC is the same whichever organisation the time is tracked for), and is only
// ever readable by that user. Deliberately lean: no uuid or audit fields, removed by a TTL index.
@Schema({ collection: 'activities' })
export class ActivityEntity {
  public _id: string;
  @Prop() @IsString() public userId: string;
  @Prop() @IsDate() @DateTransform public start: Date;
  @Prop() @IsDate() @DateTransform public end: Date;
  // Process name, e.g. "Code" or "chrome".
  @Prop() @IsString() @MaxLength(120) public app: string;
  @Prop() @IsString() @MaxLength(500) public title: string;
  // The user was away (no input for longer than the idle threshold) or the PC was locked.
  @Prop() @IsBoolean() public idle: boolean;
}

export const ActivitySchema = SchemaFactory.createForClass(ActivityEntity)
  .index({ userId: 1, start: 1 })
  .index({ end: 1 }, { expireAfterSeconds: ACTIVITY_RETENTION_DAYS * 24 * 60 * 60 });
export type ActivityModel = Model<ActivityEntity>;

export class ActivitySegment {
  @IsDate() @DateTransform public start: Date;
  @IsDate() @DateTransform public end: Date;
  @IsString() @MaxLength(120) public app: string;
  @IsString() @MaxLength(500) public title: string;
  @IsBoolean() public idle: boolean;
}

export class ActivityUploadRequest {
  @ApiProperty({ type: [ActivitySegment] }) @IsArray() @ArrayMaxSize(2000) @ValidateNested({ each: true }) @Type(() => ActivitySegment) public segments: ActivitySegment[];
}
