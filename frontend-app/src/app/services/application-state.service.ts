import { inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { debounceTime, startWith } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApplicationStateService {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly translateService = inject(TranslateService);

  public readonly formElement = this.formBuilder.group({
    language: this.formBuilder.control<string>('de'),
    darkMode: this.formBuilder.control<boolean>(window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false),
    showHelp: this.formBuilder.control<boolean>(true),
    previousTenantId: this.formBuilder.control<string | null>(null),
  });

  public readonly showHelp = toSignal(this.formElement.controls.showHelp.valueChanges.pipe(startWith(this.formElement.controls.showHelp.value)));
  public readonly darkMode = toSignal(this.formElement.controls.darkMode.valueChanges.pipe(startWith(this.formElement.controls.darkMode.value)));

  public constructor() {
    this.loadState();

    this.formElement.controls.darkMode.valueChanges //
      .pipe(startWith(this.formElement.controls.darkMode.value))
      .subscribe((isDarkMode) => document.querySelector('html')?.classList.toggle('dark', isDarkMode));

    this.formElement.controls.language.valueChanges //
      .pipe(startWith(this.formElement.controls.language.value))
      .subscribe((language) => this.translateService.use(language));

    this.formElement.valueChanges.pipe(debounceTime(100)).subscribe(() => this.storeState());
  }

  private storeState(): void {
    const state = this.formElement.getRawValue();
    localStorage.setItem('APPLICATION_STATE', JSON.stringify(state));
  }

  private loadState(): void {
    const stateJson = localStorage.getItem('APPLICATION_STATE');
    if (stateJson) {
      try {
        this.formElement.patchValue(JSON.parse(stateJson));
      } catch {
        localStorage.removeItem('APPLICATION_STATE');
      }
    }
  }

  public toggleTheme(): void {
    this.formElement.patchValue({ darkMode: !this.formElement.controls.darkMode.value });
  }

  public toggleHelp(): void {
    this.formElement.patchValue({ showHelp: !this.formElement.controls.showHelp.value });
  }

  public toggleLanguage(): void {
    this.formElement.patchValue({ language: this.formElement.controls.language.value === 'en' ? 'de' : 'en' });
  }
}
