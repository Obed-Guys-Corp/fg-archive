import { getCookie, setCookie } from "../utils/cookie";

export type Theme = "dark" | "light";
const THEME_COOKIE = "theme";

export function getInitialTheme(): Theme {
    const saved = getCookie(THEME_COOKIE);
    if (saved === "dark" || saved === "light") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(theme: Theme): void {
    document.documentElement.setAttribute("data-bs-theme", theme);
    setCookie(THEME_COOKIE, theme);
    refreshLook(theme);
}

export function toggleTheme(): void {
    const current = document.documentElement.getAttribute("data-bs-theme");
    applyTheme(current === "dark" ? "light" : "dark");
}

function refreshLook(theme: Theme): void {
    const navbar = document.getElementById("mainNavbar")!;
    const footer = document.getElementById("footerInfo")!;
    const themeIcon = document.getElementById("themeIcon")!;
    const toggleBtn = document.getElementById("toggleThemeBtn")!;

    if (theme === "dark") {
        navbar.classList.add("navbar-dark");
        navbar.style.backgroundColor = "#343a40";
        footer.style.backgroundColor = "#343a40";
        footer.style.color = "#ccc";
    } else {
        navbar.classList.remove("navbar-dark");
        navbar.style.backgroundColor = "#dee2e6";
        footer.style.backgroundColor = "#dee2e6";
        footer.style.color = "#000";
    }
    themeIcon.className = theme === "dark" ? "bi bi-moon" : "bi bi-sun";
    toggleBtn.classList.remove("btn-outline-light", "btn-outline-dark");
    toggleBtn.classList.add(theme === "dark" ? "btn-outline-light" : "btn-outline-dark");
}
