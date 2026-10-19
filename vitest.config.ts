import { defineConfig } from "vitest/config";

// Unit tests for the framework-free parts (scheduling, storage format, content).
export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
  },
});
