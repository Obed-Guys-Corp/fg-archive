import { BUILD_TYPES, type AppState, type BuildType } from "../types";
import { renderTabContent } from "../ui/builds/cards";
import { renderFilter, renderTabs, selectType } from "../ui/builds/tabs";
import { Api } from "../api";
import { t } from "../i18n/i18n";

const state: AppState = {
    currentType: null,
    currentSeason: ""
};

export async function renderBuilds(): Promise<void> {
    const app = document.getElementById("app");
    const controls = document.getElementById("controls");

    if (!app) return;

    const url = new URL(window.location.href);

    if (controls) {
        controls.innerHTML = `
            <select id="seasonFilter" class="form-select form-select-sm border-secondary bg-dark-override text-white d-none" style="min-width: 120px; max-width: 150px">
                <option value="" data-i18n="filter.all"></option>
            </select>
        `;
    }

    app.innerHTML = `
        <div id="builds_loading" class="d-flex justify-content-center">
            <div class="spinner-border" role="status">
                <span class="sr-only"></span>
            </div>
        </div>
             
        <div id="listContainer" class="container py-3 d-none">

            <ul class="nav nav-tabs" id="typeTabs" role="tablist"></ul>
            <div id="tabAlert"></div>
            <div class="tab-content" id="typeTabContent"></div>

           <div class="modal fade" id="modal_build_info" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${t("modal.buildDetails")}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                    <div class="modal-body">
                        <div id="modal-alerts"></div>
                        <div class="row">
                            <div class="col-md-6" id="modalData"></div>
                            <div class="col-md-6" id="modalSegments"></div>
                        </div>
                    </div>
                <div class="modal-footer" id="modalFooter"></div>
            </div>
        </div>
    `;

    try {
        try {
            await Api.fetchBuilds();
        } catch (err) {
            document.getElementById("typeTabContent")!.innerHTML = `<div class="alert alert-danger">Failed to download assets!<br><br>${err}</div>`;
            return;
        }

        setupFooter(document.getElementById("footerLeft")!);
        renderTabs(state);

        const firstBtn = document.querySelector<HTMLButtonElement>("#typeTabs button[data-type]");
        if (firstBtn?.dataset.type) {
            const typeParam = url.searchParams.get("type");
            const type = BUILD_TYPES.find(type => type === typeParam && Api._builds[type].length > 0) ?? BUILD_TYPES.find(type => Api._builds[type].length > 0) ?? BUILD_TYPES[0];
            
            selectType(state, type);
        }

        const modal = document.getElementById("modal_build_info");

        modal?.addEventListener("hidden.bs.modal", () => {
            document.getElementById("modal-alerts")!.innerHTML = "";
        });

    }
    finally {
        document.getElementById("listContainer")?.classList.remove("d-none");
        document.getElementById("seasonFilter")?.classList.remove("d-none");
        document.getElementById("builds_loading")?.remove();
    }
}

function setupFooter(container: HTMLElement): void {
    const selected = document.createElement("div");
    selected.id = "footerSelected";
    selected.style.fontWeight = "500";
    selected.className = "text-white-50";

    const total = document.createElement("div");
    total.id = "footerTotal";
    total.style.fontSize = "0.9rem";
    total.style.fontWeight = "500";
    total.className = "text-white-50";

    const notes = document.createElement("div");
    notes.id = "footerNotes";
    notes.style.fontSize = "0.7rem";
    notes.className = "text-white-50";

    container.append(selected, total, notes);
}
