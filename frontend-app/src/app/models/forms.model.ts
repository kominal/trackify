import { ClientRequest } from '../api/backend-core/models/client-request';
import { TenantCreateRequest } from '../api/backend-core/models/tenant-create-request';
import { TypedFormOf } from './form.model';

export type TenantCreateRequestForm = TypedFormOf<TenantCreateRequest, {}>;

export type ClientRequestForm = TypedFormOf<ClientRequest, {}>;
