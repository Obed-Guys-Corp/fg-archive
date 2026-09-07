import { t } from "../../i18n/i18n";
import { maps } from "../../map";

export function initNavbar(): void {
    const brand = document.querySelector<HTMLAnchorElement>("#mainNavbar .navbar-brand");
    if (!brand) return;

    brand.href = `${import.meta.env.BASE_URL}${maps[0].path}`;
    brand.dataset.navigation = "true";

    renderDesktopNav();
    renderMobileNav();
    updateNav();
}

function renderDesktopNav(): void {
    const container = document.getElementById("desktopNav");

    if (!container) return;

    container.innerHTML = `
        <ul class="nav nav-tabs navbar-nav d-flex flex-row border-0">
            ${maps
                .slice(1)
                .map(
                    route => `
                        <li class="nav-item">
                            <a class="nav-link px-2" href="${route.path}" data-route="${route.path}" data-navigation="true">
                                ${t(route.label)}
                            </a>
                        </li>`
                )
                .join("")}
        </ul>
    `;
}

function renderMobileNav(): void {
    const container = document.getElementById("mobileNav");

    if (!container) return;

    container.innerHTML = `
        <ul class="navbar-nav">${maps
            .slice(1)
            .map(
                route => `
                        <li class="nav-item">
                            <a class="nav-link" href="${route.path}" data-route="${route.path}" data-navigation="true">
                                ${t(route.label)}
                            </a>
                        </li>`
            )
            .join("")}
        </ul>
    `;
}

export function updateNav(): void {
    document.querySelectorAll<HTMLAnchorElement>("#mainNavbar [data-route]").forEach(element => {
        element.classList.toggle("active", element.pathname === window.location.pathname);
    });
}
