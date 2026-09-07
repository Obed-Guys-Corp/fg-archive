import { CMS_CONFIG } from "./constants/cms-config";
import type { Build, Builds, BuildType, Commit } from "./types";
import { timeDiff } from "./utils/string";

interface CachedPage {
    timestamp: number;
    data: {
        commits: Commit[];
        totalPages: number;
    };
}

const CACHE_TIME = 10 * 60 * 1000;

export class Api {
    static _builds: Builds = {
        steam_beta: [],
        steam: [],
        egs: [],
        android_ega: [],
        egs_beta: [],
        android_os: [],
        ios_ega: [],
        switch: []
    };

    static _strings: Record<string, string> = {};
    static _loaded = false;

    public static async fetchBuilds(): Promise<Builds> {
        if (this._loaded) return this._builds;

        const files: BuildType[] = ["android_ega", "steam_beta", "steam", "egs", "egs_beta", "android_os", "ios_ega", "switch"];

        await Promise.all(
            files.map(async type => {
                const response = await fetch(`./content/${type}.json`);

                if (!response.ok || response.headers.get("content-type") != "application/json") {
                    return;
                }

                const data = await response.json();
                const builds = data[type];

                if (!Array.isArray(builds)) {
                    return;
                }

                this._builds[type] = builds;
            })
        );

        this._loaded = true;
        return this._builds;
    }

    public static async fetchStrings(): Promise<Record<string, string>> {
        if (Object.keys(this.strings).length > 0) return this.strings;

        this._strings = await fetch("./content/i18n/en.json").then(res => res.json());
        return this.strings;
    }

    public static get builds(): Builds {
        return this._builds;
    }

    public static get strings(): Record<string, string> {
        return this._strings;
    }

    public static async fetchCmsUpdates(page = 1): Promise<{
        commits: Commit[];
        totalPages: number;
    }> {
        const key = `cms-commits-page-${page}`;

        const cached = localStorage.getItem(key);

        if (cached) {
            const entry = JSON.parse(cached) as CachedPage;

            if (Date.now() - entry.timestamp < CACHE_TIME) {
                return entry.data;
            }

            localStorage.removeItem(key);
        }

        const response = await fetch(`https://api.github.com/repos/${CMS_CONFIG.user}/${CMS_CONFIG.repo}/commits?per_page=100&page=${page}`);

        if (!response.ok) {
            var rateLimit = response.headers.get("x-ratelimit-reset");
            if (!rateLimit) throw new Error("fetchCmsUpdates fails with code " + response.status);
            throw new Error("you're ratelimited by github, try again in " + timeDiff(Number(rateLimit)));
        }

        const commits: Commit[] = await response.json();
        const link = response.headers.get("Link");

        let totalPages = 1;

        if (link) {
            const match = link.match(/<[^>]+[?&]page=(\d+)[^>]*>;\s*rel="last"/);

            if (match) {
                totalPages = Number(match[1]);
            }
        }

        var data = {
            commits,
            totalPages
        };

        localStorage.setItem(
            key,
            JSON.stringify({
                timestamp: Date.now(),
                data
            } satisfies CachedPage)
        );

        return data;
    }

    public static async fetchCmsJson(sha: string): Promise<{
        json: Record<string, any>;
        version: string;
    }> {
        const metaResponse = await fetch(`https://raw.githubusercontent.com/${CMS_CONFIG.user}/${CMS_CONFIG.repo}/${sha}/_meta.json`);

        if (!metaResponse.ok) {
            throw new Error(`can't get _meta.json` + metaResponse.status);
        }

        const meta = await metaResponse.json();
        const filenames = Object.keys(meta);

        const entries = (
            await Promise.all(
                filenames.map(async filename => {
                    if (filename.startsWith("_")) return null;

                    const response = await fetch(`https://raw.githubusercontent.com/${CMS_CONFIG.user}/${CMS_CONFIG.repo}/${sha}/${filename}.json`);

                    if (!response.ok) throw new Error(`can't get ${filename}.json: ${response.status}`);

                    const content = await response.json();
                    return [filename, content] as [string, any];
                })
            )
        ).filter((entry): entry is [string, any] => entry !== null);

        return {
            json: {
                ...Object.fromEntries(entries),
                _meta: meta
            },
            version: meta["_content_version"]
        };
    }
}
