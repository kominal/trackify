import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsString, ValidateNested } from 'class-validator';

export class FrontendConfigurationOidc {
  @IsString() public authority: string;
  @IsString() public clientId: string;
}

export class FrontendConfiguration {
  @Type(() => FrontendConfigurationOidc) @ValidateNested() public oidc: FrontendConfigurationOidc;
  @ApiProperty({ enum: ['USER', 'ADMIN'] }) @IsIn(['USER', 'ADMIN']) public tenantCreation: 'USER' | 'ADMIN';
}
