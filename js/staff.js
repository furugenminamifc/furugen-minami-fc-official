
async function loadStaff() {
  const grid = document.querySelector("#staffGrid");
  try {
    const res = await fetch("data/staff.json", { cache: "no-store" });
    if (!res.ok) throw new Error("staff.json load failed");
    const data = await res.json();
    grid.innerHTML = "";
    data.staff.forEach(item => {
      const article = document.createElement("article");
      article.className = "staff-card staff-card-v151";

      let media = "";
      if (item.photo) {
        media = `<div class="staff-photo"><img src="${item.photo}" alt="${item.name}" loading="lazy"></div>`;
      } else {
        media = `<div class="staff-avatar">${item.role.includes("コーチ") || item.role.includes("監督") ? "COACH" : "STAFF"}</div>`;
      }

      article.innerHTML = `
        ${media}
        <span class="staff-role">${item.role || ""}</span>
        <h3>${item.name || "氏名準備中"}</h3>
        <dl class="staff-meta">
          <div><dt>担当</dt><dd>${item.category || "—"}</dd></div>
          <div><dt>資格</dt><dd>${item.license || "—"}</dd></div>
        </dl>
        <p>${item.message || ""}</p>
      `;
      grid.appendChild(article);
    });
  } catch (e) {
    grid.innerHTML = `<div class="empty-state"><b>スタッフ情報を読み込めませんでした</b><p>data/staff.json を確認してください。</p></div>`;
  }
}
loadStaff();
