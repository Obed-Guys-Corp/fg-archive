let data = [];
let strings = {};
let currentType = null;
let currentSeason = "";

const typeTabs = document.getElementById("typeTabs");
const tabContent = document.getElementById("typeTabContent");
const filter = document.getElementById("seasonFilter");
const footerInfo = document.getElementById("footerInfo");
const toggleBtn = document.getElementById("toggleThemeBtn");
const themeIcon = document.getElementById("themeIcon");
const footer = document.getElementById("footerInfo");
const navbar = document.getElementById("mainNavbar");

Promise.all([
  fetch("./content/beta.json?v1").then((res) => res.text()),
  fetch("./content/steam.json?v1").then((res) => res.text()),
  fetch("./content/epic.json?v1").then((res) => res.text()),
  fetch("./content/android.json?v1").then((res) => res.text()),
  fetch("./content/strings.json?v1").then((res) => res.json()),
])
  .then(([beta, steam, epic, android, str]) => {
    const reviver = (key, value) => {
      if (key === "Manifest" && typeof value === "number") {
        return value.toString();
      }
      return value;
    };
    data = [
      ...JSON.parse(beta, reviver),
      ...JSON.parse(steam, reviver),
      ...JSON.parse(epic, reviver),
      ...JSON.parse(android, reviver),
    ];
    str.forEach((entry) => {
      Object.assign(strings, entry);
    });
    boot();
  })
  .catch((err) => {
    document.getElementById("typeTabContent").innerHTML =
      `<div class="alert alert-danger">Unable to load content.<br><br>${err}</div>`;
  });
toggleBtn.onclick = () => {
  updateTheme(document.documentElement.getAttribute("data-bs-theme") === "dark" ? "light" : "dark");
};
document.getElementById("helpModal").addEventListener("click", (e) => {
  e.preventDefault();
  const modal = new bootstrap.Modal(document.getElementById("modal_help"));
  modal.show();
});

function localizedStr(seasonKey) {
  if (strings[seasonKey]) return strings[seasonKey] || seasonKey;
  else return "Unknown";
}

function renderFilter(selectedType) {
  currentType = selectedType;
  currentSeason = "";
  filter.innerHTML = "";
  const allOption = document.createElement("option");
  allOption.value = "";
  allOption.textContent = "All";
  filter.appendChild(allOption);
  const seasons = new Set();
  data.forEach((item) => {
    if (item.Type === selectedType && item.Data && item.Data.Season) {
      seasons.add(item.Data.Season);
    }
  });
  Array.from(seasons)
    .sort()
    .forEach((season) => {
      const option = document.createElement("option");
      option.value = season;
      option.textContent = localizedStr(season);
      filter.appendChild(option);
    });
  filter.value = "";
  filter.onchange = () => {
    currentSeason = filter.value;
    renderTabContent(currentType, currentSeason);
  };
}

function renderTabs() {
  typeTabs.innerHTML = "";
  const typeGroups = {};
  data.forEach((item) => {
    const type = item.Type || "unknown";
    if (!typeGroups[type]) typeGroups[type] = [];
    typeGroups[type].push(item);
  });
  let first = true;
  Object.keys(typeGroups).forEach((type) => {
    const tabId = `tab-${type}`;
    const tabButton = document.createElement("li");
    tabButton.className = "nav-item";
    tabButton.innerHTML = `<button class="nav-link${first ? " active" : ""}" id="${tabId}-tab" data-bs-toggle="tab" data-bs-target="#${tabId}" type="button" role="tab" aria-controls="${tabId}" aria-selected="${first}" data-type="${type}">${localizedStr(type) || type}</button>`;
    typeTabs.appendChild(tabButton);
    first = false;
  });
  typeTabs.onclick = (e) => {
    if (e.target.tagName === "BUTTON" && e.target.dataset.type) {
      const selectedType = e.target.dataset.type;
      if (selectedType !== currentType) {
        currentType = selectedType;
        currentSeason = "";
        filter.value = "";
        renderFilter(currentType);
        renderTabContent(currentType, currentSeason);
        const buttons = typeTabs.querySelectorAll("button");
        buttons.forEach((btn) => btn.classList.toggle("active", btn === e.target));
      }
    }
  };
}

function renderTabContent(selectedType, selectedSeason) {
  tabContent.innerHTML = "";
  if (!selectedType) return;
  const fRes = data.filter((item) => item.Type === selectedType);
  const res = selectedSeason ? fRes.filter((item) => item.Data.Season === selectedSeason) : fRes;
  const seasonElems = {};
  res.forEach((item) => {
    const season = item.Data.Season || "";
    if (!seasonElems[season]) seasonElems[season] = [];
    seasonElems[season].push(item);
  });
  Object.keys(seasonElems).forEach((season) => {
    const header = document.createElement("div");
    header.className = "col-12 mt-4 mb-2";
    // header.innerHTML = `<h4>${localizedStr(season)} (${seasonElems[season].length})</h4>`;
    const count = seasonElems[season].length;
    headerText = `${localizedStr(`${season}_title`)} (${count})`;
    header.innerHTML = `<h4>${headerText}</h4>`;
    tabContent.appendChild(header);
    const row = document.createElement("div");
    row.className = "row";
    seasonElems[season].forEach((item) => {
      const idx = data.indexOf(item);
      const downloads = item.Downloads || [];
      const hasDownloads = downloads.length > 0;
      const dontShipBadge = item.Data.HasDontShipFolder
        ? `<span class="badge rounded-pill" 
                    style="background-color: #6f42c1; color: white; font-size: 0.8em; vertical-align: middle;">
                            Has Mono Sources
                    </span>`
        : "";
      const badgeContainer = dontShipBadge
        ? `<div class="mt-1 text-end">${dontShipBadge}</div>`
        : "";
      const sizeDisplay = downloads
        .map((dl, i) => {
          const segments = dl.Segments || [];
          const totalSize = segments.reduce((sum, seg) => sum + parseFloat(seg.Size || 0), 0);
          const count = segments.length;
          return `[${i + 1}] ${(totalSize / 1024).toFixed(2)} GB (${count})`;
        })
        .join(" – ");
      const manifestDisplay =
        item.Type === "android_build" || item.Type === "egs_build" ? "" : item.Manifest;
      const card = document.createElement("div");
      card.className = "col-md-4 mb-3";
      card.innerHTML = `
    <div class="card position-relative p-3 ${!hasDownloads ? "border border-danger" : ""}"
         data-index="${idx}"
         data-bs-toggle="modal"
         data-bs-target="#modal_build_info">

      <div class="position-absolute top-0 end-0 mt-2 me-2 text-muted small">
        ${item.Data.AppVer || ""}
      </div>

      <h5 style="padding-right: 6rem;">
        ${localizedStr(season)} — ${new Date(item.Date).toLocaleDateString()}
      </h5>

      <small class="text-muted d-flex justify-content-between">
        <span>${manifestDisplay}</span>
        ${sizeDisplay ? `<span>${sizeDisplay}</span>` : ""}
      </small>
        ${badgeContainer}
    </div>
  `;
      row.appendChild(card);
    });
    tabContent.appendChild(row);
  });
  setFooter();
}

function boot() {
  updateTheme(theme);
  renderTabs();
  if (typeTabs.firstElementChild) {
    const firstBtn = typeTabs.querySelector("button");
    currentType = firstBtn?.dataset.type || null;
    renderFilter(currentType);
    renderTabContent(currentType, "");
  }
}

function setFooter() {
  const typed = currentType ? data.filter((item) => item.Type === currentType) : data;
    const availableCount = typed.filter(
    (item) =>
      Array.isArray(item.Downloads) &&
      item.Downloads.length > 0 &&
      item.Downloads[0].Link?.trim()
  ).length;
  const calcTotalSize = (items) => {
    let sizeMB = 0;
    items.forEach((item) => {
      if (Array.isArray(item.Downloads) && item.Downloads.length > 0) {
        const download = item.Downloads[0];
        if (Array.isArray(download.Segments)) {
          download.Segments.forEach((seg) => {
            sizeMB += parseFloat(seg.Size || 0);
          });
        }
      }
    });
    return sizeMB;
  };

  const globalSizeMB = (calcTotalSize(data) / 1024).toFixed(2);
  const currentSizeMB = (calcTotalSize(typed) / 1024).toFixed(2);
  const typeLabel = currentType ? localizedStr(currentType) : "All Types";

  document.getElementById("footerCounts").textContent = 
    `Total: ${data.length} - Total size: ${globalSizeMB} GB | ${typeLabel}: ${typed.length} - Available: ${availableCount} - Size: ${currentSizeMB} GB`;

  document.getElementById("footerNotes").textContent =
    "Red-marked builds are lost media or haven't been uploaded yet. Note: some seasons might be set incorrectly.";
}

document.addEventListener("click", function (e) {
  const card = e.target.closest(".card");
  if (!card) return;
  const item = data[card.dataset.index];
  const season = localizedStr(item.Data.Season);
  const isEGS = item.Type === "android_build" || item.Type === "egs_build";
  const manifestLine = isEGS
    ? ""
    : `<li class="list-group-item">Manifest: ${!item.Manifest ? "Unknown" : item.Manifest}</li>`;
  let dateValue = "Unknown";
  if (item.Date) {
    dateValue = isEGS
      ? new Date(item.Date).toLocaleDateString()
      : new Date(item.Date).toLocaleString();
  }
  const dateLabel = isEGS ? "Release Date" : "Steam Publish Date";
  document.getElementById("modalData").innerHTML = `
        <h6 class="mb-2">Build Details</h6>
        <ul class="list-group">
          ${manifestLine}
          <li class="list-group-item">${dateLabel}: ${dateValue}</li>
          <li class="list-group-item">App Version: ${!item.Data.AppVer ? "Unknown" : item.Data.AppVer}</li>
          <li class="list-group-item">Build #${item.Data.BuildNo === 0 ? "?" : item.Data.BuildNo}</li>
          <li class="list-group-item">Commit: ${!item.Data.BuildCommit ? "Unknown" : item.Data.BuildCommit}</li>
          <li class="list-group-item">BuildDate: ${!item.Data.BuildDate ? "Unknown" : item.Data.BuildDate}</li>
          <li class="list-group-item">Unity Version: ${!item.Data.UnityVersion ? "Unknown" : item.Data.UnityVersion}</li>
          <li class="list-group-item">Scenes: ${item.Data.SceneCount === 0 ? "?" : item.Data.SceneCount}</li>
          <li class="list-group-item">Season: ${!season ? "Unknown" : season}</li>
        </ul>`;
  const modalData = document.getElementById("modalData");
  const modalSegments = document.getElementById("modalSegments");
  const allSegments = (item.Downloads || [])
    .flatMap((download) =>
      (download.Segments || []).map((seg, i) => ({
        source: download.Source || "Unknown",
        index: i + 1,
        sizeGB: (parseFloat(seg.Size || 0) / 1024).toFixed(2),
      }))
    )
    .filter((seg) => seg.sizeGB > 0);
  if (allSegments.length > 0) {
    modalSegments.style.display = "block";
    modalSegments.className = "col-md-6";
    const segmentsBySource = {};
    allSegments.forEach((seg) => {
      if (!segmentsBySource[seg.source]) segmentsBySource[seg.source] = [];
      segmentsBySource[seg.source].push(seg);
    });
    modalSegments.innerHTML = Object.entries(segmentsBySource)
      .map(([source, segments], i) => {
        return `
    <div class="mb-4 ${i === 0 ? "mt-3" : ""}">
      <h6 class="mb-2">Segments – ${source.charAt(0).toUpperCase() + source.slice(1)}</h6>
      ${segments
        .map(
          (seg) => `
        <div class="alert alert-info p-2 mb-2 w-100" style="text-align: left;">
          Segment ${seg.index}: ${seg.sizeGB} GB
        </div>
      `
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
  const modalFooter = document.getElementById("modalFooter");
  modalFooter.innerHTML = "";
  if (Array.isArray(item.Downloads)) {
    item.Downloads.forEach((download, index) => {
      if (download.Link && download.Link.trim() !== "") {
        const btn = document.createElement("a");
        btn.href = download.Link;
        btn.target = "_blank";
        btn.className = "btn btn-primary me-2";
        const source = download.Source || "Link";
        btn.textContent = `Download in ${source.charAt(0).toUpperCase() + source.slice(1)}`;
        modalFooter.appendChild(btn);
      }
    });
  }
  if (item.Manifest) {
    const steamBtn = document.createElement("a");
    if (item.Type === "beta_build")
      steamBtn.href = `https://steamdb.info/depot/1265941/history/?changeid=M:${item.Manifest}`;
    else steamBtn.href = `https://steamdb.info/depot/1097151/history/?changeid=M:${item.Manifest}`;
    steamBtn.target = "_blank";
    steamBtn.className = "btn btn-secondary";
    steamBtn.textContent = "View on SteamDB";
    modalFooter.appendChild(steamBtn);
  }
});
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
const theme = getCookie("theme") || (prefersDark ? "dark" : "light");
document.documentElement.setAttribute("data-bs-theme", theme);

function setCookie(name, value, days = 365) {
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value}; expires=${d.toUTCString()}; path=/`;
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  return parts.length === 2 ? parts.pop().split(";").shift() : null;
}

function updateTheme(theme) {
  document.documentElement.setAttribute("data-bs-theme", theme);
  setCookie("theme", theme);
  refreshLook(theme);
}

function refreshLook(theme) {
  const navbar = document.getElementById("mainNavbar");
  const footer = document.getElementById("footerInfo");
  const themeIcon = document.getElementById("themeIcon");
  if (theme === "dark") {
    navbar.classList.add("navbar-dark");
    navbar.style.backgroundColor = "#343a40";
    footer.style.backgroundColor = "#343a40";
    footer.style.color = "#ccc";
  } else {
    navbar.classList.remove("navbar-dark");
    navbar.style.backgroundColor = "#dee2e6";
    footer.style.backgroundColor = "#dee2e6";
    footer.style.color = "#000";
  }
  themeIcon.className = theme === "dark" ? "bi bi-moon" : "bi bi-sun";
  toggleBtn.classList.remove("btn-outline-light", "btn-outline-dark");
  toggleBtn.classList.add(theme === "dark" ? "btn-outline-light" : "btn-outline-dark");
}
