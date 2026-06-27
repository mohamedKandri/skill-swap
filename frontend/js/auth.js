document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("register-form");
  const loginForm    = document.getElementById("login-form");
  const errorMsg     = document.getElementById("error-msg");

  function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.classList.remove("hidden");
  }

  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        const { token, user } = await api.auth.register({
          name:       document.getElementById("name").value,
          email:      document.getElementById("email").value,
          password:   document.getElementById("password").value,
          university: document.getElementById("university").value,
        });
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        window.location.href = "profile.html";
      } catch (err) {
        showError(err.message);
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        const { token, user } = await api.auth.login({
          email:    document.getElementById("email").value,
          password: document.getElementById("password").value,
        });
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        window.location.href = "dashboard.html";
      } catch (err) {
        showError(err.message);
      }
    });
  }

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.clear();
      window.location.href = "login.html";
    });
  }
});
