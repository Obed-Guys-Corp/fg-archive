export interface AppState {
    currentType: BuildType | null;
    currentSeason: string;
}

export interface Build<TProperties = GenericProperties> {
    release_date: string;
    downloads?: Downloads;
    properties: TProperties;
}

export type BuildType = "steam_beta" | "steam" | "egs" | "android_ega" | "egs_beta" | "android_os" | "ios_ega" | "switch";

export interface BuildPropertiesMap {
    steam_beta: SteamProperties;
    steam: SteamProperties;
    egs: GenericProperties;
    android_ega: AndroidProperties;
    egs_beta: GenericProperties;
    android_os: AndroidProperties;
    ios_ega: GenericProperties;
    switch: GenericProperties;
}

export type Builds = {
    [K in BuildType]: Build<BuildPropertiesMap[K]>[];
};

export type AnyBuild = {
    [K in BuildType]: Build<BuildPropertiesMap[K]>;
}[BuildType];

export interface Downloads {
    total_size: number;
    available: Download[];
}

export interface Download {
    source: DownloadSource;
    link: string;
    segments: Segment[] | null;
}

export type DownloadSource = "telegram" | "gdrive";

export interface Segment {
    size: number;
}

export interface GenericProperties {
    version?: string;
    build_number?: number;
    build_commit?: string;
    build_date?: string;
    unity_version?: string;
    scenes?: number;
    season: Season;
    source_leak?: boolean;
}

export interface AndroidProperties extends GenericProperties {
    obb_hash?: string;
}

export interface SteamProperties extends GenericProperties {
    manifest?: string;
}

export type Season =
    | "ls0"
    | "ls1"
    | "ls15"
    | "ls2"
    | "ls25"
    | "ls3"
    | "ls35"
    | "ls4"
    | "ls45"
    | "ls5"
    | "ls55"
    | "ls6"
    | "ls65"
    | "ss1"
    | "ss2"
    | "ss3"
    | "ss4"
    | "ss45"
    | "ss5"
    | "not_season_0"
    | "not_season_1"
    | "not_season_2"
    | "not_season_3";
