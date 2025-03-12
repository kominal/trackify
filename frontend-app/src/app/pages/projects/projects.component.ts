import { AsyncPipe, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogService } from 'primeng/dynamicdialog';
import { TableModule } from 'primeng/table';
import { BehaviorSubject, combineLatest, filter, Subject, switchMap } from 'rxjs';
import { Client } from '../../api/backend-core/models/client';
import { ProjectHttpService } from '../../api/backend-core/services';
import { ProjectDialogComponent } from '../../dialogs/project-dialog/project-dialog.component';
import { shareReplayOne, toListRequest } from '../../helpers/util';
import { TenantService } from '../../services/tenant.service';
import { UtilService } from '../../services/util.service';

@Component({
  selector: 'app-projects',
  imports: [AsyncPipe, DatePipe, TableModule, ButtonModule, TranslatePipe],
  templateUrl: './projects.component.html',
  host: { class: 'flex flex-col h-full overflow-auto' },
})
export class ProjectsComponent {
  private projectHttpService = inject(ProjectHttpService);
  private dialogService = inject(DialogService);
  private translateService = inject(TranslateService);
  private confirmationService = inject(ConfirmationService);
  private utilService = inject(UtilService);

  public conditions$ = new Subject();

  public refresh$ = new BehaviorSubject<void>(undefined);

  public data$ = combineLatest([this.conditions$, this.refresh$]).pipe(
    switchMap(([conditions]) => this.projectHttpService.list({ tenantId: TenantService.tenantId, ...toListRequest<Client>(conditions, undefined, ['uuid', 'name']) })),
    shareReplayOne(),
  );

  public openClientDialog(uuid?: string): void {
    this.dialogService
      .open(ProjectDialogComponent, { header: this.translateService.instant('simple.project'), width: '540px', modal: true, closable: true, data: uuid })
      .onClose.pipe(filter((result) => result))
      .subscribe(() => this.refresh$.next());
  }

  public remove(event: any, uuid: string): void {
    this.confirmationService.confirm({
      target: event.target,
      header: this.translateService.instant('dialogs.delete.title'),
      message: this.translateService.instant('dialogs.delete.notice'),
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.projectHttpService
          .delete({ tenantId: TenantService.tenantId, uuid })
          .pipe(this.utilService.handleError())
          .subscribe(() => this.refresh$.next());
      },
    });
  }
}
