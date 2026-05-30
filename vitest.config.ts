import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      reporter: ["text", "lcov"],
      include: ["registry/**"],
    },
  },
  resolve: {
    alias: {
      // Stub shadcn Button so component tests don't need a full shadcn install
      "@/components/ui/button": resolve(__dirname, "tests/__mocks__/button.tsx"),
    },
  },
});
