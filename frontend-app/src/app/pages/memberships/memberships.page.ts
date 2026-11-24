import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MembershipEntity, MembershipPermission, MembershipStatus } from '@api/models';
import { MembershipHttpService } from '@api/services';
import { EntityInfo } from '@components/entity-info/entity-info';
import { MembershipAddDialog } from '@dialogs/membership-add/membership-add.dialog';
import { MembershipEditDialog } from '@dialogs/membership-edit/membership-edit.dialog';
import { TablePage } from '@helpers/table-page.helper';
import { toListRequest, toSelectItems } from '@helpers/util';
import { TranslateSelectItemsPipe } from '@kominal/common-angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ApplicationStateService } from '@services/application-state.service';
import { UtilService } from '@services/util.service';
import { ButtonModule } from 'primeng/button';
import { DialogService } from 'primeng/dynamicdialog';
import { Message } from 'primeng/message';
import { MultiSelectModule } from 'primeng/multiselect';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { EMPTY, filter, first, switchMap } from 'rxjs';

@Component({
  selector: 'app-memberships-page',
  imports: [ButtonModule, TableModule, TagModule, EntityInfo, TranslatePipe, TooltipModule, MultiSelectModule, TranslateSelectItemsPipe, AsyncPipe, FormsModule, Message],
  templateUrl: './memberships.page.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  host: { class: 'list-page' },
})
export class MembershipsPage extends TablePage<MembershipEntity> {
  protected readonly MembershipStatus = MembershipStatus;
  protected readonly MEMBERSHIP_STATUS_OPTIONS = toSelectItems('MembershipStatus', MembershipStatus);
  protected readonly MEMBERSHIP_PERMISSION_OPTIONS = toSelectItems('MembershipPermission', MembershipPermission);

  private readonly dialogService = inject(DialogService);
  private readonly membershipHttpService = inject(MembershipHttpService);
  private readonly translateService = inject(TranslateService);
  private readonly utilService = inject(UtilService);
  protected readonly applicationStateService = inject(ApplicationStateService);

  public constructor() {
    super((event) => this.membershipHttpService.list({ tenantId: this.tenantId, ...toListRequest(event) }));
  }

  protected statusSeverity(status: MembershipStatus): 'success' | 'warn' | 'danger' {
    return status === MembershipStatus.Active ? 'success' : status === MembershipStatus.Invited ? 'warn' : 'danger';
  }

  protected openMembershipAddDialog(): void {
    this.dialogService
      .open(MembershipAddDialog, { width: '600px', header: this.translateService.instant('dialogs.membershipAdd.header'), draggable: false, closable: true, data: { tenantId: this.tenantId } })
      ?.onClose.pipe(filter(Boolean))
      .subscribe(() => this.reload());
  }

  protected openMembershipEditDialog(uuid: string): void {
    this.membershipHttpService
      .read({ tenantId: this.tenantId, uuid })
      .pipe(
        switchMap((membership) => this.dialogService.open(MembershipEditDialog, { width: '600px', header: this.translateService.instant('dialogs.membershipEdit.header'), draggable: false, closable: true, data: { tenantId: this.tenantId, membership } })?.onClose ?? EMPTY),
        filter(Boolean),
      )
      .subscribe(() => this.reload());
  }

  protected remove(uuid: string): void {
    this.utilService.confirm('delete', () =>
      this.membershipHttpService
        .delete({ tenantId: this.tenantId, uuid })
        .pipe(this.utilService.handleError(), first())
        .subscribe(() => this.reload()),
    );
  }
}
