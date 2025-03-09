import { AbstractControl, FormControl } from '@angular/forms';

export type TypedFormOf<Type, Types extends { [k in keyof Partial<Type>]: AbstractControl }> = {
  [k in keyof Omit<Type, keyof Types>]: FormControl<Type[k]>;
} & {
  [k in keyof Types]: Types[k];
};
