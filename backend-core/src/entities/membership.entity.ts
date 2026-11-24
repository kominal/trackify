import { TECHNICAL_KEYS_TENANT_ENTITY, WithTenantEntity } from '@models/entity.model';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsString } from 'class-validator';
import { Model } from 'mongoose';

export enum MembershipStatus {
  INVITED = 'INVITED',
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED',
}
export const MembershipStatusDecorator = ApiProperty({ enum: MembershipStatus, enumName: 'MembershipStatus' });

export enum MembershipPermission {
  // Organisation name.
  MANAGE_TENANT = 'MANAGE_TENANT',
  // Invite, edit and remove members.
  MANAGE_MEMBERSHIPS = 'MANAGE_MEMBERSHIPS',
  // Create, edit and delete clients, projects and tasks. Every member may track time on them.
  MANAGE_CATALOG = 'MANAGE_CATALOG',
}
export const ALL_PERMISSIONS = Object.values(MembershipPermission);
export const MembershipPermissionsDecorator = ApiProperty({ enum: MembershipPermission, enumName: 'MembershipPermission', isArray: true });

@Schema({ collection: 'memberships' })
export class MembershipEntity extends WithTenantEntity {
  @Prop() @IsString() public userId: string;
  @Prop() @IsEmail() public email: string;
  @Prop() @IsEnum(MembershipPermission, { each: true }) @MembershipPermissionsDecorator public permissions: MembershipPermission[];
  @Prop() @IsEnum(MembershipStatus) @MembershipStatusDecorator public status: MembershipStatus;
}

export const MembershipSchema = SchemaFactory.createForClass(MembershipEntity).index({ tenantId: 1, uuid: 1 }, { unique: true }).index({ tenantId: 1, userId: 1 }).index({ userId: 1 }).index({ email: 1, status: 1 });
export type MembershipModel = Model<MembershipEntity>;

export class MembershipCreateRequest {
  @IsEmail() public email: string;
  @IsEnum(MembershipPermission, { each: true }) @MembershipPermissionsDecorator public permissions: MembershipPermission[];
}

export class MembershipUpdateRequest {
  @IsEnum(MembershipPermission, { each: true }) @MembershipPermissionsDecorator public permissions: MembershipPermission[];
}

export class MembershipResponse extends OmitType(MembershipEntity, TECHNICAL_KEYS_TENANT_ENTITY) {}
