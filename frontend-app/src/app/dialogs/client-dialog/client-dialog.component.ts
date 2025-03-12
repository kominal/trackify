import { Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ClientHttpService } from '../../api/backend-core/services';
import { InputTextComponent } from '../../components/input-text/input-text.component';
import { FormService } from '../../services/form.service';
import { TenantService } from '../../services/tenant.service';
import { UtilService } from '../../services/util.service';

@Component({
  selector: 'app-client-dialog',
  imports: [ReactiveFormsModule, InputTextComponent, ButtonModule, TranslateModule],
  templateUrl: './client-dialog.component.html',
  host: { class: 'flex flex-col gap-2 pt-1' },
})
export class ClientDialogComponent {
  public dynamicDialogRef = inject(DynamicDialogRef);
  public dynamicDialogConfig = inject(DynamicDialogConfig);
  private formService = inject(FormService);
  private utilService = inject(UtilService);
  private clientHttpService = inject(ClientHttpService);

  private uuid = this.dynamicDialogConfig.data;

  public formElement = this.formService.createClientRequestForm();

  public constructor() {
    if (this.uuid) {
      this.clientHttpService.read({ tenantId: TenantService.tenantId, uuid: this.uuid }).subscribe((entity) => {
        this.formElement.patchValue(entity);
        this.formElement.markAsPristine();
      });
    }
  }

  public submit(): void {
    this.utilService
      .withDefaultFormHandling(this.formElement, this.clientHttpService.upsert({ tenantId: TenantService.tenantId, body: this.formElement.getRawValue(), uuid: this.uuid }))
      .subscribe(() => this.dynamicDialogRef.close(true));
  }
}
