import type { Build } from "./types";

export class Api {
    private static _builds: Build[] = [];
    private static _strings: Record<string, string> = {};

    public static async fetchBuilds(): Promise<Build[]> {
        if (this.builds.length > 0) return this.builds;

        const files = ["android", "beta", "dev", "epic", "steam"];
        const texts = await Promise.all(files.map(file => fetch(`./content/${file}.json`).then(res => res.text())));
        const reviver = (key: string, value: unknown) => (key === "Manifest" && typeof value === "number" ? String(value) : value);

        this._builds = texts.flatMap(text => JSON.parse(text, reviver));
        return this.builds;
    }

    public static async fetchStrings(): Promise<Record<string, string>> {
        if (Object.keys(this.strings).length > 0) return this.strings;

        this._strings = await fetch("./content/i18n/en.json").then(res => res.json());
        return this.strings;
    }

    public static get builds(): Build[] {
        return this._builds;
    }

    public static get strings(): Record<string, string> {
        return this._strings;
    }
}
