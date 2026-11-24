import { Color, ColorDecorator } from '@models/color.model';
import { TECHNICAL_KEYS_TENANT_ENTITY, WithTenantEntity } from '@models/entity.model';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { Model } from 'mongoose';

@Schema({ collection: 'projects' })
export class ProjectEntity extends WithTenantEntity {
  @Prop() @ApiProperty({ required: false }) @IsOptional() @IsUUID() public clientId?: string;
  @Prop() @IsString() @MinLength(1) @MaxLength(120) public name: string;
  @Prop() @IsEnum(Color) @ColorDecorator public color: Color;
  @Prop({ default: false }) @IsBoolean() public archived: boolean;
}

export const ProjectSchema = SchemaFactory.createForClass(ProjectEntity).index({ tenantId: 1, uuid: 1 }, { unique: true });
export type ProjectModel = Model<ProjectEntity>;

export class ProjectRequest extends OmitType(ProjectEntity, [...TECHNICAL_KEYS_TENANT_ENTITY, 'uuid', 'version']) {
  // Required for updates (optimistic locking), ignored on create.
  @ApiProperty({ required: false }) @IsOptional() @IsInt() public version?: number;
}
