import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    dir: "src",
    coverage: {
      include: ["src/**/*"],
      //NOTE: this are config files taken from the documentation that we cannot test
      exclude: [
        "src/trpc/**/*{.ts,.tsx}",
        "src/env.js",
        "src/app/api/{trpc,auth}/**/route.ts",
        "src/server/auth.ts",
        "src/server/api/trpc.ts",
      ],
    },
  },
});
