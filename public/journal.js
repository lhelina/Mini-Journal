const saveBtn = document.getElementById("saveBtn");
const myjournals = document.getElementById("myjournals");
const username = localStorage.getItem("username");
const showBtn = document.getElementById("showJournalsBtn");
showBtn.addEventListener("click", loadJournals);

async function loadJournals() {
  const res = await fetch(`http://localhost:3000/journal/${username}`);
  const journals = await res.json();

  myjournals.innerHTML = journals
    .map(
      (j) => `
        <div class="entry">
          <h3>${j.title}</h3>
          <p>${j.content}</p>
          <small>${new Date(j.created_at).toLocaleString()}</small>
        </div>
      `
    )
    .join("");
}
saveBtn.addEventListener("click", async () => {
  const title = document.getElementById("title").value.trim();
  const content = document.getElementById("content").value.trim();
  if (!title || !content) {
    alert("Please write both title and content.");
    return;
  }
  const res = await fetch("http://localhost:3000/add-journal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, title, content }),
  });

  const result = await res.json();
  alert(result.message);
  if (res.ok) loadJournals();
  // refresh list
});
loadJournals();

saveBtn.onclick = function () {};
myjournals.onclick = function () {};
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("username");
  window.location.href = "index.html"; // back to home page
});
