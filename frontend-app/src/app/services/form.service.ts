import { inject, Injectable } from '@angular/core';
import { FormGroup, NonNullableFormBuilder, Validators } from '@angular/forms';
import { ClientRequestForm, ProjectRequestForm, RecordRequestForm, TaskRequestForm, TenantCreateRequestForm } from '../models/forms.model';

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

  public createProjectRequestForm(): FormGroup<ProjectRequestForm> {
    return this.formBuilder.group<ProjectRequestForm>({
      clientId: this.formBuilder.control('', Validators.required),
      name: this.formBuilder.control('', Validators.required),
    });
  }

  public createTaskRequestForm(): FormGroup<TaskRequestForm> {
    return this.formBuilder.group<TaskRequestForm>({
      projectId: this.formBuilder.control('', Validators.required),
      name: this.formBuilder.control('', Validators.required),
      color: this.formBuilder.control('', Validators.required),
    });
  }

  public createRecordRequestForm(): FormGroup<RecordRequestForm> {
    return this.formBuilder.group<RecordRequestForm>({
      taskId: this.formBuilder.control('', Validators.required),
      duration: this.formBuilder.control(0, Validators.required),
      name: this.formBuilder.control('', Validators.required),
    });
  }
}
