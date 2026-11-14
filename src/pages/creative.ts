export async function renderCreative(): Promise<void> {
   renderLevel();
}

function renderSearch() {
    const app = document.getElementById("app");

    if (!app) return;

    app.innerHTML = `
      <div class="container">
            <div id="base-page" class="col-12 justify-content-center my-3">
                <h3 class="my-2 text-center">Search results for "{0}"</h3>
                <p class="text-center">Approx. 102 results</p>
                <hr>
                <nav class="mt-4">
                    <ul id="pageList" class="pagination justify-content-center flex-wrap"></ul>
                </nav>
                <div id="commits" class="row"></div>
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
                                <span ng-if="!isNull">date</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
        `
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
                            <div class="card-body">
                                <h3>stat title</h3>
                                <table class="table">
					                <tbody>
						                <tr>
							                <td>Stat placeholder</td>
							                <td class="right">102</td>
						                </tr>
                                         <tr>
							                <td>Stat placeholder</td>
							                <td class="right">102</td>
						                </tr>
					                </tbody>
				                </table>
                                <h3>stat title</h3>
                                <table class="table">
					                <tbody>
						                <tr>
							                <td>Stat placeholder</td>
							                <td class="right">102</td>
						                </tr>
					                </tbody>
				                </table>
                            </div>
                        </div>
                    </div> 
        </div>
    `;
}
