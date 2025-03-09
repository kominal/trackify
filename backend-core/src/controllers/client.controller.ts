import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { Client, ClientRequest } from '../entities/client.entity';
import { TenantGuard } from '../guards/tenant.guard';
import { UserContext, UserCtx } from '../helpers/context.decorator';
import { CustomOperationName } from '../helpers/custom-operation-name.decorator';
import { EntitiesPathParams, EntityPathParams, ListParams, ListResponse, OpenApiPaginationResponse, OptionalEntityPathParams } from '../helpers/entity-service.helper';
import { ClientService } from '../services/client.service';

@UseGuards(TenantGuard)
@ApiTags('client-http')
@Controller('tenants/:tenantId/clients')
export class ClientController {
  public constructor(private clientService: ClientService) {}

  @Post()
  @CustomOperationName()
  public create(@UserCtx() userContext: UserContext, @Param() params: EntitiesPathParams, @Body() request: ClientRequest): Promise<Client> {
    return this.clientService.create(userContext, params, request);
  }

  @Get()
  @CustomOperationName()
  @OpenApiPaginationResponse(Client)
  public list(@Param() params: EntitiesPathParams, @Query() listParams: ListParams): Promise<ListResponse<Client>> {
    return this.clientService.list(params, listParams);
  }

  @Get(':uuid')
  @CustomOperationName()
  public read(@Param() params: EntityPathParams): Promise<Client> {
    return this.clientService.read(params);
  }

  @Patch(':uuid')
  @CustomOperationName()
  public update(@UserCtx() userContext: UserContext, @Param() params: EntityPathParams, @Body() request: ClientRequest): Promise<void> {
    return this.clientService.update(userContext, params, request);
  }

  @Put(':uuid')
  @CustomOperationName()
  @ApiOkResponse({ schema: { oneOf: [{ $ref: getSchemaPath(Client) }, { type: 'void' }] } })
  public upsert(@UserCtx() userContext: UserContext, @Param() params: OptionalEntityPathParams, @Body() request: ClientRequest): Promise<Client | void> {
    return this.clientService.upsert(userContext, params, request);
  }

  @Delete(':uuid')
  @CustomOperationName()
  public delete(@Param() params: EntityPathParams): Promise<void> {
    return this.clientService.delete(params);
  }
}
