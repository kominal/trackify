import { Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, distinctUntilChanged, map, shareReplay, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LayoutService {
  public readonly loading$ = new BehaviorSubject<string[]>([]);

  private lastFocusedElement: HTMLElement | undefined;

  public isLoading = toSignal(
    this.loading$.asObservable().pipe(
      map((loading) => loading.length > 0),
      distinctUntilChanged(),
      tap((loading) => {
        if (loading) {
          const activeElement = document.activeElement as HTMLElement | null;
          this.lastFocusedElement = activeElement ?? undefined;
          activeElement?.blur();
        } else {
          const elementToRefocus = this.lastFocusedElement;
          this.lastFocusedElement = undefined;
          if (elementToRefocus && document.contains(elementToRefocus)) {
            elementToRefocus.focus();
          }
        }
      }),
      shareReplay(1),
    ),
  );

  public startLoading(type: string): void {
    if (!this.loading$.value.includes(type)) {
      this.loading$.next([...this.loading$.value, type]);
    }
  }

  public stopLoading(type: string): void {
    if (this.loading$.value.includes(type)) {
      this.loading$.next(this.loading$.value.filter((t) => t !== type));
    }
  }
}
