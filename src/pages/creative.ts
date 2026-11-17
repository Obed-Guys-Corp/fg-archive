import { Modal } from "bootstrap";
import { Api } from "../api";
import { HttpError, RecordType, type UGCLevel, type UGCSearchRes, type UGCStats } from "../types";
import { renderPageList } from "../ui/pagination";
import { formatBytes } from "../utils/string";
import { LINKS } from "../constants/links";
import { t } from "../i18n/i18n";
import { sourceLocales } from "../ui/builds/source-maps";

let stats: UGCStats;
let recent: UGCSearchRes[];

window.addEventListener("popstate", () => {
    const path = window.location.pathname;

    if (path === "/creative") {
        renderCreative();
    } else if (path === "/creative/level") {
        renderUGCALevel();
    } else if (path === "/creative/search") {
        renderUGCASearch();
    } else if (path === "/creative/stats") {
        renderUGCAStats();
    }
});

export async function renderCreative(): Promise<void> {
    const app = document.getElementById("app");
    if (!app) return;

    app.innerHTML = ` 
        <div class="col-12 d-flex justify-content-center my-3">
            <div class="spinner-border" role="status">
                <span class="visually-hidden"></span>
            </div>
        </div>`

    try {
        if (stats == null) stats = await Api.fetchUGCAStats();
        renderMain();
    }
    catch (ex) {
        app.innerHTML = `
            <div class="container">
                <div id="base-page" class="col-12 justify-content-center my-3">
                    <div class="alert alert-danger">
                        ${t("ugca.generic_ex", `<a href="${LINKS.ugcArchiveGit}" class="alert-link">GitHub</a>`, `<a href="${LINKS.ugcTelegram}" class="alert-link">Telegram Channel</a>`)}<br><br>${ex}
                    </div>
                </div>
            </div>
            `
    }
}

async function renderMain() {
    const app = document.getElementById("app");
    if (!app) return;

    app.innerHTML = `
        <div class="container">
            <div id="base-page" class="col-12 justify-content-center my-3">
                <h1 class="my-4 text-center titan-one-font">${t("ugca.title")}</h1>
                <div class="alert alert-warning my-3 alert-dismissible fade show" role="alert">
                        <p class="mb-0">
                            ${t("ugca.exp_desc", `<a href="${LINKS.ugcTelegram}" class="alert-link" target="_blank">Telegram Channel</a>`)}
                        </p>
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>
                <div class="row">
                    <div class="col-sm-6 mb-3 mb-sm-0">
                        <div class="card">
                            <div class="card-header lead">${t("ugca.search_title")}</div>
                                <div class="card-body">
                                    <div class="input-group mb-3">
                                        <input id="level-search" type="text" class="form-control" placeholder="${t("ugca.search_ph")}" aria-label="${t("ugca.search_ph")}" aria-describedby="basic-addon2" maxlength="20" minlength="4">
                                        <div class="input-group-append">
                                            <button id="level-search-btn" class="btn btn-outline-secondary" type="button" disabled>${t("search")}</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    <div class="col-sm-6">
                        <div class="card">
                            <div class="card-header lead">${t("ugca.archive_title")}</div>
                                <div class="card-body">
                                    <div class="input-group mb-3">
                                        <input id="level-archive" type="text" inputmode="numeric" class="form-control" placeholder="${t("ugca.archive_ph")}" aria-label="${t("ugca.archive_ph")}" aria-describedby="basic-addon2" maxlength="14" minlength="14">
                                        <div class="input-group-append">
                                            <button id="level-archive-btn" class="btn btn-outline-secondary" type="button" disabled>${t("archive")}</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <hr>
                <div class="row mb-3">
                     <div class="col-sm-6 mb-3 mb-sm-0">
                        <div class="card h-100">
                            <div class="card-header">${t("stats")}</div>
                            <div id="statistics" class="card-body"></div>
                        </div>
                    </div>
                    <div class="col-sm-6">
                        <div class="card h-100">
                            <div class="card-header">${t("ugca.recent_levels")}</div>
                            <div id="recent-changes" class="card-body"></div>
                        </div>
                    </div>
                </div>
                <div class="text-center mb-3">
                    <a href="${LINKS.ugcTelegram}" class="text-decoration-underline">Telegram Channel</a> • <a href="${LINKS.ugcArchiveGit}" class="text-decoration-underline">GitHub Repository</a><br>
                    <span class="text-muted">Special thanks to <a href="${LINKS.fga}" class="text-decoration-underline">FGAnalyst</a> team for allowing me to archive their indexed levels</span>
                </div>
        </div>
        <div class="modal fade" id="txt-modal" tabindex="-1" role="dialog" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="modal-title"></h5>
                    </div>
                    <div class="modal-body" id="modal-body"></div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">${t("close")}</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    const statElement = document.getElementById("statistics");
    if (!statElement) return;

    statElement.innerHTML = `
    <div class="d-flex flex-column h-100">
    <table class="table">
        <tbody>
            <tr><td>${t("ugca.stat_levels")}</td><td class="right">${stats.levels.toLocaleString("en-US")}</td></tr>
            <tr><td>${t("ugca.stat_size")}</td><td class="right">${formatBytes(stats.total_size)}</td></tr>
            ${Object.entries(stats.source_stats!).sort((a, b) => b[1] - a[1]).map(([key, value]) => `
                            <tr>
                                <td>${key}:</td>
                                <td class="right">${value.toLocaleString("en-US")} ${value > 1 ? "levels" : "level"}</td>
                            </tr>
                        `).join("")}
        </tbody>
    </table>
    <a href="/creative/stats" class="btn btn-outline-secondary d-flex justify-content-center mt-auto" data-navigation>${t("ugca.more_stats")}</a>
    </div>
    `;

    const searchInput = document.getElementById("level-search") as HTMLInputElement;
    const searchBtn = document.getElementById("level-search-btn") as HTMLButtonElement;
    if (!searchBtn || !searchInput) return;

    searchInput.addEventListener("input", () => {
        searchBtn.disabled = searchInput.value.length < 3;
    });

    searchInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            searchBtn.click();
        }
    });

    searchBtn.addEventListener("click", () => {
        const params = new URLSearchParams({ q: searchInput.value.trim() });
        window.history.pushState({}, "", `/creative/search?${params.toString()}`);
        window.dispatchEvent(new PopStateEvent("popstate"));
    });

    const archiveInput = document.getElementById("level-archive") as HTMLInputElement;
    const archiveBtn = document.getElementById("level-archive-btn") as HTMLButtonElement;
    if (!archiveBtn || !archiveInput) return;

    archiveInput.addEventListener("input", () => {
        archiveBtn.disabled = archiveInput.value.length != 14;
        const value = archiveInput.value.replace(/\D/g, "").slice(0, 12);
        archiveInput.value = value.match(/.{1,4}/g)?.join("-") || "";
    });

    archiveInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            archiveBtn.click();
        }
    });

    archiveBtn.addEventListener("click", async () => {
        archiveBtn.disabled = true;
        archiveInput.disabled = true;

        try {
            var subRes = await Api.submitLevel(archiveInput.value);

            const modal = document.getElementById("txt-modal");

            if (modal) {
                const title = document.getElementById("modal-title");
                const body = document.getElementById("modal-body");

                if (!title || !body) return;

                title.textContent = "Submit Result";
                body.textContent = subRes.message ?? `??? (http ${subRes.code})`;

                Modal.getOrCreateInstance(modal).show();
            }
        }
        finally {
            archiveInput.disabled = false;
            archiveInput.value = "";
        }
    });

    const recentElem = document.getElementById("recent-changes");
    if (!recentElem) return;

    try {
        var res = await Api.fetchUGCARecent();

        recentElem.innerHTML = `
    <div class="table-responsive">
    <table class="table table-hover">
        <thead>
            <tr>
                <th scope="col">${t("ugca.lvl_name")}</th>
                <th scope="col">${t("ugca.lvl_code")}</th>
            </tr>
        </thead>
        <tbody>
           ${res.map((item) => `
            <tr data-sharecode="${item.sharecode}" style="cursor: pointer">
                <td>${item.name}</td>
                <td class="right">${item.sharecode}</td>
            </tr>
        `).join("")}
            
        </tbody>
    </table>
    </div>
    `;

        recentElem?.addEventListener("click", (event) => {
            const row = (event.target as HTMLElement).closest("tr");
            if (!row) return;

            const sharecode = row.dataset.sharecode;
            if (!sharecode) return;

            const params = new URLSearchParams({ code: sharecode });
            window.history.pushState({}, "", `/creative/level?${params.toString()}`);
            renderUGCALevel();
        });
    }
    catch (ex) {
        recentElem.innerHTML = `<p class="text-center">${t("generic_error")}<br>${ex}</p>`
    }
}

export async function renderUGCAStats() {
    const app = document.getElementById("app");
    if (!app) return;

    try {
        if (stats == null) stats = await Api.fetchUGCAStats();

        app.innerHTML = `
      <div class="container">
            <div id="base-page" class="col-12 justify-content-center my-3">
                <div class="card my-3">
                        <div class="card-header">${t("stats")}</div>
                            <div id="full-stats" class="card-body">
                            </div>
                        </div>
                    </div> 
                </div>
            </div>
        </div>
    `

        const statElement = document.getElementById("full-stats");
        if (!statElement) return;

        const sections = [
            [t("ugca.stat_gamemodes"), "gamemode_stats", stats.gamemode_stats],
            [t("ugca.stat_themes"), "theme_stats", stats.theme_stats],
            [t("ugca.stat_tags"), "tag_stats", stats.tag_stats],
            [t("ugca.stat_plats"), "platform_stats", stats.platform_stats],
            [t("ugca.stat_music"), "music_stats", stats.music_stats],
            [t("ugca.stat_versions"), "version_stats", stats.version_stats],
            [t("ugca.stat_sources"), "source_stats", stats.source_stats],
        ] as const;

        for (const [name, id, data] of sections) {
            if (!data || Object.keys(data).length === 0) continue;

            statElement.innerHTML += `
                <h3>${name}</h3>
                <table class="table w-100">
                    <colgroup>
                        <col style="width: 70%">
                        <col style="width: 30%">
                    </colgroup>
                    <tbody id="${id}">
                        ${Object.entries(data).sort((a, b) => b[1] - a[1]).map(([key, value]) => `
                            <tr>
                                <td>${key}:</td>
                                <td class="right">${value.toLocaleString("en-US")} ${value > 1 ? "levels" : "level"}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
    `;
        }
    }
    catch (ex) {
        app.innerHTML = `
            <div class="container">
                <div id="base-page" class="col-12 justify-content-center my-3">
                    <div class="alert alert-danger">
                       ${t("ugca.generic_ex", `<a href="${LINKS.ugcArchiveGit}" class="alert-link">GitHub</a>`, `<a href="${LINKS.ugcTelegram}" class="alert-link">Telegram Channel</a>`)}<br><br>${ex}
                    </div>
                </div>
            </div>
            `
    }
}

let currPage = 1;
let totalPages = 1;
let recentQuery = "";

export async function renderUGCASearch() {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q") ?? "";

    if (!query) {
        window.history.replaceState({}, "", `/creative`);
        return;
    }

    const codePat = /^\d{4}-\d{4}-\d{4}$/;
    if (codePat.test(query)) {
        const params = new URLSearchParams({ code: query });
        window.history.replaceState({}, "", `/creative/level?${params.toString()}`);
        return;
    }

    currPage = 1;
    totalPages = 1;
    recentQuery = query;


    const app = document.getElementById("app");

    if (!app) return;

    app.innerHTML = `
    <div class="container">
        <div class="col-12 justify-content-center my-3" id="search-base">
        </div>
    </div>
    `

    await doUGCASearch(query);

    const searchBase = document.getElementById("search-base")!;

    searchBase.addEventListener("click", async (event) => {
        const btn = (event.target as HTMLElement).closest<HTMLButtonElement>("button[data-page]");
        if (!btn || btn.disabled) return;

        const page = Number(btn.dataset.page);
        if (page < 1 || page > totalPages || page === currPage) return;

        currPage = page;
        await doUGCASearch(recentQuery);
    });
}

async function doUGCASearch(query: string) {
    const searchBase = document.getElementById("search-base");
    if (!searchBase) return;

    try {
        searchBase.innerHTML = ` 
        <div class="col-12 d-flex justify-content-center">
            <div class="spinner-border" role="status">
                <span class="visually-hidden"></span>
            </div>
        </div>`

        //todo cache
        var res = await Api.searchInUGCA(query, currPage);

        currPage = res.page;
        totalPages = res.total_pages;

        searchBase.innerHTML = `
                <h3 class="my-2 text-center">${t("ugca.search_res", query)}</h3>
                <p class="text-center">${t("ugca.search_bttm", res.total, `${res.took}${res.took < 1000 ? "ms" : "s"}`)}</p>
                <nav class="mt-4">
                    <ul id="page-list" class="pagination justify-content-center flex-wrap"></ul>
                </nav>
                <hr>
                <div class="table-responsive">
                    <table class="table table-striped table-hover">
                        <thead>
                            <tr>
                                <th scope="col">#</th>
                                <th scope="col">${t("ugca.lvl_name")}</th>
                                <th scope="col">${t("ugca.lvl_author")}</th>
                                <th scope="col">${t("ugca.lvl_played")}</th>
                                <th scope="col">${t("ugca.lvl_code")}</th>
                                <th scope="col">${t("ugca.lvl_client")}</th>
                            </tr>
                        </thead>
                        <tbody id="search-results">
                            ${res.results.map((item, index) => `
                                <tr data-sharecode="${item.sharecode}" class="result-row" style="cursor: pointer">
                                    <th scope="row">${(currPage - 1) * res.page_size + index + 1}</th>
                                    <td>${item.name}</td>
                                    <td>${item.author}</td>
                                    <td>${item.played.toLocaleString("en-US")}</td>
                                    <td>${item.sharecode}</td>
                                    <td>${item.clientVersion}</td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
        `

        const results = document.getElementById("search-results");
        results?.addEventListener("click", (event) => {
            const row = (event.target as HTMLElement).closest("tr");
            if (!row) return;

            const sharecode = row.dataset.sharecode;
            if (!sharecode) return;

            const params = new URLSearchParams({ code: sharecode });
            window.history.pushState({}, "", `/creative/level?${params.toString()}`);
            renderUGCALevel();
        });

        if (totalPages > 1) {
            const pageList = document.getElementById("page-list") as HTMLElement;
            renderPageList(pageList, currPage, totalPages);
        }
    }
    catch (ex) {
        if (ex instanceof HttpError) {
            switch (ex.status) {
                case 404:
                    searchBase.innerHTML = `<div class="alert alert-warning">${t("ugca.no_res")}<br><br><a href="/creative" class="alert-link"  data-navigation>Click here to return back on the main page</a></div>`;
                    break;
                default:
                    searchBase.innerHTML = `<div class="alert alert-danger">${ex}</div>`;
            }

        }
    }
}

window.addEventListener("resize", () => {
    var pages = document.getElementById("page-list");
    if (!pages) return;
    renderPageList(pages, currPage, totalPages, false)
});

export async function renderUGCALevel() {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("code") ?? "";
    const gen = params.get("gen") ?? "-1";

    const codePat = /^\d{4}-\d{4}-\d{4}$/;
    if (!query || !codePat.test(query)) {
        window.history.replaceState({}, "", `/creative`);
        renderCreative();
        return;
    }

    const app = document.getElementById("app");

    if (!app) return;

    app.innerHTML = `
    <div class="container">
        <div class="col-12 justify-content-center my-3" id="level-base">
        </div>
    </div>
    `

    const levelBase = document.getElementById("level-base");
    if (!levelBase) return;

    try {
        levelBase.innerHTML = ` 
        <div class="col-12 d-flex justify-content-center">
            <div class="spinner-border" role="status">
                <span class="visually-hidden"></span>
            </div>
        </div>`

        var res = await Api.searchUGCALevel(query);
        doLevelRender(res, Number(gen));
    }
    catch (ex) {
        if (ex instanceof HttpError) {
            switch (ex.status) {
                case 404:
                    levelBase.innerHTML = `<div class="alert alert-warning">${t("ugca.no_level", query)}<br><br><a href="/creative" class="alert-link" data-navigation>Click here to return back on the main page</a></div>`;
                    break;
                default:
                    levelBase.innerHTML = `<div class="alert alert-danger">${ex}</div>`;
            }

        }
    }
}

function doLevelRender(level: UGCLevel, selectedGen: number = -1) {
    const levelBase = document.getElementById("level-base");
    if (!levelBase || !level) return;

    try {
        var lastGen = selectedGen < 0 ? level.generations.find(x => x.version == level.latest_version) : level.generations.find(x => x.version == selectedGen);
        if (!lastGen) throw new Error("NO_GEN");

        var tgd = lastGen?.archive_downloads["tg"];

        levelBase.innerHTML = `
        <div class="container">
            <div id="base-page" class="col-12 justify-content-center my-3">
                <div class="fs-4 mb-1 text-center">${t("ugca.lvl_preview", lastGen.version, new Date(lastGen?.last_modified! * 1000).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" }))}</div>
                <div class="card">
                    <div class="card-body">
                        <div class="container-fluid">
                            <div class="row">
                                <div class="col-md-7">
                                    <div class="fw-bold fs-3 mb-1">${lastGen?.title}</div>
                                    <div style="white-space: pre-line">${!lastGen?.description ? "..." : lastGen?.description.replace(/\\n/g, "\n")}</div>
                                    <div class="table-responsive">
                                    <table class="table table-sm mt-2">
                                        <tbody>
                                            <tr><td class="fw-bold">${t("ugca.lvl_author")}</td><td>${lastGen?.author?.eos || lastGen?.author?.steam || lastGen?.author?.psn || lastGen?.author?.xbl || lastGen?.author?.nintendo || "Unknown"}</td></tr></td></tr>
                                            <tr><td class="fw-bold">${t("ugca.lvl_code")}</td><td>${level.sharecode}</td></tr></td></tr>
                                            <tr><td class="fw-bold">${t("ugca.lvl_played")}</td><td>${lastGen?.played.toLocaleString("en-US")} 
                                                <span style="margin-left: 6px;">
                                                    <span class="text-muted">(</span>
                                                        <span class="bi bi-hand-thumbs-up-fill"></span> ${lastGen?.likes.toLocaleString("en-US")}
                                                        <span class="bi bi-hand-thumbs-down-fill" style="margin-left: 5px;"></span> ${lastGen?.dislikes.toLocaleString("en-US")}
                                                    <span class="text-muted">)</span>
                                                </span></td></tr></td></tr>
                                            <tr><td class="fw-bold">${t("ugca.lvl_maxp")}</td><td>
                                                ${lastGen?.max_player_count}
                                                ${lastGen.config && lastGen.config["qualification_percentage"] ? ` (${lastGen.config["qualification_percentage"]}% ${t("ugca.qual_perc")})` : ``}
                                                ${lastGen.config && lastGen.config["survival_percentage"] ? ` (${lastGen.config["survival_percentage"]}% ${t("ugca.surv_perc")})` : ``}
                                            </td></tr></td></tr>
                                            <tr><td class="fw-bold">${t("ugca.lvl_theme")}</td><td>${!lastGen?.theme_id ? `<span class="text-muted">Unknown</span>` : lastGen?.theme_id}</td></tr></td></tr>
                                            <tr><td class="fw-bold">${t("ugca.lvl_mode")}</td><td>${!lastGen?.gamemode_id ? `<span class="text-muted">Unknown</span>` : lastGen?.gamemode_id}</td></tr></td></tr>
                                            <tr><td class="fw-bold">${t("ugca.lvl_last_edit")}</td><td>${new Date(lastGen?.last_modified! * 1000).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "medium" })}</td></tr></td></tr>
                                            <tr><td class="fw-bold">${t("ugca.lvl_tags")}</td><td>${!lastGen?.tags ? `<span class="text-muted">None</span>` : lastGen.tags.join(", ")}</td></tr></td></tr>
                                            <tr><td class="fw-bold">${t("ugca.lvl_mus")}</td><td>${lastGen.config && lastGen.config["ingame_music_soundtrack"] ? `${lastGen.config["ingame_music_soundtrack"]}` : `<span class="text-muted">Random</span>`}</td></tr></td></tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div class="d-flex flex-wrap gap-1">
                                <a href="${lastGen?.scene_url}" target="_blank" class="btn btn-primary me-2"><i class="bi bi-download"></i> ${t("ugca.fg_get")}</a>
                                <a style="${!tgd ? "display: none;" : ""}" href="https://t.me/fgugcarchive/${tgd?.message_id}" target="_blank" class="btn btn-primary me-2"><i class="nf nf-fae-telegram"></i> ${t(sourceLocales.get("telegram")!, t("telegram"))} (${formatBytes(Number(tgd?.file_size!))})</a>
                                </div>
                        </div>
                    <div class="col-md-5 mt-2">
                        <div class="carousel border rounded overflow-hidden w-100 border-3">
                            <div class="carousel-inner">
                                <div class="carousel-item active">
                                    <div class="position-relative w-100" style="aspect-ratio: 2 / 1;">
                                        <div id="thumb-loader" class="spinner-border position-absolute top-50 start-50" role="status" style="translate: -50% -50%;">
                                            <span class="visually-hidden"></span>
                                        </div>
                                        <img class="position-absolute top-0 start-0 w-100 h-100" style="object-fit: fit;" 
                                            src="${lastGen?.loading_image?.url || lastGen?.preview_image?.url || LINKS.fallbackPic}"
                                            onload="document.getElementById('thumb-loader').style.display='none'"
                                            onerror="document.getElementById('thumb-loader').style.display='none'; this.onerror=null; this.src='${LINKS.fallbackPic}';">
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="text-muted fs-7 mt-1">
                            ${lastGen?.loading_image?.created_at || lastGen?.preview_image?.created_at ? `<div>${t("ugca.lvl_thumb_date")}: ${new Date(lastGen?.loading_image?.created_at! || lastGen?.preview_image?.created_at!).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "medium" })}</div>` : ``}
                            <div>${t("ugca.lvl_last_touch")}: ${new Date(lastGen?.last_touch! * 1000).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "medium" })}</div>
                            <div>${t("ugca.lvl_src")}: ${RecordType[lastGen?.record_type!]}</div>
                            <div>${t("ugca.lvl_gen")}: ${lastGen?.version}</div>
                            <div>${t("ugca.lvl_made_on")}: v${lastGen?.client_version} (${lastGen?.platform_id})</div>
                            <div>${t("ugca.lvl_completed")}: ${lastGen?.completed}</div>
                            <div>${t("ugca.lvl_time_limit")}: ${lastGen.config && lastGen.config["time_limit_seconds"] ? `${lastGen.config["time_limit_seconds"]}s` : `<span class="text-muted">???</span>`}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <hr>
    <div class="card">
        <div class="card-header text-center">${t("ugca.other_gens")}</div>
            <div class="card-body" id="other-generations">
            </div>
        </div>
    </div>
        `

        const otherGens = document.getElementById("other-generations");
        if (!otherGens) return;

        if (level.generations.length <= 1) {
            otherGens.innerHTML = `<p class="text-center">${t("ugca.other_gens_blank")}</p>`
            return;
        }

        otherGens.innerHTML = `
        <div class="table-responsive">
            <table class="table table-striped table-hover">
                        <thead>
                            <tr>
                                <th scope="col">#</th>
                                <th scope="col">${t("ugca.lvl_gen_shrt")}</th>
                                <th scope="col">${t("ugca.lvl_client")}</th>
                                <th scope="col">${t("ugca.lvl_last_edit")}</th>
                                <th scope="col">${t("ugca.lvl_src")}</th>
                            </tr>
                        </thead>
                        <tbody id="level-generations">
                            ${level.generations.map((item, index) => `
                                <tr data-gen="${item.version}" class="result-row" style="cursor: pointer">
                                    <th scope="row">${index + 1}</th>
                                    <td>v${item.version}</td>
                                    <td>${item.client_version}</td>
                                    <td>${new Date(item?.last_modified! * 1000).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "medium" })}</td>
                                    <td>${RecordType[item.record_type]}</td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>`

        const generations = document.getElementById("level-generations");
        generations?.addEventListener("click", (event) => {
            const row = (event.target as HTMLElement).closest("tr");
            if (!row) return;

            const gen = row.dataset.gen;
            if (!gen) return;

            var genNum = Number(gen);
            if (lastGen?.version != genNum) {
                const params = new URLSearchParams({ code: level.sharecode, gen: gen });
                window.history.pushState({}, "", `/creative/level?${params.toString()}`);
                doLevelRender(level, genNum);
            }

            document.body.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        });
    }
    catch (ex) {
       if (ex instanceof Error && ex.message === "NO_GEN") {
            levelBase.innerHTML = `<div class="alert alert-warning">${t("ugca.level_no_gen")}<br><br><a href="/creative" class="alert-link"  data-navigation>Click here to return back on the main page</a></div>`;
       }
       else {
            levelBase.innerHTML = `<div class="alert alert-danger">${t("ugca.level_ex")}<br><br>${ex}</div>`
       }
    }
}