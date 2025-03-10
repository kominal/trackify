import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Project, ProjectModel } from '../entities/project.entity';
import { EntityService } from '../helpers/entity-service.helper';

@Injectable()
export class ProjectService extends EntityService<Project> {
  public constructor(@InjectModel(Project.name) private projectModel: ProjectModel) {
    super(projectModel);
  }
}
