import { NgClass } from '@angular/common';
import { Component, input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { LabelComponent } from '../label/label.component';

@Component({
  selector: 'app-input-color',
  imports: [NgClass, LabelComponent],
  templateUrl: './input-color.component.html',
  host: { class: 'flex flex-col gap-1 w-full' },
})
export class InputColorComponent {
  public COLORS = ['emerald', 'green', 'lime', 'red', 'orange', 'amber', 'yellow', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose'];

  public label = input.required<string>();
  public formElement = input.required<FormControl<string>>();
}
