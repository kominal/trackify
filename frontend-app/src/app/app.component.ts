import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { LayoutService } from './services/layout.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AsyncPipe, RouterOutlet, ConfirmDialogModule, ToastModule, ProgressSpinnerModule],
  templateUrl: './app.component.html',
})
export class AppComponent {
  public layoutService = inject(LayoutService);
  private translateService = inject(TranslateService);

  public constructor() {
    const browserLang = this.translateService.getBrowserLang();
    const storedLang = localStorage.getItem('lang');
    let lang = storedLang || browserLang || 'en';
    if (!['en', 'de'].includes(lang)) {
      lang = 'en';
    }
    this.translateService.use(lang);
  }
}
