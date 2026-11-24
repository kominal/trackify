// @ts-check
import tseslint from 'typescript-eslint';
import angular from '../../tooling/eslint/angular.mjs';
import nestjs from '../../tooling/eslint/nestjs.mjs';

export default tseslint.config(
  ...angular({
    tsconfigRootDir: import.meta.dirname,
    tsFiles: ['frontend-app/**/*.ts'],
    htmlFiles: ['frontend-app/**/*.html'],
    selectorPrefix: ['app'],
  }),
  ...nestjs({
    tsconfigRootDir: import.meta.dirname,
    files: ['backend-core/**/*.ts'],
  }),

  // Adopted flow conventions: the architecture this app copies from flow (Eager change detection,
  // any-typed values flowing through the generated API client and mongoose, PrimeNG template
  // method bindings) conflicts with parts of the strict shared config — same relaxations as flow.
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-extraneous-class': 'off',
      '@typescript-eslint/no-invalid-void-type': 'off',
      '@typescript-eslint/no-unnecessary-type-parameters': 'off',
      '@typescript-eslint/no-unsafe-enum-comparison': 'warn',
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: false }],
    },
  },
  {
    // @angular-eslint rules must stay scoped to files where the plugin is registered.
    files: ['frontend-app/**/*.ts'],
    rules: {
      '@angular-eslint/prefer-on-push-component-change-detection': 'off',
    },
  },
  {
    files: ['frontend-app/**/*.html'],
    rules: {
      '@angular-eslint/template/alt-text': 'warn',
      '@angular-eslint/template/click-events-have-key-events': 'warn',
      '@angular-eslint/template/interactive-supports-focus': 'warn',
      '@angular-eslint/template/label-has-associated-control': 'warn',
      '@angular-eslint/template/elements-content': 'warn',
    },
  },
);
