import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli.ts"],
  format: ["esm"],
  external: ["typescript"],
  clean: true,
  dts: false,
  sourcemap: false
});
