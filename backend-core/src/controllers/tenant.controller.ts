import { MembershipPermission } from '@entities/membership.entity';
import { TenantCreateRequest, TenantEntity, TenantUpdateRequest } from '@entities/tenant.entity';
import { TenantService } from '@entity-services/tenant.service';
import { Permissions, TenantGuard } from '@guards/tenant.guard';
import { UserGuard } from '@guards/user.guard';
import { UserContext, UserCtx } from '@helpers/context.decorator';
import { CustomOperationName } from '@helpers/custom-operation-name.decorator';
import { ListParams, ListResponse, OpenApiPaginationResponse } from '@models/list.model';
import { TenantEntitiesPathParams } from '@models/path.model';
import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('tenant-http')
@Controller('tenants')
export class TenantController {
  public constructor(private tenantService: TenantService) {}

  // Open to every signed-in user unless TENANT_CREATION=ADMIN (enforced in the service).
  @UseGuards(UserGuard)
  @Post()
  @CustomOperationName()
  public create(@UserCtx() userContext: UserContext, @Body() tenantCreateRequest: TenantCreateRequest): Promise<TenantEntity> {
    return this.tenantService.create(userContext, tenantCreateRequest);
  }

  @UseGuards(UserGuard)
  @Get()
  @CustomOperationName()
  @OpenApiPaginationResponse(TenantEntity)
  public list(@UserCtx() userContext: UserContext, @Query() listParams: ListParams): Promise<ListResponse<TenantEntity>> {
    return this.tenantService.list(userContext, listParams);
  }

  @UseGuards(TenantGuard)
  @Get(':tenantId')
  @CustomOperationName()
  public read(@Param() { tenantId }: TenantEntitiesPathParams): Promise<TenantEntity> {
    return this.tenantService.read(tenantId);
  }

  @UseGuards(TenantGuard)
  @Permissions(MembershipPermission.MANAGE_TENANT)
  @Put(':tenantId')
  @CustomOperationName()
  public update(@UserCtx() userContext: UserContext, @Param() { tenantId }: TenantEntitiesPathParams, @Body() body: TenantUpdateRequest): Promise<void> {
    return this.tenantService.update(userContext, tenantId, body);
  }

  // Deleting an organisation is restricted to global administrators (enforced again in the service).
  @UseGuards(TenantGuard)
  @Delete(':tenantId')
  @CustomOperationName()
  public delete(@UserCtx() userContext: UserContext, @Param() { tenantId }: TenantEntitiesPathParams): Promise<void> {
    return this.tenantService.delete(userContext, tenantId);
  }
}
