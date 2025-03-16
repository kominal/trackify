import { Directive, Host, HostListener, Self } from '@angular/core';
import { Calendar } from 'primeng/calendar';

@Directive({
  selector: '[useUtc]',
  standalone: true,
})
export class UtcDirective {
  public constructor(@Host() @Self() private calendar: Calendar) {}

  @HostListener('onSelect', ['$event']) public onSelect(): void {
    this.toUtc();
  }

  @HostListener('onInput', ['$event']) public onInput(): void {
    this.toUtc();
  }

  private toUTC(date: Date) {
    if (!date) {
      return date;
    }
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()));
  }

  private toUtc(): void {
    if (this.calendar.value) {
      if (this.calendar.value instanceof Date) {
        this.calendar.value = this.toUTC(this.calendar.value);
      } else if (Array.isArray(this.calendar.value)) {
        this.calendar.value = this.calendar.value.map((date) => this.toUTC(date));
      }
      this.calendar.updateModel(this.calendar.value);
    }
  }
}
