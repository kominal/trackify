import { ClientEntity, ClientModel } from '@entities/client.entity';
import { ProjectEntity, ProjectModel } from '@entities/project.entity';
import { TaskEntity, TaskModel } from '@entities/task.entity';
import { UserContext } from '@helpers/context.decorator';
import { EntityService } from '@helpers/entity-service.helper';
import { TenantEntitiesPathParams, TenantEntityPathParams } from '@models/path.model';
import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class ProjectService extends EntityService<ProjectEntity> {
  public constructor(
    @InjectModel(ProjectEntity.name) model: ProjectModel,
    @InjectModel(ClientEntity.name) private readonly clientModel: ClientModel,
    @InjectModel(TaskEntity.name) private readonly taskModel: TaskModel,
  ) {
    super(model, { defaultSortKey: 'name' });
  }

  public override async create(userContext: UserContext, params: TenantEntitiesPathParams, request: Partial<ProjectEntity>): Promise<ProjectEntity> {
    await this.assertClient(params.tenantId, request.clientId);
    return super.create(userContext, params, request);
  }

  public override async update(userContext: UserContext, params: TenantEntityPathParams, request: Partial<ProjectEntity>): Promise<void> {
    await this.assertClient(params.tenantId, request.clientId);
    // An update replaces the project: a client left out is removed (JSON drops undefined).
    return super.update(userContext, params, { ...request, clientId: request.clientId ?? (null as unknown as undefined) });
  }

  public override async inUse({ tenantId, uuid }: TenantEntityPathParams): Promise<boolean> {
    return !!(await this.taskModel.exists({ tenantId, projectId: uuid }));
  }

  private async assertClient(tenantId: string, clientId: string | undefined): Promise<void> {
    if (clientId && !(await this.clientModel.exists({ tenantId, uuid: clientId }))) {
      throw new HttpException('exception.notFound', 404);
    }
  }
}
