import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { Task, TaskRequest } from '../entities/task.entity';
import { TenantGuard } from '../guards/tenant.guard';
import { UserContext, UserCtx } from '../helpers/context.decorator';
import { CustomOperationName } from '../helpers/custom-operation-name.decorator';
import { EntitiesPathParams, EntityPathParams, ListParams, ListResponse, OpenApiPaginationResponse, OptionalEntityPathParams } from '../helpers/entity-service.helper';
import { TaskService } from '../services/task.service';

@UseGuards(TenantGuard)
@ApiTags('task-http')
@Controller('tenants/:tenantId/tasks')
export class TaskController {
  public constructor(private taskService: TaskService) {}

  @Post()
  @CustomOperationName()
  public create(@UserCtx() userContext: UserContext, @Param() params: EntitiesPathParams, @Body() request: TaskRequest): Promise<Task> {
    return this.taskService.create(userContext, params, request);
  }

  @Get()
  @CustomOperationName()
  @OpenApiPaginationResponse(Task)
  public list(@Param() params: EntitiesPathParams, @Query() listParams: ListParams): Promise<ListResponse<Task>> {
    return this.taskService.list(params, listParams);
  }

  @Get(':uuid')
  @CustomOperationName()
  public read(@Param() params: EntityPathParams): Promise<Task> {
    return this.taskService.read(params);
  }

  @Patch(':uuid')
  @CustomOperationName()
  public update(@UserCtx() userContext: UserContext, @Param() params: EntityPathParams, @Body() request: TaskRequest): Promise<void> {
    return this.taskService.update(userContext, params, request);
  }

  @Put('{:uuid}')
  @CustomOperationName()
  @ApiOkResponse({ schema: { oneOf: [{ $ref: getSchemaPath(Task) }, { type: 'void' }] } })
  public upsert(@UserCtx() userContext: UserContext, @Param() params: OptionalEntityPathParams, @Body() request: TaskRequest): Promise<Task | void> {
    return this.taskService.upsert(userContext, params, request);
  }

  @Delete(':uuid')
  @CustomOperationName()
  public delete(@Param() params: EntityPathParams): Promise<void> {
    return this.taskService.delete(params);
  }
}
