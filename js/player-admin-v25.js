
const DATA_URL="data/players.json?v=2.5";
let db={version:"2.5",updated:new Date().toISOString().slice(0,10),categories:[],players:[]};
let currentId=null, selectedPhoto=null;

const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const toast=msg=>{const t=$("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),1800)};

function slug(s){return String(s||"player").normalize("NFKD").replace(/[^\w\-]+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"").toLowerCase()||"player"}
function recommendedPhotoName(p){
  const num=String(p.number??"00").padStart(2,"0");
  return `${(p.category||"u-12").toLowerCase()}-${num}-${slug(p.nameKana||p.name)}.jpg`;
}
function makeId(p){
  const base=`${(p.category||"U-12").toLowerCase()}-${String(p.number??"00").padStart(2,"0")}-${slug(p.nameKana||p.name)}`;
  let id=base, i=2;
  while(db.players.some(x=>x.id===id && x.id!==currentId)) id=`${base}-${i++}`;
  return id;
}
function getForm(){
  return {
    name:$("name").value.trim(), nameKana:$("nameKana").value.trim(), category:$("category").value,
    number:$("number").value===""?null:Number($("number").value), grade:$("grade").value,
    position:$("position").value, dominantFoot:$("dominantFoot").value==="未設定"?"":$("dominantFoot").value,
    nickname:$("nickname").value.trim(), height:$("height").value.trim(),
    favoritePlayer:$("favoritePlayer").value.trim(), strength:$("strength").value.trim(),
    goal:$("goal").value.trim(), profile:$("profile").value.trim()
  }
}
function setForm(p={}){
  ["name","nameKana","nickname","height","favoritePlayer","strength","goal","profile"].forEach(k=>$(k).value=p[k]||"");
  $("category").value=p.category||"U-12"; $("number").value=p.number??"";
  $("grade").value=p.grade||"6年生"; $("position").value=p.position||"FP";
  $("dominantFoot").value=p.dominantFoot||"未設定";
  selectedPhoto=null; $("photoFile").value="";
  const prev=$("photoPreview");
  if(p.photo){
    prev.innerHTML=`<img src="${esc(p.photo)}" alt="">`;
    prev.querySelector("img").onerror=()=>prev.innerHTML='<div class="empty"><b>⚽</b>PLAYER PHOTO</div>';
  }else prev.innerHTML='<div class="empty"><b>⚽</b>PLAYER PHOTO</div>';
  updateGuide(p);
}
function updateGuide(p){
  const g=$("photoFileGuide"); if(!p.name){g.innerHTML="";return}
  const fname=recommendedPhotoName(p);
  g.innerHTML=`<code>写真の推奨名：images/players/${esc(fname)}</code><code>players.json の photo：images/players/${esc(fname)}</code>`;
}
function renderList(){
  const q=$("searchBox").value.toLowerCase();
  const ps=db.players.filter(p=>`${p.name} ${p.number} ${p.category}`.toLowerCase().includes(q));
  $("playerList").innerHTML=ps.map(p=>`<div class="admin-player-row ${p.id===currentId?"is-active":""}" data-id="${esc(p.id)}">
    <div class="admin-thumb">${p.photo?`<img src="${esc(p.photo)}" onerror="this.remove();this.parentElement.textContent='⚽'">`:"⚽"}</div>
    <div><strong>${esc(p.name||"名前未設定")}</strong><small>${esc(p.category||"")} / #${esc(p.number??"—")} / ${esc(p.grade||"")}</small></div>
    <span class="admin-badge">${esc(p.position||"")}</span>
  </div>`).join("") || '<div class="photo-help">選手データがありません。</div>';
  document.querySelectorAll(".admin-player-row").forEach(el=>el.onclick=()=>selectPlayer(el.dataset.id));
}
function selectPlayer(id){
  const p=db.players.find(x=>x.id===id); if(!p)return;
  currentId=id; setForm(p); renderList(); toast("選手データを開きました");
}
function newPlayer(){
  currentId=null; setForm({category:"U-12",grade:"6年生",position:"FP"}); renderList(); toast("新しい選手を入力できます");
}
function savePlayer(){
  const p=getForm();
  if(!p.name){alert("名前を入力してください。");return}
  p.id=currentId||makeId(p); p.isPublished=true; p.photo="";
  const old=db.players.find(x=>x.id===currentId);
  if(old){
    p.photo=old.photo||"";
    ["photoPosition","photoFit","captain","message"].forEach(k=>{if(old[k]!==undefined)p[k]=old[k]});
    Object.assign(old,p);
  }else{
    db.players.push(p); currentId=p.id;
  }
  if(selectedPhoto){
    const fname=recommendedPhotoName(p);
    p.photo=`images/players/${fname}`;
    if(old) old.photo=p.photo;
  }
  db.updated=new Date().toISOString().slice(0,10);
  localStorage.setItem("furugen-v25-admin",JSON.stringify(db));
  setForm(db.players.find(x=>x.id===currentId));
  renderList(); toast("保存しました");
}
function deletePlayer(){
  if(!currentId)return;
  const p=db.players.find(x=>x.id===currentId);
  if(confirm(`${p?.name||"この選手"}を削除しますか？`)){
    db.players=db.players.filter(x=>x.id!==currentId);
    currentId=null; localStorage.setItem("furugen-v25-admin",JSON.stringify(db)); newPlayer(); toast("削除しました");
  }
}
function exportJson(){
  db.version="2.5"; db.updated=new Date().toISOString().slice(0,10);
  const blob=new Blob([JSON.stringify(db,null,2)],{type:"application/json"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="players.json"; a.click(); URL.revokeObjectURL(a.href);
  toast("players.jsonを書き出しました");
}
function loadBase(force=false){
  if(!force){
    const saved=localStorage.getItem("furugen-v25-admin");
    if(saved){try{db=JSON.parse(saved);renderList();if(db.players[0])selectPlayer(db.players[0].id);return}catch(e){}}
  }
  fetch(DATA_URL).then(r=>r.json()).then(x=>{db=x;db.version="2.5";localStorage.setItem("furugen-v25-admin",JSON.stringify(db));renderList();if(db.players[0])selectPlayer(db.players[0].id);else newPlayer();toast("元データを読み込みました")});
}
$("newPlayerBtn").onclick=newPlayer;
$("reloadBtn").onclick=()=>{if(confirm("画面で編集中の内容を消して、公開中の元データを読み込みますか？"))loadBase(true)};
$("saveBtn").onclick=savePlayer;
$("deleteBtn").onclick=deletePlayer;
$("exportBtn").onclick=exportJson;
$("searchBox").oninput=renderList;
$("photoFile").onchange=e=>{
  const f=e.target.files[0]; if(!f)return; selectedPhoto=f;
  const url=URL.createObjectURL(f); $("photoPreview").innerHTML=`<img src="${url}" alt="選手写真プレビュー">`;
  updateGuide(getForm()); toast("写真を選択しました");
};
["name","nameKana","category","number"].forEach(id=>$(id).addEventListener("input",()=>updateGuide(getForm())));
loadBase();
