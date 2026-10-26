/** @fileoverview Repository lint configuration with explicit hook rules for every checked file. */
import { defineConfig, globalIgnores } from "eslint/config";
import reactHooks from 'eslint-plugin-react-hooks';
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Node regression harnesses intentionally use CommonJS; application import rules stay unchanged.
  { files: ['tests/**/*.cjs'], rules: { '@typescript-eslint/no-require-imports': 'off' } },
  {
    plugins: { 'react-hooks': reactHooks },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
