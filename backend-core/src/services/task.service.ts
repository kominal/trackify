import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Task, TaskModel } from '../entities/task.entity';
import { EntityService } from '../helpers/entity-service.helper';

@Injectable()
export class TaskService extends EntityService<Task> {
  public constructor(@InjectModel(Task.name) private taskModel: TaskModel) {
    super(taskModel);
  }
}
