import { execSync } from "node:child_process";
import { defineConfig } from "vite";
import Sitemap from 'vite-plugin-sitemap'
import { pages } from "./src/pages.ts"
import { setBuilds } from "./src/config/set-builds.ts"

export default defineConfig({
    base: "/",

    define: {
        COMMIT: JSON.stringify(execSync("git rev-parse HEAD").toString().trim()),
        BUILD_DATE: JSON.stringify(new Date().toISOString())
    },

    plugins: [
        Sitemap({
            hostname: 'https://fga.floyzi.dev',
            dynamicRoutes: pages.map(x => x)
        }),
        setBuilds(),
    ]
});
