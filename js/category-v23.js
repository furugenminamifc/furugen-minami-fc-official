
const DATA_URL="data/players.json?v=2.3";
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function pCard(p){return `<article class="v23-player-card"><div class="v23-photo">
${p.photo?`<img src="${esc(p.photo)}" alt="${esc(p.name)}" loading="lazy" style="object-position:${esc(p.photoPosition||"center center")};object-fit:${esc(p.photoFit||"cover")}" onerror="this.remove();this.parentElement.querySelector('.v23-photo-placeholder').style.display='flex'">`:""}
<div class="v23-photo-placeholder" style="${p.photo?"display:none":""}"><div class="ball">⚽</div><span>PLAYER PHOTO</span><small>写真はあとから追加できます</small></div>
<span class="v23-number">#${esc(p.number??"—")}</span></div><div class="v23-player-body"><span class="player-num">${esc(p.category||"")}</span><h3>${esc(p.name||"選手名準備中")}</h3><div class="v23-kana">${esc(p.nameKana||"")}</div><div class="v23-meta"><span>${esc(p.grade||"")}</span><span>${esc(p.position||"")}</span></div></div></article>`}
fetch(DATA_URL).then(r=>r.json()).then(data=>{
 const cats=Object.fromEntries((data.categories||[]).map(c=>[c.id,c]));
 let q=(new URLSearchParams(location.search).get("category")||"u-12").toUpperCase();
 if(!cats[q])q="U-12";
 const render=cat=>{
  const c=cats[cat]||{}, ps=(data.players||[]).filter(p=>p.isPublished!==false&&p.category===cat);
  document.querySelectorAll("[data-cat]").forEach(b=>b.classList.toggle("is-active",b.dataset.cat===cat));
  document.getElementById("heroCategory").textContent=cat+"｜2026";
  document.getElementById("heroLead").textContent=(c.grade||"")+"のカテゴリー情報・選手・試合への入口です。";
  document.getElementById("categoryTitle").textContent=cat;
  document.getElementById("categoryGrades").textContent=c.grade||"";
  document.getElementById("categoryMessage").textContent=c.message||"";
  document.getElementById("playerCount").textContent=ps.length;
  document.getElementById("playersLink").href=`players.html?category=${encodeURIComponent(cat.toLowerCase())}`;
  document.getElementById("playerGrid").innerHTML=ps.length?ps.map(pCard).join(""):`<div class="empty-category"><strong>${cat} 選手情報は準備中です</strong><span>選手を登録すると、このページに自動表示されます。</span></div>`;
  history.replaceState(null,"",`?category=${encodeURIComponent(cat.toLowerCase())}`);
 };
 document.querySelectorAll("[data-cat]").forEach(b=>b.addEventListener("click",()=>render(b.dataset.cat)));
 render(q);
});
