import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Tenant, TenantCreateRequest, TenantUpdateRequest } from '../entities/tenant.entity';
import { TenantGuard } from '../guards/tenant.guard';
import { UserGuard } from '../guards/user.guard';
import { UserContext, UserCtx } from '../helpers/context.decorator';
import { CustomOperationName } from '../helpers/custom-operation-name.decorator';
import { ListParams } from '../helpers/entity-service.helper';
import { TenantService } from '../services/tenant.service';

@ApiTags('tenant-http')
@Controller('tenants')
export class TenantController {
  public constructor(private tenantService: TenantService) {}

  @Post()
  @UseGuards(UserGuard)
  @CustomOperationName()
  public create(@UserCtx() userContext: UserContext, @Body() request: TenantCreateRequest): Promise<Tenant> {
    return this.tenantService.createForUser(userContext, request);
  }

  @UseGuards(TenantGuard)
  @Get(':tenantId')
  @CustomOperationName()
  public read(@Param('tenantId') tenantId: string): Promise<Tenant> {
    return this.tenantService.readForUser(tenantId);
  }

  @UseGuards(UserGuard)
  @Get()
  @CustomOperationName()
  public list(@UserCtx() userContext: UserContext, @Query() listParams: ListParams): Promise<Tenant[]> {
    return this.tenantService.listForUser(userContext, listParams);
  }

  @UseGuards(TenantGuard)
  @Put(':tenantId')
  @CustomOperationName()
  public update(@UserCtx() userContext: UserContext, @Param('tenantId') tenantId: string, @Body() body: TenantUpdateRequest): Promise<void> {
    return this.tenantService.updateForUser(userContext, tenantId, body);
  }
}
