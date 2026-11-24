import { CustomOperationName } from '@helpers/custom-operation-name.decorator';
import { getOidcAuthority, getOidcClientId, getTenantCreation } from '@helpers/environment';
import { FrontendConfiguration } from '@models/frontend-configuration.model';
import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('frontend-http')
@Controller('frontend')
export class FrontendController {
  @Get('configuration')
  @CustomOperationName()
  public readConfiguration(): FrontendConfiguration {
    return { oidc: { authority: getOidcAuthority(), clientId: getOidcClientId() }, tenantCreation: getTenantCreation() };
  }
}
