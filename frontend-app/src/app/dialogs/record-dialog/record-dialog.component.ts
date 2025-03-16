import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { map } from 'rxjs';
import { RecordHttpService } from '../../api/backend-core/services';
import { InputSelectComponent } from '../../components/input-select/input-select.component';
import { InputTimeComponent } from '../../components/input-time/input-time.component';
import { shareReplayOne } from '../../helpers/util';
import { FormService } from '../../services/form.service';
import { TaskService } from '../../services/task.service';
import { TenantService } from '../../services/tenant.service';
import { UtilService } from '../../services/util.service';

@Component({
  selector: 'app-record-dialog',
  imports: [AsyncPipe, ReactiveFormsModule, InputTimeComponent, InputSelectComponent, ButtonModule, TranslateModule],
  templateUrl: './record-dialog.component.html',
  host: { class: 'flex flex-col gap-2 pt-1' },
})
export class RecordDialogComponent {
  public dynamicDialogRef = inject(DynamicDialogRef);
  public dynamicDialogConfig = inject(DynamicDialogConfig);
  private formService = inject(FormService);
  private utilService = inject(UtilService);
  private recordHttpService = inject(RecordHttpService);
  private taskService = inject(TaskService);

  private uuid = this.dynamicDialogConfig.data;

  public formElement = this.formService.createRecordRequestForm();

  public tasks$ = this.taskService.tasks$.pipe(
    map((r) => r.map((i) => ({ label: `${i.task.name} (${i.project?.name})`, value: i.task.uuid }))),
    shareReplayOne(),
  );

  public constructor() {
    if (this.uuid) {
      this.recordHttpService.read({ tenantId: TenantService.tenantId, uuid: this.uuid }).subscribe((entity) => {
        this.formElement.patchValue(entity);
        this.formElement.markAsPristine();
      });
    }
  }

  public submit(): void {
    this.utilService
      .withDefaultFormHandling(this.formElement, this.recordHttpService.upsert({ tenantId: TenantService.tenantId, body: this.formElement.getRawValue(), uuid: this.uuid }))
      .subscribe(() => this.dynamicDialogRef.close(true));
  }
}
