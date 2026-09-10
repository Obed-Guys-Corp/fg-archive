import { execSync } from "node:child_process";
import { defineConfig } from "vite";

export default defineConfig({
    base: "/fg-archive/",
    define: {
        COMMIT: JSON.stringify(execSync("git rev-parse HEAD").toString().trim()),
        BUILD_DATE: JSON.stringify(new Date().toISOString())
    }
});
