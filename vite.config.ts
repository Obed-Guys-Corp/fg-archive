import { execSync } from "node:child_process";
import { defineConfig } from "vite";
import { setBuilds } from "./src/config/set-builds.ts";
import { mkPages } from "./src/config/mk-pages.ts";
import { pages } from "./src/pages.ts";
import { sitemap } from "vite-plugin-sitemap-ts";
import { minifyPlugin } from '@mpen/vite-plugin-minify';
import cp from 'vite-plugin-cp';

export default defineConfig({
    base: "/",

    define: {
        COMMIT: JSON.stringify(execSync("git rev-parse HEAD").toString().trim()),
        BUILD_DATE: JSON.stringify(new Date().toISOString())
    },

    plugins: [
        sitemap({
            hostname: "https://fga.floyzi.dev",
            outDir: "dist",
            routes: pages.map(page => ({
                loc: page.path ? `/${page.path.replace(/^\/+|\/+$/g, "")}/` : "/",
                lastmod: new Date().toISOString(),
                changefreq: "daily",
                priority: 1.0
            }))
        }),
        setBuilds(),
        {
            name: "mk-pages",

            async writeBundle(options) {
                await mkPages(options.dir!);
            }
        },
        minifyPlugin(),
        cp({
            targets: [
                {
                    src: './public',
                    dest: './dist',
                    flatten: false,

                    transform(buf, filename) {
                        const ext = filename.split('.').pop()?.toLowerCase();

                        if (ext === 'json') {
                            return JSON.stringify(JSON.parse(buf.toString()));
                        }

                        return buf;
                    }
                }
            ]
        })
    ]
});
