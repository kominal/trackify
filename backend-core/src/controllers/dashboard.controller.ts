import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TenantGuard } from '../guards/tenant.guard';
import { UserContext, UserCtx } from '../helpers/context.decorator';
import { CustomOperationName } from '../helpers/custom-operation-name.decorator';
import { EntitiesPathParams } from '../helpers/entity-service.helper';
import { DashboardRequest } from '../models/dashboard.model';
import { DashboardService } from '../services/dashboard.service';

@UseGuards(TenantGuard)
@ApiTags('dashboard-http')
@Controller('tenants/:tenantId/dashboard')
export class DashboardController {
  public constructor(private dashboardService: DashboardService) {}

  @Post()
  @CustomOperationName()
  public async get(@UserCtx() userContext: UserContext, @Param() params: EntitiesPathParams, @Body() request: DashboardRequest): Promise<void> {}
}
