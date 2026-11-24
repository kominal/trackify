import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-divider',
  imports: [TranslatePipe],
  templateUrl: './divider.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  host: { class: 'flex items-center gap-2 pt-4 pb-1' },
})
export class Divider {
  public label = input.required<string>();
}
