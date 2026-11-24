import { BaseEntity } from '@models/entity.model';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { PickType } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { Model } from 'mongoose';

@Schema({ collection: 'tenants' })
export class TenantEntity extends BaseEntity {
  @Prop() @IsString() @MinLength(1) @MaxLength(120) public name: string;
}

export const TenantSchema = SchemaFactory.createForClass(TenantEntity).index({ uuid: 1 }, { unique: true });
export type TenantModel = Model<TenantEntity>;

export class TenantCreateRequest extends PickType(TenantEntity, ['name']) {}

export class TenantUpdateRequest extends PickType(TenantEntity, ['name']) {}
