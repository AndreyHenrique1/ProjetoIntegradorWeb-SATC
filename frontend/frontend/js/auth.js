// Sessão compartilhada entre as páginas. Guardada no navegador até o usuário sair.
const Auth = {
  chave: "alfa_sessao",
  obter() {
    try { return JSON.parse(localStorage.getItem(this.chave)); } catch { return null; }
  },
  salvar(sessao) { localStorage.setItem(this.chave, JSON.stringify(sessao)); },
  atualizarUsuario(parcial) {
    const s = this.obter();
    if (!s) return null;
    s.usuario = Object.assign({}, s.usuario, parcial);
    this.salvar(s);
    return s;
  },
  raiz: () => document.body?.dataset.raiz || "",
  sair() { localStorage.removeItem(this.chave); location.href = this.raiz() + "login.html"; },
  exigir() {
    const s = this.obter();
    if (!s) { location.replace(this.raiz() + "login.html"); return null; }
    if (!s.usuario || typeof s.usuario.permissoes !== "object") { this.sair(); return null; }
    return s;
  },
  iniciais(nome) {
    return (nome || "Usuário").trim().split(/[\s._-]+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
  },
  permissao(tela) {
    const s = this.obter();
    const perms = s?.usuario?.permissoes;
    if (!perms || typeof perms !== "object") return "edit";
    const p = perms[tela];
    if (p === "none" || p === "view" || p === "edit") return p;
    return "edit";
  },
  podeVer(tela) { return this.permissao(tela) !== "none"; },
  podeEditar(tela) { return this.permissao(tela) === "edit"; },
  aplicarTela(tela) {
    const nivel = this.permissao(tela);
    const raiz = this.raiz();
    if (nivel === "none") {
      const s = this.obter();
      const perms = s?.usuario?.permissoes || {};
      const ordem = ["dashboard", "cargos", "equipes", "clientes", "veiculos", "jornalistas", "agenda", "historico"];
      const rotas = { dashboard: "index.html", cargos: "pages/usuarios/cargos.html", equipes: "pages/usuarios/equipes.html", clientes: "pages/contatos/clientes.html", veiculos: "pages/contatos/veiculos.html", jornalistas: "pages/contatos/jornalistas.html", historico: "pages/contatos/historico.html", agenda: "pages/agenda/agenda.html" };
      const proxima = ordem.find((t) => t !== tela && perms[t] && perms[t] !== "none");
      location.replace(raiz + (proxima ? rotas[proxima] : "login.html"));
      return false;
    }
    document.body.classList.add("perm-" + nivel);
    if (nivel === "view") {
      const bloquear = () => {
        document.querySelectorAll("#btnNovo, .acoes, [data-acao], #btnSalvar, #btnExcluirOk, #btnRealizar, #btnPend, #btnConf, #btnCanc").forEach((el) => { el.style.display = "none"; });
        document.querySelectorAll(".tabela th:last-child, .tabela td:last-child, .tabela td.acoes").forEach((el) => { el.style.display = "none"; });
        document.querySelectorAll("dialog form button[type=submit]").forEach((el) => { el.style.display = "none"; });
        document.querySelectorAll("dialog button.btn.perigo").forEach((el) => { el.style.display = "none"; });
      };
      bloquear();
      [0, 150, 400, 800, 1500, 3000].forEach((ms) => setTimeout(bloquear, ms));
      const obs = new MutationObserver(bloquear);
      obs.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => obs.disconnect(), 6000);
    }
    return true;
  }
};
