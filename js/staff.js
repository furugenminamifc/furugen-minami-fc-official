
function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function fallbackLabel(role) {
  return /監督|コーチ/.test(role || "") ? "COACH" : "STAFF";
}

async function loadStaff() {
  const grid = document.querySelector("#staffGrid");
  const yearText = document.querySelector("#staffYear");
  const updateText = document.querySelector("#staffUpdated");

  try {
    const res = await fetch("data/staff.json", { cache: "no-store" });
    if (!res.ok) throw new Error("staff.json load failed");
    const data = await res.json();

    if (yearText) yearText.textContent = `${data.year || "—"}年度`;
    if (updateText) updateText.textContent = data.updated ? `最終更新：${data.updated}` : "";

    const staff = (data.staff || []).filter(item => item.isPublished !== false);
    grid.innerHTML = "";

    if (!staff.length) {
      grid.innerHTML = `<div class="empty-state"><b>公開中のスタッフ情報はありません</b><p>data/staff.json で isPublished を true にしてください。</p></div>`;
      return;
    }

    staff.forEach(item => {
      const article = document.createElement("article");
      article.className = "staff-card staff-card-v152";

      const role = esc(item.role || "");
      const name = esc(item.name || "氏名準備中");
      const category = esc(item.category || "—");
      const license = esc(item.license || "—");
      const message = esc(item.message || "");
      const photo = String(item.photo || "").trim();
      const position = esc(item.photoPosition || "center center");

      const media = photo
        ? `<div class="staff-photo staff-photo-v152">
             <img src="${esc(photo)}" alt="${name}" loading="lazy"
                  style="object-position:${position}"
                  onerror="this.closest('.staff-photo').classList.add('photo-error');this.remove();">
           </div>`
        : `<div class="staff-avatar staff-avatar-v152">${fallbackLabel(item.role)}</div>`;

      article.innerHTML = `
        ${media}
        <div class="staff-card-body">
          <span class="staff-role">${role}</span>
          <h3>${name}</h3>
          <dl class="staff-meta">
            <div><dt>担当</dt><dd>${category}</dd></div>
            <div><dt>資格</dt><dd>${license}</dd></div>
          </dl>
          <p>${message}</p>
        </div>
      `;
      grid.appendChild(article);
    });
  } catch (e) {
    grid.innerHTML = `<div class="empty-state"><b>スタッフ情報を読み込めませんでした</b><p>data/staff.json を確認してください。</p></div>`;
  }
}

loadStaff();
