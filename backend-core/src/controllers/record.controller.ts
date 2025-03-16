import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { Record, RecordRequest } from '../entities/record.entity';
import { TenantGuard } from '../guards/tenant.guard';
import { UserContext, UserCtx } from '../helpers/context.decorator';
import { CustomOperationName } from '../helpers/custom-operation-name.decorator';
import { EntitiesPathParams, EntityPathParams, ListParams, ListResponse, OpenApiPaginationResponse, OptionalEntityPathParams } from '../helpers/entity-service.helper';
import { RecordService } from '../services/record.service';

@UseGuards(TenantGuard)
@ApiTags('record-http')
@Controller('tenants/:tenantId/records')
export class RecordController {
  public constructor(private recordService: RecordService) {}

  @Post()
  @CustomOperationName()
  public create(@UserCtx() userContext: UserContext, @Param() params: EntitiesPathParams, @Body() request: RecordRequest): Promise<Record> {
    return this.recordService.create(userContext, params, { ...request, userId: userContext.userId });
  }

  @Get()
  @CustomOperationName()
  @OpenApiPaginationResponse(Record)
  public list(@Param() params: EntitiesPathParams, @Query() listParams: ListParams): Promise<ListResponse<Record>> {
    return this.recordService.list(params, listParams);
  }

  @Get(':uuid')
  @CustomOperationName()
  public read(@Param() params: EntityPathParams): Promise<Record> {
    return this.recordService.read(params);
  }

  @Patch(':uuid')
  @CustomOperationName()
  public update(@UserCtx() userContext: UserContext, @Param() params: EntityPathParams, @Body() request: RecordRequest): Promise<void> {
    return this.recordService.update(userContext, params, { ...request, userId: userContext.userId });
  }

  @Put('{:uuid}')
  @CustomOperationName()
  @ApiOkResponse({ schema: { oneOf: [{ $ref: getSchemaPath(Record) }, { type: 'void' }] } })
  public upsert(@UserCtx() userContext: UserContext, @Param() params: OptionalEntityPathParams, @Body() request: RecordRequest): Promise<Record | void> {
    return this.recordService.upsert(userContext, params, { ...request, userId: userContext.userId });
  }

  @Delete(':uuid')
  @CustomOperationName()
  public delete(@Param() params: EntityPathParams): Promise<void> {
    return this.recordService.delete(params);
  }
}
