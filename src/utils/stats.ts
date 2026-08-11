import type { Build, BuildType, Download } from "../types";

export function isAvailable(build: Build): boolean {
    return (build.downloads ?? []).some(d => d.link.trim() !== "");
}

export function isSteam(type: BuildType): boolean {
    return type === "steam_beta" || type === "steam";
}

export function availableBuilds(builds: Build[]): Build[] {
    return builds.filter(isAvailable);
}

export function downloadSizeMB(download: Download): number {
    return (download.segments ?? []).reduce((sum, seg) => sum + (seg.size ?? 0), 0);
}

export function buildSizeMB(build: Build): number {
    const first = build.downloads?.[0];
    return first ? downloadSizeMB(first) : 0;
}

export function totalSizeMB(builds: Build[]): number {
    return builds.reduce((sum, b) => sum + buildSizeMB(b), 0);
}

export function toGB(mb: number): string {
    return (mb / 1024).toFixed(2);
}
