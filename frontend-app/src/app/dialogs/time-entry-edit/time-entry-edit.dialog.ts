import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TimeEntryEntity } from '@api/models';
import { TimeEntryHttpService } from '@api/services';
import { formatMinutes, minutesBetween } from '@helpers/duration';
import { Dialog } from '@helpers/dialog.helper';
import { InputSelectComponent, InputTextComponent, LabelComponent } from '@kominal/common-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { CatalogService } from '@services/catalog.service';
import { UtilService } from '@services/util.service';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectItem } from 'primeng/api';
import { first, startWith, Observable } from 'rxjs';

export interface TimeEntryEditData {
  tenantId: string;
  // Editing an existing entry, or creating one (optionally prefilled, e.g. from an untracked gap).
  entry?: TimeEntryEntity;
  start?: Date;
  end?: Date;
}

@Component({
  selector: 'app-time-entry-edit-dialog',
  imports: [ButtonModule, DatePickerModule, ReactiveFormsModule, InputSelectComponent, InputTextComponent, LabelComponent, TranslatePipe],
  templateUrl: './time-entry-edit.dialog.html',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class TimeEntryEditDialog extends Dialog<TimeEntryEditData> {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly timeEntryHttpService = inject(TimeEntryHttpService);
  private readonly catalogService = inject(CatalogService);
  private readonly utilService = inject(UtilService);

  protected readonly formElement = this.formBuilder.group({
    taskId: this.formBuilder.control<string>(this.data.entry?.taskId ?? '', Validators.required),
    start: this.formBuilder.control<Date>(this.data.entry?.start ?? this.data.start ?? new Date(), Validators.required),
    end: this.formBuilder.control<Date>(this.data.entry?.end ?? this.data.end ?? new Date(), Validators.required),
    note: this.formBuilder.control<string>(this.data.entry?.note ?? '', Validators.maxLength(500)),
  });

  protected readonly taskOptions = computed((): SelectItem<string>[] =>
    this.catalogService
      .catalog()
      .taskInfos.filter(({ task }) => !task.archived || task.uuid === this.data.entry?.taskId)
      .map(({ task, project }) => ({ label: project ? `${project.name} · ${task.name}` : task.name, value: task.uuid })),
  );

  private readonly value = toSignal(this.formElement.valueChanges.pipe(startWith(this.formElement.getRawValue())));
  protected readonly duration = computed(() => {
    const { start, end } = this.value() ?? {};
    return start && end && end > start ? formatMinutes(minutesBetween(start, end)) : undefined;
  });

  protected submit(): void {
    const { taskId, start, end, note } = this.formElement.getRawValue();
    if (end <= start) {
      this.utilService.showErrorKey('exception.invalidRange');
      return;
    }
    const body = { taskId, start, end, note: note || undefined };
    const request$: Observable<unknown> = this.data.entry ? this.timeEntryHttpService.update({ tenantId: this.data.tenantId, uuid: this.data.entry.uuid, body }) : this.timeEntryHttpService.create({ tenantId: this.data.tenantId, body });
    request$.pipe(this.utilService.handleError(), first()).subscribe(() => this.close(true));
  }

  protected remove(): void {
    const entry = this.data.entry;
    if (!entry) {
      return;
    }
    this.utilService.confirm('delete', () =>
      this.timeEntryHttpService
        .delete({ tenantId: this.data.tenantId, uuid: entry.uuid })
        .pipe(this.utilService.handleError(), first())
        .subscribe(() => this.close(true)),
    );
  }
}
