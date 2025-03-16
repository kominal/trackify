import { Pipe, PipeTransform } from '@angular/core';
import { map, Observable } from 'rxjs';
import { TaskWrapper } from '../models/task-wrapper.model';

@Pipe({
  name: 'task',
})
export class TaskPipe implements PipeTransform {
  public transform(tasks$: Observable<TaskWrapper[]>, taskId: string | undefined): Observable<TaskWrapper | undefined> {
    return tasks$.pipe(map((tasks) => tasks.find((t) => t.task.uuid === taskId)));
  }
}
