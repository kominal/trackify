import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { OmitType } from '@nestjs/swagger';
import { Model } from 'mongoose';
import { BaseEntity, TECHNICAL_KEYS_BASE_ENTITY } from '../models/core/entity.model';
import { StoredFile } from '../models/core/stored-file.model';

@Schema()
export class Tenant extends BaseEntity {
  @Prop() public name: string;
  @Prop() public logo?: StoredFile;
}

export type TenantModel = Model<Tenant>;

export const TenantSchema = SchemaFactory.createForClass(Tenant).index({ uuid: 1 }, { unique: true });

export class TenantCreateRequest extends OmitType(Tenant, [...TECHNICAL_KEYS_BASE_ENTITY, 'logo']) {}

export class TenantUpdateRequest extends OmitType(Tenant, TECHNICAL_KEYS_BASE_ENTITY) {}
