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
    resultManager: $("resultManager")
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
  await Promise.all([loadPlayers(), loadStaff(), loadMatches(), loadResults()]);
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
}
function renderResultMatchSelect(){
  const select = $("resultMatchSelect");
  if(!select) return;

  const currentValue = select.value;
  select.innerHTML = '<option value="">試合を選択してください</option>';

  currentMatches.forEach(m=>{
    const option = document.createElement("option");
    option.value = m.id;

    const date = m.match_date || "";
    const category = m.category || "";
    const competition = m.competition || "";
    const opponent = m.opponent || "";

    option.textContent =
      `${date}｜${category}｜${competition}｜vs ${opponent}`;

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

  init();
})();
