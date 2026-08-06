import { Api } from "../api";
import { t } from "../i18n/i18n";
import { downloadSizeMB, isAvailable, isEGS, toGB } from "../utils/stats";
import { setFooter } from "./footer";
import type { AppState, Build, BuildType } from "../types";

const tabContent = document.getElementById("typeTabContent")!;

const tabAlert = document.getElementById("tabAlert")!;

export function renderTabContent(state: AppState, selectedType: BuildType, selectedSeason: string): void {
    tabAlert.innerHTML = "";
    tabContent.innerHTML = "";

    const byType = Api.builds.filter(item => item.Type === selectedType);
    const filtered = selectedSeason ? byType.filter(item => item.Data.Season === selectedSeason) : byType;

    const bySeason = new Map<string, Build[]>();
    for (const item of filtered) {
        const season = item.Data.Season;
        bySeason.set(season, [...(bySeason.get(season) ?? []), item]);
    }

    let hasLostMedia = false;
    for (const [season, items] of bySeason) {
        const header = document.createElement("div");
        header.className = "col-12 mt-4 mb-2";
        const count = items.length;
        const headerText = t("card.seasonCount", t(`${season}_title`), count);
        header.innerHTML = `<h4>${headerText}</h4>`;
        tabContent.appendChild(header);

        const row = document.createElement("div");
        row.className = "row";
        for (const item of items) {
            if (item.Downloads === null || item.Downloads?.length == 0)
                hasLostMedia = true;

            row.appendChild(renderCard(item));
        }

        tabContent.appendChild(row);
    }

    if (hasLostMedia)
        tabAlert.innerHTML = `
            <div class="alert alert-warning my-3" role="alert">
                <h5 class="alert-heading">${t(`tab.lostMediaTitle`)}</h5>
                <p class="mb-0">${t(`tab.lostMediaDesc`)}</p>
            </div>
        `;

    setFooter(state);
}

function renderCard(item: Build): HTMLElement {
    const idx = Api.builds.indexOf(item);
    const downloads = item.Downloads ?? [];
    const available = isAvailable(item);
    const badgeContainer = renderDontShipBadge(item);
    // Size (Download sources length)
    const sizeDisplay = downloads.length ? t("card.size", toGB(downloadSizeMB(downloads[0]!)), t("unitGB"), downloads.length) : "";
    // Can't get manifest on android and egs builds
    const manifestDisplay = isEGS(item) ? "" : item.Manifest;
    const season = item.Data.Season;

    const card = document.createElement("div");
    card.className = "col-md-4 mb-3";
    card.innerHTML = `
        <div class="card position-relative p-3 ${!available ? "border border-danger" : ""}"
             data-index="${idx}">
          <div class="position-absolute top-0 end-0 mt-2 me-2 text-muted small">
            ${item.Data.AppVer ?? ""}
          </div>
          <h5 style="padding-right: 6rem;">
            ${t("card.title", t(season), new Date(item.Date).toLocaleDateString())}
          </h5>
          <small class="text-muted d-flex justify-content-between">
            <span>${manifestDisplay}</span>
            ${sizeDisplay ? `<span>${sizeDisplay}</span>` : ""}
          </small>
          ${badgeContainer}
        </div>
    `;
    return card;
}

function renderDontShipBadge(item: Build): string {
    if (!item.Data.HasDontShipFolder) return "";

    const badge = `<span class="badge rounded-pill" style="background-color: #6f42c1; color: white; font-size: 0.8em; vertical-align: middle;">${t("card.hasMonoSources")}</span>`;
    return `<div class="mt-1 text-end">${badge}</div>`;
}
