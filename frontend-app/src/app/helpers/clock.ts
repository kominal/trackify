import { DestroyRef, inject, signal, Signal } from '@angular/core';

// A signal with the current time, updated every `ms` (in an injection context).
export function now(ms = 1000): Signal<Date> {
  const value = signal(new Date());
  const handle = setInterval(() => value.set(new Date()), ms);
  inject(DestroyRef).onDestroy(() => clearInterval(handle));
  return value.asReadonly();
}

export function startOfLocalDay(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addLocalDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

// Monday of the week the date falls into.
export function startOfLocalWeek(date = new Date()): Date {
  const day = startOfLocalDay(date);
  return addLocalDays(day, -((day.getDay() + 6) % 7));
}

export function startOfLocalMonth(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
