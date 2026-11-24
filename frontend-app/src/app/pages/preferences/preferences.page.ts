import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MeHttpService } from '@api/services';
import { addLocalDays, startOfLocalDay } from '@helpers/clock';
import { queryDate } from '@helpers/util';
import { InputBooleanComponent, InputNumberComponent, InputSelectComponent, InputTextComponent } from '@kominal/common-angular';
import { DesktopSettings } from '@models/native.model';
import { TranslatePipe } from '@ngx-translate/core';
import { ApplicationStateService } from '@services/application-state.service';
import { NativeService } from '@services/native.service';
import { UserSettingsService } from '@services/user-settings.service';
import { UtilService } from '@services/util.service';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { FormsModule } from '@angular/forms';
import { Message } from 'primeng/message';
import { first } from 'rxjs';

const TIME_ZONES: string[] = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf?.('timeZone') ?? ['Europe/Berlin', 'UTC'];

@Component({
  selector: 'app-preferences-page',
  imports: [ButtonModule, ReactiveFormsModule, FormsModule, InputSelectComponent, InputNumberComponent, InputBooleanComponent, InputTextComponent, DatePickerModule, TranslatePipe, Message],
  templateUrl: './preferences.page.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  host: { class: 'scroll-page max-w-4xl!' },
})
export class PreferencesPage {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly userSettingsService = inject(UserSettingsService);
  private readonly meHttpService = inject(MeHttpService);
  private readonly utilService = inject(UtilService);
  protected readonly nativeService = inject(NativeService);
  protected readonly applicationStateService = inject(ApplicationStateService);

  protected readonly timeZoneOptions = TIME_ZONES.map((zone) => ({ label: zone.replace(/_/g, ' '), value: zone }));

  protected readonly formElement = this.formBuilder.group({
    timeZone: this.formBuilder.control<string>(this.userSettingsService.settings().timeZone, Validators.required),
    reminderMinutes: this.formBuilder.control<number>(this.userSettingsService.settings().reminderMinutes, [Validators.required, Validators.min(5), Validators.max(240)]),
  });

  protected readonly desktopForm = this.formBuilder.group({
    autostart: this.formBuilder.control(false),
    startHidden: this.formBuilder.control(true),
    activityTracking: this.formBuilder.control(true),
    idleThresholdSeconds: this.formBuilder.control(300, [Validators.required, Validators.min(60), Validators.max(3600)]),
    excludedApps: this.formBuilder.control(''),
  });

  protected readonly deleteRange = signal<Date[]>([startOfLocalDay(), startOfLocalDay()]);

  public constructor() {
    this.userSettingsService.settings$.pipe(first()).subscribe((settings) => this.formElement.reset(settings));
    void this.nativeService.api?.getSettings().then((settings) => this.desktopForm.reset({ ...settings, excludedApps: settings.excludedApps.join(', ') }));
  }

  protected save(): void {
    this.utilService.withDefaultFormHandling(this.formElement, this.userSettingsService.update(this.formElement.getRawValue())).subscribe();
  }

  protected saveDesktop(): void {
    const api = this.nativeService.api;
    if (!api) {
      return;
    }
    const value = this.desktopForm.getRawValue();
    const settings: DesktopSettings = {
      ...value,
      excludedApps: value.excludedApps
        .split(',')
        .map((app) => app.trim())
        .filter(Boolean),
    };
    void api.setSettings(settings).then((saved) => {
      this.desktopForm.reset({ ...saved, excludedApps: saved.excludedApps.join(', ') });
      this.utilService.showSuccess('form.formSaved');
    });
  }

  // Installers are published as GitHub releases of the trackify repository.
  protected openDownload(): void {
    window.open('https://github.com/kominal/trackify/releases/latest', '_blank', 'noopener');
  }

  protected deleteActivity(): void {
    const [from, to] = this.deleteRange();
    if (!from || !to) {
      return;
    }
    this.utilService.confirm('deleteActivity', () =>
      this.meHttpService
        .deleteActivities({ from: queryDate(startOfLocalDay(from)), to: queryDate(addLocalDays(startOfLocalDay(to), 1)) })
        .pipe(this.utilService.handleError(), first())
        .subscribe(() => this.utilService.showSuccess('preferences.activityDeleted')),
    );
  }
}
