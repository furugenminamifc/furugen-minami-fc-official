
function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function fallbackLabel(role) {
  if (/審判/.test(role || "")) return "REFEREE";
  return "COACH";
}

function makeCard(item) {
  const article = document.createElement("article");
  article.className = "staff-profile-card";

  const role = esc(item.role || "");
  const name = esc(item.name || "氏名準備中");
  const nameKana = esc(item.nameKana || "");
  const category = esc(item.category || "—");
  const license = esc(item.license || "—");
  const career = esc(item.career || "");
  const message = esc(item.message || "");
  const photo = String(item.photo || "").trim();
  const position = esc(item.photoPosition || "center center");
  const snsLabel = esc(item.snsLabel || "");
  const snsUrl = esc(item.snsUrl || "");

  const media = photo
    ? `<div class="staff-profile-photo">
         <img src="${esc(photo)}" alt="${name}" loading="lazy"
              style="object-position:${position}"
              onerror="this.closest('.staff-profile-photo').classList.add('photo-error');this.remove();">
       </div>`
    : `<div class="staff-profile-placeholder">${fallbackLabel(item.role)}</div>`;

  const sns = snsUrl
    ? `<a class="staff-sns" href="${snsUrl}" target="_blank" rel="noopener">${snsLabel || "SNS"} ↗</a>`
    : "";

  article.innerHTML = `
    ${media}
    <div class="staff-profile-body">
      <span class="staff-role">${role}</span>
      <h3>${name}</h3>
      ${nameKana ? `<p class="staff-kana">${nameKana}</p>` : ""}
      <dl class="staff-profile-meta">
        <div><dt>担当</dt><dd>${category}</dd></div>
        <div><dt>資格</dt><dd>${license}</dd></div>
        ${career ? `<div><dt>経歴</dt><dd>${career}</dd></div>` : ""}
      </dl>
      <p class="staff-message">${message}</p>
      ${sns}
    </div>
  `;
  return article;
}

function renderProfileGroup(root, group, staff) {
  const members = staff.filter(item => item.group === group.id);
  const section = document.createElement("section");
  section.className = "staff-group-section";

  section.innerHTML = `
    <div class="staff-group-heading">
      <div>
        <span class="eyebrow">${esc(group.id.toUpperCase())}</span>
        <h2>${esc(group.label)}</h2>
        <p>${esc(group.description || "")}</p>
      </div>
      <span class="staff-count">${members.length}名</span>
    </div>
    <div class="staff-profile-grid"></div>
  `;

  const grid = section.querySelector(".staff-profile-grid");
  if (!members.length) {
    grid.innerHTML = `<div class="empty-state"><b>現在、公開中の登録はありません</b></div>`;
  } else {
    members.forEach(item => grid.appendChild(makeCard(item)));
  }
  root.appendChild(section);
}

function renderTeamOperations(root, ops) {
  if (!ops) return;
  const section = document.createElement("section");
  section.className = "team-operations-section";
  section.innerHTML = `
    <div class="team-operations-heading">
      <span class="eyebrow">${esc(ops.eyebrow || "TEAM OPERATIONS")}</span>
      <h2>${esc(ops.title || "チーム運営")}</h2>
    </div>
    <div class="team-operations-card">
      <div class="team-operations-badge">PARENTS</div>
      <div class="team-operations-body">
        <h3>${esc(ops.name || "古堅南FC 保護者会")}</h3>
        <p class="team-operations-lead">${esc(ops.description || "")}</p>
        ${(ops.details || []).length ? `
          <ul class="team-operations-list">
            ${(ops.details || []).map(item => `<li>${esc(item)}</li>`).join("")}
          </ul>` : ""}
      </div>
    </div>
  `;
  root.appendChild(section);
}

async function loadStaff() {
  const root = document.querySelector("#staffGroups");
  const yearText = document.querySelector("#staffYear");
  const updateText = document.querySelector("#staffUpdated");

  try {
    let data;
    let sourceLabel = "JSON";

    if (window.FurugenPublicData?.configured()) {
      try {
        const supabaseStaff = await window.FurugenPublicData.loadStaff();
        data = {
          year: new Date().getFullYear(),
          updated: new Date().toISOString().slice(0,10),
          staff: supabaseStaff || [],
          teamOperations: {
            eyebrow: "TEAM OPERATIONS",
            title: "チーム運営",
            name: "古堅南FC 保護者会",
            description: "古堅南FCのチーム運営は、保護者会全員で協力して行っています。",
            details: [
              "大会・練習試合の運営サポート",
              "会場準備・片付け",
              "選手・チーム活動のサポート",
              "保護者会全員で協力したチーム運営"
            ]
          }
        };
        sourceLabel = "Supabase";
      } catch (supabaseError) {
        console.warn("Supabase staff load failed. JSON fallback.", supabaseError);
      }
    }

    if (!data) {
      const res = await fetch("data/staff.json?v=1.8", { cache: "no-store" });
      if (!res.ok) throw new Error("staff.json load failed");
      data = await res.json();
    }

    if (yearText) yearText.textContent = `${data.year || "—"}年度`;
    if (updateText) {
      updateText.textContent = data.updated
        ? `最終更新：${data.updated}${sourceLabel === "Supabase" ? "・自動反映" : ""}`
        : "";
    }

    const staff = (data.staff || []).filter(item => item.isPublished !== false);
    root.innerHTML = "";

    // 表示順を固定：指導 → 保護者会運営 → 審判員
    const coaching = {id:"coaching", label:"指導スタッフ", description:"代表・監督・コーチ"};
    const referees = {id:"referees", label:"審判員", description:"チーム所属・協力審判員"};

renderProfileGroup(root, coaching, staff);
renderProfileGroup(root, referees, staff);
renderTeamOperations(root, data.teamOperations);

  } catch (e) {
    root.innerHTML = `<div class="empty-state"><b>スタッフ情報を読み込めませんでした</b><p>data/staff.json を確認してください。</p></div>`;
  }
}

loadStaff();
