document.addEventListener("DOMContentLoaded", async () => {
  if (!getToken()) { window.location.href = "login.html"; return; }

  let allMatches = [];
  const grid = document.getElementById("matches-grid");

  function renderMatches(matches) {
    if (!matches.length) {
      grid.innerHTML = "<p class='loading'>No matches found. Add more skills to your profile!</p>";
      return;
    }
    grid.innerHTML = matches.map(m => `
      <div class="match-card">
        <div class="match-header">
          <img src="${m.user.avatar || "../assets/images/default-avatar.png"}" alt="avatar" />
          <div>
            <h4>${m.user.name}</h4>
            <span class="uni">${m.user.university || ""}</span>
          </div>
        </div>
        <span class="match-score">${m.score}% match</span>
        <div class="skill-pills">
          ${m.they_teach_me.map(s => `<span class="pill offer">Teaches ${s.name}</span>`).join("")}
          ${m.i_teach_them.map(s  => `<span class="pill want">Wants ${s.name}</span>`).join("")}
        </div>
        ${m.user.avg_rating ? `<span style="font-size:.85rem;color:#f59e0b">★ ${m.user.avg_rating}</span>` : ""}
        <div style="display:flex;gap:.5rem;margin-top:.5rem">
          <a href="profile.html?id=${m.user.id}" class="btn-outline btn-sm">View Profile</a>
          <button class="btn-primary btn-sm"
            data-receiver="${m.user.id}"
            data-skills='${JSON.stringify([...m.they_teach_me, ...m.i_teach_them])}'>
            Request Swap
          </button>
        </div>
      </div>`).join("");
  }

  allMatches = await api.matches.list().catch(() => []);
  renderMatches(allMatches);

  // --- filter ---
  document.getElementById("apply-filters").addEventListener("click", () => {
    const skillFilter  = document.getElementById("filter-skill").value.toLowerCase().trim();
    const ratingFilter = parseFloat(document.getElementById("filter-rating").value) || 0;

    const filtered = allMatches.filter(m => {
      const allSkillNames = [
        ...m.they_teach_me.map(s => s.name.toLowerCase()),
        ...m.i_teach_them.map(s  => s.name.toLowerCase()),
      ];
      const skillOk  = !skillFilter  || allSkillNames.some(n => n.includes(skillFilter));
      const ratingOk = !ratingFilter || (m.user.avg_rating ?? 0) >= ratingFilter;
      return skillOk && ratingOk;
    });

    renderMatches(filtered);
  });

  // reset filter when input is cleared
  document.getElementById("filter-skill").addEventListener("input", (e) => {
    if (!e.target.value) renderMatches(allMatches);
  });

  // --- request swap (delegated, works after re-render) ---
  grid.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-receiver]");
    if (!btn) return;

    const receiverId = parseInt(btn.dataset.receiver);
    const skills     = JSON.parse(btn.dataset.skills);

    if (!skills.length) {
      alert("No overlapping skills to swap.");
      return;
    }

    let skillId;
    if (skills.length === 1) {
      skillId = skills[0].id;
    } else {
      const options = skills.map((s, i) => `${i + 1}. ${s.name}`).join("\n");
      const choice  = prompt(`Which skill do you want to learn?\n\n${options}\n\nEnter number:`);
      if (!choice) return;
      const idx = parseInt(choice) - 1;
      if (isNaN(idx) || !skills[idx]) { alert("Invalid choice."); return; }
      skillId = skills[idx].id;
    }

    try {
      await api.sessions.create({ receiver_id: receiverId, skill_id: skillId });
      alert("Swap request sent!");
    } catch (err) {
      alert(err.message);
    }
  });

  document.getElementById("logout-btn").addEventListener("click", (e) => {
    e.preventDefault(); localStorage.clear(); window.location.href = "login.html";
  });
});
