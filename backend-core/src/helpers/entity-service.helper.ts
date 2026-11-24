import { UserContext } from '@helpers/context.decorator';
import { BaseEntity } from '@models/entity.model';
import { ListParams, ListResponse } from '@models/list.model';
import { TenantEntitiesPathParams, TenantEntityPathParams } from '@models/path.model';
import { HttpException } from '@nestjs/common';
import { Model, PopulateOptions, RootFilterQuery, UpdateQuery } from 'mongoose';
import { v4 } from 'uuid';

export class ChangeContext {
  email: string;
}

export function created<Entity extends BaseEntity>(changeContext: ChangeContext, entity: Omit<Entity, '_id' | 'uuid' | 'createdAt' | 'createdBy' | 'changedAt' | 'changedBy' | 'version'> & Partial<Pick<Entity, 'uuid'>>): Entity {
  return {
    ...entity,
    uuid: entity.uuid ?? v4(),
    createdAt: new Date(),
    createdBy: changeContext.email,
    changedAt: new Date(),
    changedBy: changeContext.email,
    version: 0,
  } as Entity;
}

export function changed<Entity extends BaseEntity>(changeContext: ChangeContext, entity: Partial<Entity>): UpdateQuery<Entity> {
  return {
    ...entity,
    changedAt: new Date(),
    changedBy: changeContext.email,
    $inc: { version: 1 },
  };
}

// Operators that would let a client-supplied filter execute code or arbitrary expressions on the server
const FORBIDDEN_FILTER_OPERATORS = new Set(['$where', '$function', '$accumulator', '$expr']);

function assertSafeFilterValue(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach(assertSafeFilterValue);
  } else if (value && typeof value === 'object') {
    for (const [key, nested] of Object.entries(value)) {
      if (FORBIDDEN_FILTER_OPERATORS.has(key)) {
        throw new HttpException('exception.invalidFilter', 400);
      }
      assertSafeFilterValue(nested);
    }
  }
}

// Filters come from the client; only per-field conditions are allowed so the path params (tenant scope) can never be bypassed
export function parseFilter(filter: string | undefined): Record<string, unknown> {
  if (!filter) {
    return {};
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(filter);
  } catch {
    throw new HttpException('exception.invalidFilter', 400);
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed) || Object.keys(parsed).some((key) => key.startsWith('$'))) {
    throw new HttpException('exception.invalidFilter', 400);
  }

  assertSafeFilterValue(parsed);

  return parsed as Record<string, unknown>;
}

export class EntityService<Entity extends BaseEntity, PopulatedEntity = Entity> {
  public constructor(
    protected model: Model<Entity>,
    protected options: {
      listSelect?: string;
      populate?: PopulateOptions | PopulateOptions[];
      defaultSortKey?: string;
      defaultSortDirection?: string;
    } = {},
  ) {}

  public async create(userContext: UserContext, entitiesPathParams: TenantEntitiesPathParams, request: Partial<Entity>): Promise<Entity> {
    delete request._id;

    const entity = created(userContext, {
      ...request,
      ...entitiesPathParams,
      uuid: request.uuid ?? v4(),
    } as any);

    return this.model.create(entity);
  }

  public async list(entitiesPathParams: TenantEntitiesPathParams, { active, direction, pageIndex, pageSize, filter, select }: ListParams): Promise<ListResponse<PopulatedEntity>> {
    const evaluatedFilter: RootFilterQuery<Entity> = { ...parseFilter(filter), ...entitiesPathParams };
    let query = this.model
      .find(evaluatedFilter)
      .select(this.options.listSelect ?? select ?? '')
      .sort({ [active ?? this.options.defaultSortKey ?? '_id']: (direction ?? this.options.defaultSortDirection ?? 'asc') as any })
      .populate(this.options.populate ?? []);

    if (pageIndex && pageSize) {
      query = query.skip(pageIndex * pageSize);
    }
    if (pageSize) {
      query = query.limit(pageSize);
    }

    const items = await query.lean<PopulatedEntity[]>();
    const count = await this.model.countDocuments(evaluatedFilter);
    return { items, count };
  }

  public async read(entityPathParams: TenantEntityPathParams): Promise<Entity> {
    return this.model.findOne(entityPathParams).lean<Entity>().orFail(new HttpException('exception.notFound', 404));
  }

  public async update(userContext: UserContext, entityPathParams: TenantEntityPathParams, request: Partial<Entity>): Promise<void> {
    delete request._id;

    const entity = await this.model.findOne(entityPathParams).orFail(new HttpException('exception.notFound', 404));

    if (entity.version !== undefined && entity.version !== request.version) {
      throw new HttpException('exception.conflict', 409);
    }

    delete request.version;

    await this.model.updateOne(
      entityPathParams,
      changed(userContext, {
        ...request,
        tenantId: entityPathParams.tenantId,
      }),
    );
  }

  public async delete(entityPathParams: TenantEntityPathParams): Promise<any> {
    if (await this.inUse(entityPathParams)) {
      throw new HttpException('exception.inUse', 409);
    }
    return this.model.deleteOne(entityPathParams);
  }

  public inUse(_entityPathParams: TenantEntityPathParams): Promise<boolean> {
    return Promise.resolve(false);
  }
}
