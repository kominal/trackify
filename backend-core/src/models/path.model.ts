import { IsUUID } from 'class-validator';

export class EntityPathParams {
  @IsUUID() public uuid: string;
}

export class TenantEntitiesPathParams {
  @IsUUID() public tenantId: string;
}

export class TenantEntityPathParams extends EntityPathParams {
  @IsUUID() public tenantId: string;
}
