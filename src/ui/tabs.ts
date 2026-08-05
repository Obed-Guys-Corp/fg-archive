import { Api } from "../api";
import { t } from "../i18n/i18n";
import { renderTabContent } from "./cards";
import type { AppState, BuildType } from "../types";

const typeTabs = document.getElementById("typeTabs")!;
const filter = document.getElementById("seasonFilter")! as HTMLSelectElement;

export function renderFilter(state: AppState, selectedType: BuildType): void {
    state.currentType = selectedType;
    state.currentSeason = "";
    filter.innerHTML = "";

    const allOption = document.createElement("option");
    allOption.value = "";
    allOption.textContent = t("filter.all");
    filter.appendChild(allOption);

    const seasons = new Set<string>();
    for (const item of Api.builds) {
        if (item.Type === selectedType && item.Data.Season) seasons.add(item.Data.Season);
    }

    for (const season of [...seasons].sort()) {
        const option = document.createElement("option");
        option.value = season;
        option.textContent = t(season);
        filter.appendChild(option);
    }

    filter.value = "";
    filter.onchange = () => {
        state.currentSeason = filter.value;
        renderTabContent(state, state.currentType!, state.currentSeason);
    };
}

const TAB_ORDER: BuildType[] = ["beta_build", "steam_build", "egs_build", "android_build", "dev_build"];

export function renderTabs(state: AppState): void {
    typeTabs.innerHTML = "";

    let first = true;
    for (const type of TAB_ORDER) {
        const tabId = `tab-${type}`;
        const label = t(type);
        const tabButton = document.createElement("li");
        tabButton.className = "nav-item";
        tabButton.innerHTML = `<button class="nav-link${first ? " active" : ""}" id="${tabId}-tab" type="button" data-type="${type}">${label}</button>`;
        typeTabs.appendChild(tabButton);
        first = false;
    }

    typeTabs.onclick = e => {
        const target = e.target as HTMLElement;
        if (target.tagName !== "BUTTON" || !target.dataset.type) return;

        const selectedType = target.dataset.type as BuildType;
        if (selectedType === state.currentType) return;

        renderFilter(state, selectedType);
        renderTabContent(state, selectedType, state.currentSeason);
        typeTabs.querySelectorAll("button").forEach(btn => btn.classList.toggle("active", btn === target));
    };
}
