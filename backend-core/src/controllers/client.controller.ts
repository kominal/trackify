import { ClientEntity, ClientRequest } from '@entities/client.entity';
import { MembershipPermission } from '@entities/membership.entity';
import { ClientService } from '@entity-services/client.service';
import { Permissions, TenantGuard } from '@guards/tenant.guard';
import { UserContext, UserCtx } from '@helpers/context.decorator';
import { CustomOperationName } from '@helpers/custom-operation-name.decorator';
import { ListParams, ListResponse, OpenApiPaginationResponse } from '@models/list.model';
import { TenantEntitiesPathParams, TenantEntityPathParams } from '@models/path.model';
import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@UseGuards(TenantGuard)
@ApiTags('client-http')
@Controller('tenants/:tenantId/clients')
export class ClientController {
  public constructor(private readonly service: ClientService) {}

  @Post()
  @Permissions(MembershipPermission.MANAGE_CATALOG)
  @CustomOperationName()
  public create(@UserCtx() userContext: UserContext, @Param() params: TenantEntitiesPathParams, @Body() request: ClientRequest): Promise<ClientEntity> {
    return this.service.create(userContext, params, request);
  }

  @Get()
  @CustomOperationName()
  @OpenApiPaginationResponse(ClientEntity)
  public list(@Param() params: TenantEntitiesPathParams, @Query() listParams: ListParams): Promise<ListResponse<ClientEntity>> {
    return this.service.list(params, listParams);
  }

  @Get(':uuid')
  @CustomOperationName()
  public read(@Param() params: TenantEntityPathParams): Promise<ClientEntity> {
    return this.service.read(params);
  }

  @Put(':uuid')
  @Permissions(MembershipPermission.MANAGE_CATALOG)
  @CustomOperationName()
  public update(@UserCtx() userContext: UserContext, @Param() params: TenantEntityPathParams, @Body() request: ClientRequest): Promise<void> {
    return this.service.update(userContext, params, request);
  }

  @Delete(':uuid')
  @Permissions(MembershipPermission.MANAGE_CATALOG)
  @CustomOperationName()
  public async delete(@Param() params: TenantEntityPathParams): Promise<void> {
    await this.service.delete(params);
  }
}
