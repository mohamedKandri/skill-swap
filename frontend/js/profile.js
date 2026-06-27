document.addEventListener("DOMContentLoaded", async () => {
  if (!getToken()) { window.location.href = "login.html"; return; }

  const params = new URLSearchParams(window.location.search);
  const userId = params.get("id");
  const isOwn  = !userId;

  let currentUser = null;

  async function loadProfile() {
    document.getElementById("user-name").textContent = "";
    document.querySelector(".profile-page").insertAdjacentHTML("afterbegin", '<div id="profile-spinner" class="spinner"></div>');
    currentUser = userId ? await api.profile.get(userId) : await api.profile.me();
    document.getElementById("profile-spinner")?.remove();

    document.getElementById("user-name").textContent       = currentUser.name;
    document.getElementById("user-university").textContent = currentUser.university || "";
    document.getElementById("user-bio").textContent        = currentUser.bio || "No bio yet.";
    document.getElementById("user-rating").textContent     =
      currentUser.avg_rating ? `★ ${currentUser.avg_rating}` : "No ratings yet";
    if (currentUser.avatar)
      document.getElementById("avatar").src = currentUser.avatar;

    renderSkills(currentUser.skills || []);
  }

  function renderSkills(skills) {
    const offerList = document.getElementById("skills-offer");
    const wantList  = document.getElementById("skills-want");
    offerList.innerHTML = "";
    wantList.innerHTML  = "";

    skills.forEach(({ skill, type }) => {
      const li = document.createElement("li");
      li.className = "skill-tag";
      li.innerHTML = skill.name +
        (isOwn ? ` <span class="remove" data-id="${skill.id}" data-type="${type}">✕</span>` : "");
      (type === "offer" ? offerList : wantList).appendChild(li);
    });
  }

  await loadProfile();

  if (!isOwn) {
    document.getElementById("edit-btn")?.remove();
    document.getElementById("add-offer-btn")?.remove();
    document.getElementById("add-want-btn")?.remove();
    const msgBtn = document.getElementById("msg-btn");
    if (msgBtn) {
      msgBtn.href = `messages.html?with=${userId}`;
      msgBtn.classList.remove("hidden");
    }
  }

  // --- remove skill ---
  document.addEventListener("click", async (e) => {
    if (!e.target.classList.contains("remove")) return;
    await api.skills.remove(e.target.dataset.id, e.target.dataset.type);
    await loadProfile();
  });

  // --- add skill modal ---
  const addSkillModal = document.getElementById("add-skill-modal");
  const addSkillInput = document.getElementById("add-skill-input");
  const addSkillError = document.getElementById("add-skill-error");
  let addSkillType = "offer";

  function openAddSkillModal(type) {
    addSkillType = type;
    document.getElementById("add-skill-title").textContent =
      type === "offer" ? "Add a Skill You Offer" : "Add a Skill You Want to Learn";
    addSkillInput.value = "";
    addSkillError.classList.add("hidden");
    addSkillModal.classList.remove("hidden");
    setTimeout(() => addSkillInput.focus(), 50);
  }

  document.getElementById("add-skill-cancel")?.addEventListener("click", () => addSkillModal.classList.add("hidden"));
  addSkillModal?.addEventListener("click", (e) => { if (e.target === addSkillModal) addSkillModal.classList.add("hidden"); });

  document.getElementById("add-skill-save")?.addEventListener("click", async () => {
    const name = addSkillInput.value.trim();
    if (!name) {
      addSkillError.textContent = "Please enter a skill name.";
      addSkillError.classList.remove("hidden");
      return;
    }
    try {
      await api.skills.add({ name, type: addSkillType });
      addSkillModal.classList.add("hidden");
      await loadProfile();
    } catch (err) {
      addSkillError.textContent = err.message;
      addSkillError.classList.remove("hidden");
    }
  });

  addSkillInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("add-skill-save")?.click();
  });

  document.getElementById("add-offer-btn")?.addEventListener("click", () => openAddSkillModal("offer"));
  document.getElementById("add-want-btn")?.addEventListener("click",  () => openAddSkillModal("want"));

  // --- edit profile modal ---
  const modal      = document.getElementById("edit-modal");
  const editBtn    = document.getElementById("edit-btn");
  const cancelBtn  = document.getElementById("edit-cancel");
  const saveBtn    = document.getElementById("edit-save");

  editBtn?.addEventListener("click", () => {
    document.getElementById("edit-name").value       = currentUser.name || "";
    document.getElementById("edit-bio").value        = currentUser.bio  || "";
    document.getElementById("edit-university").value = currentUser.university || "";
    modal.classList.remove("hidden");
  });

  cancelBtn?.addEventListener("click", () => modal.classList.add("hidden"));

  modal?.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.add("hidden");
  });

  saveBtn?.addEventListener("click", async () => {
    try {
      await api.profile.update({
        name:       document.getElementById("edit-name").value.trim(),
        bio:        document.getElementById("edit-bio").value.trim(),
        university: document.getElementById("edit-university").value.trim(),
      });
      modal.classList.add("hidden");
      await loadProfile();
    } catch (err) {
      alert(err.message);
    }
  });

  // --- reviews ---
  async function loadReviews() {
    const reviews = await api.reviews.forUser(currentUser.id).catch(() => []);
    const list = document.getElementById("reviews-list");
    list.innerHTML = reviews.length
      ? reviews.map(r => `
          <div style="padding:.75rem 0; border-bottom:1px solid var(--border)">
            <strong>${r.reviewer.name}</strong>
            <span style="color:#f59e0b"> ${"★".repeat(r.rating)}</span>
            <p style="font-size:.875rem; color:var(--muted); margin-top:.25rem">${r.comment}</p>
          </div>`).join("")
      : "<p style='color:var(--muted)'>No reviews yet.</p>";
  }
  await loadReviews();

  // --- logout ---
  document.getElementById("logout-btn")?.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.clear();
    window.location.href = "login.html";
  });
});
