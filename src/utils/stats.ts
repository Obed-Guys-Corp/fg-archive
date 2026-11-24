import type { Build, BuildType, Download } from "../types";

export function isAvailable(build: Build): boolean {
    return (build.downloads?.available ?? []).some(d => d.link.trim() !== "");
}

export function isSteam(type: BuildType): boolean {
    return type === "steam_beta" || type === "steam";
}

export function isMobile(type: BuildType): boolean {
    return type === "android_ega" || type === "android_os";
}

export function isFullyAvailable(type: BuildType, build: Build): boolean {
    if (!build || !isAvailable(build)) return false;
    if (isMobile(type)) return (build.downloads?.available.some(x => x.file_type === "apk") && build.downloads?.available.some(x => x.file_type === "obb"))!;
    return true;
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
