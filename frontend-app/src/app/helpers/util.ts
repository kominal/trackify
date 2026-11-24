import { HttpContext } from '@angular/common/http';
import { inject, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { BLOCKING } from '../app.config';

// The generic form/list helpers live in the shared workspace library; re-exported so `@helpers/util` imports stay short.
export { ListRequest, moveControlInFormArray, moveDownInFormArray, moveUpInFormArray, shareReplayOne, toListRequest, toOptions, toSelectItems } from '@kominal/common-angular';

export function param(key: string): string {
  const activatedRoute = inject(ActivatedRoute);
  return activatedRoute.snapshot.paramMap.get(key) ?? '';
}

export function data<T>(key: string): T {
  return inject(ActivatedRoute).snapshot.data[key] as T;
}

export function dataSignal<T>(key: string): Signal<T> {
  return toSignal<T>(inject(ActivatedRoute).data.pipe(map((data) => data[key])), { initialValue: inject(ActivatedRoute).snapshot.data[key] }) as Signal<T>;
}

// Non-blocking requests: the global spinner (BLOCKING context, see app.config) would freeze the
// page on every filter change; pages that refresh in place pass this context instead.
export function background(): HttpContext {
  return new HttpContext().set(BLOCKING, false);
}

// The generated client turns query parameters into strings with String(), which for a Date is the
// long local form ("Tue Nov 24 2026 …"). Dates in queries are sent as ISO strings instead.
export function queryDate(date: Date): Date {
  return date.toISOString() as unknown as Date;
}
