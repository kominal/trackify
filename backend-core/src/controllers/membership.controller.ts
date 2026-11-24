import { MembershipCreateRequest, MembershipEntity, MembershipPermission, MembershipUpdateRequest } from '@entities/membership.entity';
import { MembershipService } from '@entity-services/membership.service';
import { Permissions, TenantGuard } from '@guards/tenant.guard';
import { UserContext, UserCtx } from '@helpers/context.decorator';
import { CustomOperationName } from '@helpers/custom-operation-name.decorator';
import { ListParams, ListResponse, OpenApiPaginationResponse } from '@models/list.model';
import { TenantEntitiesPathParams, TenantEntityPathParams } from '@models/path.model';
import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@UseGuards(TenantGuard)
@ApiTags('membership-http')
@Controller('tenants/:tenantId/memberships')
export class MembershipController {
  public constructor(private service: MembershipService) {}

  @Get('me')
  @CustomOperationName()
  public readCurrentMembership(@UserCtx() userContext: UserContext, @Param() entitiesPathParams: TenantEntitiesPathParams): Promise<MembershipEntity> {
    return this.service.readCurrentMembership(userContext, entitiesPathParams);
  }

  @Post()
  @Permissions(MembershipPermission.MANAGE_MEMBERSHIPS)
  @CustomOperationName()
  public create(@UserCtx() userContext: UserContext, @Param() entitiesPathParams: TenantEntitiesPathParams, @Body() createRequest: MembershipCreateRequest): Promise<void> {
    return this.service.create(userContext, entitiesPathParams, createRequest);
  }

  @Get()
  @CustomOperationName()
  @OpenApiPaginationResponse(MembershipEntity)
  public list(@Param() entitiesPathParams: TenantEntitiesPathParams, @Query() listParams: ListParams): Promise<ListResponse<MembershipEntity>> {
    return this.service.list(entitiesPathParams, listParams);
  }

  @Get(':uuid')
  @CustomOperationName()
  public read(@Param() params: TenantEntityPathParams): Promise<MembershipEntity> {
    return this.service.read(params);
  }

  @Put(':uuid')
  @Permissions(MembershipPermission.MANAGE_MEMBERSHIPS)
  @CustomOperationName()
  public update(@UserCtx() userContext: UserContext, @Param() entityPathParams: TenantEntityPathParams, @Body() body: MembershipUpdateRequest): Promise<void> {
    return this.service.update(userContext, entityPathParams, body);
  }

  @Delete(':uuid')
  @Permissions(MembershipPermission.MANAGE_MEMBERSHIPS)
  @CustomOperationName()
  public delete(@UserCtx() userContext: UserContext, @Param() entityPathParams: TenantEntityPathParams): Promise<void> {
    return this.service.delete(userContext, entityPathParams);
  }
}
