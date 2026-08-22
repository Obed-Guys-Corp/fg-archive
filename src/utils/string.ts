export function capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

export function readableUrl(url: string): string {
    return url.replace(/^https?:\/\/(www\.)?/, "");
}
