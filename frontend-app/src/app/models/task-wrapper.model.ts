import { Client } from '../api/backend-core/models/client';
import { Project } from '../api/backend-core/models/project';
import { Task } from '../api/backend-core/models/task';

export interface TaskWrapper {
  task: Task;
  project: Project;
  client: Client;
}
