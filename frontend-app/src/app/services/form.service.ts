import { inject, Injectable } from '@angular/core';
import { FormGroup, NonNullableFormBuilder, Validators } from '@angular/forms';
import { ClientRequestForm, TenantCreateRequestForm } from '../models/forms.model';

@Injectable({
  providedIn: 'root',
})
export class FormService {
  private formBuilder = inject(NonNullableFormBuilder);

  public createTenantCreateRequestForm(): FormGroup<TenantCreateRequestForm> {
    return this.formBuilder.group<TenantCreateRequestForm>({
      name: this.formBuilder.control('', Validators.required),
    });
  }

  public createClientRequestForm(): FormGroup<ClientRequestForm> {
    return this.formBuilder.group<ClientRequestForm>({
      name: this.formBuilder.control('', Validators.required),
    });
  }
}
