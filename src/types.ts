export interface AppState {
    currentType: BuildType | null;
    currentSeason: string;
}

export interface Build<TProperties = GenericProperties> {
    id: string;
    release_date: string;
    downloads?: Downloads;
    properties: TProperties;
}

export const BUILD_TYPES = ["steam_beta", "steam", "egs", "android_ega", "egs_beta", "android_os", "ios_ega", "switch"] as const;
export type BuildType = (typeof BUILD_TYPES)[number];

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
    env?: Environment;
    signature?: string;
    season: Season;
    source_leak?: boolean;
}

export interface AndroidProperties extends GenericProperties {
    obb_hash?: string;
}

export interface SteamProperties extends GenericProperties {
    manifest?: string;
}

export type Environment =
    | "Production"
    | "OpenBeta"
    | "ClosedBeta"
    | "Unstable"
    | "China"
    | "CompatQA"
    | "ComplianceQA"
    | "Development"
    | "ExternalQA"
    | "InternalQA"
    | "LoadTesting"
    | "Mobile"
    | "MobileQA"
    | "Porting"
    | "Staging";

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

export interface GhCommit {
    sha: string;
    html_url: string;
    commit: {
        message: string;
        author: {
            name: string;
            date: string;
        } | null;
    };
}

export interface Release {
    ver: string;
    date: string;
}

export interface GlCommit {
    id: string;
    title: string;
    authored_date: string;
    web_url: string;
    stats: {
        additions: number;
        deletions: number;
    };
}

export enum RecordType {
    Unknown = 0,
    Explore = 1,
    BotLookup = 2,
    FGAnalyst = 3,
    Discord = 4,
}

export interface UGCStats {
    levels: number;
    total_size: number;
    platform_stats: Record<string, number> | null;
    version_stats: Record<string, number> | null;
    source_stats: Partial<Record<RecordType, number>> | null;
    music_stats: Record<string, number> | null;
    theme_stats: Record<string, number> | null;
    gamemode_stats: Record<string, number> | null;
    tag_stats: Record<string, number> | null;
}

export interface UGCSearchRes {
    sharecode: string;
    author: string;
    name: string;
    latestVersion: number;
    clientVersion: string;
    played: number;
    likes: number;
    dislikes: number;
    platform: string;
    gamemode: string;
    theme: string;
    soundtrack: string;
    tags: string[];
    lastTouch: number;
}

export interface UGCSearch {
    results: UGCSearchRes[];
    total: number;
    page: number;
    total_pages: number;
    page_size: number;
    took: number;
}

export interface UGCLevel {
    sharecode: string;
    latest_version: number;
    generations: UGCGeneration[];
    took: number;
}

export interface UGCGeneration {
    author: UGCAuthor;
    version: number;
    title: string;
    description: string;
    tags: string[] | null;
    max_player_count: number;
    scene_url: string;
    platform_id: string;
    last_modified: number;
    gamemode_id: string;
    theme_id: string;
    client_version: string;
    config: Record<string, unknown>;
    completed: boolean;
    played: number;
    likes: number;
    dislikes: number;
    preview_image: UGCImage | null;
    loading_image: UGCImage | null;
    record_type: number;
    archive_downloads: Record<string, Record<string, unknown>>;
    last_touch: number;
}

export interface UGCAuthor {
    eos: string;
    steam: string | null;
    nintendo: string | null;
    psn: string | null;
    xbl: string | null;
}

export interface UGCImage {
    url: string;
    created_at: string | null;
}

export type HttpResponse<T> = {
    response: T;
    status: number;
    ok: boolean;
    statusText: string;
};
