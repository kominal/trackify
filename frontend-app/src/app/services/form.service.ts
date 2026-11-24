import { inject, Injectable } from '@angular/core';
import { FormGroup, NonNullableFormBuilder, Validators } from '@angular/forms';
import { ClientEntity, Color, MembershipCreateRequest, MembershipEntity, MembershipPermission, MembershipUpdateRequest, ProjectEntity, TaskEntity, TenantCreateRequest, TenantEntity } from '@api/models';
import { SimpleTypedFormOf } from '@kominal/common-angular';

export type TenantCreateRequestForm = SimpleTypedFormOf<TenantCreateRequest>;
export type TenantNameForm = SimpleTypedFormOf<{ name: string }>;
export type MembershipCreateRequestForm = SimpleTypedFormOf<MembershipCreateRequest>;
export type MembershipUpdateRequestForm = SimpleTypedFormOf<MembershipUpdateRequest>;

@Injectable({ providedIn: 'root' })
export class FormService {
  private readonly formBuilder = inject(NonNullableFormBuilder);

  public createTenantCreateRequestForm(): FormGroup<TenantCreateRequestForm> {
    return this.formBuilder.group<TenantCreateRequestForm>({
      name: this.formBuilder.control<string>('', [Validators.required, Validators.maxLength(120)]),
    });
  }

  public createTenantNameForm(value: TenantEntity): FormGroup<TenantNameForm> {
    return this.formBuilder.group<TenantNameForm>({
      name: this.formBuilder.control<string>(value.name, [Validators.required, Validators.maxLength(120)]),
    });
  }

  public createMembershipCreateRequestForm(): FormGroup<MembershipCreateRequestForm> {
    return this.formBuilder.group<MembershipCreateRequestForm>({
      email: this.formBuilder.control('', [Validators.required, Validators.email]),
      // Every member can track time; managing the catalog or the organisation is granted explicitly.
      permissions: this.formBuilder.control<MembershipPermission[]>([]),
    });
  }

  public createMembershipUpdateRequestForm(value: MembershipEntity): FormGroup<MembershipUpdateRequestForm> {
    return this.formBuilder.group<MembershipUpdateRequestForm>({
      permissions: this.formBuilder.control<MembershipPermission[]>(value.permissions),
    });
  }

  public createClientForm(value?: ClientEntity) {
    return this.formBuilder.group({
      name: this.formBuilder.control<string>(value?.name ?? '', [Validators.required, Validators.maxLength(120)]),
    });
  }

  public createProjectForm(value?: ProjectEntity) {
    return this.formBuilder.group({
      name: this.formBuilder.control<string>(value?.name ?? '', [Validators.required, Validators.maxLength(120)]),
      clientId: this.formBuilder.control<string | undefined>(value?.clientId),
      color: this.formBuilder.control<Color>(value?.color ?? Color.Blue, Validators.required),
      archived: this.formBuilder.control<boolean>(value?.archived ?? false),
    });
  }

  public createTaskForm(value?: Partial<TaskEntity>) {
    return this.formBuilder.group({
      name: this.formBuilder.control<string>(value?.name ?? '', [Validators.required, Validators.maxLength(120)]),
      projectId: this.formBuilder.control<string>(value?.projectId ?? '', Validators.required),
      color: this.formBuilder.control<Color | undefined>(value?.color),
      priority: this.formBuilder.control<number>(value?.priority ?? 0, Validators.required),
      archived: this.formBuilder.control<boolean>(value?.archived ?? false),
    });
  }
}
