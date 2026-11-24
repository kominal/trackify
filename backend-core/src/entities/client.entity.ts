import { TECHNICAL_KEYS_TENANT_ENTITY, WithTenantEntity } from '@models/entity.model';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Model } from 'mongoose';

@Schema({ collection: 'clients' })
export class ClientEntity extends WithTenantEntity {
  @Prop() @IsString() @MinLength(1) @MaxLength(120) public name: string;
}

export const ClientSchema = SchemaFactory.createForClass(ClientEntity).index({ tenantId: 1, uuid: 1 }, { unique: true });
export type ClientModel = Model<ClientEntity>;

export class ClientRequest extends OmitType(ClientEntity, [...TECHNICAL_KEYS_TENANT_ENTITY, 'uuid', 'version']) {
  // Required for updates (optimistic locking), ignored on create.
  @ApiProperty({ required: false }) @IsOptional() @IsInt() public version?: number;
}
