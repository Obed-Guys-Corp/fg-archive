import { execSync } from "node:child_process";
import { readFileSync, mkdirSync, writeFileSync, readdirSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import { format } from "./src/i18n/i18n.ts";
import { sourceLocales } from "./src/ui/builds/source-maps.ts";

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
                    const dStr = build.release_date?.substring(0, 10) ?? "";
                    const dUnix = build.release_date ? Math.floor(new Date(build.release_date).getTime() / 1000) : 0;
                    const ver = fgVer ? ` v${fgVer}` : "";

                    const iconName = !build.properties?.season ? "ls1" : build.properties?.season.startsWith("not") ? "ss5" : build.properties?.season;

                    const desc = dStr
                        ? available
                            ? format(loc["build_desc.downloads_date"], loc[type], ver, dStr)
                            : format(loc["build_desc.missing_date"], loc[type], ver, dStr)
                        : available
                            ? format(loc["build_desc.downloads"], loc[type], ver)
                            : format(loc["build_desc.missing"], loc[type], ver);

                    const dStamp = build.release_date.includes("T") ? `<t:${dUnix}:f>` : `<t:${dUnix}:D>`;
                    
                    const descEmbed = dStr
                        ? available
                            ? format(loc["build_desc.downloads_date"], `**${loc[type]}**`, `**${ver}**`, dStamp)
                            : format(loc["build_desc.missing_date"], `**${loc[type]}**`, `**${ver}**`, dStamp)
                        : available
                            ? format(loc["build_desc.downloads"], `**${loc[type]}**`, `**${ver}**`)
                            : format(loc["build_desc.missing"], `**${loc[type]}**`, `**${ver}**`);

                    const embed = {
                        "component": {
                            "type": 17,
                            "spoiler": false,
                            "accent_color": 16202915,
                            "components": [
                                {
                                    "type": 9,
                                    "components": [
                                        {
                                            "type": 10,
                                            "content": "# " + title + "\n" + descEmbed
                                        }
                                    ],
                                    "accessory": {
                                        "type": 11,
                                        "media": { "url": "https://fga.floyzi.dev/static/seasons/" + iconName + ".webp" },
                                        "spoiler": false
                                    }
                                }
                            ]
                        }
                    }

                    if (available) {
                        const comp: any[] = [
                            {
                                "type": 14,
                                "spacing": 1
                            },
                            {
                                "type": 1,
                                "components": [
                                ]
                            },
                        ]

                        for (const download of build.downloads?.available ?? []) {
                            if (download.link.trim() !== "") {
                                const src = download.source;
                                const label = `${format(loc[sourceLocales.get(src) ?? "modal.downloadIn"], format(loc[src]))}`;
                                const btn = { "type": 2, "style": 5, "url": download.link, "label": label };
                                comp[1].components!.push(btn);
                            }
                        }

                        embed.component.components.push(...comp);
                    }

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
        <meta name="og:image" property="og:image" content="https://fga.floyzi.dev/static/seasons/${iconName}.webp" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="${title}" />
        <meta name="twitter:description" content="${desc}" />
        <meta name="twitter:image" content="https://fga.floyzi.dev/static/seasons/${iconName}.webp" />
        <meta content="#f73ca3" name="theme-color" />
        <link rel="icon" href="https://fga.floyzi.dev/static/favicon.ico" type="image/x-icon" />
        <script id="discord:component-embed" type="application/json">${JSON.stringify(embed)}</script>
    </head>
    <body>
        <script>window.location.replace(${JSON.stringify(`/builds?type=${type}#${build.id}`)});</script>
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
    base: "/",

    define: {
        COMMIT: JSON.stringify(execSync("git rev-parse HEAD").toString().trim()),
        BUILD_DATE: JSON.stringify(new Date().toISOString())
    },

    plugins: [setBuilds()]
});
