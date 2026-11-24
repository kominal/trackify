import { DateTransform } from '@models/entity.model';
import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsOptional, IsString } from 'class-validator';

export class RangeParams {
  @ApiProperty({ type: String, format: 'date-time' }) @IsDate() @DateTransform public from: Date;
  @ApiProperty({ type: String, format: 'date-time' }) @IsDate() @DateTransform public to: Date;
}

export class ZonedRangeParams extends RangeParams {
  // IANA time zone the days are cut in (e.g. Europe/Berlin); falls back to the user's setting.
  @ApiProperty({ required: false }) @IsOptional() @IsString() public timeZone?: string;
}
