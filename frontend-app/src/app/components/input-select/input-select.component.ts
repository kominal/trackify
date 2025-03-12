import { Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SelectItem } from 'primeng/api';
import { DropdownModule } from 'primeng/dropdown';
import { LabelComponent } from '../label/label.component';

@Component({
  selector: 'app-input-select',
  imports: [DropdownModule, ReactiveFormsModule, LabelComponent],
  templateUrl: './input-select.component.html',
  host: { class: 'flex flex-col gap-1 w-full' },
})
export class InputSelectComponent {
  public label = input.required<string>();
  public formElement = input.required<FormControl<string>>();
  public options = input.required<SelectItem[]>();
}
