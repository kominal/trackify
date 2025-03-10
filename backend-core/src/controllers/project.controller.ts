import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { Project, ProjectRequest } from '../entities/project.entity';
import { TenantGuard } from '../guards/tenant.guard';
import { UserContext, UserCtx } from '../helpers/context.decorator';
import { CustomOperationName } from '../helpers/custom-operation-name.decorator';
import { EntitiesPathParams, EntityPathParams, ListParams, ListResponse, OpenApiPaginationResponse, OptionalEntityPathParams } from '../helpers/entity-service.helper';
import { ProjectService } from '../services/project.service';

@UseGuards(TenantGuard)
@ApiTags('project-http')
@Controller('tenants/:tenantId/projects')
export class ProjectController {
  public constructor(private projectService: ProjectService) {}

  @Post()
  @CustomOperationName()
  public create(@UserCtx() userContext: UserContext, @Param() params: EntitiesPathParams, @Body() request: ProjectRequest): Promise<Project> {
    return this.projectService.create(userContext, params, request);
  }

  @Get()
  @CustomOperationName()
  @OpenApiPaginationResponse(Project)
  public list(@Param() params: EntitiesPathParams, @Query() listParams: ListParams): Promise<ListResponse<Project>> {
    return this.projectService.list(params, listParams);
  }

  @Get(':uuid')
  @CustomOperationName()
  public read(@Param() params: EntityPathParams): Promise<Project> {
    return this.projectService.read(params);
  }

  @Patch(':uuid')
  @CustomOperationName()
  public update(@UserCtx() userContext: UserContext, @Param() params: EntityPathParams, @Body() request: ProjectRequest): Promise<void> {
    return this.projectService.update(userContext, params, request);
  }

  @Put('{:uuid}')
  @CustomOperationName()
  @ApiOkResponse({ schema: { oneOf: [{ $ref: getSchemaPath(Project) }, { type: 'void' }] } })
  public upsert(@UserCtx() userContext: UserContext, @Param() params: OptionalEntityPathParams, @Body() request: ProjectRequest): Promise<Project | void> {
    return this.projectService.upsert(userContext, params, request);
  }

  @Delete(':uuid')
  @CustomOperationName()
  public delete(@Param() params: EntityPathParams): Promise<void> {
    return this.projectService.delete(params);
  }
}
