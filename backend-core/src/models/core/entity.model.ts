import { Prop } from '@nestjs/mongoose';

export abstract class BaseEntity {
  public _id: string;
  @Prop() public uuid: string;
  @Prop() public createdAt: Date;
  @Prop() public createdBy: string;
  @Prop() public updatedAt: Date;
  @Prop() public updatedBy: string;
  @Prop() public version: number;
}

export const TECHNICAL_KEYS_BASE_ENTITY: (keyof BaseEntity)[] = ['_id', 'uuid', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy', 'version'];

export abstract class TenantEntity extends BaseEntity {
  @Prop() public tenantId: string;
}

export const TECHNICAL_KEYS: (keyof TenantEntity)[] = [...TECHNICAL_KEYS_BASE_ENTITY, 'tenantId'];
