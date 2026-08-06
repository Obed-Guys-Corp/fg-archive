import { Api } from "../api";
import { t } from "../i18n/i18n";
import { capitalize } from "../utils/string";
import { isEGS } from "../utils/stats";
import type { Build } from "../types";

const modalData = document.getElementById("modalData")!;
const modalSegments = document.getElementById("modalSegments")!;
const modalFooter = document.getElementById("modalFooter")!;

export function initCardClick(): void {
    document.addEventListener("click", e => {
        const card = (e.target as HTMLElement).closest<HTMLElement>(".card");
        const idx = card?.dataset.index;
        if (!idx) return;
        const item = Api.builds[Number(idx)];
        if (!item) return;
        showBuildModal(item);
        new bootstrap.Modal(document.getElementById("modal_build_info")!).show();
    });
}

function showBuildModal(item: Build): void {
    const season = t(item.Data.Season);
    const egs = isEGS(item);
    const manifestLine = egs ? "" : `<li class="list-group-item">${t("modal.field", t("modal.manifest"), item.Manifest || t("modal.unknown"))}</li>`;

    const dateValue = egs ? new Date(item.Date).toLocaleDateString() : new Date(item.Date).toLocaleString();
    const dateLabel = t("modal.releaseDate");

    modalData.innerHTML = `
        <h6 class="mb-2">${t("modal.buildDetails")}</h6>
        <ul class="list-group">
          ${manifestLine}
          <li class="list-group-item">${t("modal.field", dateLabel, dateValue)}</li>
          <li class="list-group-item">${t("modal.field", t("modal.appVersion"), item.Data.AppVer || t("modal.unknown"))}</li>
          <li class="list-group-item">${t("modal.field", t("modal.buildNo"), item.Data.BuildNo === 0 ? "?" : (item.Data.BuildNo ?? "?"))}</li>
          <li class="list-group-item">${t("modal.field", t("modal.commit"), item.Data.BuildCommit || t("modal.unknown"))}</li>
          <li class="list-group-item">${t("modal.field", t("modal.buildDate"), item.Data.BuildDate || t("modal.unknown"))}</li>
          <li class="list-group-item">${t("modal.field", t("modal.unityVersion"), item.Data.UnityVersion || t("modal.unknown"))}</li>
          <li class="list-group-item">${t("modal.field", t("modal.scenes"), item.Data.SceneCount === 0 ? "?" : (item.Data.SceneCount ?? "?"))}</li>
          <li class="list-group-item">${t("modal.field", t("modal.season"), season || t("modal.unknown"))}</li>
        </ul>`;

    const allSegments = (item.Downloads ?? [])
        .flatMap(download =>
            (download.Segments ?? []).map((seg, i) => ({
                source: download.Source,
                index: i + 1,
                sizeGB: seg.Size / 1024
            }))
        )
        .filter(seg => seg.sizeGB > 0);

    if (allSegments.length > 0) {
        modalSegments.style.display = "block";
        modalSegments.className = "col-md-6";
        const segmentsBySource = new Map<string, typeof allSegments>();
        for (const seg of allSegments) {
            segmentsBySource.set(seg.source, [...(segmentsBySource.get(seg.source) ?? []), seg]);
        }
        modalSegments.innerHTML = [...segmentsBySource.entries()]
            .map(([source, segments], i) => {
                const capitalized = capitalize(source);
                return `
                    <div class="mb-4 ${i === 0 ? "mt-3" : ""}">
                      <h6 class="mb-2">${t("modal.segmentsTitle", capitalized)}</h6>
                      ${segments
                          .map(
                              seg =>
                                  `<div class="alert alert-info p-2 mb-2 w-100" style="text-align: left;">${t("modal.segment", seg.index, seg.sizeGB.toFixed(2))}</div>`
                          )
                          .join("")}
                    </div>
                `;
            })
            .join("");
        modalData.className = "col-md-6";
    } else {
        modalSegments.style.display = "none";
        modalSegments.className = "";
        modalSegments.innerHTML = "";
        modalData.className = "col-12";
    }

    modalFooter.innerHTML = "";
    for (const download of item.Downloads ?? []) {
        if (download.Link.trim() !== "") {
            const btn = document.createElement("a");
            btn.href = download.Link;
            btn.target = "_blank";
            btn.className = "btn btn-primary me-2";
            const source = download.Source;
            btn.textContent = t("modal.downloadIn", capitalize(source));
            modalFooter.appendChild(btn);
        }
    }
    if (item.Manifest) {
        const steamBtn = document.createElement("a");
        steamBtn.href = `https://steamdb.info/depot/${item.Type === "beta_build" ? 1265941 : 1097151}/history/?changeid=M:${item.Manifest}`;
        steamBtn.target = "_blank";
        steamBtn.className = "btn btn-secondary";
        steamBtn.textContent = t("modal.viewSteamDB");
        modalFooter.appendChild(steamBtn);
    }
}
