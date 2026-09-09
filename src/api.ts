import JSZip from "jszip";
import { CMS_CONFIG } from "./constants/cms-config";
import { t } from "./i18n/i18n";
import { BUILD_TYPES, type Build, type Builds, type BuildType, type GlCommit, type Release } from "./types";
import { timeDiff } from "./utils/string";


interface CachedPage {
    timestamp: number;
    data: {
        commits: GlCommit[];
        totalPages: number;
    };
}

const CACHE_TIME = 10 * 60 * 1000;

export class Api {
    static _builds: Record<BuildType, Build[]> = Object.fromEntries(
        BUILD_TYPES.map(type => [type, [] as Build[]])
    ) as Record<BuildType, Build[]>;

    static _strings: Record<string, string> = {};
    static _releases: Release[];
    static _loaded = false;

    public static async fetchBuilds(): Promise<Builds> {
        if (this._loaded) return this._builds;

        await Promise.all(
            BUILD_TYPES.map(async type => {
                const response = await fetch(`${import.meta.env.BASE_URL}content/${type}.json`);

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

        this._strings = await fetch(`${import.meta.env.BASE_URL}content/i18n/en.json`).then(res => res.json());
        return this.strings;
    }

    public static async fetchReleaseMap(): Promise<Release[]> {
        if (this._releases?.length > 0) return this._releases;

        this._releases = await fetch(`${import.meta.env.BASE_URL}content/cms/releases_map.json`).then(res => res.json());
        return this._releases;
    }

    public static get builds(): Builds {
        return this._builds;
    }

    public static get strings(): Record<string, string> {
        return this._strings;
    }

    public static async fetchCmsUpdates(page = 1, pages = 50): Promise<{
        commits: GlCommit[];
        totalPages: number;
    }> {
        if (!Number.isFinite(pages) || pages <= 0 || pages >= 100) pages = 50;

        const totalPagesKey = `cms-total-pages-${pages}`;
        const key = `cms-commits-page-${page}-pages-${pages}`;

        const cache = localStorage.getItem(key);

        if (cache) {
            const entry = JSON.parse(cache) as CachedPage;

            if (Date.now() - entry.timestamp < CACHE_TIME) {
                return entry.data;
            }

            localStorage.removeItem(key);
        }

        const response = await fetch(`https://gitlab.com/api/v4/projects/${CMS_CONFIG.gl_repo}/repository/commits?per_page=${pages}&page=${page}&with_stats=true`);

        if (!response.ok) {
            var rateLimit = response.headers.get("x-ratelimit-reset");
            if (!rateLimit) throw new Error("fetchCmsUpdates fails with code " + response.status);
            throw new Error("you're ratelimited by github, try again in " + timeDiff(Number(rateLimit)));
        }

        const commits: GlCommit[] = await response.json();
        let totalPages = 1;
        const pagesCache = localStorage.getItem(totalPagesKey);
        let cachedTotal = pagesCache ? JSON.parse(pagesCache) : null;

        if (commits.length === 0 && page > 1) {
            return {
                commits,
                totalPages: 0
            };
        }

        if (page == 1 || cachedTotal == null || cachedTotal.pages != pages || Date.now() - cachedTotal.timestamp >= CACHE_TIME) {
            const latest = commits[0]!;

            const commitsTotal = await fetch(`https://gitlab.com/api/v4/projects/${CMS_CONFIG.gl_repo}/repository/commits/${latest.id}/sequence`);
            const { count } = await commitsTotal.json();
            totalPages = Math.ceil(count / pages);

            localStorage.setItem(totalPagesKey, JSON.stringify({
                timestamp: Date.now(),
                totalPages,
                pages
            }));
        }
        else {
            totalPages = cachedTotal.totalPages;
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

    public static async fetchCmsJson(sha: string, state?: (s: string) => void): Promise<{
        json: Record<string, any>;
        version: string;
    }> {
        state?.(t("cms.fetch.init"))

        const cmsReq = await fetch(`http://fg-archive.floyzi.dev/api/cms?sha=${sha}`);

        if (!cmsReq.ok) throw new Error(`can't get cms` + cmsReq.status);

        state?.(t("cms.fetch.load"))

        const zip = await JSZip.loadAsync(await cmsReq.arrayBuffer());

        const metiaFile = Object.entries(zip.files).find(([path, file]) => !file.dir && path.endsWith("/_meta.json"));
        if (metiaFile == null) throw new Error(`can't get meta`);

        const [metaPath, metaFile] = metiaFile;
        const meta = JSON.parse(await metaFile.async("string"));

        const root = metaPath.substring(0, metaPath.indexOf("/"));
        const cms: Record<string, any> = {};

        for (const f of Object.keys(meta).filter(x => !x.startsWith("_"))) {
            const file = zip.files[`${root}/${f}.json`];

            if (!file || file.dir) throw new Error(`lack of ${f}`);

            cms[f] = JSON.parse(await file.async("string"));
        }

        return {
            json: cms,
            version: meta["_content_version"]
        };
    }
}
