document.addEventListener("DOMContentLoaded", async () => {
  if (!getToken()) { window.location.href = "login.html"; return; }

  const me = JSON.parse(localStorage.getItem("user") || "{}");
  let activeUserId = null;

  const convoItems     = document.getElementById("convo-items");
  const noConvo        = document.getElementById("no-convo");
  const threadHeader   = document.getElementById("thread-header");
  const threadMessages = document.getElementById("thread-messages");
  const threadInput    = document.getElementById("thread-input");
  const msgInput       = document.getElementById("msg-input");

  // Support opening a conversation directly via ?with=<userId>
  const params = new URLSearchParams(window.location.search);
  const directUserId = params.get("with") ? parseInt(params.get("with")) : null;

  async function loadConversations() {
    const convos = await api.messages.conversations().catch(() => []);
    convoItems.innerHTML = convos.length
      ? convos.map(c => `
          <div class="convo-item${activeUserId === c.user.id ? " active" : ""}"
               data-uid="${c.user.id}" data-name="${c.user.name}">
            <strong>${c.user.name}</strong>
            <span>${c.last_message}</span>
          </div>`).join("")
      : "<p class='loading'>No conversations yet.</p>";

    convoItems.querySelectorAll(".convo-item").forEach(el => {
      el.addEventListener("click", () => openThread(parseInt(el.dataset.uid), el.dataset.name));
    });
  }

  async function openThread(userId, userName) {
    activeUserId = userId;
    noConvo.classList.add("hidden");
    threadHeader.classList.remove("hidden");
    threadMessages.classList.remove("hidden");
    threadInput.classList.remove("hidden");
    threadHeader.textContent = userName;
    threadMessages.innerHTML = '<div class="spinner"></div>';

    // highlight active convo
    convoItems.querySelectorAll(".convo-item").forEach(el => {
      el.classList.toggle("active", parseInt(el.dataset.uid) === userId);
    });

    const msgs = await api.messages.thread(userId).catch(() => []);
    renderMessages(msgs);
  }

  function renderMessages(msgs) {
    threadMessages.innerHTML = msgs.length
      ? msgs.map(m => {
          const mine = m.sender_id === me.id;
          const t = new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          return `<div class="msg-bubble ${mine ? "mine" : "theirs"}">${escHtml(m.body)}<time>${t}</time></div>`;
        }).join("")
      : "<p class='loading'>No messages yet. Say hi!</p>";
    threadMessages.scrollTop = threadMessages.scrollHeight;
  }

  function escHtml(str) {
    return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  }

  async function sendMessage() {
    const body = msgInput.value.trim();
    if (!body || !activeUserId) return;
    msgInput.value = "";
    try {
      await api.messages.send({ receiver_id: activeUserId, body });
      const msgs = await api.messages.thread(activeUserId);
      renderMessages(msgs);
      await loadConversations();
    } catch (err) {
      alert(err.message);
    }
  }

  document.getElementById("msg-send").addEventListener("click", sendMessage);
  msgInput.addEventListener("keydown", (e) => { if (e.key === "Enter") sendMessage(); });

  document.getElementById("logout-btn").addEventListener("click", (e) => {
    e.preventDefault(); localStorage.clear(); window.location.href = "login.html";
  });

  await loadConversations();

  // auto-open thread if ?with= param is present
  if (directUserId) {
    const profile = await api.profile.get(directUserId).catch(() => null);
    if (profile) openThread(directUserId, profile.name);
  }
});
