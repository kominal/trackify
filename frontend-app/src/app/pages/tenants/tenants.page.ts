import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TenantEntity } from '@api/models';
import { TenantHttpService } from '@api/services';
import { EntityInfo } from '@components/entity-info/entity-info';
import { TenantAddDialog } from '@dialogs/tenant-add/tenant-add.dialog';
import { TablePage } from '@helpers/table-page.helper';
import { toListRequest } from '@helpers/util';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ApplicationStateService } from '@services/application-state.service';
import { UserService } from '@services/user.service';
import { ButtonModule } from 'primeng/button';
import { DialogService } from 'primeng/dynamicdialog';
import { Message } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { filter, first } from 'rxjs';
import { FRONTEND_CONFIGURATION } from '../../app.config';

@Component({
  selector: 'app-tenants-page',
  imports: [ButtonModule, TableModule, RouterLink, EntityInfo, TranslatePipe, Message],
  templateUrl: './tenants.page.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  host: { class: 'list-page' },
})
export class TenantsPage extends TablePage<TenantEntity> {
  private readonly tenantHttpService = inject(TenantHttpService);
  private readonly translateService = inject(TranslateService);
  private readonly dialogService = inject(DialogService);
  protected readonly applicationStateService = inject(ApplicationStateService);
  protected readonly userService = inject(UserService);
  private readonly frontendConfiguration = inject(FRONTEND_CONFIGURATION);

  // Mirrors the backend rule (TENANT_CREATION): everyone, or global administrators only.
  protected readonly canCreate = computed(() => this.frontendConfiguration.tenantCreation === 'USER' || !!this.userService.isAdmin());

  public constructor() {
    super((event) => this.tenantHttpService.list({ ...toListRequest(event) }));
    this.openPreviousTenant();
  }

  // Most people work in one organisation: opening the app leads straight to the last one used
  // (or the only one). Coming back here through the menu (?stay) shows the list.
  private openPreviousTenant(): void {
    if (inject(ActivatedRoute).snapshot.queryParamMap.has('stay')) {
      return;
    }
    const router = inject(Router);
    const previousTenantId = this.applicationStateService.formElement.controls.previousTenantId.value;
    this.tenantHttpService
      .list({ pageSize: 50 })
      .pipe(first())
      .subscribe(({ items }) => {
        const target = items.find(({ uuid }) => uuid === previousTenantId) ?? (items.length === 1 ? items[0] : undefined);
        if (target) {
          void router.navigate(['/tenants', target.uuid, 'tracking'], { replaceUrl: true });
        } else if (items.length === 0 && this.canCreate()) {
          this.openTenantAddDialog();
        }
      });
  }

  protected openTenantAddDialog(): void {
    this.dialogService
      .open(TenantAddDialog, { width: '600px', header: this.translateService.instant('dialogs.tenantAdd.header'), draggable: false, closable: true })
      ?.onClose.pipe(filter(Boolean))
      .subscribe(() => this.reload());
  }
}
