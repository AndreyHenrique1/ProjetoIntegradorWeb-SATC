// Monta topo e menu lateral e liga o comportamento comum das páginas internas.
// O <body> informa: data-raiz (caminho até a pasta frontend, ex.: "../../") e data-ativo (item do menu).
(() => {
  const $ = (id) => document.getElementById(id);
  const sessao = Auth.exigir();
  if (!sessao) return;

  const raiz = document.body.dataset.raiz || "";
  const ativo = document.body.dataset.ativo || "";

  const ICONES = {
    home: '<path d="M3 11l9-8 9 8M5 10v10h14V10"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5M16 4.8a3.5 3.5 0 010 6.4M18 14.8c2 .6 3.2 2.3 3.5 5.2"/>',
    book: '<path d="M5 3h11a3 3 0 013 3v15H8a3 3 0 01-3-3V3zM5 18a3 3 0 013-3h11"/>',
    cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    out: '<path d="M9 4H6a2 2 0 00-2 2v12a2 2 0 002 2h3M16 8l4 4-4 4M20 12H9"/>',
    chev: '<path d="M6 9l6 6 6-6"/>',
    chat: '<path d="M4 5h16v11H9l-5 4V5z"/>'
  };
  const ico = (nome, extra = "") => `<svg class="ico ${extra}" viewBox="0 0 24 24" aria-hidden="true">${ICONES[nome]}</svg>`;

  const MENU = [
    { id: "dashboard", rotulo: "Dashboard", href: "index.html", icone: "home" },
    { rotulo: "Usuários", icone: "users", itens: [
      { id: "cargos", rotulo: "Cargos", href: "pages/usuarios/cargos.html" },
      { id: "equipes", rotulo: "Equipes", href: "pages/usuarios/equipes.html" }
    ] },
    { rotulo: "Contatos", icone: "book", itens: [
      { id: "clientes", rotulo: "Clientes", href: "pages/contatos/clientes.html" },
      { id: "veiculos", rotulo: "Veículos", href: "pages/contatos/veiculos.html" },
      { id: "jornalistas", rotulo: "Jornalistas", href: "pages/contatos/jornalistas.html" }
    ] },
    { id: "historico", rotulo: "Histórico de relacionamento", href: "pages/contatos/historico.html", icone: "chat" },
    { id: "agenda", rotulo: "Agenda", href: "pages/agenda/agenda.html", icone: "cal" }
  ];

  const atual = (i) => i.id === ativo ? ' aria-current="page"' : "";
  const menuHtml = MENU.map((m) => m.itens
    ? `<details class="group"${m.itens.some((i) => i.id === ativo) ? " open" : ""}>
         <summary>${ico(m.icone)}${m.rotulo}${ico("chev", "chev")}</summary>
         ${m.itens.map((i) => `<a href="${raiz}${i.href}"${i.id === ativo ? ' class="active"' : ""}${atual(i)}>${i.rotulo}</a>`).join("")}
       </details>`
    : `<a href="${raiz}${m.href}" class="link${m.id === ativo ? " active" : ""}"${atual(m)}>${ico(m.icone)}${m.rotulo}</a>`
  ).join("");

  $("topbar").innerHTML = `
    <button class="menu-btn" id="menuBtn" aria-label="Abrir menu" aria-controls="sidebar" aria-expanded="false">${ico("chev")}</button>
    <a href="${raiz}index.html" class="logo"><img src="${raiz}assets/logo.svg" alt="Alfa – comunicação e conteúdo"></a>
    <div class="avatar" id="avatar" aria-label="Usuário logado"></div>`;
  $("sidebar").innerHTML = `
    <nav aria-label="Menu principal">${menuHtml}</nav>
    <a href="${raiz}login.html" class="link logout" id="sair">${ico("out")}Log out</a>`;

  $("avatar").textContent = Auth.iniciais(sessao.usuario?.nome);
  $("avatar").title = sessao.usuario?.nome || "Usuário logado";
  $("sair").addEventListener("click", (e) => { e.preventDefault(); Auth.sair(); });

  const sidebar = $("sidebar"), menuBtn = $("menuBtn"), scrim = $("scrim");
  function menu(abrir) {
    sidebar.classList.toggle("open", abrir);
    scrim.hidden = !abrir;
    menuBtn.setAttribute("aria-expanded", abrir);
  }
  menuBtn.addEventListener("click", () => menu(!sidebar.classList.contains("open")));
  scrim.addEventListener("click", () => menu(false));
  document.addEventListener("keydown", (e) => e.key === "Escape" && menu(false));
})();
