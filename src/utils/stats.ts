import type { Build, Download } from "../types";

export function isAvailable(build: Build): boolean {
    return (build.Downloads ?? []).some(d => d.Link.trim() !== "");
}

export function isEGS(build: Build): boolean {
    return build.Type === "android_build" || build.Type === "egs_build";
}

export function availableBuilds(builds: Build[]): Build[] {
    return builds.filter(isAvailable);
}

export function downloadSizeMB(download: Download): number {
    return (download.Segments ?? []).reduce((sum, seg) => sum + (seg.Size ?? 0), 0);
}

export function buildSizeMB(build: Build): number {
    const first = build.Downloads?.[0];
    return first ? downloadSizeMB(first) : 0;
}

export function totalSizeMB(builds: Build[]): number {
    return builds.reduce((sum, b) => sum + buildSizeMB(b), 0);
}

export function toGB(mb: number): string {
    return (mb / 1024).toFixed(2);
}
