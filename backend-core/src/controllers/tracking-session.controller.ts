import { Body, Controller, Delete, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { Client } from '../entities/client.entity';
import { TrackingSession, TrackingSessionRequest } from '../entities/tracking-session.entity';
import { TenantGuard } from '../guards/tenant.guard';
import { UserContext, UserCtx } from '../helpers/context.decorator';
import { CustomOperationName } from '../helpers/custom-operation-name.decorator';
import { EntityPathParams, OptionalEntityPathParams } from '../helpers/entity-service.helper';
import { TrackingSessionService } from '../services/tracking-session.service';

@UseGuards(TenantGuard)
@ApiTags('tracking-session-http')
@Controller('tenants/:tenantId/tracking-sessions')
export class TrackingSessionController {
  public constructor(private trackingSessionService: TrackingSessionService) {}

  @Get('active')
  @CustomOperationName()
  @ApiOkResponse({ schema: { oneOf: [{ $ref: getSchemaPath(Client) }, { type: 'null' }] } })
  public read(@UserCtx() userContext: UserContext, @Param() params: EntityPathParams): Promise<TrackingSession | null> {
    return this.trackingSessionService.read(userContext, params);
  }

  @Put('active')
  @CustomOperationName()
  public upsert(@UserCtx() userContext: UserContext, @Param() params: OptionalEntityPathParams, @Body() request: TrackingSessionRequest): Promise<void> {
    return this.trackingSessionService.upsert(userContext, params, request);
  }

  @Delete('active')
  @CustomOperationName()
  public delete(@UserCtx() userContext: UserContext, @Param() params: EntityPathParams): Promise<void> {
    return this.trackingSessionService.delete(userContext, params);
  }
}
