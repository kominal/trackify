import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ClientEntity } from '@api/models';
import { ClientHttpService } from '@api/services';
import { EntityInfo } from '@components/entity-info/entity-info';
import { ClientEditDialog } from '@dialogs/client-edit/client-edit.dialog';
import { TablePage } from '@helpers/table-page.helper';
import { toListRequest } from '@helpers/util';
import { TranslatePipe } from '@ngx-translate/core';
import { ApplicationStateService } from '@services/application-state.service';
import { CatalogService } from '@services/catalog.service';
import { UtilService } from '@services/util.service';
import { ButtonModule } from 'primeng/button';
import { Message } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { filter, first } from 'rxjs';

@Component({
  selector: 'app-clients-page',
  imports: [ButtonModule, TableModule, TooltipModule, EntityInfo, TranslatePipe, Message],
  templateUrl: './clients.page.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  host: { class: 'list-page' },
})
export class ClientsPage extends TablePage<ClientEntity> {
  private readonly clientHttpService = inject(ClientHttpService);
  private readonly catalogService = inject(CatalogService);
  private readonly utilService = inject(UtilService);
  protected readonly applicationStateService = inject(ApplicationStateService);

  public constructor() {
    super((event) => this.clientHttpService.list({ tenantId: this.tenantId, ...toListRequest(event) }));
  }

  protected edit(entity?: ClientEntity): void {
    this.utilService
      .open(entity ? 'clientEdit' : 'clientAdd', ClientEditDialog, { tenantId: this.tenantId, entity }, '520px')
      .pipe(filter(Boolean))
      .subscribe(() => this.changed());
  }

  protected remove(entity: ClientEntity): void {
    this.utilService.confirm('delete', () =>
      this.clientHttpService
        .delete({ tenantId: this.tenantId, uuid: entity.uuid })
        .pipe(this.utilService.handleError(), first())
        .subscribe(() => this.changed()),
    );
  }

  private changed(): void {
    this.reload();
    this.catalogService.reload();
  }
}
