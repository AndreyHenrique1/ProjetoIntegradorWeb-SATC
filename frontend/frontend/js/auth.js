// Sessão compartilhada entre as páginas. Guardada no navegador até o usuário sair.
const Auth = {
  chave: "alfa_sessao",
  obter() {
    try { return JSON.parse(localStorage.getItem(this.chave)); } catch { return null; }
  },
  salvar(sessao) { localStorage.setItem(this.chave, JSON.stringify(sessao)); },
  raiz: () => document.body?.dataset.raiz || "",
  sair() { localStorage.removeItem(this.chave); location.href = this.raiz() + "login.html"; },
  // Chame no topo de toda página que exige login
  exigir() {
    const s = this.obter();
    if (!s) location.replace(this.raiz() + "login.html");
    return s;
  },
  iniciais(nome) {
    return (nome || "Usuário").trim().split(/[\s._-]+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
  }
};
