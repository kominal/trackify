import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TimeEntryEntity } from '@api/models';
import { TimeEntryHttpService } from '@api/services';
import { colorOf } from '@constants/colors';
import { TimeEntryEditDialog, TimeEntryEditData } from '@dialogs/time-entry-edit/time-entry-edit.dialog';
import { formatMinutes, minutesBetween } from '@helpers/duration';
import { TablePage } from '@helpers/table-page.helper';
import { toListRequest } from '@helpers/util';
import { TranslatePipe } from '@ngx-translate/core';
import { ApplicationStateService } from '@services/application-state.service';
import { CatalogService } from '@services/catalog.service';
import { TrackingService } from '@services/tracking.service';
import { UtilService } from '@services/util.service';
import { ButtonModule } from 'primeng/button';
import { Message } from 'primeng/message';
import { MultiSelectModule } from 'primeng/multiselect';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { filter } from 'rxjs';

@Component({
  selector: 'app-entries-page',
  imports: [ButtonModule, TableModule, TooltipModule, TranslatePipe, Message, DatePipe, MultiSelectModule, FormsModule],
  templateUrl: './entries.page.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  host: { class: 'list-page' },
})
export class EntriesPage extends TablePage<TimeEntryEntity> {
  private readonly timeEntryHttpService = inject(TimeEntryHttpService);
  private readonly trackingService = inject(TrackingService);
  protected readonly catalogService = inject(CatalogService);
  private readonly utilService = inject(UtilService);
  protected readonly applicationStateService = inject(ApplicationStateService);

  protected readonly taskOptions = computed(() => this.catalogService.catalog().taskInfos.map(({ task, project }) => ({ label: project ? `${project.name} · ${task.name}` : task.name, value: task.uuid })));

  public constructor() {
    super((event) => this.timeEntryHttpService.list({ tenantId: this.tenantId, ...toListRequest(event) }));
    let first = true;
    effect(() => {
      this.trackingService.changes();
      if (!first) {
        this.reload();
      }
      first = false;
    });
  }

  protected info(entry: TimeEntryEntity): { task: string; project: string; color: string } {
    const info = this.catalogService.catalog().taskInfo.get(entry.taskId);
    return { task: info?.task.name ?? '?', project: info?.project?.name ?? '', color: colorOf(info?.task.color ?? info?.project?.color, !!this.applicationStateService.darkMode()) };
  }

  protected duration(entry: TimeEntryEntity): string {
    return formatMinutes(minutesBetween(entry.start, entry.end));
  }

  protected edit(entry?: TimeEntryEntity): void {
    const now = new Date();
    this.utilService
      .open<TimeEntryEditData, boolean>(entry ? 'timeEntryEdit' : 'timeEntryAdd', TimeEntryEditDialog, { tenantId: this.tenantId, entry, start: new Date(now.getTime() - 60 * 60 * 1000), end: now }, '640px')
      .pipe(filter(Boolean))
      .subscribe(() => this.reload());
  }
}
