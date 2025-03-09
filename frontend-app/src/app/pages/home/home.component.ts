import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DialogService } from 'primeng/dynamicdialog';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TenantHttpService } from '../../api/backend-core/services';
import { CreateTenantDialogComponent } from '../../dialogs/create-tenant-dialog/create-tenant-dialog.component';
import { shareReplayOne } from '../../helpers/util';

@Component({
  selector: 'app-home',
  imports: [AsyncPipe, TableModule, ButtonModule, TranslatePipe, MessageModule, RouterLink],
  templateUrl: './home.component.html',
  host: { class: 'flex flex-col gap-2 h-full' },
})
export class HomeComponent {
  private tenantHttpService = inject(TenantHttpService);
  private dialogService = inject(DialogService);
  private translateService = inject(TranslateService);

  public tenants$ = this.tenantHttpService.list({ select: 'uuid name' }).pipe(shareReplayOne());

  public showCreateTenantDialog(): void {
    this.dialogService.open(CreateTenantDialogComponent, { header: this.translateService.instant('dialogs.createTenant.title'), width: '400px', modal: true, closable: true });
  }
}
