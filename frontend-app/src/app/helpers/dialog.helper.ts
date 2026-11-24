import { inject } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

export class Dialog<T> {
  protected readonly dynamicDialogRef = inject(DynamicDialogRef);
  protected readonly dynamicDialogConfig = inject<DynamicDialogConfig<T>>(DynamicDialogConfig);
  protected readonly data = this.dynamicDialogConfig.data as T;

  public close(data?: unknown): void {
    this.dynamicDialogRef.close(data);
  }
}
