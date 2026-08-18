import type { Build, Builds, BuildType } from "./types";

export class Api {
    private static _builds: Builds = {
        steam_beta: [],
        steam: [],
        egs: [],
        android_ega: [],
        egs_beta: [],
        android_os: [],
        ios_ega: [],
        switch: [],
    };
    private static _strings: Record<string, string> = {};
    private static _loaded = false;

    public static async fetchBuilds(): Promise<Builds> {
        if (this._loaded) return this._builds;

        const files: BuildType[] = [
            "android_ega",
            "steam_beta",
            "steam",
            "egs",
            "egs_beta",
            "android_os",
            "ios_ega",
            "switch",
        ];

        await Promise.all(
            files.map(async type => {
                const response = await fetch(`./content/${type}.json`);

                if (!response.ok) {
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
}
