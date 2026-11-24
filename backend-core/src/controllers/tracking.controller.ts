import { TrackingSessionEntity, TrackingSessionRequest } from '@entities/tracking-session.entity';
import { TenantGuard } from '@guards/tenant.guard';
import { UserContext, UserCtx } from '@helpers/context.decorator';
import { CustomOperationName } from '@helpers/custom-operation-name.decorator';
import { TenantEntitiesPathParams } from '@models/path.model';
import { Body, Controller, Delete, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { TrackingService } from '@services/tracking.service';

@UseGuards(TenantGuard)
@ApiTags('tracking-http')
@Controller('tenants/:tenantId/tracking')
export class TrackingController {
  public constructor(private readonly service: TrackingService) {}

  // Empty body when nothing is running.
  @Get()
  @CustomOperationName()
  @ApiOkResponse({ type: TrackingSessionEntity })
  public async read(@UserCtx() userContext: UserContext, @Param() params: TenantEntitiesPathParams): Promise<TrackingSessionEntity | undefined> {
    return (await this.service.read(userContext, params)) ?? undefined;
  }

  @Put()
  @CustomOperationName()
  public start(@UserCtx() userContext: UserContext, @Param() params: TenantEntitiesPathParams, @Body() { taskId }: TrackingSessionRequest): Promise<TrackingSessionEntity> {
    return this.service.start(userContext, params, taskId);
  }

  @Delete()
  @CustomOperationName()
  public async stop(@UserCtx() userContext: UserContext, @Param() params: TenantEntitiesPathParams): Promise<void> {
    await this.service.stop(userContext, params);
  }
}
