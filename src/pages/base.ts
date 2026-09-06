export function renderBase(): void {
    const app = document.getElementById("app");

    if (!app) return;

    app.innerHTML = `
        <div class="container py-5">
            <div class="text-center">
                <h1 class="titan-one-font">Fall Guys: Builds Archive 1</h1>
            </div>
        </div>
    `;
}
