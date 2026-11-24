import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Color } from '@api/models';
import { COLOR_KEYS, colorOf } from '@constants/colors';
import { LabelComponent } from '@kominal/common-angular';
import { TranslatePipe } from '@ngx-translate/core';

// Swatches of the fixed palette (projects and tasks store the key, see constants/colors).
@Component({
  selector: 'app-color-picker',
  imports: [LabelComponent, TranslatePipe],
  template: `
    <app-label [label]="label()" [formElement]="formElement()" />
    <div class="flex flex-wrap gap-2">
      @if (allowEmpty()) {
        <button type="button" class="flex h-8 cursor-pointer items-center rounded-md border-2 px-2 text-xs" [class]="formElement().value ? 'bg-surface-100 dark:bg-surface-800 border-transparent' : 'border-primary bg-surface-100 dark:bg-surface-800'" (click)="select(undefined)">{{
          emptyLabel() | translate
        }}</button>
      }
      @for (color of colors; track color) {
        <button
          type="button"
          class="h-8 w-8 cursor-pointer rounded-md border-2"
          [class]="formElement().value === color ? 'border-primary ring-primary/30 ring-2' : 'border-transparent'"
          [style.background]="colorOf(color)"
          [attr.aria-label]="'enums.Color.' + color | translate"
          [attr.data-testid]="'color-' + color"
          (click)="select(color)"
        ></button>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  host: { class: 'flex flex-col gap-1 w-full' },
})
export class ColorPicker {
  public readonly label = input.required<string>();
  public readonly formElement = input.required<FormControl<Color | undefined>>();
  public readonly allowEmpty = input(false);
  public readonly emptyLabel = input('simple.inherit');

  protected readonly colors = COLOR_KEYS;

  protected colorOf(color: Color): string {
    return colorOf(color, false);
  }

  protected select(color: Color | undefined): void {
    this.formElement().setValue(color);
    this.formElement().markAsDirty();
  }
}
