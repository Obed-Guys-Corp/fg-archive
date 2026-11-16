import { Modal } from "bootstrap";
import { Api } from "../api";
import { RecordType, type UGCLevel, type UGCStats } from "../types";
import { renderPageList } from "../ui/pagination";
import { formatBytes } from "../utils/string";

let stats: UGCStats;

export async function renderCreative(): Promise<void> {
    const app = document.getElementById("app");
    if (!app) return;

    app.innerHTML = ` 
        <div class="col-12 d-flex justify-content-center">
            <div class="spinner-border" role="status">
                <span class="visually-hidden"></span>
            </div>
        </div>`

    try {
        stats = await Api.fetchUGCAStats();
        renderMain();
    }
    catch (ex) {
        app.innerHTML = `
            <div class="container">
                <div id="base-page" class="col-12 justify-content-center my-3">
                    <div class="alert alert-danger">
                        Looks like my API is down right now. You can still access Fall Guys Creative Archive directly on GitHub and it's Telegram Channel. You can also check your internet connection, use different browser or a VPN and also simply wait<br><br>${ex}
                    </div>
                </div>
            </div>
            `
    }
}

function renderMain() {
    const app = document.getElementById("app");
    if (!app) return;

    app.innerHTML = `
        <div class="container">
            <div id="base-page" class="col-12 justify-content-center my-3">
                <h1 class="my-4 text-center">Fall Guys Creative Archive (EXPERIMENTAL)</h1>
                <div class="row">
                    <div class="col-sm-6 mb-3 mb-sm-0">
                        <div class="card">
                            <div class="card-header">Search for a level</div>
                                <div class="card-body">
                                    <div class="input-group mb-3">
                                        <input id="level-search" type="text" class="form-control" placeholder="Level share-code or name" aria-label="Level share-code" aria-describedby="basic-addon2" maxlength="20" minlength="4">
                                        <div class="input-group-append">
                                            <button id="level-search-btn" class="btn btn-outline-secondary" type="button" disabled>Search</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    <div class="col-sm-6">
                        <div class="card">
                            <div class="card-header">Archive level</div>
                                <div class="card-body">
                                    <div class="input-group mb-3">
                                        <input id="level-archive" type="text" inputmode="numeric" class="form-control" placeholder="Level share-code" aria-label="Level share-code" aria-describedby="basic-addon2" maxlength="14" minlength="14">
                                        <div class="input-group-append">
                                            <button id="level-archive-btn" class="btn btn-outline-secondary" type="button" disabled>Archive</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <hr>
                    <div class="card my-3">
                        <div class="card-header">Statistics</div>
                            <div id="statistics" class="card-body">
                            
                            </div>
                        </div>
                    </div> 
        </div>
    `;

    const statElement = document.getElementById("statistics");
    if (!statElement) return;

    statElement.innerHTML = `
    <table class="table">
        <tbody>
            <tr><td>Total levels</td><td class="right">${stats.levels.toLocaleString("en-US")}</td></tr>
            <tr><td>Total size</td><td class="right">${formatBytes(stats.total_size)}</td></tr>
        </tbody>
    </table>
    <a href="/creative/stats" class="btn btn-outline-primary d-flex justify-content-center" data-navigation>More statistics</a>
    <div class="modal fade" id="txt-modal" tabindex="-1" role="dialog" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="modal-title">Modal title</h5>
      </div>
      <div class="modal-body" id="modal-body">...</div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
      </div>
    </div>
  </div>
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
                        <div class="card-header">Statistics</div>
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
            ["Gamemodes", "gamemode_stats", stats.gamemode_stats],
            ["Themes", "theme_stats", stats.theme_stats],
            ["Tags", "tag_stats", stats.tag_stats],
            ["Platforms", "platform_stats", stats.platform_stats],
            ["Music", "music_stats", stats.music_stats],
            ["Versions", "version_stats", stats.version_stats],
            ["Sources", "source_stats", stats.source_stats],
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
                ${Object.entries(data).map(([key, value]) => `
                    <tr>
                        <td>${key}:</td>
                        <td class="right">${value} ${value > 1 ? "levels" : "level"}</td>
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
                        Looks like my API is down right now. You can still access Fall Guys Creative Archive directly on GitHub and it's Telegram Channel. You can also check your internet connection, use different browser or a VPN and also simply wait<br><br>${ex}
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
        window.history.pushState({}, "", `/creative`);
        window.dispatchEvent(new PopStateEvent("popstate"));
        renderCreative();
        return;
    }

    const codePat = /^\d{4}-\d{4}-\d{4}$/;
    if (codePat.test(query)) {
        const params = new URLSearchParams({ code: query });
        window.history.pushState({}, "", `/creative/level?${params.toString()}`);
        window.dispatchEvent(new PopStateEvent("popstate"));
        renderUGCALevel();
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
                <h3 class="my-2 text-center">Search results for \"${query}\"</h3>
                <p class="text-center">Approx. ${res.total} results</p>
                <nav class="mt-4">
                    <ul id="page-list" class="pagination justify-content-center flex-wrap"></ul>
                </nav>
                <hr>
                <div class="table-responsive">
                    <table class="table table-striped table-hover">
                        <thead>
                            <tr>
                                <th scope="col">#</th>
                                <th scope="col">Name</th>
                                <th scope="col">Author</th>
                                <th scope="col">Sharecode</th>
                                <th scope="col">Client</th>
                            </tr>
                        </thead>
                        <tbody id="search-results">
                            ${res.results.map((item, index) => `
                                <tr data-sharecode="${item.sharecode}" class="result-row" style="cursor: pointer">
                                    <th scope="row">${(currPage - 1) * 50 + index + 1}</th>
                                    <td>${item.name}</td>
                                    <td>${item.author}</td>
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
            window.dispatchEvent(new PopStateEvent("popstate"));
            renderUGCALevel();
        });

        if (totalPages > 1) {
            const pageList = document.getElementById("page-list") as HTMLElement;
            renderPageList(pageList, currPage, totalPages);
        }
    }
    catch (ex) {
        searchBase.innerHTML = `<div class="alert alert-danger">${ex}</div>`;
    }
    finally {

    }
}

export async function renderUGCALevel() {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("code") ?? "";
    const gen = params.get("gen") ?? "-1";

    if (!query) {
        window.history.pushState({}, "", `/creative`);
        window.dispatchEvent(new PopStateEvent("popstate"));
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
        levelBase.innerHTML = `<div class="alert alert-danger">${ex}</div>`;
    }
}

function doLevelRender(level: UGCLevel, selectedGen: number = -1) {
    const levelBase = document.getElementById("level-base");
    if (!levelBase || !level) return;

    try {
        var lastGen = selectedGen < 0 ? level.generations.find(x => x.version == level.latest_version) : level.generations.find(x => x.version == selectedGen);
        if (!lastGen) {
            throw new Error("such generation does not exist for this level");
        }

        var tgd = lastGen?.archive_downloads["tg"];

        levelBase.innerHTML = `
        <div class="container">
            <div id="base-page" class="col-12 justify-content-center my-3">
                <div class="card">
                    <div class="card-body">
                        <div class="container-fluid">
                            <div class="row">
                                <div class="col-md-7">
                                    <div class="fw-bold fs-3 mb-1">${lastGen?.title}</div>
                                    <div>${!lastGen?.description ? "..." : lastGen?.description}</div>
                                    <table class="table table-sm mt-2">
                                        <tbody>
                                            <tr><td class="fw-bold">Author</td><td>${lastGen?.author?.eos || lastGen?.author?.steam || lastGen?.author?.psn || lastGen?.author?.xbl || lastGen?.author?.nintendo || "Unknown"}</td></tr></td></tr>
                                            <tr><td class="fw-bold">Share Code</td><td>${level.sharecode}</td></tr></td></tr>
                                            <tr><td class="fw-bold">Play Count</td><td>${lastGen?.played} 
                                                <span style="margin-left: 6px;">
                                                    <span class="text-muted">(</span>
                                                        <span class="bi bi-hand-thumbs-up-fill"></span> ${lastGen?.likes}
                                                        <span class="bi bi-hand-thumbs-down-fill" style="margin-left: 5px;"></span> ${lastGen?.dislikes}
                                                    <span class="text-muted">)</span>
                                                </span></td></tr></td></tr>
                                            <tr><td class="fw-bold">Max players</td><td>${lastGen?.max_player_count}</td></tr></td></tr>
                                            <tr><td class="fw-bold">Theme</td><td>${lastGen?.theme_id}</td></tr></td></tr>
                                            <tr><td class="fw-bold">Gamemode</td><td>${lastGen?.gamemode_id}</td></tr></td></tr>
                                            <tr><td class="fw-bold">Last Modified</td><td>${new Date(lastGen?.last_modified! * 1000).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "medium" })}</td></tr></td></tr>
                                            <tr><td class="fw-bold">Made On</td><td>v${lastGen?.client_version} (${lastGen?.platform_id})</td></tr></td></tr>
                                        </tbody>
                                    </table>
                                <div>
                                <a href="${lastGen?.scene_url}" target="_blank" class="btn btn-primary me-2"><i class="nf nf-fae-telegram"></i> Download from Fall Guys</a>
                                <a style="${!tgd ? "display: none;" : ""}" href="https://t.me/fgugcarchive/${tgd?.message_id}" target="_blank" class="btn btn-primary me-2"><i class="nf nf-fae-telegram"></i> Download in Telegram (${formatBytes(Number(tgd?.file_size!))})</a>
                                </div>
                        </div>
                    <div class="col-md-5 mt-2">
                        <div class="carousel img-thumbnail">
                            <div class="carousel-inner">
                                <div class="carousel-item active">
                                    <div class="position-relative w-100" style="aspect-ratio: 2 / 1;">
                                        <div id="thumb-loader" class="spinner-border position-absolute top-50 start-50" role="status" style="translate: -50% -50%;">
                                            <span class="visually-hidden"></span>
                                        </div>
                                        <img style="object-fit: fit;" class="d-block w-100 h-100" 
                                            src="${lastGen?.loading_image?.url || lastGen?.preview_image?.url || "https://cdn.floyzi.dev/shared-images/fallback.webp"}"
                                            onload="document.getElementById('thumb-loader').style.display='none'"
                                            onerror="document.getElementById('thumb-loader').style.display='none'; this.onerror=null; this.src='https://cdn.floyzi.dev/shared-images/fallback.webp';">
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="text-muted fs-7 mt-1">
                            <div>Last bot touch: ${new Date(lastGen?.last_touch! * 1000).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "medium" })}</div>
                            <div>Source: ${RecordType[lastGen?.record_type!]}</div>
                            <div>Level version: ${lastGen?.version}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <hr>
    <div class="card">
        <div class="card-header text-center">Other level versions</div>
            <div class="card-body" id="other-generations">
            </div>
        </div>
    </div>
        `

        const otherGens = document.getElementById("other-generations");
        if (!otherGens) return;

        if (level.generations.length <= 1) {
            otherGens.innerHTML = `<p class="text-center">There's nothing!</p>`
            return;
        }

        otherGens.innerHTML = `
        <div class="table-responsive">
            <table class="table table-striped table-hover">
                        <thead>
                            <tr>
                                <th scope="col">#</th>
                                <th scope="col">Version</th>
                                <th scope="col">Client</th>
                                <th scope="col">Last Modified</th>
                                <th scope="col">Source</th>
                            </tr>
                        </thead>
                        <tbody id="level-generations">
                            ${level.generations.map((item, index) => `
                                <tr data-gen="${item.version}" class="result-row" style="cursor: pointer">
                                    <th scope="row">${(currPage - 1) * 50 + index + 1}</th>
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

            const params = new URLSearchParams({ code: level.sharecode, gen: gen });
            window.history.pushState({}, "", `/creative/level?${params.toString()}`);
            doLevelRender(level, Number(gen));
        });
    }
    catch (ex) {
        levelBase.innerHTML = `<div class="alert alert-danger">This level was too good for my code, it can't be rendered<br><br>${ex}</div>`
    }
    finally {

    }
}