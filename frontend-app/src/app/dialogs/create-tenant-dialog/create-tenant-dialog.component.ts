import { Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageModule } from 'primeng/message';
import { TenantHttpService } from '../../api/backend-core/services';
import { InputTextComponent } from '../../components/input-text/input-text.component';
import { FormService } from '../../services/form.service';
import { UtilService } from '../../services/util.service';

@Component({
  selector: 'app-create-tenant-dialog',
  imports: [MessageModule, ReactiveFormsModule, InputTextComponent, ButtonModule, TranslateModule],
  templateUrl: './create-tenant-dialog.component.html',
  host: { class: 'flex flex-col gap-2 pt-1' },
})
export class CreateTenantDialogComponent {
  public dynamicDialogRef = inject(DynamicDialogRef);
  private formService = inject(FormService);
  private utilService = inject(UtilService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private tenantHttpService = inject(TenantHttpService);

  public formElement = this.formService.createTenantCreateRequestForm();

  public submit(): void {
    this.utilService.withDefaultFormHandling(this.formElement, this.tenantHttpService.create({ body: this.formElement.getRawValue() })).subscribe((entity) => {
      if (entity) {
        this.dynamicDialogRef.close();
        this.router.navigate([`../${entity.uuid}`], { relativeTo: this.activatedRoute });
      }
    });
  }
}
