
const params = new URLSearchParams(location.search);
const category = params.get("category") || "U-12";
const requestedYear = Number(params.get("year")) || null;

async function getJSON(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json();
}

function normalizeCategoryFilename(cat) {
  return cat.toLowerCase();
}

async function initCategoryPage() {
  const site = await getJSON("data/site.json");
  const year = requestedYear || site.currentYear;
  const catMeta = site.categories.find(c => c.id === category) || site.categories[0];

  document.title = `古堅南FC ${catMeta.label}｜${year}年度`;
  document.querySelector("#categoryTitle").textContent = catMeta.label;
  document.querySelector("#categoryGrades").textContent = catMeta.grades;

  const yearSelect = document.querySelector("#yearSelect");
  yearSelect.innerHTML = "";
  site.years
    .slice()
    .sort((a,b) => b-a)
    .forEach(y => {
      const opt = document.createElement("option");
      opt.value = y;
      opt.textContent = `${y}年度`;
      if (y === year) opt.selected = true;
      yearSelect.appendChild(opt);
    });

  yearSelect.addEventListener("change", () => {
    const y = yearSelect.value;
    location.href = `category.html?category=${encodeURIComponent(category)}&year=${encodeURIComponent(y)}`;
  });

  try {
    const data = await getJSON(`data/${year}/${normalizeCategoryFilename(category)}.json`);
    document.querySelector("#categoryIntro").textContent = data.intro || `${catMeta.label}の活動紹介です。`;

    const stats = {
      players: data.players?.length || 0,
      matches: data.matches?.length || 0,
      wins: (data.results || []).filter(r => String(r.result || "").includes("○") || r.outcome === "win").length,
      achievements: data.achievements?.length || 0
    };
    document.querySelector("#statPlayers").textContent = stats.players || "—";
    document.querySelector("#statMatches").textContent = stats.matches || "—";
    document.querySelector("#statWins").textContent = stats.wins || "—";
    document.querySelector("#statAchievements").textContent = stats.achievements || "—";

    renderPlayers(data.players || []);
    renderMatches(data.matches || data.results || []);
    renderAchievements(data.achievements || []);
  } catch (e) {
    document.querySelector("#categoryIntro").textContent = `${year}年度のデータは準備中です。`;
  }
}

function renderPlayers(players) {
  const tbody = document.querySelector("#playersBody");
  tbody.innerHTML = "";
  if (!players.length) {
    tbody.innerHTML = `<tr><td>—</td><td>選手データ準備中</td><td>—</td></tr>`;
    return;
  }
  players.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${p.number ?? "—"}</td><td>${p.name ?? "—"}</td><td>${p.position ?? "—"}</td>`;
    tbody.appendChild(tr);
  });
}

function renderMatches(matches) {
  const tbody = document.querySelector("#matchesBody");
  tbody.innerHTML = "";
  if (!matches.length) {
    tbody.innerHTML = `<tr><td>—</td><td>試合データ準備中</td><td>—</td><td>—</td></tr>`;
    return;
  }
  matches.forEach(m => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${m.date ?? "—"}</td><td>${m.competition ?? m.name ?? "—"}</td><td>${m.opponent ?? "—"}</td><td>${m.score ?? m.result ?? "—"}</td>`;
    tbody.appendChild(tr);
  });
}

function renderAchievements(items) {
  const box = document.querySelector("#achievementsList");
  if (!items.length) {
    box.innerHTML = `<p>大会成績は準備中です。</p>`;
    return;
  }
  box.innerHTML = items.map(a => `<div class="achievement-item">🏆 ${a.name ?? a.title ?? a}</div>`).join("");
}

initCategoryPage().catch(console.error);
