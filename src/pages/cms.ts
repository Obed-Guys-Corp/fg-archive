import { Api } from "../api";
import { t } from "../i18n/i18n";
import { calcDateStr } from "../utils/string";

let currPage = 1;
let totalPages = 1;
let commitList: HTMLDivElement;
let pageList: Element;

export async function renderCms(): Promise<void> {
    const app = document.getElementById("app");

    if (!app) return;

    app.innerHTML = `
        <div class="container">

            <nav class="mt-4">
                <ul id="pageList" class="pagination justify-content-center"></ul>
            </nav>

            <div id="commits" class="row g-3 pb-5"></div>
        </div>
    `;

    commitList = document.querySelector("#commits")!;
    pageList = document.querySelector("#pageList")!;

    pageList?.addEventListener("click", event => {
        const target = event.target as HTMLElement;

        const button = target.closest("[data-page]") as HTMLButtonElement | null;

        if (!button || button.disabled) {
            return;
        }

        const page = Number(button.dataset.page);

        if (!page || page === currPage) {
            return;
        }

        loadPage(page);
    });

    commitList?.addEventListener("click", async event => {
        const target = event.target as HTMLElement;
        const button = target.closest(".download-json") as HTMLButtonElement | null;

        if (!button || !button.dataset.sha) return;

        const spinner = button.querySelector<HTMLElement>(".spinner-border");

        button.disabled = true;
        spinner?.classList.remove("d-none");

        try {
            const commit = await Api.fetchCmsJson(button.dataset.sha);

            const json = JSON.stringify(commit.json);

            const url = URL.createObjectURL(
                new Blob([json], {
                    type: "application/json"
                })
            );

            const link = document.createElement("a");
            link.href = url;
            link.download = `CMS_${commit.version}.json`;

            link.click();

            URL.revokeObjectURL(url);
        } finally {
            button.disabled = false;
            spinner?.classList.add("d-none");
        }
    });

    await loadPage(1);

    document.getElementById("builds_loading")?.remove();
}

async function loadPage(page: number) {
    if (!commitList || !pageList) return;
    if (page < 1 || page > totalPages) return;

    commitList.innerHTML = `
        <div class="col-12 d-flex justify-content-center">
            <div class="spinner-border" role="status">
                <span class="visually-hidden"></span>
            </div>
        </div>
    `;

    try {
        var updates = await Api.fetchCmsUpdates(page);
        currPage = page;

        if (updates.totalPages > 1) totalPages = updates.totalPages;

        commitList.innerHTML = updates.commits
            .map(update => {
                const date = update.commit.author?.date ? new Date(update.commit.author.date).toLocaleDateString() : "Unknown date";

                return `
            <div class="col-12">
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">${update.commit.message}</h5>

                        <h6 class="card-subtitle mb-2 text-body-secondary">
                            ${date} - ${calcDateStr(date)}
                        </h6>

                        <a href="${update.html_url}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">View</a>

                        <button type="button" class="btn btn-primary btn-sm download-json" data-sha="${update.sha}">
                             <span class="spinner-border spinner-border-sm d-none" role="status" aria-hidden="true"></span>
                            JSON
                        </button>
                    </div>
                </div>
            </div>
        `;
            })
            .join("");

        renderPageList();
    } catch (e) {
        commitList.innerHTML = `<div class="alert alert-danger">${e}</div>`;
    }
}

function renderPageList() {
    if (!pageList) return;

    let res = "";

    res += `
        <li class="page-item ${currPage === 1 ? "disabled" : ""}">
            <button class="page-link" data-page="1">${t("nav.btnFirst")}</button>
        </li>
    `;

    res += `
        <li class="page-item ${currPage === 1 ? "disabled" : ""}">
            <button class="page-link" data-page="${currPage - 1}">${t("nav.btnPrev")}</button>
        </li>
    `;

    let start = Math.max(1, currPage - 2);
    let end = Math.min(totalPages, start + 4);

    start = Math.max(1, end - 4);

    for (let page = start; page <= end; page++) {
        res += `
            <li class="page-item ${page === currPage ? "active" : ""}">
                <button class="page-link" data-page="${page}">${page}</button>
            </li>
        `;
    }

    res += `
        <li class="page-item ${currPage === totalPages ? "disabled" : ""}">
            <button class="page-link" data-page="${currPage + 1}">${t("nav.btnNext")}</button>
        </li>
    `;

    res += `
        <li class="page-item ${currPage === totalPages ? "disabled" : ""}">
            <button class="page-link" data-page="${totalPages}">${t("nav.btnLast")}</button>
        </li>
    `;

    pageList.innerHTML = res;
}
