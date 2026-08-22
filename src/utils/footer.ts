export function addFooterLink(container: HTMLElement, last: HTMLElement, href: string, txt: string) {
    const link = document.createElement("a");

    link.href = href;
    link.className = "small text-decoration-underline";
    link.textContent = txt;

    container.insertBefore(link, last);
}
