import { Api } from "../../api";
import { t } from "../../i18n/i18n";
import { availableBuilds, buildSizeMB, isAvailable, isSteam, toGB, totalSizeMB } from "../../utils/stats";
import type { AnyBuild, AppState, Build, BuildType, SteamProperties } from "../../types";
import { LINKS } from "../../constants/links";
import * as bootstrap from "bootstrap";
import { sourceIcons } from "./source-maps";
import { createAlert } from "../alerts";

export function renderTabContent(state: AppState, selectedType: BuildType, selectedSeason: string): void {
    const tabAlert = document.getElementById("tabAlert")!;
    const tabContent = document.getElementById("typeTabContent")!;

    tabAlert.innerHTML = "";
    tabContent.innerHTML = "";

    const byType = Api.builds[selectedType];
    const filtered = selectedSeason ? byType.filter(item => item.properties.season === selectedSeason) : byType;

    const bySeason = new Map<string, Build[]>();
    for (const item of filtered) {
        const season = item.properties.season;
        bySeason.set(season, [...(bySeason.get(season) ?? []), item]);
    }

    let hasLostMedia = false;
    let letsLeakSomething = false;

    for (const [season, items] of bySeason) {
        const header = document.createElement("div");
        header.className = "col-12 mt-4 mb-2";
        const count = items.length;
        const headerText = t("card.seasonCount", season ? t(`${season}_title`) : t(`fallback.noSeason`), count);
        header.innerHTML = `<h4>${headerText}</h4>`;
        tabContent.appendChild(header);

        const row = document.createElement("div");
        row.className = "row";
        for (const item of items) {
            if ((item.downloads?.available?.length ?? 0) === 0) hasLostMedia = true;
            if (item.properties.source_leak) letsLeakSomething = true;

            const index = Api.builds[selectedType].indexOf(item);
            row.appendChild(renderCard(item, selectedType, index));
        }

        tabContent.appendChild(row);
    }

    const url = new URL(window.location.href);

    url.searchParams.set("type", String(selectedType));
    history.pushState({ page: selectedType }, "", url);

    if (letsLeakSomething) createAlert(tabAlert, "alert-info my-3", t("tab.didYouKnow"), t("tab.sourceLeaksDesc", `<i class="text-info bi bi-code-slash"></i>`));

    if (hasLostMedia)
        createAlert(
            tabAlert,
            "alert-warning my-3",
            t("tab.lostMediaTitle"),
            t("tab.lostMediaDesc", `<a href="${LINKS.discord}" class="alert-link" target="_blank">${t(`tab.lostMediaDesc.link`)}</a>`)
        );

    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => new bootstrap.Tooltip(el));

    setFooter(state);
}

export function setFooter(state: AppState): void {
    const footerTotal = document.getElementById("footerTotal")!;
    const footerSelected = document.getElementById("footerSelected")!;
    const footerNotes = document.getElementById("footerNotes")!;

    const totalBuilds = Object.values(Api.builds).flat();
    const totalBuildsCount = totalBuilds.length;
    const totalAvailableCount = availableBuilds(totalBuilds).length;
    const totalSize = toGB(totalSizeMB(totalBuilds));

    // Selected type
    const typeLabel = state.currentType ? t(state.currentType) : t("footer.allBuilds");

    const typeBuilds = state.currentType ? Api.builds[state.currentType] : totalBuilds;
    const typeBuildsCount = typeBuilds.length;
    const typeSize = toGB(totalSizeMB(typeBuilds));
    const typeAvailableCount = availableBuilds(typeBuilds).length;

    // Example:
    // Beta Builds: 72 - Available: 55 - Size: 142.54 GB
    // Total: 168 - Available: 144 - Size: 507.28 GB
    footerTotal.textContent = `${t("footer.total")}: ${totalBuildsCount} - ${t("footer.available")}: ${totalAvailableCount} - ${t("footer.size")}: ${totalSize} ${t("unitGB")}`;
    footerSelected.textContent = `${typeLabel}: ${typeBuildsCount} - ${t("footer.available")}: ${typeAvailableCount} - ${t("footer.size")}: ${typeSize} ${t("unitGB")}`;

    footerNotes.textContent = t("footer.note");
}

function renderCard(item: AnyBuild, type: BuildType, index: number): HTMLElement {
    const downloads = item.downloads;
    const available = isAvailable(item);

    // Size (Download sources length)
    const sizeDisplay = downloads?.available?.length
        ? t(
            "card.size",
            toGB(buildSizeMB(item)),
            t("unitGB"),
            downloads.available
                .map(item => {
                    const val = sourceIcons.get(item.source);
                    return val !== undefined ? `<i class="${val}"></i>` : t(item.source);
                })
                .join(" ")
        )
        : "";

    // Can't get manifest on android and egs builds
    const manifestDisplay = isSteam(type) ? ((item.properties as SteamProperties).manifest ?? "") : "";
    const season = item.properties.season;
    const sourceLeak = item.properties.source_leak;

    const card = document.createElement("div");
    card.className = "col-md-4 mb-3";
    card.innerHTML = `
        <div class="card build-card position-relative p-3 ${!available ? "border border-danger" : ""}" data-type="${type}" data-index="${index}">
            <div class="row align-items-start g-2">
                <div class="col">
                    <h5 class="mb-0">
                        ${t("card.title", season ? t(season) : t("fallback.noSeason"), item.release_date ? new Date(item.release_date).toLocaleDateString() : t("fallback.noDate"))}
                        ${sourceLeak ? `<i class="text-info bi bi-code-slash" data-bs-toggle="tooltip" data-bs-title="${t("card.sourceLeak")}"></i>` : ""}
                    </h5>
                </div>

                <div class="col-auto text-muted small text-nowrap">
                    ${item.properties.version ?? ""}
                </div>
            </div>

            <small class="text-muted d-flex justify-content-between mt-2">
                <span class="text-truncate">${manifestDisplay}</span>
                ${sizeDisplay ? `<span class="ms-2 text-nowrap">${sizeDisplay}</span>` : ""}
            </small>
        </div>
`;

    return card;
}
