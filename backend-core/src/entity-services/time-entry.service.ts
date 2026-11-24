import { TaskEntity, TaskModel } from '@entities/task.entity';
import { TimeEntryEntity, TimeEntryModel, TimeEntryRequest } from '@entities/time-entry.entity';
import { UserContext } from '@helpers/context.decorator';
import { changed, created, parseFilter } from '@helpers/entity-service.helper';
import { ListParams, ListResponse } from '@models/list.model';
import { TenantEntitiesPathParams, TenantEntityPathParams } from '@models/path.model';
import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

const MAX_ENTRY_MS = 24 * 60 * 60 * 1000;

// Time entries always belong to the signed-in user: the userId comes from the token and is part of
// every query, so members never see (or change) each other's time.
@Injectable()
export class TimeEntryService {
  public constructor(
    @InjectModel(TimeEntryEntity.name) private readonly model: TimeEntryModel,
    @InjectModel(TaskEntity.name) private readonly taskModel: TaskModel,
  ) {}

  public async create(userContext: UserContext, { tenantId }: TenantEntitiesPathParams, request: TimeEntryRequest): Promise<TimeEntryEntity> {
    await this.validate(tenantId, request);
    const entity = await this.model.create(created<TimeEntryEntity>(userContext, { tenantId, userId: userContext.userId, taskId: request.taskId, start: request.start, end: request.end, note: request.note }));
    return entity.toObject();
  }

  public async list(userContext: UserContext, { tenantId }: TenantEntitiesPathParams, { active, direction, pageIndex, pageSize, filter }: ListParams): Promise<ListResponse<TimeEntryEntity>> {
    const evaluatedFilter = { ...parseFilter(filter), tenantId, userId: userContext.userId };
    let query = this.model.find(evaluatedFilter).sort({ [active ?? 'start']: direction ?? 'desc' });
    if (pageIndex && pageSize) {
      query = query.skip(pageIndex * pageSize);
    }
    if (pageSize) {
      query = query.limit(pageSize);
    }
    const [items, count] = await Promise.all([query.lean<TimeEntryEntity[]>(), this.model.countDocuments(evaluatedFilter)]);
    return { items, count };
  }

  public async read(userContext: UserContext, params: TenantEntityPathParams): Promise<TimeEntryEntity> {
    return this.model
      .findOne({ ...params, userId: userContext.userId })
      .lean<TimeEntryEntity>()
      .orFail(new HttpException('exception.notFound', 404));
  }

  public async update(userContext: UserContext, params: TenantEntityPathParams, request: TimeEntryRequest): Promise<void> {
    await this.validate(params.tenantId, request);
    const { matchedCount } = await this.model.updateOne({ ...params, userId: userContext.userId }, changed<TimeEntryEntity>(userContext, { taskId: request.taskId, start: request.start, end: request.end, note: request.note }));
    if (matchedCount === 0) {
      throw new HttpException('exception.notFound', 404);
    }
  }

  public async delete(userContext: UserContext, params: TenantEntityPathParams): Promise<void> {
    await this.model.deleteOne({ ...params, userId: userContext.userId });
  }

  private async validate(tenantId: string, { taskId, start, end }: TimeEntryRequest): Promise<void> {
    if (end.getTime() <= start.getTime() || end.getTime() - start.getTime() > MAX_ENTRY_MS) {
      throw new HttpException('exception.invalidRange', 400);
    }
    if (!(await this.taskModel.exists({ tenantId, uuid: taskId }))) {
      throw new HttpException('exception.notFound', 404);
    }
  }
}
