import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { OmitType } from '@nestjs/swagger';
import { Model } from 'mongoose';
import { TECHNICAL_KEYS, TenantEntity } from '../models/core/entity.model';

@Schema()
export class Client extends TenantEntity {
  @Prop() public name: string;
}

export type ClientModel = Model<Client>;

export const ClientSchema = SchemaFactory.createForClass(Client).index({ tenantId: 1 }).index({ tenantId: 1, uuid: 1 }, { unique: true });

export class ClientRequest extends OmitType(Client, TECHNICAL_KEYS) {}
