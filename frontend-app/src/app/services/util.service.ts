import { inject, Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { catchError, EMPTY, first, Observable, OperatorFunction, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UtilService {
  private translateService = inject(TranslateService);
  private messageService = inject(MessageService);

  public showError(httpExchange: any): void {
    const { response } = httpExchange;

    if (!response) {
      this.messageService.add({ severity: 'error', summary: 'Fehler', detail: 'Deine Anfrage konnte nicht bearbeitet werden.' });
    }
  }

  public handleError<T>(action?: (e: T) => void): OperatorFunction<T, T> {
    return catchError((httpExchange: T) => {
      this.showError(httpExchange);
      return EMPTY;
    });
  }

  public withDefaultFormHandling<T>(form: FormGroup, observable: Observable<T>): Observable<T> {
    return observable.pipe(
      catchError((httpExchange: T) => {
        this.showError(httpExchange);
        return EMPTY;
      }),
      tap(() => {
        form.markAsPristine();
        this.messageService.add({
          severity: 'success',
          summary: this.translateService.instant('simple.success'),
          detail: this.translateService.instant('simple.formSaved'),
        });
      }),
      first(),
    );
  }
}
