import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MembershipPermission } from '@api/models';
import { MembershipHttpService } from '@api/services';
import { Dialog } from '@helpers/dialog.helper';
import { toSelectItems } from '@helpers/util';
import { InputMultiSelectComponent, InputTextComponent, TranslateSelectItemsPipe } from '@kominal/common-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { FormService } from '@services/form.service';
import { UtilService } from '@services/util.service';
import { ButtonModule } from 'primeng/button';
import { first } from 'rxjs';

@Component({
  selector: 'app-membership-add-dialog',
  imports: [ButtonModule, InputTextComponent, InputMultiSelectComponent, TranslatePipe, TranslateSelectItemsPipe, AsyncPipe],
  templateUrl: './membership-add.dialog.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class MembershipAddDialog extends Dialog<{ tenantId: string }> {
  protected readonly MEMBERSHIP_PERMISSION_OPTIONS = toSelectItems('MembershipPermission', MembershipPermission);

  private readonly formService = inject(FormService);
  private readonly membershipHttpService = inject(MembershipHttpService);
  private readonly utilService = inject(UtilService);

  protected readonly formElement = this.formService.createMembershipCreateRequestForm();

  protected submit(): void {
    this.membershipHttpService
      .create({ tenantId: this.data.tenantId, body: this.formElement.getRawValue() })
      .pipe(this.utilService.handleError(), first())
      .subscribe(() => this.close(true));
  }
}
