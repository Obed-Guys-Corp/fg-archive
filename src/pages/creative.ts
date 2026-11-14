export async function renderCreative(): Promise<void> {
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
