import { Api } from "../../api";
import { t } from "../../i18n/i18n";
import { renderTabContent } from "./cards";
import { BUILD_TYPES, type AppState, type BuildType } from "../../types";

export function renderFilter(state: AppState, selectedType: BuildType): void {
    const filter = document.getElementById("seasonFilter")! as HTMLSelectElement;

    state.currentType = selectedType;
    state.currentSeason = "";
    filter.innerHTML = "";

    const allOption = document.createElement("option");
    allOption.value = "";
    allOption.textContent = t("filter.all");
    filter.appendChild(allOption);

    const seasons = new Set<string>();
    for (const item of Api.builds[selectedType]) {
        if (item.properties.season) seasons.add(item.properties.season);
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

export function renderTabs(state: AppState): void {
    const typeTabs = document.getElementById("typeTabs")!;

    typeTabs.innerHTML = "";

    typeTabs.innerHTML = BUILD_TYPES.filter(type => Api._builds[type].length > 0).map((type, index) => `
        <li class="nav-item">
            <button class="nav-link${index === 0 ? " active" : ""}" id="tab-${type}-tab" type="button" data-type="${type}">
                ${t(type)}
            </button>
        </li>
    `).join("");


    typeTabs.onclick = e => {
        const target = e.target as HTMLElement;
        if (!target?.dataset.type) return;

        selectType(state, target.dataset.type as BuildType)
    };
}

export function selectType(state: AppState, selectedType: BuildType) {
    const typeTabs = document.getElementById("typeTabs")!;

    typeTabs.querySelectorAll<HTMLButtonElement>("button").forEach(btn => {
        btn.classList.toggle(
            "active",
            btn.dataset.type === selectedType
        );
    });

    renderFilter(state, selectedType);
    renderTabContent(state, selectedType, state.currentSeason);
}
