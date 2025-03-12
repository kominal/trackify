import { ClientRequest } from '../api/backend-core/models/client-request';
import { ProjectRequest } from '../api/backend-core/models/project-request';
import { RecordRequest } from '../api/backend-core/models/record-request';
import { TaskRequest } from '../api/backend-core/models/task-request';
import { TenantCreateRequest } from '../api/backend-core/models/tenant-create-request';
import { TypedFormOf } from './form.model';

export type TenantCreateRequestForm = TypedFormOf<TenantCreateRequest, {}>;

export type ClientRequestForm = TypedFormOf<ClientRequest, {}>;

export type ProjectRequestForm = TypedFormOf<ProjectRequest, {}>;

export type TaskRequestForm = TypedFormOf<TaskRequest, {}>;

export type RecordRequestForm = TypedFormOf<RecordRequest, {}>;
