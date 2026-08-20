
async function loadCategory(category) {
  const file = `../data/2026/${category.toLowerCase()}.json`;
  const res = await fetch(file);
  const data = await res.json();
  document.title = `古堅南FC ${data.category}｜${data.year}年度`;
  document.querySelector("#categoryTitle").textContent = data.category;
  document.querySelector("#categoryGrades").textContent = data.grades;
  document.querySelector("#categoryIntro").textContent = data.intro;
}
const params = new URLSearchParams(location.search);
const cat = params.get("category");
if (cat) loadCategory(cat).catch(() => {});
