import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { map } from 'rxjs';
import { ClientHttpService, ProjectHttpService } from '../../api/backend-core/services';
import { InputSelectComponent } from '../../components/input-select/input-select.component';
import { InputTextComponent } from '../../components/input-text/input-text.component';
import { shareReplayOne } from '../../helpers/util';
import { FormService } from '../../services/form.service';
import { TenantService } from '../../services/tenant.service';
import { UtilService } from '../../services/util.service';

@Component({
  selector: 'app-project-dialog',
  imports: [AsyncPipe, ReactiveFormsModule, InputTextComponent, InputSelectComponent, ButtonModule, TranslateModule],
  templateUrl: './project-dialog.component.html',
  host: { class: 'flex flex-col gap-2 pt-1' },
})
export class ProjectDialogComponent {
  public dynamicDialogRef = inject(DynamicDialogRef);
  public dynamicDialogConfig = inject(DynamicDialogConfig);
  private formService = inject(FormService);
  private utilService = inject(UtilService);
  private clientHttpService = inject(ClientHttpService);
  private projectHttpService = inject(ProjectHttpService);

  private uuid = this.dynamicDialogConfig.data;

  public formElement = this.formService.createProjectRequestForm();

  public clients$ = this.clientHttpService.list({ tenantId: TenantService.tenantId, pageIndex: -1, pageSize: 0, select: 'uuid name' }).pipe(
    map((r) => r.items.map((i) => ({ label: i.name, value: i.uuid }))),
    shareReplayOne(),
  );

  public constructor() {
    if (this.uuid) {
      this.projectHttpService.read({ tenantId: TenantService.tenantId, uuid: this.uuid }).subscribe((entity) => {
        this.formElement.patchValue(entity);
        this.formElement.markAsPristine();
      });
    }
  }

  public submit(): void {
    this.utilService
      .withDefaultFormHandling(this.formElement, this.projectHttpService.upsert({ tenantId: TenantService.tenantId, body: this.formElement.getRawValue(), uuid: this.uuid }))
      .subscribe(() => this.dynamicDialogRef.close(true));
  }
}
