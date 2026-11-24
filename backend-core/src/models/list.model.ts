import { applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class ListParams {
  @ApiProperty({ required: false }) @IsOptional() @IsString() public active?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() public direction?: 'asc' | 'desc';
  @ApiProperty({ required: false }) @IsOptional() public pageIndex?: number;
  @ApiProperty({ required: false }) @IsOptional() public pageSize?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsString() public filter?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() public select?: string;
}

export class ListResponse<T> {
  @ApiProperty() public items: T[];
  @ApiProperty() @IsNumber() public count: number;
}

export const OpenApiPaginationResponse = (model: any) =>
  applyDecorators(
    ApiOkResponse({
      schema: {
        properties: {
          items: { type: 'array', items: { $ref: getSchemaPath(model) } },
          count: { type: 'number' },
        },
        required: ['items', 'count'],
      },
    }),
    ApiExtraModels(model),
  );
