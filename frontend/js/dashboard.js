document.addEventListener("DOMContentLoaded", async () => {
  if (!getToken()) { window.location.href = "login.html"; return; }

  const me = JSON.parse(localStorage.getItem("user") || "{}");

  const [sessions, matches] = await Promise.all([
    api.sessions.list().catch(() => []),
    api.matches.list().catch(() => []),
  ]);

  const now = new Date();
  const pending   = sessions.filter(s => s.status === "pending");
  const upcoming  = sessions.filter(s => s.status === "accepted" && s.date && new Date(s.date) > now);
  const past      = sessions.filter(s => s.status === "completed" || (s.date && new Date(s.date) < now));

  document.getElementById("pending-count").textContent = pending.length;
  if (!pending.length) document.getElementById("pending-count").classList.add("hidden");

  function sessionCard(s) {
    const other = s.requester.id === me.id ? s.receiver : s.requester;
    const actions = s.status === "pending" && s.receiver.id === me.id
      ? `<button class="btn-primary btn-sm" onclick="updateStatus(${s.id},'accepted')">Accept</button>
         <button class="btn-outline btn-sm"  onclick="updateStatus(${s.id},'declined')">Decline</button>`
      : s.status === "accepted"
        ? `<button class="btn-outline btn-sm" onclick="updateStatus(${s.id},'cancelled')">Cancel</button>`
        : s.status === "completed"
          ? `<a href="profile.html?id=${other.id}" class="btn-outline btn-sm">Leave Review</a>`
          : "";
    return `
      <div class="session-card">
        <div class="info">
          <strong>${other.name}</strong>
          <span>${s.skill.name} · ${s.format} · ${s.date ? new Date(s.date).toLocaleDateString() : "TBD"}</span>
        </div>
        <span class="status-badge ${s.status}">${s.status}</span>
        <div style="display:flex;gap:.5rem">${actions}</div>
      </div>`;
  }

  document.getElementById("pending-list").innerHTML  = pending.map(sessionCard).join("") || "<p class='loading'>No pending requests.</p>";
  document.getElementById("upcoming-list").innerHTML = upcoming.map(sessionCard).join("") || "<p class='loading'>No upcoming sessions.</p>";
  document.getElementById("past-list").innerHTML     = past.map(sessionCard).join("")    || "<p class='loading'>No past sessions.</p>";

  document.getElementById("matches-list").innerHTML = matches.slice(0, 5).map(m => `
    <div class="session-card">
      <div class="info">
        <strong>${m.user.name}</strong>
        <span>${m.user.university || ""}</span>
      </div>
      <span class="match-score" style="background:#dcfce7;color:#16a34a;padding:.2rem .6rem;border-radius:999px;font-size:.8rem">${m.score}%</span>
      <a href="browse.html" class="btn-outline btn-sm">View</a>
    </div>`).join("") || "<p class='loading'>No matches yet. Add skills to your profile!</p>";

  document.getElementById("logout-btn").addEventListener("click", (e) => {
    e.preventDefault(); localStorage.clear(); window.location.href = "login.html";
  });
});

async function updateStatus(sessionId, status) {
  try {
    await api.sessions.update(sessionId, { status });
    window.location.reload();
  } catch (err) {
    alert(err.message);
  }
}
