import { Api } from "../api";

/** Resolves key and replaces {0}, {1} placeholders with provided arguments */
export function t(key: string, ...args: (string | number)[]): string {
    const text = Api.strings[key] ?? key;
    if (args.length === 0) return text;

    return text.replace(/{(\d+)}/g, (match, number) => {
        const index = parseInt(number);
        return args[index] !== undefined ? String(args[index]) : match;
    });
}

/** Replaces `[data-i18n]` and `[data-i18n-html]` with localised strings */
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
