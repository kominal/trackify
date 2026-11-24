import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TenantHttpService } from '@api/services';
import { Dialog } from '@helpers/dialog.helper';
import { InputTextComponent } from '@kominal/common-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { FormService } from '@services/form.service';
import { UtilService } from '@services/util.service';
import { ButtonModule } from 'primeng/button';
import { first } from 'rxjs';

@Component({
  selector: 'app-tenant-add-dialog',
  imports: [ButtonModule, InputTextComponent, TranslatePipe],
  templateUrl: './tenant-add.dialog.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class TenantAddDialog extends Dialog<undefined> {
  private readonly formService = inject(FormService);
  private readonly tenantHttpService = inject(TenantHttpService);
  private readonly utilService = inject(UtilService);
  private readonly router = inject(Router);

  protected readonly formElement = this.formService.createTenantCreateRequestForm();

  protected submit(): void {
    this.tenantHttpService
      .create({ body: this.formElement.getRawValue() })
      .pipe(this.utilService.handleError(), first())
      .subscribe((tenant) => {
        this.close(tenant);
        void this.router.navigate(['/tenants', tenant.uuid]);
      });
  }
}
