export function renderPageList(pageList: HTMLElement, currPage: number, totalPages: number, force = true) {
    if (!pageList) return;

    const pageCount = window.innerWidth < 712 ? (window.innerWidth < 576 ? (window.innerWidth < 412 ? 3 : 4) : 6) : 8;
    if (!force && Number(pageList.dataset.lastRenderPages) === pageCount) return;

    pageList.dataset.lastRenderPages = pageCount.toString();

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
