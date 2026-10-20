import { defineConfig } from "vitest/config";

// Dates are the product here, so the suite runs in a non-UTC zone on purpose: a
// calendar-day bug that only shows up west of UTC would otherwise pass in CI.
process.env.TZ = "America/New_York";

export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
});
