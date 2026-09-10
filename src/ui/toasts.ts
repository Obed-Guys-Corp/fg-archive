import Toast from "bootstrap/js/dist/toast";

export function showToast(toastId: string, title: string, msg: string, length = 5): void {
    const tid = `${toastId}-toast`;

    const toastEl = document.getElementById(tid);
    if (!toastEl) return;

    const titleEl = toastEl.querySelector(".me-auto");
    const body = toastEl.querySelector(".toast-body");

    if (titleEl) titleEl.textContent = title;
    if (body) body.textContent = msg;

    const toast = Toast.getOrCreateInstance(toastEl, {
        autohide: true,
        delay: length * 1000
    });

    toast.show();
}
