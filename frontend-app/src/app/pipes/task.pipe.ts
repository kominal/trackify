import { Pipe, PipeTransform } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Task } from '../api/backend-core/models/task';

@Pipe({
  name: 'task',
})
export class TaskPipe implements PipeTransform {
  public transform(tasks$: Observable<Task[]>, taskId: string | undefined): Observable<Task | undefined> {
    return tasks$.pipe(map((tasks) => tasks.find((t) => t.uuid === taskId)));
  }
}
