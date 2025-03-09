import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { OmitType } from '@nestjs/swagger';
import { Model } from 'mongoose';
import { TECHNICAL_KEYS, TenantEntity } from '../models/core/entity.model';

@Schema()
export class Project extends TenantEntity {
  @Prop() public name: string;
}

export type ProjectModel = Model<Project>;

export const ProjectSchema = SchemaFactory.createForClass(Project).index({ tenantId: 1 }).index({ tenantId: 1, uuid: 1 }, { unique: true });

export class ProjectRequest extends OmitType(Project, TECHNICAL_KEYS) {}
