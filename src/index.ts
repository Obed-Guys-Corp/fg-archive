import { Api } from "./api";
import { initStaticText, t } from "./i18n/i18n";
import { renderTabContent } from "./ui/cards";
import { initCardClick } from "./ui/modal";
import { renderFilter, renderTabs } from "./ui/tabs";
import { applyTheme, getInitialTheme, toggleTheme } from "./ui/theme";
import type { AppState, BuildType } from "./types";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "../css/styles.css";
import { LINKS } from "./constants/links";
import { addFooterLink } from "./utils/footer";
import { readableUrl } from "./utils/string";
import * as bootstrap from 'bootstrap';

const state: AppState = {
    currentType: null,
    currentSeason: ""
};

async function init(): Promise<void> {
    // Init theme
    document.getElementById("toggleThemeBtn")!.onclick = toggleTheme;
    applyTheme(getInitialTheme());

    // Init help modal
    document.getElementById("helpModal")!.addEventListener("click", e => {
        e.preventDefault();
        new bootstrap.Modal(document.getElementById("modal_help")!).show();
    });

    initCardClick();

    try {
        // Fetch data
        await Promise.all([Api.fetchBuilds(), Api.fetchStrings()]);
    } catch (err) {
        document.getElementById("typeTabContent")!.innerHTML = `<div class="alert alert-danger">Failed to download assets!<br><br>${err}</div>`;
        return;
    }

    // I18n
    initStaticText();

    const footerLinks = document.getElementById("footerRight")!;
    const helpModal = document.getElementById("helpModal")!;

    if (footerLinks && helpModal) {
        addFooterLink(footerLinks, helpModal, LINKS.telegram, readableUrl(LINKS.telegram));
        addFooterLink(footerLinks, helpModal, LINKS.discord, t("footer.discord"));
        addFooterLink(footerLinks, helpModal, LINKS.github, t("footer.github"));
    }

    renderTabs(state);

    const firstBtn = document.querySelector<HTMLButtonElement>("#typeTabs button[data-type]");
    if (firstBtn?.dataset.type) {
        const firstType = firstBtn.dataset.type as BuildType;
        renderFilter(state, firstType);
        renderTabContent(state, firstType, state.currentSeason);
    }
}

await init();
