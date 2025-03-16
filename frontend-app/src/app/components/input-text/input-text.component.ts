import { Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { LabelComponent } from '../label/label.component';

@Component({
  selector: 'app-input-text',
  imports: [InputTextModule, ReactiveFormsModule, LabelComponent],
  templateUrl: './input-text.component.html',
  host: { class: 'flex flex-col gap-2 w-full' },
})
export class InputTextComponent {
  public label = input.required<string>();
  public formElement = input.required<FormControl<string>>();
}
