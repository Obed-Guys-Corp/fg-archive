import { execSync } from "node:child_process";
import { defineConfig } from "vite";
import Sitemap from 'vite-plugin-sitemap'
import { setBuilds } from "./src/config/set-builds.ts"
import { mkPages } from "./src/config/mk-pages.ts"

export default defineConfig({
    base: "/",

    define: {
        COMMIT: JSON.stringify(execSync("git rev-parse HEAD").toString().trim()),
        BUILD_DATE: JSON.stringify(new Date().toISOString())
    },

    plugins: [
        Sitemap({
            hostname: 'https://fga.floyzi.dev',
        }),
        setBuilds(),
        {
            name: "mk-pages",

            async writeBundle(options) {
                await mkPages(options.dir!);
            },
        },
    ]
});
