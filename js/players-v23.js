
const PLAYER_DATA_URL = "data/players.json?v=2.5";
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function photoMarkup(p){
  if(!p.photo) return "";
  return `<img src="${esc(p.photo)}" alt="${esc(p.name)}" loading="lazy"
    style="object-position:${esc(p.photoPosition || "center center")};object-fit:${esc(p.photoFit || "cover")}"
    onerror="this.style.display='none';this.parentElement.querySelector('.v23-photo-placeholder').style.display='flex'">`;
}
function playerCard(p){
  const n = p.number ?? "—";
  return `<article class="v23-player-card">
    <a class="v24-card-link" href="player-profile.html?id=${encodeURIComponent(p.id)}">
      <div class="v23-photo">
        ${photoMarkup(p)}
        <div class="v23-photo-placeholder" style="${p.photo ? "display:none" : ""}">
          <div class="ball">⚽</div><span>PLAYER PHOTO</span><small>写真はあとから追加できます</small>
        </div>
        <span class="v23-number">#${esc(n)}</span>
      </div>
      <div class="v23-player-body">
        <span class="player-num">${esc(p.category || "")}</span>
        <h3>${esc(p.name || "選手名準備中")}</h3>
        <div class="v23-kana">${esc(p.nameKana || "")}</div>
        <div class="v23-meta">
          <span>${esc(p.grade || "")}</span><span>${esc(p.position || "")}</span><span>利き足 ${esc(p.dominantFoot || "—")}</span>
        </div>
        <span class="v24-profile-btn">プロフィールを見る →</span>
      </div>
    </a>
  </article>`;
}
function emptyCard(cat){
  return `<div class="empty-category"><strong>${esc(cat)} 選手情報を追加できます</strong>
    <span>data/players.json に選手を追加すると、この場所へ自動表示されます。</span></div>`;
}
fetch(PLAYER_DATA_URL).then(r=>r.json()).then(async data=>{
  try{
  if(window.FurugenPublicData?.configured()){
    const livePlayers = await window.FurugenPublicData.loadPlayers();

    if(Array.isArray(livePlayers) && livePlayers.length){
      data.players = livePlayers;
    }
  }
}catch(e){
  console.warn("Supabase players fallback to JSON:", e);
}
  const cats = Object.fromEntries((data.categories || []).map(c=>[c.id,c]));
  let active = new URLSearchParams(location.search).get("category")?.toUpperCase() || "U-12";
  if(!cats[active]) active="U-12";
  const buttons=[...document.querySelectorAll("[data-cat]")], grid=document.getElementById("playerGrid");
  const render=cat=>{
    active=cat;
    const c=cats[cat]||{};
    buttons.forEach(b=>b.classList.toggle("is-active",b.dataset.cat===cat));
    document.getElementById("categoryTitle").textContent=cat;
    document.getElementById("categoryDescription").textContent=c.grade||"";
    document.getElementById("categoryMessage").textContent=c.message||"";
    const players=(data.players||[]).filter(p=>p.isPublished!==false && p.category===cat);
    document.getElementById("categoryCount").textContent=players.length;
    grid.innerHTML=players.length?players.map(playerCard).join(""):emptyCard(cat);
    history.replaceState(null,"",`?category=${encodeURIComponent(cat.toLowerCase())}`);
  };
  buttons.forEach(b=>b.addEventListener("click",()=>render(b.dataset.cat)));
  render(active);
}).catch(()=>{
  document.getElementById("playerGrid").innerHTML='<div class="empty-category"><strong>選手データを読み込めませんでした</strong><span>公開後に再読み込みしてください。</span></div>';
});
