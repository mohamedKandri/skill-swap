// review state — global so openReview() (called via inline onclick) can reach it
let reviewSessionId = null;
let revieweeId      = null;
let reviewRating    = 0;

function openReview(sessionId, otherId) {
  reviewSessionId = sessionId;
  revieweeId      = otherId;
  reviewRating    = 0;
  document.getElementById("review-comment").value = "";
  document.getElementById("review-error").classList.add("hidden");
  document.querySelectorAll(".star-rating span").forEach(s => s.classList.remove("active"));
  document.getElementById("review-modal").classList.remove("hidden");
}

async function updateStatus(sessionId, status) {
  try {
    await api.sessions.update(sessionId, { status });
    window.location.reload();
  } catch (err) {
    alert(err.message);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  if (!getToken()) { window.location.href = "login.html"; return; }

  const me = JSON.parse(localStorage.getItem("user") || "{}");

  const spinner = '<div class="spinner"></div>';
  document.getElementById("pending-list").innerHTML  = spinner;
  document.getElementById("upcoming-list").innerHTML = spinner;
  document.getElementById("past-list").innerHTML     = spinner;
  document.getElementById("matches-list").innerHTML  = spinner;

  const [sessions, matches] = await Promise.all([
    api.sessions.list().catch(() => []),
    api.matches.list().catch(() => []),
  ]);

  const now      = new Date();
  const pending  = sessions.filter(s => s.status === "pending");
  const upcoming = sessions.filter(s => s.status === "accepted" && s.date && new Date(s.date) > now);
  const past     = sessions.filter(s => s.status === "completed" || (s.date && new Date(s.date) < now));

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
          ? `<button class="btn-outline btn-sm" onclick="openReview(${s.id},${other.id})">Leave Review</button>`
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

  // --- review modal wiring ---
  const reviewModal = document.getElementById("review-modal");
  const reviewError = document.getElementById("review-error");
  const stars       = reviewModal.querySelectorAll(".star-rating span");

  function setStars(val) {
    reviewRating = val;
    stars.forEach(s => s.classList.toggle("active", parseInt(s.dataset.val) <= val));
  }

  stars.forEach(s => {
    s.addEventListener("click",      () => setStars(parseInt(s.dataset.val)));
    s.addEventListener("mouseover",  () => stars.forEach(x => x.classList.toggle("active", parseInt(x.dataset.val) <= parseInt(s.dataset.val))));
    s.addEventListener("mouseleave", () => setStars(reviewRating));
  });

  document.getElementById("review-cancel")?.addEventListener("click", () => reviewModal.classList.add("hidden"));
  reviewModal?.addEventListener("click", (e) => { if (e.target === reviewModal) reviewModal.classList.add("hidden"); });

  document.getElementById("review-submit")?.addEventListener("click", async () => {
    if (!reviewRating) {
      reviewError.textContent = "Please select a star rating.";
      reviewError.classList.remove("hidden");
      return;
    }
    try {
      await api.reviews.create({
        session_id:  reviewSessionId,
        reviewee_id: revieweeId,
        rating:      reviewRating,
        comment:     document.getElementById("review-comment").value.trim(),
      });
      reviewModal.classList.add("hidden");
      window.location.reload();
    } catch (err) {
      reviewError.textContent = err.message;
      reviewError.classList.remove("hidden");
    }
  });
});
