import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MembershipEntity, MembershipPermission } from '@api/models';
import { MembershipHttpService } from '@api/services';
import { Dialog } from '@helpers/dialog.helper';
import { toSelectItems } from '@helpers/util';
import { InputMultiSelectComponent, TranslateSelectItemsPipe } from '@kominal/common-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { FormService } from '@services/form.service';
import { UtilService } from '@services/util.service';
import { ButtonModule } from 'primeng/button';
import { first } from 'rxjs';

@Component({
  selector: 'app-membership-edit-dialog',
  imports: [ButtonModule, InputMultiSelectComponent, TranslatePipe, TranslateSelectItemsPipe, AsyncPipe],
  templateUrl: './membership-edit.dialog.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class MembershipEditDialog extends Dialog<{ tenantId: string; membership: MembershipEntity }> {
  protected readonly MEMBERSHIP_PERMISSION_OPTIONS = toSelectItems('MembershipPermission', MembershipPermission);

  private readonly formService = inject(FormService);
  private readonly membershipHttpService = inject(MembershipHttpService);
  private readonly utilService = inject(UtilService);

  protected readonly formElement = this.formService.createMembershipUpdateRequestForm(this.data.membership);

  protected submit(): void {
    this.membershipHttpService
      .update({ tenantId: this.data.tenantId, uuid: this.data.membership.uuid, body: this.formElement.getRawValue() })
      .pipe(this.utilService.handleError(), first())
      .subscribe(() => this.close(true));
  }
}
