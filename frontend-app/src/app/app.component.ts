import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { PrimeNG } from 'primeng/config';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { startWith, switchMap } from 'rxjs';
import { LayoutService } from './services/layout.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ConfirmDialogModule, ProgressSpinnerModule, ToastModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  host: { class: 'flex flex-col h-full' },
})
export class AppComponent {
  protected readonly layoutService = inject(LayoutService);
  private readonly translateService = inject(TranslateService);
  private readonly primeng = inject(PrimeNG);

  public constructor() {
    this.translateService.onLangChange
      .pipe(
        startWith(undefined),
        switchMap(() => this.translateService.get('primeng')),
      )
      .subscribe((res) => this.primeng.setTranslation(res));
  }
}
