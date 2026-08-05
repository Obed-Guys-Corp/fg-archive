export interface AppState {
    currentType: BuildType | null;
    currentSeason: string;
}

export interface Build {
    Type: BuildType;
    Manifest?: string;
    Date: string;
    Downloads?: Download[];
    Data: BuildData;
}

export type BuildType = "beta_build" | "steam_build" | "egs_build" | "android_build" | "dev_build";

export interface Download {
    Source: DownloadSource;
    Link: string;
    Segments: Segment[];
}

export type DownloadSource = "telegram" | "gdrive";

export interface Segment {
    Size: number;
}

export interface BuildData {
    AppVer?: string;
    BuildNo?: number;
    BuildCommit?: string;
    BuildDate?: string;
    UnityVersion?: string;
    SceneCount?: number;
    Season: Season;
    HasDontShipFolder?: boolean;
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
