// Ver.1.8 Supabase公開データ読み込み
(function(){
  function configured(){
    const c = window.FURUGEN_SUPABASE || {};
    return !!(
      window.supabase &&
      c.url &&
      c.anonKey &&
      !String(c.url).includes("YOUR_SUPABASE") &&
      !String(c.anonKey).includes("YOUR_SUPABASE")
    );
  }

  function client(){
    if(!configured()) return null;
    if(!window.__furugenSupabaseClient){
      window.__furugenSupabaseClient = window.supabase.createClient(
        window.FURUGEN_SUPABASE.url,
        window.FURUGEN_SUPABASE.anonKey
      );
    }
    return window.__furugenSupabaseClient;
  }

  async function loadPlayers(){
    const sb = client();
    if(!sb) return null;

    const { data, error } = await sb
      .from("players")
      .select("*")
      .eq("is_published", true)
      .order("category", { ascending:true })
      .order("number", { ascending:true });

    if(error) throw error;

    return (data || []).map(x => ({
      id: x.id,
      category: x.category,
      number: x.number,
      name: x.name,
      nameKana: x.name_kana || "",
      grade: x.grade || "",
      position: x.position || "",
      dominantFoot: x.dominant_foot || "",
      profile: x.profile || "",
      photo: x.photo_url || "",
      photoPosition: x.photo_position || "center 35%",
      photoFit: "cover",
      captain: x.captain === true,
      isPublished: x.is_published !== false
    }));
  }

  async function loadStaff(){
    const sb = client();
    if(!sb) return null;

    const { data, error } = await sb
      .from("staff")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending:true })
      .order("created_at", { ascending:true });

    if(error) throw error;

    return (data || []).map(x => ({
      id: x.id,
      group: x.staff_group,
      role: x.role,
      name: x.name,
      nameKana: x.name_kana || "",
      category: x.category || "",
      license: x.license || "",
      career: x.career || "",
      message: x.message || "",
      photo: x.photo_url || "",
      photoPosition: x.photo_position || "center 35%",
      snsLabel: x.sns_label || "",
      snsUrl: x.sns_url || "",
      isPublished: x.is_published !== false
    }));
  }

  window.FurugenPublicData = {
    configured,
    client,
    loadPlayers,
    loadStaff
  };
})();
