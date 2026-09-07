import { t } from "../i18n/i18n";

export function capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

export function readableUrl(url: string): string {
    return url.replace(/^https?:\/\/(www\.)?/, "");
}

export function calcDateStr(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();

    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return t("now");

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return t(minutes === 1 ? "minAgo" : "minsAgo", minutes);

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t(hours === 1 ? "hourAgo" : "hoursAgo", hours);

    const days = Math.floor(hours / 24);
    if (days < 30) return t(days === 1 ? "dayAgo" : "daysAgo", days);

    const months = Math.floor(days / 30);
    if (months < 12) return t(months === 1 ? "monthAgo" : "monthsAgo", months);

    const years = Math.floor(months / 12);

    return t(years === 1 ? "yearAgo" : "yearsAgo", years);
}

export function timeDiff(timestamp: number): string {
    const diff = Math.abs(Date.now() - timestamp * 1000);

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (years > 0) return t(years === 1 ? "year" : "years", years);
    if (months > 0) return t(months === 1 ? "month" : "months", months);
    if (days > 0) return t(days === 1 ? "day" : "days", days);
    if (hours > 0) return t(hours === 1 ? "hour" : "hours", hours);
    if (minutes > 0) return t(minutes === 1 ? "minute" : "minutes", minutes);

    return t(seconds === 1 ? "second" : "seconds", seconds);
}
