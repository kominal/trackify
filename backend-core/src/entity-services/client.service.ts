import { ClientEntity, ClientModel } from '@entities/client.entity';
import { ProjectEntity, ProjectModel } from '@entities/project.entity';
import { EntityService } from '@helpers/entity-service.helper';
import { TenantEntityPathParams } from '@models/path.model';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class ClientService extends EntityService<ClientEntity> {
  public constructor(
    @InjectModel(ClientEntity.name) model: ClientModel,
    @InjectModel(ProjectEntity.name) private readonly projectModel: ProjectModel,
  ) {
    super(model, { defaultSortKey: 'name' });
  }

  public override async inUse({ tenantId, uuid }: TenantEntityPathParams): Promise<boolean> {
    return !!(await this.projectModel.exists({ tenantId, clientId: uuid }));
  }
}
