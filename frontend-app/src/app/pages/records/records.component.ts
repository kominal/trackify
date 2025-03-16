import { AsyncPipe, DatePipe, NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogService } from 'primeng/dynamicdialog';
import { TableModule } from 'primeng/table';
import { BehaviorSubject, combineLatest, filter, Subject, switchMap } from 'rxjs';
import { Record } from '../../api/backend-core/models/record';
import { RecordHttpService } from '../../api/backend-core/services';
import { RecordDialogComponent } from '../../dialogs/record-dialog/record-dialog.component';
import { shareReplayOne, toListRequest } from '../../helpers/util';
import { TaskPipe } from '../../pipes/task.pipe';
import { TaskService } from '../../services/task.service';
import { TenantService } from '../../services/tenant.service';
import { UtilService } from '../../services/util.service';

@Component({
  selector: 'app-records',
  imports: [AsyncPipe, DatePipe, TableModule, ButtonModule, TranslatePipe, TaskPipe, NgClass],
  templateUrl: './records.component.html',
  host: { class: 'flex flex-col h-full overflow-auto' },
})
export class RecordsComponent {
  private recordHttpService = inject(RecordHttpService);
  private dialogService = inject(DialogService);
  private translateService = inject(TranslateService);
  private confirmationService = inject(ConfirmationService);
  private utilService = inject(UtilService);
  private taskService = inject(TaskService);

  public tasks$ = this.taskService.tasks$;

  public conditions$ = new Subject();

  public refresh$ = new BehaviorSubject<void>(undefined);

  public data$ = combineLatest([this.conditions$, this.refresh$]).pipe(
    switchMap(([conditions]) =>
      this.recordHttpService.list({ tenantId: TenantService.tenantId, ...toListRequest<Record>(conditions, undefined, ['uuid', 'taskId', 'start', 'end']) }),
    ),
    shareReplayOne(),
  );

  public constructor() {
    this.tasks$.pipe(takeUntilDestroyed()).subscribe();
  }

  public openRecordDialog(uuid?: string): void {
    this.dialogService
      .open(RecordDialogComponent, { header: this.translateService.instant('simple.record'), width: '540px', modal: true, closable: true, data: uuid })
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
        this.recordHttpService
          .delete({ tenantId: TenantService.tenantId, uuid })
          .pipe(this.utilService.handleError())
          .subscribe(() => this.refresh$.next());
      },
    });
  }
}
