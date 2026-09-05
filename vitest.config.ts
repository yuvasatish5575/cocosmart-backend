import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    testTimeout: 20000,
    hookTimeout: 30000,
    // All test files share one Postgres database — running files in parallel
    // would let e.g. the stock-depletion test in orders.test.ts race against
    // products.test.ts reading the same rows.
    fileParallelism: false,
    setupFiles: ["./tests/testEnv.ts"],
    globalSetup: ["./tests/globalSetup.ts"],
  },
});
