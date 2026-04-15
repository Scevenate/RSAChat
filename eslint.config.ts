import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

const files = ["src/**/*.{js,mjs,cjs,ts,mts,cts}"];

export default defineConfig([
  { files, plugins: { js }, extends: ["js/recommended"], languageOptions: { globals: globals.browser } },
  tseslint.configs.recommended.map((config) => ({ ...config, files })),
]);
