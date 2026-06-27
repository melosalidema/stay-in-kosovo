import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    exclude: ["e2e/**", "node_modules/**"],
    coverage: {
      reporter: ["text", "html"],
      include: ["src/services/**/*.ts", "src/lib/**/*.ts", "src/components/**/*.tsx"]
    }
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  }
});
