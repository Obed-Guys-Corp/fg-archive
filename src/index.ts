import { Api } from "./api";
import { initStaticText, t } from "./i18n/i18n";
import { applyTheme, getInitialTheme, toggleTheme } from "./ui/theme";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../css/styles.css";
import { LINKS } from "./constants/links";
import { addFooterLink } from "./utils/footer";
import { readableUrl } from "./utils/string";
import { initNavbar, updateNav } from "./ui/builds/navbar";
import { renderBase } from "./pages/base";
import { renderBuilds } from "./pages/builds";
import { maps } from "./map";
import * as bootstrap from "bootstrap";
import { initCardClick } from "./ui/builds/modal";

async function init(): Promise<void> {
    initNavbar();

    // Init theme
    document.getElementById("toggleThemeBtn")!.onclick = toggleTheme;
    applyTheme(getInitialTheme());

    await Api.fetchStrings();

    renderCurrentPage();

    initStaticText();
    initCardClick();

    const footerLinks = document.getElementById("footerRight")!;

    if (footerLinks) {
        addFooterLink(footerLinks, LINKS.telegram, readableUrl(LINKS.telegram));
        addFooterLink(footerLinks, LINKS.discord, t("footer.discord"));
        addFooterLink(footerLinks, LINKS.github, t("footer.github"));
    }

    document.addEventListener("click", async event => {
        const link = (event.target as HTMLElement).closest<HTMLAnchorElement>("a[data-navigation]");

        if (!link) return;

        event.preventDefault();

        history.pushState(null, "", link.href);

        await renderCurrentPage();
        updateNav();
    });

    window.addEventListener("popstate", async () => {
        await renderCurrentPage();
        updateNav();
    });
}

async function renderCurrentPage(): Promise<void> {
    const route = maps.find(route => `${import.meta.env.BASE_URL}${route.path}` === window.location.pathname);

    if (!route) {
        renderBase();
        return;
    }

    document.getElementById("controls")!.innerHTML = "";
    const footer = document.getElementById("footerLeft");

    if (footer) {
        const mainText = document.getElementById("footerMainText");

        Array.from(footer.children).forEach(child => {
            if (child !== mainText) {
                child.remove();
            }
        });
    }

    await route.render();
}

await init();
