import { ProjectEntity, ProjectModel } from '@entities/project.entity';
import { TaskEntity, TaskModel } from '@entities/task.entity';
import { TimeEntryEntity, TimeEntryModel } from '@entities/time-entry.entity';
import { TrackingSessionEntity, TrackingSessionModel } from '@entities/tracking-session.entity';
import { UserContext } from '@helpers/context.decorator';
import { EntityService } from '@helpers/entity-service.helper';
import { TenantEntitiesPathParams, TenantEntityPathParams } from '@models/path.model';
import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class TaskService extends EntityService<TaskEntity> {
  public constructor(
    @InjectModel(TaskEntity.name) model: TaskModel,
    @InjectModel(ProjectEntity.name) private readonly projectModel: ProjectModel,
    @InjectModel(TimeEntryEntity.name) private readonly timeEntryModel: TimeEntryModel,
    @InjectModel(TrackingSessionEntity.name) private readonly trackingSessionModel: TrackingSessionModel,
  ) {
    super(model, { defaultSortKey: 'priority' });
  }

  public override async create(userContext: UserContext, params: TenantEntitiesPathParams, request: Partial<TaskEntity>): Promise<TaskEntity> {
    await this.assertProject(params.tenantId, request.projectId);
    return super.create(userContext, params, request);
  }

  public override async update(userContext: UserContext, params: TenantEntityPathParams, request: Partial<TaskEntity>): Promise<void> {
    await this.assertProject(params.tenantId, request.projectId);
    // An update replaces the task: a colour left out falls back to the project's (JSON drops undefined).
    return super.update(userContext, params, { ...request, color: request.color ?? (null as unknown as undefined) });
  }

  // Tasks with tracked time are archived instead of deleted, so the time keeps its task.
  public override async inUse({ tenantId, uuid }: TenantEntityPathParams): Promise<boolean> {
    return !!((await this.timeEntryModel.exists({ tenantId, taskId: uuid })) || (await this.trackingSessionModel.exists({ tenantId, taskId: uuid })));
  }

  private async assertProject(tenantId: string, projectId: string | undefined): Promise<void> {
    if (!projectId || !(await this.projectModel.exists({ tenantId, uuid: projectId }))) {
      throw new HttpException('exception.notFound', 404);
    }
  }
}
