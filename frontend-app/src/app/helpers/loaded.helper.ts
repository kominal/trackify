import { inject, Signal, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { UtilService } from '@services/util.service';
import { catchError, EMPTY, filter, finalize, Observable, switchMap, tap } from 'rxjs';

export interface Loaded<T> {
  // The latest successfully loaded value. It is kept while the next request is running, so a
  // filter change dims the page instead of blanking it.
  value: Signal<T | undefined>;
  loading: Signal<boolean>;
}

// Loads again whenever `params` changes; an outdated request is cancelled. Must be called in an
// injection context (field initialiser or constructor).
export function loaded<P, T>(params: Signal<P | undefined>, load: (params: P) => Observable<T>): Loaded<T> {
  const utilService = inject(UtilService);
  const loading = signal(false);

  const value = toSignal(
    toObservable(params).pipe(
      filter((current): current is P => current !== undefined),
      tap(() => loading.set(true)),
      switchMap((current) =>
        load(current).pipe(
          catchError((error: unknown) => {
            utilService.showError(error);
            return EMPTY;
          }),
          finalize(() => loading.set(false)),
        ),
      ),
    ),
  );

  return { value, loading: loading.asReadonly() };
}
