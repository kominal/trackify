import { TenantGuard } from '@guards/tenant.guard';
import { UserContext, UserCtx } from '@helpers/context.decorator';
import { CustomOperationName } from '@helpers/custom-operation-name.decorator';
import { Dashboard } from '@models/dashboard.model';
import { TenantEntitiesPathParams } from '@models/path.model';
import { ZonedRangeParams } from '@models/range.model';
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DashboardService } from '@services/dashboard.service';

@UseGuards(TenantGuard)
@ApiTags('dashboard-http')
@Controller('tenants/:tenantId/dashboard')
export class DashboardController {
  public constructor(private readonly service: DashboardService) {}

  @Get()
  @CustomOperationName()
  public read(@UserCtx() userContext: UserContext, @Param() params: TenantEntitiesPathParams, @Query() range: ZonedRangeParams): Promise<Dashboard> {
    return this.service.read(userContext, params, range);
  }
}
