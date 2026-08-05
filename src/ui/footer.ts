import { Api } from "../api";
import { t } from "../i18n/i18n";
import { availableBuilds, toGB, totalSizeMB } from "../utils/stats";
import type { AppState } from "../types";

const footerCounts = document.getElementById("footerCounts")!;
const footerNotes = document.getElementById("footerNotes")!;

export function setFooter(state: AppState): void {
    const totalBuilds = Api.builds;
    const totalBuildsCount = totalBuilds.length;
    const totalAvailableCount = availableBuilds(totalBuilds).length;
    const totalSize = toGB(totalSizeMB(totalBuilds));

    // Selected type
    const typeLabel = state.currentType ? t(state.currentType) : t("footer.allBuilds");
    const typeBuilds = state.currentType ? totalBuilds.filter(i => i.Type === state.currentType) : totalBuilds;
    const typeBuildsCount = typeBuilds.length;
    const typeSize = toGB(totalSizeMB(typeBuilds));
    const typeAvailableCount = availableBuilds(typeBuilds).length;

    // Example:
    // Total Builds: 168 - Total size: 507.28 GB | Beta Builds: 72 - Available: 55 - Size: 142.54 GB
    footerCounts.textContent =
        `${t("footer.totalBuilds")}: ${totalBuildsCount} - ${t("footer.totalAvailable")}: ${totalAvailableCount} - ${t("footer.totalSize")}: ${totalSize} ${t("unitGB")} | ` +
        `${typeLabel}: ${typeBuildsCount} - ${t("footer.available")}: ${typeAvailableCount} - ${t("footer.size")}: ${typeSize} ${t("unitGB")}`;

    footerNotes.textContent = t("footer.note");
}
