
function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function makePlayerCard(item) {
  const card = document.createElement("article");
  card.className = "player-card player-card-v167";

  const number = esc(item.number ?? "—");
  const name = esc(item.name || "氏名準備中");
  const nameKana = esc(item.nameKana || "");
  const grade = esc(item.grade || "");
  const position = esc(item.position || "—");
  const foot = esc(item.dominantFoot || "");
  const profile = esc(item.profile || item.message || "");
  const photo = String(item.photo || "").trim();
  const photoPosition = esc(item.photoPosition || "center 35%");
  const photoFit = esc(item.photoFit || "cover");
  const captain = item.captain === true;

  const media = photo
    ? `<div class="player-photo player-photo-v167">
         <img src="${esc(photo)}?v=1.6.8" alt="${name}" loading="lazy"
              style="object-position:${photoPosition};object-fit:${photoFit}"
              onerror="this.closest('.player-photo').classList.add('photo-error');this.remove();">
         <div class="player-photo-overlay"></div>
         <span class="player-photo-number">${number}</span>
         ${captain ? `<span class="captain-badge">CAPTAIN</span>` : ""}
       </div>`
    : `<div class="player-placeholder player-placeholder-v167">
         <span class="player-placeholder-number">${number}</span>
         <span class="player-placeholder-text">PHOTO</span>
         ${captain ? `<span class="captain-badge">CAPTAIN</span>` : ""}
       </div>`;

  card.innerHTML = `
    ${media}
    <div class="player-card-body player-card-body-v167">
      <div class="player-mainline">
        <div>
          <div class="player-number">#${number}</div>
          <h3>${name}</h3>
          ${nameKana ? `<p class="player-kana">${nameKana}</p>` : ""}
        </div>
        ${grade ? `<span class="player-grade">${grade}</span>` : ""}
      </div>

      <div class="player-tags">
        <span class="player-position">${position}</span>
        ${foot ? `<span class="player-foot">${foot}利き</span>` : ""}
      </div>

      ${profile ? `<p class="player-profile">${profile}</p>` : ""}
    </div>
  `;
  return card;
}

function renderCategory(root, category, players) {
  const members = players
    .filter(p => p.category === category.id)
    .sort((a, b) => Number(a.number || 999) - Number(b.number || 999));

  const section = document.createElement("section");
  section.className = "player-category-section";
  section.dataset.category = category.id;

  section.innerHTML = `
    <div class="player-category-heading">
      <div>
        <span class="eyebrow">${esc(category.id)}</span>
        <h2>${esc(category.label)}</h2>
        <p>${esc(category.grade || "")}</p>
      </div>
      <span class="staff-count">${members.length}名</span>
    </div>
    <div class="player-grid player-grid-v167"></div>
  `;

  const grid = section.querySelector(".player-grid");
  if (!members.length) {
    grid.innerHTML = `<div class="empty-state"><b>現在、公開中の選手登録はありません</b></div>`;
  } else {
    grid.dataset.count = String(members.length);
    if (members.length === 1) grid.classList.add("player-grid-count-1");
    else if (members.length === 2) grid.classList.add("player-grid-count-2");
    else if (members.length === 3) grid.classList.add("player-grid-count-3");
    else grid.classList.add("player-grid-count-many");

    members.forEach(item => grid.appendChild(makePlayerCard(item)));
  }

  root.appendChild(section);
}

async function loadPlayers() {
  const root = document.querySelector("#playerGroups");
  const tabs = document.querySelector("#playerTabs");
  const year = document.querySelector("#playerYear");
  const updated = document.querySelector("#playerUpdated");

  try {
    const res = await fetch("data/players.json?v=1.6.8", { cache: "no-store" });
    if (!res.ok) throw new Error("players.json load failed");

    const data = await res.json();

    if (year) year.textContent = `${data.year || "—"}年度`;
    if (updated) updated.textContent = data.updated ? `最終更新：${data.updated}` : "";

    const categories = data.categories || [];
    const players = (data.players || []).filter(p => p.isPublished !== false);

    root.innerHTML = "";
    tabs.innerHTML = "";

    categories.forEach((category, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "player-tab";
      btn.textContent = category.label;
      btn.dataset.target = category.id;
      if (index === 0) btn.classList.add("active");
      tabs.appendChild(btn);

      renderCategory(root, category, players);
    });

    const sections = [...root.querySelectorAll(".player-category-section")];
    sections.forEach((section, index) => section.hidden = index !== 0);

    tabs.addEventListener("click", e => {
      const btn = e.target.closest(".player-tab");
      if (!btn) return;

      tabs.querySelectorAll(".player-tab").forEach(x => x.classList.remove("active"));
      btn.classList.add("active");

      sections.forEach(section => {
        section.hidden = section.dataset.category !== btn.dataset.target;
      });
    });

  } catch (e) {
    root.innerHTML = `<div class="empty-state"><b>選手情報を読み込めませんでした</b><p>data/players.json を確認してください。</p></div>`;
  }
}

loadPlayers();
