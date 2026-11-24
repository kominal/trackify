import { inject, Injectable, Type } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Confirmation, ConfirmationService, MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { catchError, EMPTY, first, Observable, OperatorFunction, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UtilService {
  private readonly confirmationService = inject(ConfirmationService);
  private readonly dialogService = inject(DialogService);
  private readonly messageService = inject(MessageService);
  private readonly translateService = inject(TranslateService);

  // Handles HttpErrorResponse (body in `error`) and the generated client's responses; the backend
  // answers with translation keys (`exception.*`), anything else becomes a generic message.
  public showError(httpExchange: any): void {
    const body = httpExchange?.error ?? httpExchange?.response;
    const message = typeof body?.message === 'string' && body.message.startsWith('exception.') ? body.message : undefined;
    this.messageService.add({
      severity: 'error',
      summary: this.translateService.instant('simple.error'),
      detail: this.translateService.instant(message ?? 'error.errorOnRequest'),
    });
  }

  public showErrorKey(key: string): void {
    this.messageService.add({ severity: 'error', summary: this.translateService.instant('simple.error'), detail: this.translateService.instant(key) });
  }

  public handleError<T>(): OperatorFunction<T, T> {
    return catchError((httpExchange: T) => {
      this.showError(httpExchange);
      return EMPTY;
    });
  }

  public withDefaultFormHandling<T>(form: FormGroup, observable: Observable<T | void>): Observable<T | void> {
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
          detail: this.translateService.instant('form.formSaved'),
        });
      }),
      first(),
    );
  }

  public showSuccess(detailKey: string): void {
    this.messageService.add({
      severity: 'success',
      summary: this.translateService.instant('simple.success'),
      detail: this.translateService.instant(detailKey),
    });
  }

  public confirm(type: string, accept: () => void, reject?: () => void): void {
    this.confirmationService.confirm({
      header: this.translateService.instant(`confirm.${type}.header`),
      message: this.translateService.instant(`confirm.${type}.message`),
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      icon: 'fas fa-trash',
      draggable: false,
      accept,
      reject,
    } as Confirmation);
  }

  public open<T = unknown, V = unknown>(type: string, component: Type<unknown>, data: T, width = '1000px'): Observable<V> {
    return this.dialogService.open(component, { width, header: this.translateService.instant(`dialogs.${type}.header`), draggable: false, closable: true, data })?.onClose ?? EMPTY;
  }
}
