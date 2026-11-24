import { ActivityEntity, ActivityModel, ActivitySchema } from '@entities/activity.entity';
import { ProjectEntity, ProjectModel, ProjectSchema } from '@entities/project.entity';
import { TaskEntity, TaskModel, TaskSchema } from '@entities/task.entity';
import { TimeEntryEntity, TimeEntryModel, TimeEntrySchema } from '@entities/time-entry.entity';
import { TrackingSessionEntity, TrackingSessionModel, TrackingSessionSchema } from '@entities/tracking-session.entity';
import { UserEntity, UserModel, UserSchema } from '@entities/user.entity';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, createConnection, Model } from 'mongoose';

export interface TestDatabase {
  connection: Connection;
  projectModel: ProjectModel;
  taskModel: TaskModel;
  timeEntryModel: TimeEntryModel;
  sessionModel: TrackingSessionModel;
  activityModel: ActivityModel;
  userModel: UserModel;
  clear(): Promise<void>;
  stop(): Promise<void>;
}

// A real MongoDB in memory: the queries, indexes and atomic updates are the logic under test,
// mocks would only assert that a query was passed along.
export async function startTestDatabase(): Promise<TestDatabase> {
  const server = await MongoMemoryServer.create();
  const connection = await createConnection(server.getUri(), { dbName: 'trackify-test' }).asPromise();

  const models = {
    projectModel: connection.model(ProjectEntity.name, ProjectSchema) as unknown as ProjectModel,
    taskModel: connection.model(TaskEntity.name, TaskSchema) as unknown as TaskModel,
    timeEntryModel: connection.model(TimeEntryEntity.name, TimeEntrySchema) as unknown as TimeEntryModel,
    sessionModel: connection.model(TrackingSessionEntity.name, TrackingSessionSchema) as unknown as TrackingSessionModel,
    activityModel: connection.model(ActivityEntity.name, ActivitySchema) as unknown as ActivityModel,
    userModel: connection.model(UserEntity.name, UserSchema) as unknown as UserModel,
  };
  const all = Object.values(models) as unknown as Model<unknown>[];
  await Promise.all(all.map((model) => model.init()));

  return {
    connection,
    ...models,
    clear: async () => {
      await Promise.all(all.map((model) => model.deleteMany({})));
    },
    stop: async () => {
      await connection.close();
      await server.stop();
    },
  };
}
