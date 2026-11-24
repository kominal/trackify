import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { PopoverModule } from 'primeng/popover';

@Component({
  selector: 'app-entity-info',
  imports: [PopoverModule, ButtonModule, TranslatePipe, DatePipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './entity-info.html',
})
export class EntityInfo {
  public readonly entity = input<{ createdBy: string; createdAt: Date; changedBy: string; changedAt: Date }>();
}
