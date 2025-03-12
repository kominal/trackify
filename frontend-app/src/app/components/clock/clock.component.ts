import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { map, timer } from 'rxjs';

@Component({
  selector: 'app-clock',
  imports: [AsyncPipe, DecimalPipe],
  templateUrl: './clock.component.html',
})
export class ClockComponent {
  public since = input(new Date());

  public time$ = timer(0, 100).pipe(
    map(() => {
      return new Date().getTime() - this.since().getTime();
    }),
    map((diff) => {
      return {
        hours: Math.floor(diff / 1000 / 60 / 60),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      };
    }),
  );
}
