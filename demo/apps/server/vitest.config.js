// eslint-disable-next-line node/no-missing-import
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/*.test.js"],
    globals: true,
  },
});
