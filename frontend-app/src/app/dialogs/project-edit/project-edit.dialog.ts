import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ProjectEntity } from '@api/models';
import { ProjectHttpService } from '@api/services';
import { ColorPicker } from '@components/color-picker/color-picker';
import { Dialog } from '@helpers/dialog.helper';
import { InputBooleanComponent, InputSelectComponent, InputTextComponent } from '@kominal/common-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { CatalogService } from '@services/catalog.service';
import { FormService } from '@services/form.service';
import { UtilService } from '@services/util.service';
import { ButtonModule } from 'primeng/button';
import { first, Observable } from 'rxjs';

@Component({
  selector: 'app-project-edit-dialog',
  imports: [ButtonModule, InputTextComponent, InputSelectComponent, InputBooleanComponent, ColorPicker, TranslatePipe, ReactiveFormsModule],
  template: `
    <form class="flex flex-col gap-4" [formGroup]="formElement" (ngSubmit)="submit()">
      <app-input-text label="simple.name" [formElement]="formElement.controls.name" />
      <app-input-select label="simple.client" [formElement]="$any(formElement.controls.clientId)" [options]="clientOptions()" />
      <app-color-picker label="simple.color" [formElement]="$any(formElement.controls.color)" />
      @if (data.entity) {
        <app-input-boolean label="simple.archived" [formElement]="formElement.controls.archived" />
      }
      <div class="flex justify-end gap-2">
        <p-button severity="secondary" [outlined]="true" [label]="'simple.cancel' | translate" (click)="close()" />
        <p-button type="submit" [attr.data-testid]="'project-save-button'" [label]="'simple.save' | translate" [disabled]="formElement.invalid" />
      </div>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class ProjectEditDialog extends Dialog<{ tenantId: string; entity?: ProjectEntity }> {
  private readonly projectHttpService = inject(ProjectHttpService);
  private readonly catalogService = inject(CatalogService);
  private readonly utilService = inject(UtilService);
  protected readonly formElement = inject(FormService).createProjectForm(this.data.entity);

  protected readonly clientOptions = computed(() => this.catalogService.catalog().clients.map((client) => ({ label: client.name, value: client.uuid })));

  protected submit(): void {
    const { tenantId, entity } = this.data;
    const { clientId, ...rest } = this.formElement.getRawValue();
    const body = { ...rest, clientId: clientId || undefined };
    const request$: Observable<unknown> = entity ? this.projectHttpService.update({ tenantId, uuid: entity.uuid, body: { ...body, version: entity.version } }) : this.projectHttpService.create({ tenantId, body });
    request$.pipe(this.utilService.handleError(), first()).subscribe(() => this.close(true));
  }
}
