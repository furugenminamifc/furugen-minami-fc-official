(function(){
  const $ = id => document.getElementById(id);
  const cfg = window.FURUGEN_SUPABASE || {};
  let sb = null;
  let editingPlayerId = null;
  let editingStaffId = null;
  let currentPlayers = [];
  let currentStaff = [];
let editingMatchId = null;
let currentMatches = [];
let editingResultId = null;
let currentResults = [];
let resultFilterMode = "all";  
  function isConfigured(){
    return !!(
      window.supabase &&
      cfg.url &&
      cfg.anonKey &&
      !String(cfg.url).includes("YOUR_SUPABASE") &&
      !String(cfg.anonKey).includes("YOUR_SUPABASE")
    );
  }

  function show(id, message){
    const el = $(id);
    el.textContent = message;
    el.style.display = "block";
    setTimeout(()=>el.style.display="none", 2600);
  }

  function hide(id){ $(id).style.display = "none"; }

  function esc(value){
    return String(value ?? "")
      .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
      .replaceAll('"',"&quot;").replaceAll("'","&#039;");
  }
function setupAdminTabs(){
  const tabs = document.querySelectorAll(".tabs .tab");

const panels = {
  players: $("playersTab"),
  staff: $("staffTab"),
  matches: $("matchesTab"),
  resultManager: $("resultManager"),
  gallery: $("galleryTab"),
  cup: $("cupTab")
};

  tabs.forEach(tab => {
    tab.onclick = () => {
      const target = tab.dataset.tab;

      tabs.forEach(t => t.classList.remove("active"));

      Object.values(panels).forEach(panel => {
        if(panel) panel.classList.add("hidden");
      });

      tab.classList.add("active");

      if(panels[target]){
        panels[target].classList.remove("hidden");
      }
    };
  });
const activeTab = document.querySelector(".tabs .tab.active") || tabs[0];
if(activeTab) activeTab.click();}
  function init(){setupAdminTabs();
    $("configStatus").textContent = isConfigured()
      ? "Supabase設定：入力済み ✅"
      : "Supabase設定：未設定（js/supabase-config.js を設定してください）";

    if(!isConfigured()){
      $("loginBtn").disabled = true;
      return;
    }

    sb = window.supabase.createClient(cfg.url, cfg.anonKey);

    sb.auth.onAuthStateChange((_event, session)=>{
      applySession(session);
    });

    sb.auth.getSession().then(({data})=>applySession(data.session));
  }

  async function applySession(session){
    const loggedIn = !!session;
    $("adminArea").classList.toggle("hidden", !loggedIn);
    $("logoutBtn").classList.toggle("hidden", !loggedIn);
    $("loginBtn").classList.toggle("hidden", loggedIn);

    if(loggedIn){
      show("loginOk", `ログイン中：${session.user.email || ""}`);
  await Promise.all([loadPlayers(), loadStaff(), loadMatches(), loadResults(), loadGallery()]);
    }
  }

  $("loginBtn").onclick = async ()=>{
    hide("loginError");
    const email = $("loginEmail").value.trim();
    const password = $("loginPassword").value;

    const { error } = await sb.auth.signInWithPassword({email, password});
    if(error) show("loginError", "ログインできませんでした：" + error.message);
  };

  $("logoutBtn").onclick = async ()=>{
    await sb.auth.signOut();
  };

  document.querySelectorAll(".tab").forEach(btn=>{
    btn.onclick = ()=>{
      document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
      btn.classList.add("active");
      $("playersTab").classList.toggle("hidden", btn.dataset.tab !== "players");
      $("staffTab").classList.toggle("hidden", btn.dataset.tab !== "staff");
      $("matchesTab").classList.toggle("hidden", btn.dataset.tab !== "matches");
      $("resultManager").classList.toggle("hidden", btn.dataset.tab !== "resultManager");
      $("galleryTab").classList.toggle("hidden", btn.dataset.tab !== "gallery");
    };
  });

  function bindPhoto(inputId, imgId, emptyId){
    $(inputId).addEventListener("change", ()=>{
      const file = $(inputId).files?.[0];
      if(!file) return;
      $(imgId).src = URL.createObjectURL(file);
      $(imgId).style.display = "block";
      $(emptyId).style.display = "none";
    });
  }
  bindPhoto("pPhoto","pPhotoPreview","pPhotoEmpty");
  bindPhoto("sPhoto","sPhotoPreview","sPhotoEmpty");

  async function uploadPhoto(file, folder){
    if(!file) return null;
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const name = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;

    const { error } = await sb.storage
      .from(cfg.storageBucket || "site-media")
      .upload(name, file, {cacheControl:"3600", upsert:false});

    if(error) throw error;

    const { data } = sb.storage
      .from(cfg.storageBucket || "site-media")
      .getPublicUrl(name);

    return data.publicUrl;
  }

  async function loadPlayers(){
    const { data, error } = await sb
      .from("players")
      .select("*")
      .order("category",{ascending:true})
      .order("number",{ascending:true});

    if(error){
      show("playerError", "選手一覧を読み込めません：" + error.message);
      return;
    }
    currentPlayers = data || [];
    renderPlayers();
  }
async function loadMatches(){
  const { data, error } = await sb
    .from("matches")
    .select("*")
    .order("match_date", { ascending:false })
    .order("kickoff_time", { ascending:true });

  if(error){
    show("matchError", "試合一覧を読み込めません: " + error.message);
    return;
  }

  currentMatches = data || [];
renderMatches();
renderResultMatchSelect();
}
async function loadResults(){
  const { data, error } = await sb
    .from("match_results")
    .select("*")
    .order("match_date", { ascending:false });

  if(error){
    show("resultError", "試合結果を読み込めません: " + error.message);
    return;
  }

currentResults = data || [];
renderResults();
renderResultMatchSelect();
}
async function loadCurrentPhotoPreviews() {
  try {
    async function getLatest(type) {
      let result = await sb
        .from("gallery")
        .select("photo_url, created_at, year")
        .eq("published", true)
        .eq("photo_type", type)
        .order("created_at", { ascending: false })
        .limit(1);

      if (result.error) {
        result = await sb
          .from("gallery")
          .select("photo_url, year")
          .eq("published", true)
          .eq("photo_type", type)
          .order("year", { ascending: false })
          .limit(1);
      }

      return result.data && result.data[0]
        ? result.data[0].photo_url
        : "";
    }

    const heroUrl = await getLatest("hero");
    const teamUrl = await getLatest("team");

    const heroPreview = $("currentHeroPreview");
    const teamPreview = $("currentTeamPreview");

    if (heroPreview) {
      if (heroUrl) {
        heroPreview.src = heroUrl;
        heroPreview.style.display = "block";
      } else {
        heroPreview.removeAttribute("src");
        heroPreview.style.display = "none";
      }
    }

    if (teamPreview) {
      if (teamUrl) {
        teamPreview.src = teamUrl;
        teamPreview.style.display = "block";
      } else {
        teamPreview.removeAttribute("src");
        teamPreview.style.display = "none";
      }
    }

  } catch (error) {
    console.error("画像プレビュー読み込みエラー:", error);
  }
}
  async function loadGallery(){
  const list = $("galleryAdminList");
  await loadCurrentPhotoPreviews();  
  if (!list) return;

  const { data, error } = await sb
    .from("gallery")
    .select("*")
    .order("year", { ascending: false })
　　　.order("sort_order", { ascending: true });

  if (error) {
    list.innerHTML = `<div class="error">ギャラリーを読み込めません: ${esc(error.message)}</div>`;
    return;
  }

  list.innerHTML = "";

  (data || []).forEach(item => {
    const row = document.createElement("div");
    row.className = "list-item";

    row.innerHTML = `
      <div style="display:flex;gap:12px;align-items:center;">
        <img src="${esc(item.photo_url || "")}"
             alt=""
             style="width:90px;height:70px;object-fit:cover;border-radius:8px;">
        <div style="flex:1;">
          <strong>${esc(item.title || "無題")}</strong><br>
          <small>${esc(item.year || "")}年度 ／ ${item.published ? "公開" : "非公開"}</small>
        </div>
<button class="secondary" data-gallery-type="${esc(item.id)}">${String(item.photo_type || "gallery").replaceAll('"', "") === "gallery"
  ? "トップ画像へ"
  : String(item.photo_type || "gallery").replaceAll('"', "") === "hero"
    ? "TEAM PHOTOへ"
    : "通常ギャラリーへ"}</button>
<button class="secondary" data-gallery-up="${esc(item.id)}">↑ 上へ</button>
<button class="secondary" data-gallery-down="${esc(item.id)}">↓ 下へ</button>
<button class="danger" data-gallery-delete="${esc(item.id)}">削除</button>
      </div>
    `;

    list.appendChild(row);
  });
}
document.addEventListener("click", async (event) => {
  const btn = event.target.closest("[data-gallery-delete]");
  if (!btn) return;

  const id = btn.dataset.galleryDelete;
  if (!id) return;

  const ok = confirm("このギャラリー写真を削除しますか？");
  if (!ok) return;

  const { error } = await sb
    .from("gallery")
    .delete()
    .eq("id", id);

  if (error) {
    alert("削除に失敗しました：" + error.message);
    return;
  }

  alert("削除しました");
  await loadGallery();
});
document.addEventListener("click", async (event) => {
  const btn = event.target.closest("[data-gallery-type]");
  if (!btn) return;

  const id = btn.dataset.galleryType;
  if (!id) return;

  const { data, error } = await sb
    .from("gallery")
    .select("photo_type")
    .eq("id", id)
    .single();

  if (error) {
    alert("写真種別の取得に失敗しました: " + error.message);
    return;
  }

const currentType = String(data.photo_type || "gallery").replaceAll("'", "");
const typeOrder = ["gallery", "hero", "team"];
const currentIndex = typeOrder.indexOf(currentType);
const newType = typeOrder[(currentIndex + 1) % typeOrder.length];

  const { error: updateError } = await sb
    .from("gallery")
    .update({ photo_type: newType })
    .eq("id", id);

  if (updateError) {
    alert("写真種別の変更に失敗しました: " + updateError.message);
    return;
  }

  await loadGallery();
});  
document.addEventListener("click", async (event) => {
  const upBtn = event.target.closest("[data-gallery-up]");
  const downBtn = event.target.closest("[data-gallery-down]");

  if (!upBtn && !downBtn) return;

  const id = upBtn
    ? upBtn.dataset.galleryUp
    : downBtn.dataset.galleryDown;

  const direction = upBtn ? -1 : 1;

  const { data, error } = await sb
    .from("gallery")
    .select("id, sort_order")
    .order("sort_order", { ascending: true });

  if (error) {
    alert("並び替え情報の取得に失敗しました：" + error.message);
    return;
  }

  const index = data.findIndex(item => String(item.id) === String(id));
  if (index === -1) return;

  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= data.length) return;

  const current = data[index];
  const target = data[targetIndex];

  const { error: error1 } = await sb
    .from("gallery")
    .update({ sort_order: target.sort_order })
    .eq("id", current.id);

  if (error1) {
  alert("並び替えに失敗しました：" + error1.message);
  return;
}

  const { error: error2 } = await sb
    .from("gallery")
    .update({ sort_order: current.sort_order })
    .eq("id", target.id);

  if (error2) {
    alert("並び替えに失敗しました：" + error2.message);
    return;
  }

  await loadGallery();
});  
function renderResultMatchSelect(){
  const select = $("resultMatchSelect");
  if(!select) return;

  const currentValue = select.value;
  select.innerHTML = '<option value="">試合を選択してください</option>';
const isResultEntered = (m) => currentResults.some(r =>
  r.match_date === m.match_date &&
  r.category === m.category &&
  r.opponent === m.opponent
);

const filteredMatches = currentMatches.filter(m => {
  if (m.competition === "過去試合一括取込") return false;

  const entered = isResultEntered(m);

  if (resultFilterMode === "pending") return !entered;
  if (resultFilterMode === "done") return entered;
  return true;
});
const sortedMatches = [...filteredMatches]
  .filter(m => m.competition !== "過去試合一括取込")
  .sort((a, b) => {
  const aEntered = currentResults.some(r =>
    r.match_date === a.match_date &&
    r.category === a.category &&
    r.opponent === a.opponent
  );

  const bEntered = currentResults.some(r =>
    r.match_date === b.match_date &&
    r.category === b.category &&
    r.opponent === b.opponent
  );

  if (aEntered !== bEntered) {
    return aEntered ? 1 : -1;
  }

  return String(b.match_date || "").localeCompare(String(a.match_date || ""));
});

sortedMatches.forEach(m=>{
    const option = document.createElement("option");
    option.value = m.id;

    const date = m.match_date || "";
    const category = m.category || "";
    const competition = m.competition || "";
    const opponent = m.opponent || "";

  const alreadyEntered = currentResults.some(r =>
  r.match_date === m.match_date &&
  r.category === m.category &&
  r.opponent === m.opponent
);

option.textContent =
  `${date} | ${category} | ${competition} | vs ${opponent}${alreadyEntered ? " ✅ 結果入力済み" : ""}`;

    select.appendChild(option);
  });

  if(currentValue){
    select.value = currentValue;
  }
}
const resultMatchSelect = $("resultMatchSelect");

if(resultMatchSelect){
  resultMatchSelect.addEventListener("change", ()=>{
    const match = currentMatches.find(
      m => String(m.id) === String(resultMatchSelect.value)
    );

    if(!match) return;

    $("rDate").value = match.match_date || "";
    $("rCategory").value = match.category || "";
    $("rCompetition").value = match.competition || "";
    $("rOpponent").value = match.opponent || "";
    $("rVenue").value = match.venue || "";
  });
}  
  function renderResults(){
  const root = $("resultAdminList");
  if(!root) return;

  root.innerHTML = "";

  currentResults.forEach(r=>{
    const row = document.createElement("div");
    row.className = "row";

    const score = `${r.our_score} - ${r.opponent_score}`;

    row.innerHTML = `
      <div>
        <b>${esc(r.match_date)} ${esc(r.category)}</b><br>
        <strong>古堅南FC ${score} ${esc(r.opponent)}</strong><br>
        <small>${esc(r.competition || "")} / ${esc(r.venue || "")}
        ${r.is_published ? "・公開" : "・非公開"}</small>
      </div>
      <button class="secondary edit">編集</button>
      <button class="danger delete">削除</button>
    `;
row.querySelector(".edit").onclick = ()=>fillResult(r);
row.querySelector(".delete").onclick = ()=>deleteResult(r);
root.appendChild(row);
  });
}
function fillResult(r){
  editingResultId = r.id;

  $("rDate").value = r.match_date || "";
  $("rCategory").value = r.category || "U-12";
  $("rCompetition").value = r.competition || "";
  $("rOpponent").value = r.opponent || "";
  $("rOurScore").value = r.our_score ?? 0;
  $("rOpponentScore").value = r.opponent_score ?? 0;
  $("rVenue").value = r.venue || "";
  $("rPublished").value = String(r.is_published !== false);

  $("saveResultBtn").textContent = "試合結果を更新";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function deleteResult(r){
  if(!confirm(`${r.match_date} ${r.opponent || ""} を削除しますか？`)) return;

  const { error } = await sb
    .from("match_results")
    .delete()
    .eq("id", r.id);

  if(error){
    show("resultError", "削除できません: " + error.message);
    return;
  }

  show("resultOk", "試合結果を削除しました。");
  await loadResults();
}  
  
  function renderPlayers(){
    const root = $("playerList");
    root.innerHTML = "";

    currentPlayers.forEach(p=>{
      const row = document.createElement("div");
      row.className = "row";
      row.innerHTML = `
        <div><b>${esc(p.category)} #${esc(p.number)} ${esc(p.name)}</b><br>
        <small>${esc(p.grade || "")}・${esc(p.position || "")}${p.is_published ? "・公開" : "・非公開"}</small></div>
        <button class="secondary edit">編集</button>
        <button class="danger delete">削除</button>
      `;
      row.querySelector(".edit").onclick = ()=>fillPlayer(p);
      row.querySelector(".delete").onclick = ()=>deletePlayer(p);
      root.appendChild(row);
    });
  }

  function fillPlayer(p){
    editingPlayerId = p.id;
    $("pCategory").value = p.category;
    $("pNumber").value = p.number;
    $("pName").value = p.name;
    $("pKana").value = p.name_kana || "";
    $("pGrade").value = p.grade || "";
    $("pPosition").value = p.position || "FP";
    $("pFoot").value = p.dominant_foot || "";
    $("pCaptain").value = String(!!p.captain);
    $("pProfile").value = p.profile || "";
    $("pPhotoPosition").value = p.photo_position || "center 35%";
    $("pPublished").value = String(p.is_published !== false);
    if(p.photo_url){
      $("pPhotoPreview").src = p.photo_url;
      $("pPhotoPreview").style.display = "block";
      $("pPhotoEmpty").style.display = "none";
    }
    $("savePlayerBtn").textContent = "選手情報を更新";
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function clearPlayer(){
    editingPlayerId = null;
    ["pNumber","pName","pKana","pProfile"].forEach(id=>$(id).value="");
    $("pCategory").value="U-12"; $("pGrade").value=""; $("pPosition").value="FP";
    $("pFoot").value=""; $("pCaptain").value="false"; $("pPublished").value="true";
    $("pPhotoPosition").value="center 35%"; $("pPhoto").value="";
    $("pPhotoPreview").src=""; $("pPhotoPreview").style.display="none"; $("pPhotoEmpty").style.display="block";
    $("savePlayerBtn").textContent="選手を保存";
  }

  $("clearPlayerBtn").onclick = clearPlayer;

  $("savePlayerBtn").onclick = async ()=>{
    hide("playerError");
    const name = $("pName").value.trim();
    const number = Number($("pNumber").value || 0);
    if(!name || !number){
      show("playerError","氏名と背番号を入力してください。");
      return;
    }

    try{
      let photoUrl = null;
      const file = $("pPhoto").files?.[0];
      if(file) photoUrl = await uploadPhoto(file, "players");

      const payload = {
        category:$("pCategory").value,
        number,
        name,
        name_kana:$("pKana").value.trim(),
        grade:$("pGrade").value,
        position:$("pPosition").value,
        dominant_foot:$("pFoot").value,
        profile:$("pProfile").value.trim(),
        photo_position:$("pPhotoPosition").value,
        captain:$("pCaptain").value==="true",
        is_published:$("pPublished").value==="true",
        updated_at:new Date().toISOString()
      };
      if(photoUrl) payload.photo_url = photoUrl;

      let result;
      if(editingPlayerId){
        result = await sb.from("players").update(payload).eq("id", editingPlayerId);
      }else{
        result = await sb.from("players").insert(payload);
      }

      if(result.error) throw result.error;

      show("playerOk", editingPlayerId ? "選手情報を更新しました ✅" : "選手を登録しました ✅");
      clearPlayer();
      await loadPlayers();
    }catch(e){
      show("playerError","保存できません：" + (e.message || e));
    }
  };

  async function deletePlayer(p){
    if(!confirm(`${p.name} を削除しますか？`)) return;
    const { error } = await sb.from("players").delete().eq("id", p.id);
    if(error) show("playerError","削除できません：" + error.message);
    else{
      show("playerOk","削除しました。");
      await loadPlayers();
    }
  }

  async function loadStaff(){
    const { data, error } = await sb
      .from("staff")
      .select("*")
      .order("sort_order",{ascending:true})
      .order("created_at",{ascending:true});

    if(error){
      show("staffError", "スタッフ一覧を読み込めません：" + error.message);
      return;
    }
    currentStaff = data || [];
    renderStaff();
  }

  function renderStaff(){
    const root = $("staffList");
    root.innerHTML = "";

    currentStaff.forEach(s=>{
      const row = document.createElement("div");
      row.className = "row";
      row.innerHTML = `
        <div><b>${esc(s.role)}｜${esc(s.name)}</b><br>
        <small>${s.staff_group === "referees" ? "審判員" : "指導スタッフ"}${s.is_published ? "・公開" : "・非公開"}</small></div>
        <button class="secondary edit">編集</button>
        <button class="danger delete">削除</button>
      `;
      row.querySelector(".edit").onclick = ()=>fillStaff(s);
      row.querySelector(".delete").onclick = ()=>deleteStaff(s);
      root.appendChild(row);
    });
  }

  function fillStaff(s){
    editingStaffId = s.id;
    $("sGroup").value=s.staff_group || "coaching";
    $("sRole").value=s.role || "";
    $("sName").value=s.name || "";
    $("sKana").value=s.name_kana || "";
    $("sCategory").value=s.category || "";
    $("sLicense").value=s.license || "";
    $("sCareer").value=s.career || "";
    $("sMessage").value=s.message || "";
    $("sPhotoPosition").value=s.photo_position || "center 35%";
    $("sPublished").value=String(s.is_published !== false);
    if(s.photo_url){
      $("sPhotoPreview").src=s.photo_url;
      $("sPhotoPreview").style.display="block";
      $("sPhotoEmpty").style.display="none";
    }
    $("saveStaffBtn").textContent="スタッフ情報を更新";
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function clearStaff(){
    editingStaffId=null;
    ["sRole","sName","sKana","sCategory","sLicense","sCareer","sMessage"].forEach(id=>$(id).value="");
    $("sGroup").value="coaching"; $("sPublished").value="true"; $("sPhotoPosition").value="center 35%";
    $("sPhoto").value=""; $("sPhotoPreview").src=""; $("sPhotoPreview").style.display="none"; $("sPhotoEmpty").style.display="block";
    $("saveStaffBtn").textContent="スタッフを保存";
  }
  $("clearStaffBtn").onclick=clearStaff;

  $("saveStaffBtn").onclick = async ()=>{
    hide("staffError");
    const name=$("sName").value.trim();
    const role=$("sRole").value.trim();
    if(!name || !role){
      show("staffError","氏名と役職を入力してください。");
      return;
    }

    try{
      let photoUrl=null;
      const file=$("sPhoto").files?.[0];
      if(file) photoUrl=await uploadPhoto(file,"staff");

      const payload={
        staff_group:$("sGroup").value,
        role,
        name,
        name_kana:$("sKana").value.trim(),
        category:$("sCategory").value.trim(),
        license:$("sLicense").value.trim(),
        career:$("sCareer").value.trim(),
        message:$("sMessage").value.trim(),
        photo_position:$("sPhotoPosition").value,
        is_published:$("sPublished").value==="true",
        updated_at:new Date().toISOString()
      };
      if(photoUrl) payload.photo_url=photoUrl;

      let result;
      if(editingStaffId){
        result=await sb.from("staff").update(payload).eq("id",editingStaffId);
      }else{
        result=await sb.from("staff").insert(payload);
      }
      if(result.error) throw result.error;

      show("staffOk",editingStaffId ? "スタッフ情報を更新しました ✅" : "スタッフを登録しました ✅");
      clearStaff();
      await loadStaff();
    }catch(e){
      show("staffError","保存できません：" + (e.message || e));
    }
  };

  async function deleteStaff(s){
    if(!confirm(`${s.name} を削除しますか？`)) return;
    const {error}=await sb.from("staff").delete().eq("id",s.id);
    if(error) show("staffError","削除できません：" + error.message);
    else{
      show("staffOk","削除しました。");
      await loadStaff();
    }
  }
function renderMatches(){
  const root = $("matchList");
  if(!root) return;

  root.innerHTML = "";

  currentMatches.forEach(m=>{
    const row = document.createElement("div");
    row.className = "row";

    row.innerHTML = `
      <div>
        <b>${esc(m.match_date || "")}　${esc(m.category || "")}</b><br>
        <small>
          ${esc(m.competition || "")}
          ${m.opponent ? " ／ 対 " + esc(m.opponent) : ""}
          ${m.venue ? " ／ " + esc(m.venue) : ""}
          ${m.kickoff_time ? " ／ " + esc(String(m.kickoff_time).slice(0,5)) : ""}
          ${m.is_published ? " ／ 公開" : " ／ 非公開"}
        </small>
      </div>
      <button class="secondary edit">編集</button>
<button class="danger delete">削除</button>
    `;
row.querySelector(".edit").onclick = ()=>fillMatch(m);
row.querySelector(".delete").onclick = ()=>deleteMatch(m);
    root.appendChild(row);
  });
  function fillMatch(m){
  editingMatchId = m.id;
  $("mDate").value = m.match_date || "";
  $("mCategory").value = m.category || "U-12";
  $("mTitle").value = m.competition || "";
  $("mOpponent").value = m.opponent || "";
  $("mVenue").value = m.venue || "";
  $("mKickoff").value = m.kickoff_time ? String(m.kickoff_time).slice(0,5) : "";
  $("mPublished").value = String(m.is_published !== false);
  $("saveMatchBtn").textContent = "試合情報を更新";
  window.scrollTo({top:0, behavior:"smooth"});
}
async function deleteMatch(m){
  if(!confirm(`${m.match_date} ${m.opponent || ""} を削除しますか？`)) return;

  const { error } = await sb
    .from("matches")
    .delete()
    .eq("id", m.id);

  if(error){
    show("matchError", "削除できません: " + error.message);
    return;
  }

  show("matchOk", "試合を削除しました。");
  await loadMatches();
}  
} 
function clearMatch(){
  editingMatchId = null;
  $("mDate").value = "";
  $("mCategory").value = "U-12";
  $("mTitle").value = "";
  $("mOpponent").value = "";
  $("mVenue").value = "";
  $("mKickoff").value = "";
  $("mPublished").value = "true";
}

$("clearMatchBtn").onclick = clearMatch;

$("saveMatchBtn").onclick = async ()=>{
  hide("matchError");

  const matchDate = $("mDate").value;
  const opponent = $("mOpponent").value.trim();

  if(!matchDate){
    show("matchError", "日付を入力してください。");
    return;
  }

  if(!opponent){
    show("matchError", "対戦相手を入力してください。");
    return;
  }

  const payload = {
    match_date: matchDate,
    category: $("mCategory").value,
    competition: $("mTitle").value.trim(),
    opponent: opponent,
    venue: $("mVenue").value.trim(),
    kickoff_time: $("mKickoff").value || null,
    is_published: $("mPublished").value === "true"
  };

  let result;

  if(editingMatchId){
    result = await sb
      .from("matches")
      .update(payload)
      .eq("id", editingMatchId);
  }else{
    result = await sb
      .from("matches")
      .insert(payload);
  }

  if(result.error){
    show("matchError", "保存できません: " + result.error.message);
    return;
  }

  show(
    "matchOk",
    editingMatchId
      ? "試合情報を更新しました ✅"
      : "試合を登録しました ✅"
  );

  clearMatch();
  await loadMatches();
};
$("saveResultBtn").onclick = async ()=>{
  hide("resultError");

  const matchDate = $("rDate").value;
  const opponent = $("rOpponent").value.trim();

  if(!matchDate){
    show("resultError", "日付を入力してください。");
    return;
  }

  if(!opponent){
    show("resultError", "対戦相手を入力してください。");
    return;
  }

  const payload = {
    match_date: matchDate,
    category: $("rCategory").value,
    competition: $("rCompetition").value.trim(),
    opponent: opponent,
    our_score: Number($("rOurScore").value || 0),
    opponent_score: Number($("rOpponentScore").value || 0),
    venue: $("rVenue").value.trim(),
    is_published: $("rPublished").value === "true"
  };

  let result;

  if(editingResultId){
    result = await sb
      .from("match_results")
      .update(payload)
      .eq("id", editingResultId);
  }else{
    result = await sb
      .from("match_results")
      .insert(payload);
  }

  if(result.error){
    show("resultError", "保存できません: " + result.error.message);
    return;
  }

  show(
    "resultOk",
    editingResultId
      ? "試合結果を更新しました ✅"
      : "試合結果を登録しました ✅"
  );

  editingResultId = null;
  $("saveResultBtn").textContent = "試合結果を保存";

  await loadResults();
};
const resultFilterButtons = $("resultFilterButtons");

if (resultFilterButtons) {
  resultFilterButtons.onclick = (event) => {
    const btn = event.target.closest(".result-filter");
    if (!btn) return;

    resultFilterMode = btn.dataset.filter || "all";

    resultFilterButtons.querySelectorAll(".result-filter").forEach(b => {
      b.classList.remove("active");
    });

    btn.classList.add("active");
    renderResultMatchSelect();
  };
}
  const saveGalleryBtn = $("saveGalleryBtn");
const clearGalleryBtn = $("clearGalleryBtn");

function clearGalleryForm(){
  if ($("gTitle")) $("gTitle").value = "";
  if ($("gPhoto")) $("gPhoto").value = "";
  if ($("gPublished")) $("gPublished").value = "true";
  if ($("gPhotoType")) $("gPhotoType").value = "gallery";
}

if(saveGalleryBtn) {
  saveGalleryBtn.onclick = async () => {
    try {
      const year = $("gYear")?.value;
      const title = $("gTitle")?.value?.trim();
      const file = $("gPhoto")?.files?.[0];
      const published = $("gPublished")?.value === "true";
      const photoType = $("gPhotoType")?.value || "gallery";
      
      if (!year || !title || !file) {
        show("galleryError", "年度・タイトル・写真を入力してください。");
        return;
      }

      hide("galleryError");
      hide("galleryOk");

      saveGalleryBtn.disabled = true;
      saveGalleryBtn.textContent = "登録中...";

      const photoUrl = await uploadPhoto(file, "gallery");

      const { error } = await sb
        .from("gallery")
        .insert({
          year: Number(year),
          title: title,
          photo_url: photoUrl,
          published: published,
          photo_type: photoType
          
        });

      if (error) throw error;

      show("galleryOk", "写真を登録しました ✅");
      clearGalleryForm();

    } catch (error) {
      console.error("Gallery save error:", error);
      show(
        "galleryError",
        "登録に失敗しました：" + (error?.message || String(error))
      );
    } finally {
      saveGalleryBtn.disabled = false;
      saveGalleryBtn.textContent = "写真を登録";
    }
  };
} 
  if (clearGalleryBtn) {
  clearGalleryBtn.onclick = clearGalleryForm;
}
  // =========================
  // 古堅南FC CUP 管理
  // =========================

  const saveCupBtn = $("saveCupBtn");
  const clearCupBtn = $("clearCupBtn");

  function clearCupForm() {
    $("cupName").value = "";
    $("cupDate").value = "";
    $("cupOrganizer").value = "";
    $("cupVenue").value = "";
    $("cupCategory").value = "";
    $("cupFormat").value = "";
    $("cupYear").value = "";
    $("cupTeams").value = "";
    $("cupMatchStyle").value = "";
    $("cupMatchTime").value = "";
    $("cupTeamCount").value = "";
    $("cupVenueCount").value = "";
    $("cupCourtCount").value = "";
    $("cupPreliminary").value = "";
    $("cupRankingRule").value = "";
    $("cupNote").value = "";
    $("cupU12ScheduleTitle").value = "";
    $("cupU12ScheduleText").value = "";
    $("cupU10ScheduleTitle").value = "";
    $("cupU10ScheduleText").value = "";
    $("cupU12ResultTitle").value = "";
　　　$("cupU12ResultText").value = "";
　　　$("cupU10ResultTitle").value = "";
　　　$("cupU10ResultText").value = "";
    $("cupPastYear").value = "";
    $("cupPastTitle").value = "";
    $("cupPastDate").value = "";
    $("cupPastLink").value = "";
  }

  async function loadCupSettings() {
    try {
      const { data, error } = await sb
        .from("cup_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return;

      // ===== CUP 新入力方式 読み込み =====

// 大会名から「第○回」を分離
const savedCupName = data.cup_name || "";
const roundMatch = savedCupName.match(/^第(\d+)回\s*(.*)$/);

if (roundMatch) {
  $("cupRound").value = roundMatch[1];
  $("cupName").value = roundMatch[2] || "古堅南FC CUP";
} else {
  $("cupRound").value = "";
  $("cupName").value = savedCupName || "古堅南FC CUP";
}

// 開催日をカレンダーへ戻す
const parseJapaneseDate = (text) => {
  const match = String(text || "").match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (!match) return "";

  const [, y, m, d] = match;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
};

const savedDates = String(data.cup_date || "")
  .split("～")
  .map(v => v.trim());

$("cupDateStart").value = parseJapaneseDate(savedDates[0]);

$("cupDateEnd").value =
  savedDates[1]
    ? parseJapaneseDate(savedDates[1])
    : parseJapaneseDate(savedDates[0]);

// 対象カテゴリーをチェック状態へ戻す
const savedCategories = String(data.category || "")
  .split("・")
  .map(v => v.trim());

document.querySelectorAll(".cupCategoryCheck").forEach(el => {
  el.checked = savedCategories.includes(el.value);
});

$("cupCategory").value = data.category || "";

// 大会形式をプルダウンへ戻す
const formatSelect = $("cupFormatSelect");
const formatOther = $("cupFormatOther");

if (formatSelect) {
  const options = [...formatSelect.options].map(opt => opt.value);

  if (options.includes(data.format || "")) {
    formatSelect.value = data.format || "";
    if (formatOther) formatOther.value = "";
  } else if (data.format) {
    formatSelect.value = "その他";
    if (formatOther) formatOther.value = data.format;
  } else {
    formatSelect.value = "";
    if (formatOther) formatOther.value = "";
  }
}

$("cupFormat").value = data.format || "";
      $("cupYear").value = data.year || "";
      $("cupTeams").value = data.teams || "";
      $("cupMatchStyle").value = data.match_style || "";
      $("cupMatchTime").value = data.match_time || "";
      $("cupTeamCount").value = data.team_count || "";
      $("cupVenueCount").value = data.venue_count || "";
      $("cupCourtCount").value = data.court_count || "";
      $("cupPreliminary").value = data.preliminary || "";
      $("cupRankingRule").value = data.ranking_rule || "";
      $("cupNote").value = data.note || "";
      $("cupU12ScheduleTitle").value = data.u12_schedule_title || "";
      $("cupU12ScheduleText").value = data.u12_schedule_text || "";
      $("cupU10ScheduleTitle").value = data.u10_schedule_title || "";
      $("cupU10ScheduleText").value = data.u10_schedule_text || "";
      $("cupU11ScheduleTitle").value = data.u11_schedule_title || "";
      $("cupU11ScheduleText").value = data.u11_schedule_text || "";
      $("cupU9ScheduleTitle").value = data.u9_schedule_title || "";
      $("cupU9ScheduleText").value = data.u9_schedule_text || "";
      const restoreSelectWithOther = (selectId, otherId, value) => {
  const select = $(selectId);
  const other = $(otherId);

  if (!select) return;

  const options = [...select.options].map(opt => opt.value);

  if (options.includes(value || "")) {
    select.value = value || "";
    if (other) other.value = "";
  } else if (value) {
    select.value = "その他";
    if (other) other.value = value;
  } else {
    select.value = "";
    if (other) other.value = "";
  }
};
// 大会基本設定：保存済みデータ → プルダウンへ復元
restoreSelectWithOther(
  "cupMatchStyleSelect",
  "cupMatchStyleOther",
  data.match_style
);

restoreSelectWithOther(
  "cupMatchTimeSelect",
  "cupMatchTimeOther",
  data.match_time
);

restoreSelectWithOther(
  "cupTeamCountSelect",
  "cupTeamCountOther",
  data.team_count
);

restoreSelectWithOther(
  "cupVenueCountSelect",
  "cupVenueCountOther",
  data.venue_count
);

restoreSelectWithOther(
  "cupCourtCountSelect",
  "cupCourtCountOther",
  data.court_count
);

restoreSelectWithOther(
  "cupPreliminarySelect",
  "cupPreliminaryOther",
  data.preliminary
);

restoreSelectWithOther(
  "cupRankingRuleSelect",
  "cupRankingRuleOther",
  data.ranking_rule
);      
restoreSelectWithOther(
  "cupU10ScheduleTextSelect",
  "cupU10ScheduleTextOther",
  data.u10_schedule_text
);
restoreSelectWithOther(
  "cupU11ScheduleTitleSelect",
  "cupU11ScheduleTitleOther",
  data.u11_schedule_title
);

restoreSelectWithOther(
  "cupU11ScheduleTextSelect",
  "cupU11ScheduleTextOther",
  data.u11_schedule_text
);

restoreSelectWithOther(
  "cupU9ScheduleTitleSelect",
  "cupU9ScheduleTitleOther",
  data.u9_schedule_title
);

restoreSelectWithOther(
  "cupU9ScheduleTextSelect",
  "cupU9ScheduleTextOther",
  data.u9_schedule_text
);
      $("cupU12ResultTitle").value = data.u12_result_title || "";
　　　　$("cupU12ResultText").value = data.u12_result_text || "";
　　　　$("cupU10ResultTitle").value = data.u10_result_title || "";
　　　　$("cupU10ResultText").value = data.u10_result_text || "";
      const restoreRankingText = (category, text) => {
  const values = String(text || "")
    .split(" / ")
    .map(item => item.replace(/^.*?：/, "").trim());

  for (let i = 1; i <= 8; i++) {
    const el = $(`cup${category}Rank${i}`);
    if (el) el.value = values[i - 1] || "";
  }
};

restoreRankingText("U12", data.u12_result_text);
restoreRankingText("U11", data.u11_result_text);
restoreSelectWithOther("cupU10ScheduleTitleSelect","cupU10ScheduleTitleOther",data.u10_schedule_title);      
restoreRankingText("U10", data.u10_result_text);
restoreRankingText("U9", data.u9_result_text);
      $("cupPastYear").value = data.past_year || "";
      $("cupPastTitle").value = data.past_title || "";
      $("cupPastDate").value = data.past_date || "";
      $("cupPastLink").value = data.past_link || "";

    } catch (error) {
      console.error("CUP load error:", error);
    }
  }

  if (saveCupBtn) {
    saveCupBtn.onclick = async () => {
      try {
        saveCupBtn.disabled = true;
        saveCupBtn.textContent = "保存中...";
const getSelectValueWithOther = (selectId, otherId) => {
  const select = $(selectId);
  const other = $(otherId);

  if (!select) return "";

  if (select.value === "その他") {
    return other?.value.trim() || "";
  }

  return select.value || "";
};
// 大会基本設定：プルダウン → 保存用hiddenへ
$("cupMatchStyle").value = getSelectValueWithOther(
  "cupMatchStyleSelect",
  "cupMatchStyleOther"
);

$("cupMatchTime").value = getSelectValueWithOther(
  "cupMatchTimeSelect",
  "cupMatchTimeOther"
);

$("cupTeamCount").value = getSelectValueWithOther(
  "cupTeamCountSelect",
  "cupTeamCountOther"
);

$("cupVenueCount").value = getSelectValueWithOther(
  "cupVenueCountSelect",
  "cupVenueCountOther"
);

$("cupCourtCount").value = getSelectValueWithOther(
  "cupCourtCountSelect",
  "cupCourtCountOther"
);

$("cupPreliminary").value = getSelectValueWithOther(
  "cupPreliminarySelect",
  "cupPreliminaryOther"
);

$("cupRankingRule").value = getSelectValueWithOther(
  "cupRankingRuleSelect",
  "cupRankingRuleOther"
);        
 // U-12 対戦表
$("cupU12ScheduleTitle").value = getSelectValueWithOther(
  "cupU12ScheduleTitleSelect",
  "cupU12ScheduleTitleOther"
);

$("cupU12ScheduleText").value = getSelectValueWithOther(
  "cupU12ScheduleTextSelect",
  "cupU12ScheduleTextOther"
);       
// U-10 対戦表タイトル
$("cupU10ScheduleTitle").value = getSelectValueWithOther(
  "cupU10ScheduleTitleSelect",
  "cupU10ScheduleTitleOther"
);        
// U-10 対戦表説明
$("cupU10ScheduleText").value = getSelectValueWithOther(
  "cupU10ScheduleTextSelect",
  "cupU10ScheduleTextOther"
);
// U-11 対戦表
$("cupU11ScheduleTitle").value = getSelectValueWithOther(
  "cupU11ScheduleTitleSelect",
  "cupU11ScheduleTitleOther"
);

$("cupU11ScheduleText").value = getSelectValueWithOther(
  "cupU11ScheduleTextSelect",
  "cupU11ScheduleTextOther"
);

// U-9 対戦表
$("cupU9ScheduleTitle").value = getSelectValueWithOther(
  "cupU9ScheduleTitleSelect",
  "cupU9ScheduleTitleOther"
);

$("cupU9ScheduleText").value = getSelectValueWithOther(
  "cupU9ScheduleTextSelect",
  "cupU9ScheduleTextOther"
);        
// ===== CUP 新入力方式を保存用データに変換 =====

// 大会回数
const cupRound = $("cupRound")?.value || "";

// 大会名
const baseCupName = $("cupName")?.value.trim() || "古堅南FC CUP";
const cupNameForSave = cupRound
  ? `第${cupRound}回 ${baseCupName}`
  : baseCupName;

// 開催日
const dateStart = $("cupDateStart")?.value || "";
const dateEnd = $("cupDateEnd")?.value || "";

const formatDateJP = (value) => {
  if (!value) return "";
  const [y, m, d] = value.split("-");
  return `${Number(y)}年${Number(m)}月${Number(d)}日`;
};

let cupDateForSave = formatDateJP(dateStart);

if (dateStart && dateEnd && dateStart !== dateEnd) {
  cupDateForSave =
    `${formatDateJP(dateStart)} ～ ${formatDateJP(dateEnd)}`;
}

// 対象カテゴリー
const selectedCategories = [
  ...document.querySelectorAll(".cupCategoryCheck:checked")
].map(el => el.value);

const cupCategoryForSave = selectedCategories.join("・");

// 大会形式
const formatSelect = $("cupFormatSelect")?.value || "";
const formatOther = $("cupFormatOther")?.value.trim() || "";

const cupFormatForSave =
  formatSelect === "その他"
    ? formatOther
    : formatSelect;

// 順位を文章にまとめる
const makeRankingText = (category) => {
  const labels = [
    "優勝", "2位", "3位", "4位",
    "5位", "6位", "7位", "8位"
  ];

  return labels.map((label, index) => {
    const value =
      $(`cup${category}Rank${index + 1}`)?.value.trim() || "";

    return value ? `${label}：${value}` : "";
  })
  .filter(Boolean)
  .join(" / ");
};

const u12RankingText = makeRankingText("U12");
const u11RankingText = makeRankingText("U11");
const u10RankingText = makeRankingText("U10");
const u9RankingText  = makeRankingText("U9");

// 既存の公開ページ互換用
$("cupCategory").value = cupCategoryForSave;
$("cupFormat").value = cupFormatForSave;

$("cupU12ResultTitle").value = "U-12 大会結果";
$("cupU12ResultText").value = u12RankingText;

$("cupU10ResultTitle").value = "U-10 大会結果";
$("cupU10ResultText").value = u10RankingText;
        const payload = {
          id: 1,
                      cup_name: cupNameForSave,
                      cup_date: cupDateForSave,
          organizer: $("cupOrganizer").value.trim(),
              venue: $("cupVenue").value.trim(),
                       category: cupCategoryForSave,
                       format: cupFormatForSave,
               year: $("cupYear").value.trim(),
              teams: $("cupTeams").value.trim(),
        match_style: $("cupMatchStyle").value.trim(),
         match_time: $("cupMatchTime").value.trim(),
         team_count: $("cupTeamCount").value.trim(),
        venue_count: $("cupVenueCount").value.trim(),
        court_count: $("cupCourtCount").value.trim(),
        preliminary: $("cupPreliminary").value.trim(),
       ranking_rule: $("cupRankingRule").value.trim(),
               note: $("cupNote").value.trim(),
 u12_schedule_title: $("cupU12ScheduleTitle").value.trim(),
  u12_schedule_text: $("cupU12ScheduleText").value.trim(),
 u10_schedule_title: $("cupU10ScheduleTitle").value.trim(),
  u10_schedule_text: $("cupU10ScheduleText").value.trim(),
 u11_schedule_title: $("cupU11ScheduleTitle").value.trim(),
  u11_schedule_text: $("cupU11ScheduleText").value.trim(),
  u9_schedule_title: $("cupU9ScheduleTitle").value.trim(),
   u9_schedule_text: $("cupU9ScheduleText").value.trim(),        
   u12_result_title: $("cupU12ResultTitle").value.trim(),
    u12_result_text: $("cupU12ResultText").value.trim(),
   u10_result_title: $("cupU10ResultTitle").value.trim(),
    u10_result_text: $("cupU10ResultText").value.trim(),
    u11_result_title: "U-11 大会結果",
    u11_result_text: u11RankingText,
   u9_result_title: "U-9 大会結果",
   u9_result_text: u9RankingText,      
          past_year: $("cupPastYear").value.trim(),
         past_title: $("cupPastTitle").value.trim(),
          past_date: $("cupPastDate").value.trim(),
          past_link: $("cupPastLink").value.trim(),          
          updated_at: new Date().toISOString()
        };

        const { error } = await sb
          .from("cup_settings")
          .upsert(payload, { onConflict: "id" });

        if (error) throw error;

        show("cupOk", "CUP情報を保存しました ✅");

      } catch (error) {
        console.error("CUP save error:", error);

        show(
          "cupError",
          "CUP情報の保存に失敗しました：" +
          (error?.message || String(error))
        );

      } finally {
        saveCupBtn.disabled = false;
        saveCupBtn.textContent = "CUP情報を保存";
      }
    };
  }

  if (clearCupBtn) {
    clearCupBtn.onclick = clearCupForm;
  }

  loadCupSettings();  
  init();
})();
