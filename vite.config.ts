import { resolve } from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "kdim",
      fileName: "index",
    },
  },
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text"],
    },
  },
});
