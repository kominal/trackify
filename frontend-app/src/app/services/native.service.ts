import { Injectable } from '@angular/core';
import { TrackifyNative } from '@models/native.model';

@Injectable({ providedIn: 'root' })
export class NativeService {
  // Captured once: the preload script runs before the app, so the bridge is there from the start or never.
  public readonly api: TrackifyNative | undefined = window.trackifyNative;
  public readonly available = !!this.api;
}
