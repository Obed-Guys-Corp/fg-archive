import { Api } from "../api";
import { CMS_CONFIG } from "../constants/cms-config";
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
            const cms = await Api.fetchCmsJson(button.dataset.sha);

            const json = JSON.stringify(cms.json);

            download(json, "application/json", `CMS_${cms.version}.json`)
        } finally {
            button.disabled = false;
            spinner?.classList.add("d-none");
        }
    });

    commitList?.addEventListener("click", async event => {
        const target = event.target as HTMLElement;
        const button = target.closest(".download-v1") as HTMLButtonElement | null;

        if (!button || !button.dataset.sha) return;

        const spinner = button.querySelector<HTMLElement>(".spinner-border");

        button.disabled = true;
        spinner?.classList.remove("d-none");

        try {
            const cms = await Api.fetchCmsJson(button.dataset.sha);

            const encoder = new TextEncoder();
            let bytes = encoder.encode(JSON.stringify(cms.json)!);
            
            bytes = xor(bytes)

            download(bytes, "application/octet-stream", `CMS_v1_${cms.version}`)
        } finally {
            button.disabled = false;
            spinner?.classList.add("d-none");
        }
    });

    commitList?.addEventListener("click", async event => {
        const target = event.target as HTMLElement;
        const button = target.closest(".download-v2") as HTMLButtonElement | null;

        if (!button || !button.dataset.sha) return;

        const spinner = button.querySelector<HTMLElement>(".spinner-border");

        button.disabled = true;
        spinner?.classList.remove("d-none");

        try {
            const cms = await Api.fetchCmsJson(button.dataset.sha);

            const encoder = new TextEncoder();
            const bytes = encoder.encode(JSON.stringify(cms.json)!);

            let compressed = new Uint8Array(
                await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream("gzip"))).arrayBuffer()
            );

            compressed = xor(compressed);

            download(compressed, "application/octet-stream", `CMS_v2_${cms.version}.gdata`)
        } finally {
            button.disabled = false;
            spinner?.classList.add("d-none");
        }
    });

    await loadPage(1);

    document.getElementById("builds_loading")?.remove();
}

function xor<T extends ArrayBufferLike>(content: Uint8Array<T>): Uint8Array<T> {
    const key = new TextEncoder().encode(CMS_CONFIG.xor!);

    for (let i = 0; i < content.length; i++) {
        content[i]! ^= key[i % key.length]!;
    }

    return content;
}

function download(file: BlobPart, type: string, name: string) {
    const url = URL.createObjectURL(
        new Blob([file], {
            type: type
        })
    );

    const link = document.createElement("a");
    link.href = url;
    link.download = name;

    link.click();

    URL.revokeObjectURL(url);
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

                        <a href="${update.html_url}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">
                            <i class="bi bi-eye"></i>
                            ${t("cms.view")}
                        </a>

                        <button type="button" class="btn btn-primary btn-sm download-json" data-sha="${update.sha}">
                            <span class="spinner-border spinner-border-sm d-none" role="status" aria-hidden="true"></span>
                            <i class="bi bi-code-slash"></i>
                            ${t("cms.asJson")}
                        </button>

                         <button type="button" class="btn btn-primary btn-sm download-v1" data-sha="${update.sha}">
                            <span class="spinner-border spinner-border-sm d-none" role="status" aria-hidden="true"></span>
                            <i class="bi bi-download"></i>
                            ${t("cms.asV1")}
                        </button>

                         <button type="button" class="btn btn-primary btn-sm download-v2" data-sha="${update.sha}">
                            <span class="spinner-border spinner-border-sm d-none" role="status" aria-hidden="true"></span>
                            <i class="bi bi-download"></i>
                            ${t("cms.asV2")}
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
