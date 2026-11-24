import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TaskEntity } from '@api/models';
import { TaskHttpService } from '@api/services';
import { ColorPicker } from '@components/color-picker/color-picker';
import { Dialog } from '@helpers/dialog.helper';
import { InputBooleanComponent, InputNumberComponent, InputSelectComponent, InputTextComponent } from '@kominal/common-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { CatalogService } from '@services/catalog.service';
import { FormService } from '@services/form.service';
import { UtilService } from '@services/util.service';
import { ButtonModule } from 'primeng/button';
import { first, Observable } from 'rxjs';

@Component({
  selector: 'app-task-edit-dialog',
  imports: [ButtonModule, InputTextComponent, InputSelectComponent, InputNumberComponent, InputBooleanComponent, ColorPicker, TranslatePipe, ReactiveFormsModule],
  template: `
    <form class="flex flex-col gap-4" [formGroup]="formElement" (ngSubmit)="submit()">
      <app-input-text label="simple.name" [formElement]="formElement.controls.name" />
      <app-input-select label="simple.project" [formElement]="$any(formElement.controls.projectId)" [options]="projectOptions()" [allowEmpty]="false" />
      <app-color-picker label="simple.color" [formElement]="formElement.controls.color" [allowEmpty]="true" emptyLabel="simple.projectColor" />
      <app-input-number label="simple.priority" [formElement]="$any(formElement.controls.priority)" [step]="1" />
      @if (data.entity) {
        <app-input-boolean label="simple.archived" [formElement]="formElement.controls.archived" />
      }
      <div class="flex justify-end gap-2">
        <p-button severity="secondary" [outlined]="true" [label]="'simple.cancel' | translate" (click)="close()" />
        <p-button type="submit" [attr.data-testid]="'task-save-button'" [label]="'simple.save' | translate" [disabled]="formElement.invalid" />
      </div>
    </form>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class TaskEditDialog extends Dialog<{ tenantId: string; entity?: TaskEntity; projectId?: string }> {
  private readonly taskHttpService = inject(TaskHttpService);
  private readonly catalogService = inject(CatalogService);
  private readonly utilService = inject(UtilService);
  protected readonly formElement = inject(FormService).createTaskForm(this.data.entity ?? { projectId: this.data.projectId, priority: this.catalogService.catalog().tasks.length });

  protected readonly projectOptions = computed(() =>
    this.catalogService
      .catalog()
      .projects.filter((project) => !project.archived || project.uuid === this.data.entity?.projectId)
      .map((project) => ({ label: project.name, value: project.uuid })),
  );

  protected submit(): void {
    const { tenantId, entity } = this.data;
    const { color, ...rest } = this.formElement.getRawValue();
    const body = { ...rest, color: color || undefined };
    const request$: Observable<unknown> = entity ? this.taskHttpService.update({ tenantId, uuid: entity.uuid, body: { ...body, version: entity.version } }) : this.taskHttpService.create({ tenantId, body });
    request$.pipe(this.utilService.handleError(), first()).subscribe(() => this.close(true));
  }
}
