// Página: login.html
(() => {
  const $ = (id) => document.getElementById(id);
  const form = $("loginForm"), erro = $("erro"), btn = $("entrar");

  if (Auth.obter()) location.replace("index.html");

  function mostrarErro(msg, campo) {
    erro.textContent = msg;
    erro.hidden = false;
    [$("email"), $("senha")].forEach((i) => i.removeAttribute("aria-invalid"));
    if (campo) { campo.setAttribute("aria-invalid", "true"); campo.focus(); }
  }

  $("verSenha").addEventListener("click", (e) => {
    const mostrar = $("senha").type === "password";
    $("senha").type = mostrar ? "text" : "password";
    e.target.textContent = mostrar ? "Ocultar" : "Mostrar";
    e.target.setAttribute("aria-label", mostrar ? "Ocultar senha" : "Mostrar senha");
    e.target.setAttribute("aria-pressed", mostrar);
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    erro.hidden = true;
    const email = $("email").value.trim(), senha = $("senha").value;

    if (!/^\S+@\S+\.\S+$/.test(email)) return mostrarErro("Digite um e-mail válido.", $("email"));
    if (!senha) return mostrarErro("Digite sua senha.", $("senha"));

    btn.disabled = true;
    btn.textContent = "Entrando…";
    try {
      const r = await AuthApi.login(email, senha);
      if (r.ok) {
        const d = await r.json().catch(() => ({}));
        Auth.salvar({ token: d.token || null, usuario: d.usuario || { nome: email, email } });
        return location.replace("index.html");
      }
      if ([400, 401, 403].includes(r.status)) return mostrarErro("E-mail ou senha incorretos.", $("senha"));
      mostrarErro("Não foi possível entrar agora. Tente novamente em instantes.");
    } catch {
      mostrarErro("Não consegui conectar ao servidor. Verifique sua conexão.");
    } finally {
      btn.disabled = false;
      btn.textContent = "Entrar";
    }
  });
})();
