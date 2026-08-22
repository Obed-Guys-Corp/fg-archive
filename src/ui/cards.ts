import { Api } from "../api";
import { t } from "../i18n/i18n";
import { buildSizeMB, isAvailable, isSteam, toGB } from "../utils/stats";
import { setFooter } from "./footer";
import type { AnyBuild, AppState, Build, BuildType, SteamProperties } from "../types";
import { LINKS } from "../constants/links";

const tabContent = document.getElementById("typeTabContent")!;
const tabAlert = document.getElementById("tabAlert")!;

const iconsMap = new Map<string, string>([
    ["telegram", "nf nf-fae-telegram"],
    ["gdrive", "nf nf-fa-google_drive"]
]);

export function renderTabContent(state: AppState, selectedType: BuildType, selectedSeason: string): void {
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
        const headerText = t("card.seasonCount", t(`${season}_title`), count);
        header.innerHTML = `<h4>${headerText}</h4>`;
        tabContent.appendChild(header);

        const row = document.createElement("div");
        row.className = "row";
        for (const item of items) {
            if ((item.downloads?.available.length ?? 0) === 0) hasLostMedia = true;
            if (item.properties.source_leak) letsLeakSomething = true;

            const index = Api.builds[selectedType].indexOf(item);
            row.appendChild(renderCard(item, selectedType, index));
        }

        tabContent.appendChild(row);
    }

    if (letsLeakSomething)
        createAlert(tabAlert, "alert-info", t("tab.didYouKnow"), t("tab.sourceLeaksDesc", `<i class="text-info bi bi-code-slash"></i>`))

    if (hasLostMedia)
        createAlert(tabAlert, "alert-warning", t("tab.lostMediaTitle"), t("tab.lostMediaDesc", `<a href="${LINKS.discord}" class="alert-link">${t(`tab.lostMediaDesc.link`)}</a>`))

    setFooter(state);
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
    const sizeDisplay = downloads?.available.length ? t("card.size", toGB(buildSizeMB(item)), t("unitGB"), downloads.available
        .map(item => {
            const val = iconsMap.get(item.source);
            return val !== undefined ? `<i class="${val}"></i>` : ``;
        })
        .join(" ")) : "";

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
            ${t("card.title", t(season), new Date(item.release_date).toLocaleDateString())} ${sourceLeak ? '<i class="text-info bi bi-code-slash"></i>' : ""}
          </h5>
          <small class="text-muted d-flex justify-content-between">
            <span>${manifestDisplay}</span>
            ${sizeDisplay ? `<span>${sizeDisplay}</span>` : ""}
          </small>
        </div>
    `;

    return card;
}