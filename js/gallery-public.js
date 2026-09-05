(async () => {
  const cfg = window.FURUGEN_SUPABASE || {};

  if (!window.supabase || !cfg.url || !cfg.anonKey) {
    console.error("Supabase設定が見つかりません");
    return;
  }

  const sb = window.supabase.createClient(cfg.url, cfg.anonKey);

  const { data, error } = await sb
    .from("gallery")
    .select("*")
    .eq("published", true)
    .order("year", { ascending: false });

  if (error) {
    console.error("Gallery load error:", error);
    return;
  }

  if (!data || data.length === 0) {
    console.log("公開ギャラリー写真はありません");
    return;
  }

  const main = document.querySelector("main");
  if (!main) return;

  const section = document.createElement("section");
  section.style.padding = "40px 20px";

  const wrap = document.createElement("div");
  wrap.className = "wrap";

  const heading = document.createElement("h2");
  heading.textContent = "ギャラリー写真";
  wrap.appendChild(heading);

  const grid = document.createElement("div");
  grid.style.display = "grid";
  grid.style.gridTemplateColumns =
    "repeat(auto-fit, minmax(240px, 1fr))";
  grid.style.gap = "20px";
  grid.style.marginTop = "24px";

  data.forEach(item => {
    const card = document.createElement("article");

    card.style.background = "#fff";
    card.style.borderRadius = "14px";
    card.style.overflow = "hidden";
    card.style.boxShadow = "0 4px 16px rgba(0,0,0,.10)";

    const img = document.createElement("img");
    img.src = item.photo_url;
    img.alt = item.title || "古堅南FC ギャラリー";
    img.loading = "lazy";
    img.style.width = "100%";
    img.style.height = "240px";
    img.style.objectFit = "cover";
    img.style.display = "block";

    const info = document.createElement("div");
    info.style.padding = "14px";

    const title = document.createElement("strong");
    title.textContent = item.title || "古堅南FC";

    const year = document.createElement("div");
    year.textContent = item.year ? `${item.year}年度` : "";
    year.style.marginTop = "6px";
    year.style.fontSize = "14px";
    year.style.opacity = ".7";

    info.appendChild(title);
    info.appendChild(year);

    card.appendChild(img);
    card.appendChild(info);
    grid.appendChild(card);
  });

  wrap.appendChild(grid);
  section.appendChild(wrap);

  const footer = document.querySelector(".site-footer");

  if (footer) {
    main.insertBefore(section, footer);
  } else {
    main.appendChild(section);
  }
})();
