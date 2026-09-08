import { Api } from "../api";

export function t(key: string, ...args: (string | number)[]): string {
    var loc = Api.strings[key];
    if (loc === undefined) console.warn("missing: " + key);
    const text = loc ?? key;
    if (args.length === 0) return text;

    return text.replace(/{(\d+)}/g, (match, number) => {
        const index = parseInt(number);
        return args[index] !== undefined ? String(args[index]) : match;
    });
}

export function initStaticText(): void {
    document.querySelectorAll<HTMLElement>("[data-i18n]").forEach(element => {
        const key = element.dataset.i18n!;
        element.textContent = t(key);
    });

    document.querySelectorAll<HTMLElement>("[data-i18n-html]").forEach(element => {
        const key = element.dataset.i18nHtml!;
        element.innerHTML = t(key);
    });
}
