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

declare const COMMIT: string;
declare const BUILD_DATE: string;

async function init(): Promise<void> {
    // Init theme
    document.getElementById("toggleThemeBtn")!.onclick = toggleTheme;
    applyTheme(getInitialTheme());

    await Api.fetchStrings();

    initNavbar();

    await renderCurrentPage();

    initStaticText();
    initCardClick();

    const verText = document.getElementById("footerMainText")!;
    if (verText)
        verText.innerHTML = `${t("footer.poweredBy")} | <a class="text-reset font-monospace" target="_blank" href=${LINKS.github}/commit/${COMMIT}>#${COMMIT.substring(0, 8)}</a>, ${new Date(BUILD_DATE).toLocaleDateString()}`

    const footerLinks = document.getElementById("footerLinks")!;

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

        updateNav();
        await renderCurrentPage();
    });

    window.addEventListener("popstate", async () => {
        updateNav();
        await renderCurrentPage();
    });

    document.documentElement.classList.add("fga-show");
}

async function renderCurrentPage(): Promise<void> {
    const route = maps.find(route => `${import.meta.env.BASE_URL}${route.path}` === window.location.pathname);

    if (!route) {
        history.replaceState(null, "", import.meta.env.BASE_URL);
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
