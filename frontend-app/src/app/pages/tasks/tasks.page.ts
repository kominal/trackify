import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TaskEntity } from '@api/models';
import { TaskHttpService } from '@api/services';
import { EntityInfo } from '@components/entity-info/entity-info';
import { colorOf } from '@constants/colors';
import { TaskEditDialog } from '@dialogs/task-edit/task-edit.dialog';
import { param } from '@helpers/util';
import { TranslatePipe } from '@ngx-translate/core';
import { ApplicationStateService } from '@services/application-state.service';
import { CatalogService } from '@services/catalog.service';
import { UtilService } from '@services/util.service';
import { ButtonModule } from 'primeng/button';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';
import { filter, first } from 'rxjs';

// Tasks come from the shared catalog (all of them are loaded anyway for the tracking page), so this
// table filters and sorts on the client.
@Component({
  selector: 'app-tasks-page',
  imports: [ButtonModule, TableModule, TooltipModule, TagModule, EntityInfo, TranslatePipe, Message, InputTextModule, IconField, InputIcon, FormsModule, ToggleSwitchModule],
  templateUrl: './tasks.page.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  host: { class: 'list-page' },
})
export class TasksPage {
  private readonly taskHttpService = inject(TaskHttpService);
  protected readonly catalogService = inject(CatalogService);
  private readonly utilService = inject(UtilService);
  protected readonly applicationStateService = inject(ApplicationStateService);
  protected readonly tenantId = param('tenantId');

  protected readonly search = signal('');
  protected readonly showArchived = signal(false);

  protected readonly rows = computed(() => {
    const query = this.search().trim().toLocaleLowerCase();
    const dark = !!this.applicationStateService.darkMode();
    return this.catalogService
      .catalog()
      .taskInfos.filter(({ task, project }) => this.showArchived() || (!task.archived && !project?.archived))
      .filter(({ task, project, client }) => !query || `${task.name} ${project?.name ?? ''} ${client?.name ?? ''}`.toLocaleLowerCase().includes(query))
      .map((info) => ({ ...info, color: colorOf(info.task.color ?? info.project?.color, dark), projectName: info.project?.name ?? '', archived: info.task.archived || !!info.project?.archived }));
  });

  protected edit(entity?: TaskEntity): void {
    this.utilService
      .open(entity ? 'taskEdit' : 'taskAdd', TaskEditDialog, { tenantId: this.tenantId, entity }, '560px')
      .pipe(filter(Boolean))
      .subscribe(() => this.catalogService.reload());
  }

  protected remove(entity: TaskEntity): void {
    this.utilService.confirm('deleteTask', () =>
      this.taskHttpService
        .delete({ tenantId: this.tenantId, uuid: entity.uuid })
        .pipe(this.utilService.handleError(), first())
        .subscribe(() => this.catalogService.reload()),
    );
  }
}
