(() => {
  const list = document.getElementById("resultsList");
  const filters = document.querySelectorAll(".result-filter");

  if (!list) return;

  let allResults = [];
  let selectedCategory = "all";

  function esc(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function render() {
    const rows = selectedCategory === "all"
      ? allResults
      : allResults.filter(r => r.category === selectedCategory);

    if (!rows.length) {
      list.innerHTML = "<p>現在、公開中の試合結果はありません。</p>";
      return;
    }

    list.innerHTML = rows.map(r => {
      const ourScore = Number(r.our_score ?? 0);
      const opponentScore = Number(r.opponent_score ?? 0);

      let result = "△";
      if (ourScore > opponentScore) result = "○";
      if (ourScore < opponentScore) result = "●";

      return `
        <div class="result-card" style="margin-bottom:16px;padding:16px;border:1px solid #ddd;border-radius:12px;">
          <div style="font-size:13px;margin-bottom:6px;">
            ${esc(r.match_date)}　${esc(r.category)}
          </div>

          <div style="font-size:20px;font-weight:700;">
            ${result} 古堅南FC
            ${ourScore} - ${opponentScore}
            ${esc(r.opponent)}
          </div>

          <div style="font-size:13px;margin-top:6px;">
            ${esc(r.competition || "")}
            ${r.venue ? " / " + esc(r.venue) : ""}
          </div>
        </div>
      `;
    }).join("");
  }

  async function loadResults() {
    list.innerHTML = "<p>読み込み中...</p>";

    try {
      if (typeof sb === "undefined") {
        throw new Error("Supabase設定を読み込めませんでした。");
      }

      const { data, error } = await sb
        .from("match_results")
        .select("*")
        .eq("is_published", true)
        .order("match_date", { ascending: false });

      if (error) throw error;

      allResults = data || [];
      render();

    } catch (error) {
      console.error(error);
      list.innerHTML =
        "<p>試合結果を読み込めませんでした。</p>";
    }
  }

  filters.forEach(button => {
    button.addEventListener("click", () => {
      filters.forEach(b => b.classList.remove("active"));
      button.classList.add("active");

      selectedCategory = button.dataset.category || "all";
      render();
    });
  });

  loadResults();
})();
