import { t } from "../i18n/i18n";

export function renderBase(): void {
    const app = document.getElementById("app");

    if (!app) return;

    app.innerHTML = `
        <div class="container py-5">
            <div class="text-center">
                <h1 class="titan-one-font">${t("base_title")}</h1>
                <p class="fs-5 mb-3">${t("base_desc")}</p>
            </div>
            
        </div>
    `;
}
