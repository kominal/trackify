import { Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DatePickerModule } from 'primeng/datepicker';
import { LabelComponent } from '../label/label.component';

@Component({
  selector: 'app-input-time',
  imports: [ReactiveFormsModule, LabelComponent, DatePickerModule],
  templateUrl: './input-time.component.html',
  styles: ``,
})
export class InputTimeComponent {
  public label = input.required<string>();
  public formElement = input.required<FormControl<Date>>();
}
