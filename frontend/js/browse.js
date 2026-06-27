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
        <div style="display:flex;gap:.5rem;margin-top:.5rem;flex-wrap:wrap">
          <a href="profile.html?id=${m.user.id}" class="btn-outline btn-sm">View Profile</a>
          <a href="messages.html?with=${m.user.id}" class="btn-outline btn-sm">Message</a>
          <button class="btn-primary btn-sm"
            data-receiver="${m.user.id}"
            data-skills='${JSON.stringify([...m.they_teach_me, ...m.i_teach_them])}'>
            Request Swap
          </button>
        </div>
      </div>`).join("");
  }

  grid.innerHTML = '<div class="spinner"></div>';
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

  // --- request swap modal ---
  let swapReceiverId = null;
  let swapSkills = [];
  const swapModal   = document.getElementById("swap-modal");
  const swapSelect  = document.getElementById("swap-skill-select");
  const swapError   = document.getElementById("swap-error");

  grid.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-receiver]");
    if (!btn) return;

    swapReceiverId = parseInt(btn.dataset.receiver);
    swapSkills     = JSON.parse(btn.dataset.skills);

    if (!swapSkills.length) return;

    swapSelect.innerHTML = swapSkills.map(s => `<option value="${s.id}">${s.name}</option>`).join("");
    document.getElementById("swap-date").value = "";
    swapError.classList.add("hidden");
    swapModal.classList.remove("hidden");
  });

  document.getElementById("swap-cancel")?.addEventListener("click", () => swapModal.classList.add("hidden"));
  swapModal?.addEventListener("click", (e) => { if (e.target === swapModal) swapModal.classList.add("hidden"); });

  document.getElementById("swap-confirm")?.addEventListener("click", async () => {
    const skillId = parseInt(swapSelect.value);
    const date    = document.getElementById("swap-date").value;
    const format  = document.getElementById("swap-format").value;

    try {
      await api.sessions.create({
        receiver_id: swapReceiverId,
        skill_id:    skillId,
        format,
        ...(date ? { date } : {}),
      });
      swapModal.classList.add("hidden");
      const btn = document.querySelector(`[data-receiver="${swapReceiverId}"]`);
      if (btn) { btn.textContent = "Requested ✓"; btn.disabled = true; }
    } catch (err) {
      swapError.textContent = err.message;
      swapError.classList.remove("hidden");
    }
  });

  document.getElementById("logout-btn").addEventListener("click", (e) => {
    e.preventDefault(); localStorage.clear(); window.location.href = "login.html";
  });
});
