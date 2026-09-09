export function createAlert(container: HTMLElement, style: string, title: string, desc: string) {
    const div = document.createElement("div");
    div.className = `alert ${style} alert-dismissible fade show`;
    div.role = "alert";

    if (title) {
        const h5 = document.createElement("h5");
        h5.className = "alert-heading";
        h5.textContent = title;
        div.appendChild(h5);
    }

    if (desc) {
        const p = document.createElement("p");
        p.className = "mb-0";
        p.innerHTML = desc;
        div.appendChild(p);
    }

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn-close";
    btn.setAttribute("data-bs-dismiss", "alert");
    btn.setAttribute("aria-label", "Close");

    div.appendChild(btn);
    container.appendChild(div);
}