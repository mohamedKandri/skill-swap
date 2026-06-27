const BASE = "http://localhost:5000/api";

function getToken() {
  return localStorage.getItem("token");
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

const api = {
  auth: {
    register: (data) => apiFetch("/auth/register", { method: "POST", body: JSON.stringify(data) }),
    login:    (data) => apiFetch("/auth/login",    { method: "POST", body: JSON.stringify(data) }),
  },
  profile: {
    me:     ()     => apiFetch("/profile/me"),
    update: (data) => apiFetch("/profile/me", { method: "PUT", body: JSON.stringify(data) }),
    get:    (id)   => apiFetch(`/profile/${id}`),
  },
  skills: {
    list:   ()     => apiFetch("/skills/"),
    add:    (data) => apiFetch("/skills/",       { method: "POST",   body: JSON.stringify(data) }),
    remove: (id, type) => apiFetch(`/skills/${id}?type=${type}`, { method: "DELETE" }),
  },
  matches: {
    list: () => apiFetch("/matches/"),
  },
  sessions: {
    create: (data) => apiFetch("/sessions/",      { method: "POST",  body: JSON.stringify(data) }),
    list:   ()     => apiFetch("/sessions/"),
    update: (id, data) => apiFetch(`/sessions/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  },
  reviews: {
    create:  (data) => apiFetch("/reviews/",             { method: "POST", body: JSON.stringify(data) }),
    forUser: (id)   => apiFetch(`/reviews/user/${id}`),
  },
  messages: {
    conversations: ()     => apiFetch("/messages/"),
    thread:        (id)   => apiFetch(`/messages/${id}`),
    send:          (data) => apiFetch("/messages/", { method: "POST", body: JSON.stringify(data) }),
  },
};
