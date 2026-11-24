import { inject, Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

// Route titles are translation keys.
@Injectable({ providedIn: 'root' })
export class TranslateTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly translateService = inject(TranslateService);
  private key: string | undefined;

  public constructor() {
    super();
    this.translateService.onLangChange.subscribe(() => this.apply());
  }

  public override updateTitle(snapshot: RouterStateSnapshot): void {
    this.key = this.buildTitle(snapshot);
    this.apply();
  }

  private apply(): void {
    if (!this.key) {
      this.title.setTitle('Trackify');
      return;
    }
    this.translateService.get(this.key).subscribe((translated: string) => this.title.setTitle(`${translated} · Trackify`));
  }
}
