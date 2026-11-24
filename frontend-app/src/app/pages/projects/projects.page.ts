import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ProjectEntity } from '@api/models';
import { ProjectHttpService } from '@api/services';
import { EntityInfo } from '@components/entity-info/entity-info';
import { colorOf } from '@constants/colors';
import { ProjectEditDialog } from '@dialogs/project-edit/project-edit.dialog';
import { TaskEditDialog } from '@dialogs/task-edit/task-edit.dialog';
import { TablePage } from '@helpers/table-page.helper';
import { toListRequest } from '@helpers/util';
import { TranslatePipe } from '@ngx-translate/core';
import { ApplicationStateService } from '@services/application-state.service';
import { CatalogService } from '@services/catalog.service';
import { UtilService } from '@services/util.service';
import { ButtonModule } from 'primeng/button';
import { Message } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { filter, first } from 'rxjs';

@Component({
  selector: 'app-projects-page',
  imports: [ButtonModule, TableModule, TooltipModule, TagModule, EntityInfo, TranslatePipe, Message],
  templateUrl: './projects.page.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  host: { class: 'list-page' },
})
export class ProjectsPage extends TablePage<ProjectEntity> {
  private readonly projectHttpService = inject(ProjectHttpService);
  protected readonly catalogService = inject(CatalogService);
  private readonly utilService = inject(UtilService);
  protected readonly applicationStateService = inject(ApplicationStateService);

  public constructor() {
    super((event) => this.projectHttpService.list({ tenantId: this.tenantId, ...toListRequest(event) }));
  }

  protected color(entity: ProjectEntity): string {
    return colorOf(entity.color, !!this.applicationStateService.darkMode());
  }

  protected clientName(clientId: string | undefined): string {
    return this.catalogService.catalog().clients.find(({ uuid }) => uuid === clientId)?.name ?? '';
  }

  protected taskCount(projectId: string): number {
    return this.catalogService.catalog().tasks.filter((task) => task.projectId === projectId && !task.archived).length;
  }

  protected edit(entity?: ProjectEntity): void {
    this.utilService
      .open(entity ? 'projectEdit' : 'projectAdd', ProjectEditDialog, { tenantId: this.tenantId, entity }, '560px')
      .pipe(filter(Boolean))
      .subscribe(() => this.changed());
  }

  protected addTask(entity: ProjectEntity): void {
    this.utilService
      .open('taskAdd', TaskEditDialog, { tenantId: this.tenantId, projectId: entity.uuid }, '560px')
      .pipe(filter(Boolean))
      .subscribe(() => this.changed());
  }

  protected remove(entity: ProjectEntity): void {
    this.utilService.confirm('delete', () =>
      this.projectHttpService
        .delete({ tenantId: this.tenantId, uuid: entity.uuid })
        .pipe(this.utilService.handleError(), first())
        .subscribe(() => this.changed()),
    );
  }

  private changed(): void {
    this.reload();
    this.catalogService.reload();
  }
}
