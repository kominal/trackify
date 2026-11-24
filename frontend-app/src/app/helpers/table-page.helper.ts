import { param } from '@helpers/util';
import { TablePage as CommonTablePage } from '@kominal/common-angular';

// The generic lazy-table plumbing lives in the shared workspace library; this subclass only adds the route params.
export class TablePage<T> extends CommonTablePage<T> {
  protected readonly tenantId = param('tenantId');
}
