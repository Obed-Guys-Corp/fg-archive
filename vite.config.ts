import { execSync } from "node:child_process";
import { readFileSync, mkdirSync, writeFileSync, readdirSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import { format } from "./src/i18n/i18n.ts";

const setBuilds = (): Plugin => ({
    name: "set-builds",

    closeBundle() {
        const loc = JSON.parse(readFileSync(resolve("public/content/i18n/en.json"), "utf-8"));
        const dataDir = resolve("public/content");
        const buildMetaDir = resolve("dist/build");

        mkdirSync(buildMetaDir, { recursive: true });

        for (const file of readdirSync(dataDir)) {
            if (!file.endsWith(".json")) continue;

            const data = JSON.parse(readFileSync(resolve(dataDir, file), "utf-8"));

            for (const [type, builds] of Object.entries(data)) {
                for (const build of builds as Array<Record<string, any>>) {
                    const dir = resolve(buildMetaDir, build.id);

                    mkdirSync(dir, { recursive: true });

                    const available = (build.downloads?.available ?? []).some((d: { link: string }) => d.link.trim() !== "");

                    const title = loc.build_desc_title;
                    const fgVer = build.properties?.version;
                    const d = build.release_date?.substring(0, 10) ?? "";
                    const ver = fgVer ? ` v${fgVer}` : "";

                    const desc = d
                        ? available
                            ? format(loc["build_desc.downloads_date"], loc[type], ver, d)
                            : format(loc["build_desc.missing_date"], loc[type], ver, d)
                        : available
                          ? format(loc["build_desc.downloads"], loc[type], ver)
                          : format(loc["build_desc.missing"], loc[type], ver);

                    writeFileSync(
                        resolve(dir, "index.html"),
                        `<!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <title>${title}</title>
        <meta name="og:title" property="og:title" content="${title}" />
        <meta name="description" content="${desc}" />
        <meta name="og:description" property="og:description" content="${desc}" />
        <meta name="og:image" property="og:image" content="https://obed-guys-corp.github.io/fg-archive/static/favicon-512x512.webp" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="${title}" />
        <meta name="twitter:description" content="${desc}" />
        <meta name="twitter:image" content="https://obed-guys-corp.github.io/fg-archive/static/favicon-512x512.webp" />
        <meta content="#f73ca3" name="theme-color" />
        <link rel="icon" href="https://obed-guys-corp.github.io/fg-archive/static/favicon.ico" type="image/x-icon" />
    </head>
    <body>
    <script>window.location.replace(${JSON.stringify(`/fg-archive/builds?type=${type}#${build.id}`)});</script>
    </body>
</html>`
                    );
                }
            }
        }

        copyFileSync(resolve("dist/index.html"), resolve("dist/404.html"));
    }
});

export default defineConfig({
    base: "/fg-archive/",

    define: {
        COMMIT: JSON.stringify(execSync("git rev-parse HEAD").toString().trim()),
        BUILD_DATE: JSON.stringify(new Date().toISOString())
    },

    plugins: [setBuilds()]
});
