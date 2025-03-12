import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { map } from 'rxjs';
import { ProjectHttpService, TaskHttpService } from '../../api/backend-core/services';
import { InputColorComponent } from '../../components/input-color/input-color.component';
import { InputSelectComponent } from '../../components/input-select/input-select.component';
import { InputTextComponent } from '../../components/input-text/input-text.component';
import { shareReplayOne } from '../../helpers/util';
import { FormService } from '../../services/form.service';
import { TenantService } from '../../services/tenant.service';
import { UtilService } from '../../services/util.service';

@Component({
  selector: 'app-task-dialog',
  imports: [AsyncPipe, ReactiveFormsModule, InputTextComponent, InputSelectComponent, ButtonModule, TranslateModule, InputColorComponent],
  templateUrl: './task-dialog.component.html',
  host: { class: 'flex flex-col gap-2 pt-1' },
})
export class TaskDialogComponent {
  public dynamicDialogRef = inject(DynamicDialogRef);
  public dynamicDialogConfig = inject(DynamicDialogConfig);
  private formService = inject(FormService);
  private utilService = inject(UtilService);
  private projectHttpService = inject(ProjectHttpService);
  private taskHttpService = inject(TaskHttpService);

  private uuid = this.dynamicDialogConfig.data;

  public formElement = this.formService.createTaskRequestForm();

  public projects$ = this.projectHttpService.list({ tenantId: TenantService.tenantId, pageIndex: -1, pageSize: 0, select: 'uuid name' }).pipe(
    map((r) => r.items.map((i) => ({ label: i.name, value: i.uuid }))),
    shareReplayOne(),
  );

  public constructor() {
    if (this.uuid) {
      this.taskHttpService.read({ tenantId: TenantService.tenantId, uuid: this.uuid }).subscribe((entity) => {
        this.formElement.patchValue(entity);
        this.formElement.markAsPristine();
      });
    }
  }

  public submit(): void {
    this.utilService
      .withDefaultFormHandling(this.formElement, this.taskHttpService.upsert({ tenantId: TenantService.tenantId, body: this.formElement.getRawValue(), uuid: this.uuid }))
      .subscribe(() => this.dynamicDialogRef.close(true));
  }
}
