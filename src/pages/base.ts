import { t } from "../i18n/i18n";
import { maps } from "../map";

export function renderBase(): void {
    const app = document.getElementById("app");

    if (!app) return;

    const isNew = document.body.hasAttribute("data-new");

    app.innerHTML = `
        <div class="container py-5${isNew ? " fade" : ""}" ${isNew ? 'style="transition-duration: 0.5s;"' : ""}>
            <div class="text-center">
                <h1 class="titan-one-font">${t("base_title")}</h1>
                <p class="fs-5 mb-3">${t("base_desc")}</p>

                <div id="btn_list" class="row g-2 justify-content-center"></div>
            </div>
        </div>
    `;

    var btnList = document.getElementById("btn_list");
    if (btnList) {
        maps.slice(1).map(route => {
            makeBtn(btnList!, route.path, t(route.label));
        });
    }

    const container = app.querySelector<HTMLElement>(".fade");

    if (container) {
        container.getBoundingClientRect();
        container.classList.add("show");
    }

}

export function makeBtn(container: HTMLElement, href: string, txt: string) {
    const div = document.createElement("div");
    div.className = "col-12 col-sm-6 col-lg-3";

    const btn = document.createElement("a");

    btn.href = href;
    btn.className = "btn btn-outline-primary w-100 btn-lg";
    btn.textContent = txt;
    btn.dataset.navigation = "true";

    div.appendChild(btn);

    container.appendChild(div);
}
