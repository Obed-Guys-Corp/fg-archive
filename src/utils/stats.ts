import type { Build, BuildType, Download } from "../types";

export function isAvailable(build: Build): boolean {
    return (build.downloads?.available ?? []).some(d => d.link.trim() !== "");
}

export function isSteam(type: BuildType): boolean {
    return type === "steam_beta" || type === "steam";
}

export function availableBuilds(builds: Build[]): Build[] {
    return builds.filter(isAvailable);
}

export function buildSizeMB(build: Build): number {
    return build.downloads?.total_size ?? 0;
}

export function totalSizeMB(builds: Build[]): number {
    return builds.reduce((sum, b) => sum + buildSizeMB(b), 0);
}

export function toGB(mb: number): string {
    return (mb / 1024).toFixed(2);
}
