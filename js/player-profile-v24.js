
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
fetch("data/players.json?v=2.4").then(r=>r.json()).then(data=>{
  const id=new URLSearchParams(location.search).get("id");
  const p=(data.players||[]).find(x=>x.id===id && x.isPublished!==false) || (data.players||[]).find(x=>x.isPublished!==false);
  if(!p){ document.querySelector("main").innerHTML='<section class="section"><div class="wrap"><h1>選手情報が見つかりません</h1></div></section>'; return; }
  document.title=`${p.name}｜選手プロフィール｜古堅南FC`;
  document.getElementById("profileCategory").textContent=`${p.category||""} / 2026 PLAYER`;
  document.getElementById("profileName").textContent=p.name||"選手名";
  document.getElementById("profileKana").textContent=p.nameKana||"";
  document.getElementById("profileNumber").textContent=`#${p.number??"—"}`;
  const tags=[p.grade,p.position,p.dominantFoot?`利き足 ${p.dominantFoot}`:"",p.captain?"CAPTAIN":""].filter(Boolean);
  document.getElementById("profileTags").innerHTML=tags.map(x=>`<span>${esc(x)}</span>`).join("");
  document.getElementById("backPlayers").href=`players.html?category=${encodeURIComponent((p.category||"U-12").toLowerCase())}`;
  if(p.photo){
    const img=new Image(); img.alt=p.name||"選手写真"; img.style.objectPosition=p.photoPosition||"center center"; img.style.objectFit=p.photoFit||"cover";
    img.onload=()=>{ document.getElementById("photoFallback").style.display="none"; document.getElementById("profilePhotoWrap").prepend(img); };
    img.src=p.photo;
  }
  const infos=[
    ["カテゴリー",p.category],["背番号",p.number!=null?`#${p.number}`:"—"],["学年",p.grade],["ポジション",p.position],
    ["利き足",p.dominantFoot||"—"],["ニックネーム",p.nickname||"—"],["身長",p.height||"—"],["好きな選手",p.favoritePlayer||"—"]
  ];
  document.getElementById("profileInfo").innerHTML=infos.map(([k,v])=>`<div class="profile-info"><small>${esc(k)}</small><strong>${esc(v||"—")}</strong></div>`).join("");
  const text=p.profile||p.message||"";
  const goal=[p.strength?`得意なプレー：${p.strength}`:"",p.goal?`目標：${p.goal}`:""].filter(Boolean).join("　");
  if(text){ const el=document.getElementById("profileText"); el.textContent=text; el.classList.remove("profile-empty"); }
  if(goal){ const el=document.getElementById("profileGoal"); el.textContent=goal; el.classList.remove("profile-empty"); }
});
