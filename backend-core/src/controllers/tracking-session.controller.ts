import { Body, Controller, Delete, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { TrackingSession, TrackingSessionRequest } from '../entities/tracking-session.entity';
import { TenantGuard } from '../guards/tenant.guard';
import { UserContext, UserCtx } from '../helpers/context.decorator';
import { CustomOperationName } from '../helpers/custom-operation-name.decorator';
import { EntitiesPathParams } from '../helpers/entity-service.helper';
import { TrackingSessionService } from '../services/tracking-session.service';

@UseGuards(TenantGuard)
@ApiTags('tracking-session-http')
@Controller('tenants/:tenantId/tracking-sessions')
export class TrackingSessionController {
  public constructor(private trackingSessionService: TrackingSessionService) {}

  @Get('active')
  @CustomOperationName()
  @ApiExtraModels(TrackingSession)
  @ApiOkResponse({ schema: { oneOf: [{ $ref: getSchemaPath(TrackingSession) }, { type: 'null' }] } })
  public readActive(@UserCtx() userContext: UserContext, @Param() params: EntitiesPathParams): Promise<TrackingSession | null> {
    return this.trackingSessionService.read(userContext, params);
  }

  @Put('active')
  @CustomOperationName()
  public updateActive(@UserCtx() userContext: UserContext, @Param() params: EntitiesPathParams, @Body() request: TrackingSessionRequest): Promise<void> {
    return this.trackingSessionService.upsert(userContext, params, request);
  }

  @Delete('active')
  @CustomOperationName()
  public stopActive(@UserCtx() userContext: UserContext, @Param() params: EntitiesPathParams): Promise<void> {
    return this.trackingSessionService.delete(userContext, params);
  }
}
