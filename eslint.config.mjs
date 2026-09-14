import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(['.next/**', '.vercel/**', '.vinext/**', 'dist/**', 'output/**', 'outputs/**', 'tmp/**', 'work/**', 'out/**', 'build/**', 'next-env.d.ts']),
]);

export default eslintConfig;
