import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TenantEntity } from '@api/models';
import { TenantHttpService } from '@api/services';
import { Divider } from '@components/divider/divider';
import { data, param } from '@helpers/util';
import { InputTextComponent } from '@kominal/common-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { ApplicationStateService } from '@services/application-state.service';
import { FormService } from '@services/form.service';
import { TenantService } from '@services/tenant.service';
import { UserService } from '@services/user.service';
import { UtilService } from '@services/util.service';
import { ButtonModule } from 'primeng/button';
import { Message } from 'primeng/message';
import { first } from 'rxjs';

@Component({
  selector: 'app-settings-page',
  imports: [ButtonModule, InputTextComponent, Divider, TranslatePipe, Message],
  templateUrl: './settings.page.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  host: { class: 'list-page' },
})
export class SettingsPage {
  private readonly formService = inject(FormService);
  private readonly tenantHttpService = inject(TenantHttpService);
  private readonly tenantService = inject(TenantService);
  private readonly utilService = inject(UtilService);
  private readonly router = inject(Router);
  protected readonly applicationStateService = inject(ApplicationStateService);
  protected readonly userService = inject(UserService);

  private readonly entity = data<TenantEntity>('entity');
  protected readonly tenantId = param('tenantId');

  protected readonly formElement = this.formService.createTenantNameForm(this.entity);

  protected submit(): void {
    const save$ = this.tenantHttpService.update({ tenantId: this.tenantId, body: { name: this.formElement.getRawValue().name } });
    this.utilService.withDefaultFormHandling(this.formElement, save$).subscribe(() => this.tenantService.refreshTenantId());
  }

  protected deleteTenant(): void {
    this.utilService.confirm('deleteTenant', () =>
      this.tenantHttpService
        .delete({ tenantId: this.tenantId })
        .pipe(this.utilService.handleError(), first())
        .subscribe(() => void this.router.navigate(['/start'])),
    );
  }
}
