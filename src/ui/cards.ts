import { Api } from "../api";
import { t } from "../i18n/i18n";
import { availableBuilds, buildSizeMB, isAvailable, isSteam, toGB, totalSizeMB } from "../utils/stats";
import type { AnyBuild, AppState, Build, BuildType, SteamProperties } from "../types";
import { LINKS } from "../constants/links";
import { sourceIcons } from "./source-maps";
import * as bootstrap from "bootstrap";

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

    if (letsLeakSomething) createAlert(tabAlert, "alert-info", t("tab.didYouKnow"), t("tab.sourceLeaksDesc", `<i class="text-info bi bi-code-slash"></i>`));

    if (hasLostMedia)
        createAlert(
            tabAlert,
            "alert-warning",
            t("tab.lostMediaTitle"),
            t("tab.lostMediaDesc", `<a href="${LINKS.discord}" class="alert-link">${t(`tab.lostMediaDesc.link`)}</a>`)
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


function createAlert(container: HTMLElement, style: string, title: string, desc: string) {
    const div = document.createElement("div");
    div.className = `alert ${style} my-3`;
    div.setAttribute("role", "alert");

    const h5 = document.createElement("h5");
    h5.className = "alert-heading";
    h5.textContent = title;

    const p = document.createElement("p");
    p.className = "mb-0";
    p.innerHTML = desc;

    div.appendChild(h5);
    div.appendChild(p);

    container.appendChild(div);
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
        <div class="card position-relative p-3 ${!available ? "border border-danger" : ""}" data-type="${type}" data-index="${index}">
          <div class="position-absolute top-0 end-0 mt-2 me-2 text-muted small">
            ${item.properties.version ?? ""}
          </div>
          <h5 style="padding-right: 6rem;">
            ${t("card.title", season ? t(season) : t("fallback.noSeason"), item.release_date ? new Date(item.release_date).toLocaleDateString() : t("fallback.noDate"))} ${sourceLeak ? `<i class="text-info bi bi-code-slash" data-bs-toggle="tooltip" data-bs-title="${t("card.sourceLeak")}"></i>` : ""}
          </h5>
          <small class="text-muted d-flex justify-content-between">
            <span>${manifestDisplay}</span>
            ${sizeDisplay ? `<span>${sizeDisplay}</span>` : ""}
          </small>
        </div>
    `;

    return card;
}
