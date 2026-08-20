
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
  return /監督|コーチ/.test(role || "") ? "COACH" : "STAFF";
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

async function loadStaff() {
  const root = document.querySelector("#staffGroups");
  const yearText = document.querySelector("#staffYear");
  const updateText = document.querySelector("#staffUpdated");

  try {
    const res = await fetch("data/staff.json", { cache: "no-store" });
    if (!res.ok) throw new Error("staff.json load failed");
    const data = await res.json();

    if (yearText) yearText.textContent = `${data.year || "—"}年度`;
    if (updateText) updateText.textContent = data.updated ? `最終更新：${data.updated}` : "";

    const groups = data.groups || [
      {id:"coaching",label:"指導スタッフ"},
      {id:"operations",label:"運営スタッフ"},
      {id:"referees",label:"審判員"}
    ];
    const staff = (data.staff || []).filter(item => item.isPublished !== false);

    root.innerHTML = "";

    groups.forEach(group => {
      const members = staff.filter(item => (item.group || "coaching") === group.id);
      const section = document.createElement("section");
      section.className = "staff-group-section";

      section.innerHTML = `
        <div class="staff-group-heading">
          <div>
            <span class="eyebrow">${esc(group.id.toUpperCase())}</span>
            <h2>${esc(group.label)}</h2>
            ${group.description ? `<p>${esc(group.description)}</p>` : ""}
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
    });
  } catch (e) {
    root.innerHTML = `<div class="empty-state"><b>スタッフ情報を読み込めませんでした</b><p>data/staff.json を確認してください。</p></div>`;
  }
}

loadStaff();
