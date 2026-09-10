import { Api } from "../api";
import { CMS_CONFIG } from "../constants/cms-config";
import { LINKS } from "../constants/links";
import { t } from "../i18n/i18n";
import type { Release } from "../types";
import { createAlert } from "../ui/alerts";
import { showToast } from "../ui/toasts";
import { calcDateStr } from "../utils/string";

let currPage = 1;
let totalPages = 1;
let commitList: HTMLDivElement;
let alerts: HTMLDivElement;
let pageList: Element;

export async function renderCms(): Promise<void> {
    const app = document.getElementById("app");

    if (!app) return;

    const url = new URL(window.location.href);

    const page = Number(url.searchParams.get("page") ?? "1");
    const max = Number(url.searchParams.get("max") ?? "50");

    app.innerHTML = `
        <div class="container">
            <div class="toast-container position-fixed top-0 end-0 mx-3 my-5 p-3" style="z-index: 9999">
                <div id="alert-toast" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                    <div class="toast-header">
                        <strong class="me-auto"></strong>
                        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                    </div>
                    <div i class="toast-body"></div>
                </div>
            </div>

            <div id="init-load" class="col-12 d-flex justify-content-center my-3">
                <div class="spinner-border" role="status">
                    <span class="visually-hidden"></span>
                </div>
            </div>

            <nav class="mt-4">
                <ul id="pageList" class="pagination justify-content-center flex-wrap"></ul>
            </nav>

            <div id="alerts"></div>
            <div id="commits" class="row"></div>
        </div>
    `;

    commitList = document.querySelector("#commits")!;
    pageList = document.querySelector("#pageList")!;
    alerts = document.querySelector("#alerts")!;

    pageList?.addEventListener("click", event => {
        const target = event.target as HTMLElement;
        const button = target.closest("[data-page]") as HTMLButtonElement | null;

        if (!button || button.disabled) return;

        const goTo = Number(button.dataset.page);

        if (!goTo || goTo === currPage) return;

        loadPage(goTo, max);
    });

    commitList?.addEventListener("click", async event => {
        const target = event.target as HTMLElement;
        const button = target.closest<HTMLButtonElement>(".download");

        if (!button) return;

        switch (button.dataset.type) {
            case "json":
                await doDownload(button, cms => {
                    download(JSON.stringify(cms.json), "application/json", `CMS_${cms.version}.json`);
                });
                break;
            case "v1":
                await doDownload(button, cms => {
                    const bytes = xor(new TextEncoder().encode(JSON.stringify(cms.json)));
                    download(bytes, "application/octet-stream", `CMS_v1_${cms.version}`);
                });
                break;
            case "v2":
                await doDownload(button, async cms => {
                    const bytes = new TextEncoder().encode(JSON.stringify(cms.json));
                    const compressed = new Uint8Array(
                        await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream("gzip"))).arrayBuffer()
                    );

                    download(xor(compressed), "application/octet-stream", `CMS_v2_${cms.version}.gdata`);
                });
                break;
        }
    });

    await Api.fetchReleaseMap();

    document.getElementById("init-load")?.remove();

    if (alerts) {
        createAlert(alerts, "alert-secondary", "", t("cms.about",
            `<a href="${LINKS.cmsGitlab}" class="alert-link" target="_blank">${t(`gitlab`)}</a>`,
            `<a href="${LINKS.cmsGithub}" class="alert-link" target="_blank">${t(`github`)}</a>`))
    }

    await loadPage(page, max);
}

async function doDownload(btn: HTMLButtonElement, action: (cms: Awaited<ReturnType<typeof Api.fetchCmsJson>>) => Promise<void> | void) {
    const icon = btn.querySelector<HTMLElement>("i");
    const spinner = btn.querySelector<HTMLElement>(".spinner-border");
    const text = btn.querySelector<HTMLElement>(".text");

    if (!btn.dataset.sha || !text) return;

    btn.disabled = true;
    spinner?.classList.remove("d-none");
    icon?.classList.add("d-none");

    let ogStr = text.textContent;

    try {
        const cms = await Api.fetchCmsJson(btn.dataset.sha, s => text.textContent = s);
        await action(cms);
    } catch (err) {
        showToast("alert", t("cms.fetch.fail"), `${err}`, 7)
    }
    finally {
        text.textContent = ogStr;
        btn.disabled = false;
        spinner?.classList.add("d-none");
        icon?.classList.remove("d-none");
    }
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

async function loadPage(page: number, pages: number) {
    if (!commitList || !pageList) return;
    if (!Number.isFinite(page) || page < 1) return;
    if (!Number.isFinite(pages) || pages <= 0 || pages >= 100) pages = 50;

    commitList.innerHTML = `
        <div class="col-12 d-flex justify-content-center">
            <div class="spinner-border" role="status">
                <span class="visually-hidden"></span>
            </div>
        </div>
    `;

    const releases = [...Api._releases].sort((x, y) => new Date(y.date).getTime() - new Date(x.date).getTime());

    let releaseIndex = 0;
    let lastRelease: Release | null = null;

    try {
        var updates = await Api.fetchCmsUpdates(page, pages);

        if (page > updates.totalPages) {
            currPage = 1;
            updates = await Api.fetchCmsUpdates(currPage, pages)
        }
        else
            currPage = page;

        if (updates.totalPages > 1) totalPages = updates.totalPages;

        const url = new URL(window.location.href);

        if (currPage === 1) {
            url.searchParams.delete("page");
        } else {
            url.searchParams.set("page", String(currPage));
        }

        url.searchParams.set("max", String(pages));

        history.pushState({ page: currPage, max: pages }, "", url);

        commitList.innerHTML = updates.commits.map(update => {
            const date = update.authored_date ? new Date(update.authored_date) : null;

            while (date && releaseIndex < releases.length - 1) {
                const release = releases[releaseIndex];
                if (!release || date >= new Date(release.date)) break;

                releaseIndex++;
            }

            const release = releases[releaseIndex];

            let html = "";

            if (release && release !== lastRelease) {
                html += `
                    <h4 class="col-12 mt-4 mb-2">
                        ${t("cms.clientVer", release.ver, new Date(release.date).toLocaleDateString())}
                    </h4>
                `;

                lastRelease = release;
            }

            const dateStr = date ? date.toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
            }) : "Unknown date";

            const stats = update.stats ? `
            <div class="col-auto small text-nowrap">
                <span class="bg-success text-white px-1 rounded">+ ${update.stats.additions}</span>
                <span class="bg-danger text-white px-1 rounded">- ${update.stats.deletions}</span>
            </div>
            ` : "";

            let titleSplit = update.title.split(":");

            html += `
            <div class="col-12 mb-3">
                <div class="card">
                    <div class="card-body">
                        <div class="row align-items-center mb-2">
                            <div class="col">
                                <h5 class="card-title mb-0">${titleSplit.length >= 2 ? `<span class="font-monospace">${titleSplit[1]}</span>` : t("cms.verFallback")}</h5>
                            </div>
                            ${stats}
                        </div>

                        <h6 class="card-subtitle mb-2 text-body-secondary">
                            ${dateStr} - ${calcDateStr(dateStr)}
                        </h6>

                        <div class="d-flex flex-wrap gap-1">
                            <a href="${update.web_url}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">
                                <i class="bi bi-gitlab"></i>
                                <span class="text">${t("cms.view")}</span>
                            </a>

                            <a href="${LINKS.cmsGithub}/commit/${update.id}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">
                                <i class="bi bi-github"></i>
                                <span class="text">${t("cms.view")}</span>
                            </a>

                            <button type="button" class="btn btn-primary btn-sm download" data-type="json" data-sha="${update.id}">
                                <span class="spinner-border spinner-border-sm d-none" role="status" aria-hidden="true"></span>
                                <i class="bi bi-download"></i>
                                <span class="text">${t("cms.asJson")}</span>
                            </button>

                            <button type="button" class="btn btn-primary btn-sm download" data-type="v1" data-sha="${update.id}">
                                <span class="spinner-border spinner-border-sm d-none" role="status" aria-hidden="true"></span>
                                <i class="bi bi-download"></i>
                                <span class="text">${t("cms.asV1")}</span>
                            </button>

                            <button type="button" class="btn btn-primary btn-sm download" data-type="v2" data-sha="${update.id}">
                                <span class="spinner-border spinner-border-sm d-none" role="status" aria-hidden="true"></span>
                                <i class="bi bi-download"></i>
                                <span class="text">${t("cms.asV2")}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

            return html;
        })
            .join("");

        renderPageList();
    } catch (e) {
        commitList.innerHTML = `<div class="alert alert-danger">${e}</div>`;
    }
}

function renderPageList() {
    if (!pageList) return;
    const pageCount = window.innerWidth < 576 ? 3 : 6;

    let res = "";

    res += `
        <li class="page-item ${currPage === 1 ? "disabled" : ""}">
            <button class="page-link" data-page="1">
                <i class="bi bi-chevron-bar-left"></i>
            </button>
        </li>
    `;

    res += `
        <li class="page-item ${currPage === 1 ? "disabled" : ""}">\
            <button class="page-link" data-page="${currPage - 1}">
                <i class="bi bi-chevron-left"></i>
            </button>
        </li>
    `;

    let start = Math.max(1, currPage - Math.floor(pageCount / 2));
    let end = Math.min(totalPages, start + pageCount - 1);

    start = Math.max(1, end - pageCount + 1);

    for (let page = start; page <= end; page++) {
        res += `
            <li class="page-item ${page === currPage ? "active" : ""}">
                <button class="page-link" data-page="${page}">${page}</button>
            </li>
        `;
    }

    res += `
        <li class="page-item ${currPage === totalPages ? "disabled" : ""}">
            <button class="page-link" data-page="${currPage + 1}">
                <i class="bi bi-chevron-right"></i>
            </button>
        </li>
    `;

    res += `
        <li class="page-item ${currPage === totalPages ? "disabled" : ""}">
            <button class="page-link" data-page="${totalPages}">
                <i class="bi bi-chevron-bar-right"></i>
            </button>
        </li>
    `;

    pageList.innerHTML = res;
}
