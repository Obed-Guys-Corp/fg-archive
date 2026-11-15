import { Api } from "../api";
import { RecordType, type UGCStats } from "../types";

let stats: UGCStats;

export async function renderCreative(): Promise<void> {
    stats = await Api.fetchUGCAStats();
    renderMain();
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
                                        <input type="text" class="form-control" placeholder="Level share-code or name" aria-label="Level share-code" aria-describedby="basic-addon2">
                                        <div class="input-group-append">
                                            <button class="btn btn-outline-secondary" type="button">Search</button>
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
                                        <input type="text" class="form-control" placeholder="Level share-code" aria-label="Level share-code" aria-describedby="basic-addon2">
                                        <div class="input-group-append">
                                            <button class="btn btn-outline-secondary" type="button">Archive</button>
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
            <tr><td>Total levels</td><td class="right">${stats.levels}</td></tr>
            <tr><td>Total size</td><td class="right">${stats.total_size}</td></tr>
        </tbody>
    </table>
    <a href="/creative/stats" class="btn btn-outline-primary d-flex justify-content-center" data-navigation>More statistics</a>
`;
}

export async function renderUGCAStats() {
    if (stats == null) stats = await Api.fetchUGCAStats();

    const app = document.getElementById("app");

    if (!app) return;

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
                        <td>${id === "source_stats" ? RecordType[Number(key)] : key}:</td>
                        <td class="right">${value} ${value > 1 ? "levels" : "level"}</td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;
    }
}

function renderSearch() {
    const app = document.getElementById("app");

    if (!app) return;

    app.innerHTML = `
      <div class="container">
            <div id="base-page" class="col-12 justify-content-center my-3">
                <h3 class="my-2 text-center">Search results for "{0}"</h3>
                <p class="text-center">Approx. 102 results</p>
                <nav class="mt-4">
                    <ul id="pageList" class="pagination justify-content-center flex-wrap"></ul>
                </nav>
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
                <tbody>
                </tbody>
                </table>
            </div>
        </div>
    `
}

function renderLevel() {
    const app = document.getElementById("app");

    if (!app) return;

    app.innerHTML = `
        <div class="container">
            <div id="base-page" class="col-12 justify-content-center my-3">
                <div class="card">
                    <div class="card-body">
                        <div class="container-fluid">
                            <div class="row">
                                <div class="col-md-7">
                                    <div class="fw-bold fs-3 mb-1">Level name</div>
                                    <div>Level desc</div>
                                    <table class="table table-sm mt-2">
                                        <tbody>
                                            <tr>
                                                <td class="fw-bold">a</td>
                                                <td>
                                                    <span>b</span>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                <div>
                            </div>
                        </div>
                    <div class="col-md-5 mt-2">
                        <div class="carousel img-thumbnail">
                            <div class="carousel-inner">
                                <div class="carousel-item active">
                                    <img class="d-block w-100" src="https://api.floyzi.dev/random_pic?src=main">
                                </div>
                            </div>
                        </div>
                        <div class="text-muted fs-7 mt-1">
                            <div>text</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <hr>
    <div class="card">
        <div class="card-header text-center">Other level versions</div>
            <div class="card-body">
                <table class="table table-sm mt-2 table-hover">
                    <tbody>
                        <tr>
                            <td class="fw-bold">v102</td>
                            <td>
                                <span>date</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
        `
}