import { TimeEntryEntity, TimeEntryRequest } from '@entities/time-entry.entity';
import { TimeEntryService } from '@entity-services/time-entry.service';
import { TenantGuard } from '@guards/tenant.guard';
import { UserContext, UserCtx } from '@helpers/context.decorator';
import { CustomOperationName } from '@helpers/custom-operation-name.decorator';
import { ListParams, ListResponse, OpenApiPaginationResponse } from '@models/list.model';
import { TenantEntitiesPathParams, TenantEntityPathParams } from '@models/path.model';
import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

// Own time only: the service scopes every call to the signed-in user.
@UseGuards(TenantGuard)
@ApiTags('time-entry-http')
@Controller('tenants/:tenantId/time-entries')
export class TimeEntryController {
  public constructor(private readonly service: TimeEntryService) {}

  @Post()
  @CustomOperationName()
  public create(@UserCtx() userContext: UserContext, @Param() params: TenantEntitiesPathParams, @Body() request: TimeEntryRequest): Promise<TimeEntryEntity> {
    return this.service.create(userContext, params, request);
  }

  @Get()
  @CustomOperationName()
  @OpenApiPaginationResponse(TimeEntryEntity)
  public list(@UserCtx() userContext: UserContext, @Param() params: TenantEntitiesPathParams, @Query() listParams: ListParams): Promise<ListResponse<TimeEntryEntity>> {
    return this.service.list(userContext, params, listParams);
  }

  @Get(':uuid')
  @CustomOperationName()
  public read(@UserCtx() userContext: UserContext, @Param() params: TenantEntityPathParams): Promise<TimeEntryEntity> {
    return this.service.read(userContext, params);
  }

  @Put(':uuid')
  @CustomOperationName()
  public update(@UserCtx() userContext: UserContext, @Param() params: TenantEntityPathParams, @Body() request: TimeEntryRequest): Promise<void> {
    return this.service.update(userContext, params, request);
  }

  @Delete(':uuid')
  @CustomOperationName()
  public delete(@UserCtx() userContext: UserContext, @Param() params: TenantEntityPathParams): Promise<void> {
    return this.service.delete(userContext, params);
  }
}
