import { BaseEntity } from '@models/entity.model';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Max, Min } from 'class-validator';
import { Model } from 'mongoose';

export const DEFAULT_REMINDER_MINUTES = 30;

@Schema({ collection: 'users' })
export class UserEntity extends BaseEntity {
  @Prop() @ApiProperty() @IsString() public userId: string;
  @Prop() @ApiProperty() @IsString() public email: string;
  @Prop() @ApiProperty() @IsString() public lastActivity: Date;
  // IANA time zone days are cut in on the dashboard.
  @Prop() @ApiProperty({ required: false }) public timeZone?: string;
  // Minutes without a change of the tracked task (or without tracking while the PC is in use) before the desktop app reminds.
  @Prop() @ApiProperty({ required: false }) public reminderMinutes?: number;
}

export const UserSchema = SchemaFactory.createForClass(UserEntity).index({ uuid: 1 }, { unique: true }).index({ userId: 1 });
export type UserModel = Model<UserEntity>;

export class UserSettings {
  @IsString() public timeZone: string;
  @IsInt() @Min(5) @Max(240) public reminderMinutes: number;
}
