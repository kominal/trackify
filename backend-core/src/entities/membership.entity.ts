import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Model } from 'mongoose';
import { TenantEntity } from '../models/core/entity.model';

export enum MembershipStatus {
  INVITED = 'INVITED',
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED',
}
export const MembershipStatusDecorator = ApiProperty({ enum: MembershipStatus, enumName: 'MembershipStatus' });

@Schema()
export class Membership extends TenantEntity {
  @Prop() public userId: string;
  @Prop() public email: string;
  @Prop() public permissions: string[];
  @Prop() public roles: string[];
  @Prop() @MembershipStatusDecorator public status: MembershipStatus;
}

export type MembershipModel = Model<Membership>;

export const MembershipSchema = SchemaFactory.createForClass(Membership)
  .index({ tenantId: 1 })
  .index({ tenantId: 1, uuid: 1 }, { unique: true })
  .index({ tenantId: 1, userId: 1 }, { unique: true });

export class MembershipCreateRequest {
  public email: string;
}

export class MembershipUpdateRequest {
  public permissions: string[];
}

export class MembershipPathParams {
  public userId: string;
}
