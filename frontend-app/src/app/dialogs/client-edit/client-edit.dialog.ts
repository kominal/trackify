import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ClientEntity } from '@api/models';
import { ClientHttpService } from '@api/services';
import { Dialog } from '@helpers/dialog.helper';
import { InputTextComponent } from '@kominal/common-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { FormService } from '@services/form.service';
import { UtilService } from '@services/util.service';
import { ButtonModule } from 'primeng/button';
import { first, Observable } from 'rxjs';

@Component({
  selector: 'app-client-edit-dialog',
  imports: [ButtonModule, InputTextComponent, TranslatePipe, ReactiveFormsModule],
  template: `
    <form class="flex flex-col gap-4" [formGroup]="formElement" (ngSubmit)="submit()">
      <app-input-text label="simple.name" [formElement]="formElement.controls.name" />
      <div class="flex justify-end gap-2">
        <p-button severity="secondary" [outlined]="true" [label]="'simple.cancel' | translate" (click)="close()" />
        <p-button type="submit" [attr.data-testid]="'client-save-button'" [label]="'simple.save' | translate" [disabled]="formElement.invalid" />
      </div>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class ClientEditDialog extends Dialog<{ tenantId: string; entity?: ClientEntity }> {
  private readonly clientHttpService = inject(ClientHttpService);
  private readonly utilService = inject(UtilService);
  protected readonly formElement = inject(FormService).createClientForm(this.data.entity);

  protected submit(): void {
    const { tenantId, entity } = this.data;
    const body = this.formElement.getRawValue();
    const request$: Observable<unknown> = entity ? this.clientHttpService.update({ tenantId, uuid: entity.uuid, body: { ...body, version: entity.version } }) : this.clientHttpService.create({ tenantId, body });
    request$.pipe(this.utilService.handleError(), first()).subscribe(() => this.close(true));
  }
}
