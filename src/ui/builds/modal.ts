import { Api } from "../../api";
import { t } from "../../i18n/i18n";
import { capitalize } from "../../utils/string";
import { isSteam } from "../../utils/stats";
import type { AnyBuild, Build, BuildType, SteamProperties } from "../../types";
import * as bootstrap from "bootstrap";
import { sourceIcons, sourceLocales } from "./source-maps";
import { createAlert } from "../alerts";
import { LINKS } from "../../constants/links";

export function initCardClick(): void {
    document.addEventListener("click", e => {
        const card = (e.target as HTMLElement).closest<HTMLElement>(".card");
        if (!card) return;

        const type = card.dataset.type as BuildType | undefined;
        const index = Number(card.dataset.index);

        if (!type || !Number.isInteger(index)) return;

        const item = Api.builds[type][index];
        if (!item) return;

        showBuildModal(item, type);
    });
}

export function showBuildModal(item: Build, type: BuildType): void {
    const season = t(item.properties.season);
    const steam = isSteam(type);
    const steamManifest = isSteam(type) ? ((item.properties as SteamProperties).manifest ?? "") : "";
    const manifestLine = steam ? "" : `<li class="list-group-item">${t("modal.field", t("modal.manifest"), steamManifest || t("modal.unknown"))}</li>`;

    const modalData = document.getElementById("modalData")!;
    const modalSegments = document.getElementById("modalSegments")!;
    const modalFooter = document.getElementById("modalFooter")!;

    const relDate = item.release_date
        ? !steam
            ? new Date(item.release_date).toLocaleDateString()
            : new Date(item.release_date).toLocaleString()
        : t("modal.unknown");

    modalData.innerHTML = `
        <h6 class="mb-2">${t("modal.buildDetails")}</h6>
        <ul class="list-group">
          ${manifestLine}
          <li class="list-group-item">${t("modal.field", t("modal.releaseDate"), relDate)}</li>
          <li class="list-group-item">${t("modal.field", t("modal.appVersion"), item.properties.version || t("modal.unknown"))}</li>
          <li class="list-group-item">${t("modal.field", t("modal.buildNo"), item.properties.build_number === 0 ? "?" : (item.properties.build_number ?? "?"))}</li>
          <li class="list-group-item">${t("modal.field", t("modal.commit"), item.properties.build_commit || t("modal.unknown"))}</li>
          <li class="list-group-item">${t("modal.field", t("modal.buildDate"), item.properties.build_date || t("modal.unknown"))}</li>
          <li class="list-group-item">${t("modal.field", t("modal.unityVersion"), item.properties.unity_version || t("modal.unknown"))}</li>
          <li class="list-group-item">${t("modal.field", t("modal.env"), item.properties.env || t("modal.unknown"))}</li>
          <li class="list-group-item text-break">${t("modal.field", t("modal.signature"), item.properties.signature || t("modal.unknown"))}</li>
          <li class="list-group-item">${t("modal.field", t("modal.season"), season || t("modal.unknown"))}</li>
        </ul>`;

    const available = item.downloads?.available ?? [];
    const allSegments = available
        .flatMap(download =>
            (download.segments ?? [{ size: item.downloads!.total_size }]).map((seg, i) => ({
                source: download.source,
                index: i + 1,
                sizeGB: seg.size / 1024
            }))
        )
        .filter(seg => seg.sizeGB > 0);

    const showAlert = available.length === 1 && available[0]!.source === "telegram" && available[0]!.segments === null;

    if (showAlert) {
        const modalAlerts = document.getElementById("modal-alerts")!;
        createAlert(
            modalAlerts,
            "alert-info",
            "",
            t("modal.tgAlert.0", `<a href="${LINKS.tgDownloader}" target="_blank" class="alert-link">${t(`modal.tgAlert.1`)}</a>`)
        );
    }

    if (allSegments.length > 0) {
        modalSegments.style.display = "block";
        modalSegments.className = "col-md-4";
        const segmentsBySource = new Map<string, typeof allSegments>();
        for (const seg of allSegments) {
            segmentsBySource.set(seg.source, [...(segmentsBySource.get(seg.source) ?? []), seg]);
        }
        modalSegments.innerHTML = [...segmentsBySource.entries()]
            .map(([source, segments], i) => {
                return `
                    <div class="mb-4 ${i === 0 ? "mt-3" : ""}">
                      <h6 class="mb-2">${t(segments.length !== 1 ? "modal.segmentsTitle" : "modal.fileTitle", t(source))}</h6>
                      ${segments
                        .map(
                            seg =>
                                `<div class="alert alert-info p-2 mb-2 w-100" style="text-align: left;">
                                    ${segments.length !== 1 ? t("modal.segment", seg.index, seg.sizeGB.toFixed(2)) : t("gbFiller", seg.sizeGB.toFixed(2))}</div>`
                        )
                        .join("")}
                    </div>
                `;
            })
            .join("");
        modalData.className = "col-md-8";
    } else {
        modalSegments.style.display = "none";
        modalSegments.className = "";
        modalSegments.innerHTML = "";
        modalData.className = "col-12";
    }

    modalFooter.innerHTML = "";
    for (const download of item.downloads?.available ?? []) {
        if (download.link.trim() !== "") {
            const btn = document.createElement("a");
            btn.href = download.link;
            btn.target = "_blank";
            btn.className = "btn btn-primary me-2";
            const source = download.source;
            const icon = sourceIcons.get(source);
            btn.innerHTML = `${icon !== undefined ? `<i class="${icon}"></i>` : ""} ${t(sourceLocales.get(source) ?? "modal.downloadIn", t(source))}`;
            modalFooter.appendChild(btn);
        }

    }

    if (steam && steamManifest) {
        const steamBtn = document.createElement("a");
        steamBtn.href = `https://steamdb.info/depot/${type === "steam_beta" ? 1265941 : 1097151}/history/?changeid=M:${steamManifest}`;
        steamBtn.target = "_blank";
        steamBtn.className = "btn btn-secondary";
        steamBtn.textContent = t("modal.viewSteamDB");
        modalFooter.appendChild(steamBtn);
    }

    const shareBtn = document.createElement("button");
    shareBtn.className = "btn btn-secondary me-2 share";
    shareBtn.innerHTML = `<i class="bi bi-share"></i>`;
    shareBtn.dataset.build = item.id;
    shareBtn.addEventListener("click", () => {
        const url = new URL(window.location.href);
        url.hash = item.id;
        navigator.clipboard.writeText(url.toString());

        shareBtn.classList.remove("btn-secondary");
        shareBtn.classList.add("btn-success");

        setTimeout(() => {
            shareBtn.classList.add("btn-secondary");
            shareBtn.classList.remove("btn-success");
        }, 350);
    });

    modalFooter.appendChild(shareBtn);

    new bootstrap.Modal(document.getElementById("modal_build_info")!).show();
}
