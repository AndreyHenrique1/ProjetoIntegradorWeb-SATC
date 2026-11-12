// Página: pages/agenda/agenda.html
(() => {
  const $ = (id) => document.getElementById(id);
  const { esc } = Fmt;

  const ROTULO_STATUS = { Agendado: "Agendado", Pendente: "Pendente", Concluido: "Concluído", Cancelado: "Cancelado" };
  const hojeISO = () => Fmt.isoDia(new Date());
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const diaDe = (iso) => Fmt.isoDia(new Date(iso));

  let compromissos = [], tags = [], clientes = [], jornalistas = [], equipe = [], cores = [];
  let mes = new Date(); mes.setDate(1); mes.setHours(0, 0, 0, 0);
  let selecionado = hojeISO();
  let editando = null;
  let excluindo = null;
  let editandoTag = null;
  let excluindoTag = null;

  // ---------- dados ----------
  const filtrados = () => {
    const t = $("filtroTag").value, s = $("filtroStatus").value;
    return compromissos.filter((c) => (!t || String(c.codTag) === t) && (!s || c.status === s));
  };
  function porDia(lista) {
    const m = new Map();
    lista.forEach((c) => {
      const k = diaDe(c.dataHoraInicio);
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(c);
    });
    m.forEach((v) => v.sort((a, b) => new Date(a.dataHoraInicio) - new Date(b.dataHoraInicio)));
    return m;
  }

  // ---------- calendário ----------
  function desenharMes() {
    const lista = porDia(filtrados());
    $("tituloMes").textContent = cap(mes.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }));
    const inicio = new Date(mes);
    inicio.setDate(1 - mes.getDay()); // domingo da primeira semana
    let html = "";
    for (let i = 0; i < 42; i++) {
      const d = new Date(inicio);
      d.setDate(inicio.getDate() + i);
      const k = Fmt.isoDia(d);
      const itens = lista.get(k) || [];
      const rotulo = `${d.getDate()} de ${d.toLocaleDateString("pt-BR", { month: "long" })}, ${itens.length} compromisso${itens.length === 1 ? "" : "s"}`;
      html += `
        <button type="button" class="dia${d.getMonth() !== mes.getMonth() ? " fora" : ""}${k === hojeISO() ? " hoje" : ""}${k === selecionado ? " sel" : ""}"
                data-dia="${k}" aria-label="${esc(rotulo)}" aria-pressed="${k === selecionado}">
          <span class="num">${d.getDate()}</span>
          <span class="evts">
            ${itens.slice(0, 2).map((c) => `<span class="evt${c.status === "Cancelado" ? " cancelado" : ""}" style="--cor:${esc(c.tagCor || "#2340e8")}" title="${Fmt.hora(c.dataHoraInicio)} · ${esc(c.titulo)}">${esc(c.titulo)}</span>`).join("")}
            ${itens.length > 2 ? `<span class="mais">+${itens.length - 2} mais</span>` : ""}
          </span>
        </button>`;
    }
    $("grade").innerHTML = html;
  }

  // ---------- painel do dia ----------
  function desenharDia() {
    const itens = porDia(filtrados()).get(selecionado) || [];
    $("tituloDia").textContent = cap(new Date(selecionado + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }));
    $("qtdDia").textContent = `${itens.length} compromisso${itens.length === 1 ? "" : "s"}`;

    if (!itens.length) {
      const passado = selecionado < hojeISO();
      $("listaDia").innerHTML = `<li class="vazio-dia">Nenhum compromisso neste dia.${passado ? "" : '<br><button type="button" class="btn sec peq" data-acao="novoDia">Agendar neste dia</button>'}</li>`;
      return;
    }
    $("listaDia").innerHTML = itens.map((c) => {
      const quem = [c.clienteNome, c.jornalistaNome].filter(Boolean).map(esc).join(" · ");
      const equipeTxt = (c.participantesEquipe || []).map((p) => esc(p.nome)).join(", ");
      return `
      <li class="item-dia${c.status === "Cancelado" ? " cancelado" : ""}" data-codigo="${c.codigo}" style="--cor:${esc(c.tagCor || "#2340e8")}">
        <span class="barra"></span>
        <div>
          <div class="item-topo">
            <span class="badge" style="--cor:${esc(c.tagCor || "#2340e8")};color:${Fmt.corTexto(c.tagCor)}">${esc(c.tagNome || "Sem tag")}</span>
            <span class="pill st-${esc(String(c.status).toLowerCase())}">${esc(ROTULO_STATUS[c.status] || c.status)}</span>
          </div>
          <strong>${esc(c.titulo)}</strong>
          <small>${Fmt.hora(c.dataHoraInicio)} – ${Fmt.hora(c.dataHoraFim)}${quem ? " · " + quem : ""}</small>
          ${equipeTxt ? `<small>Equipe: ${equipeTxt}</small>` : ""}
          ${c.anotacoes ? `<small>${esc(c.anotacoes)}</small>` : ""}
          <div class="item-acoes">
            ${c.status === "Pendente" ? '<button type="button" class="btn peq" data-acao="concluir">Concluir</button>' : ""}
            <button type="button" class="btn sec peq" data-acao="editar">Editar</button>
            <button type="button" class="btn sec peq" data-acao="excluir">Excluir</button>
          </div>
        </div>
      </li>`;
    }).join("");
  }

  const desenhar = () => { desenharMes(); desenharDia(); };

  function irParaDia(k) {
    selecionado = k;
    const d = new Date(k + "T12:00:00");
    mes = new Date(d.getFullYear(), d.getMonth(), 1);
    desenhar();
  }

  function montarFiltroTag() {
    const atual = $("filtroTag").value;
    $("filtroTag").innerHTML = '<option value="">Todas as tags</option>' +
      tags.map((t) => `<option value="${t.codigo}">${esc(t.nome)}</option>`).join("");
    $("filtroTag").value = tags.some((t) => String(t.codigo) === atual) ? atual : "";
  }

  async function carregar() {
    $("erroCarga").hidden = true;
    try {
      const [rComp, rTags, rCli, rJor, rEq, rCores] = await Promise.allSettled([
        CompromissoApi.listar(), TagApi.listar(), ClienteApi.listar(), JornalistaApi.listar(), EquipeApi.listar(), TagApi.cores()
      ]);
      compromissos = rComp.status === "fulfilled" ? rComp.value : [];
      tags = rTags.status === "fulfilled" ? rTags.value : [];
      clientes = rCli.status === "fulfilled" ? rCli.value : [];
      jornalistas = rJor.status === "fulfilled" ? rJor.value : [];
      equipe = rEq.status === "fulfilled" ? rEq.value : [];
      cores = rCores.status === "fulfilled" ? rCores.value : [];
      const falhas = [rComp, rTags, rCli, rJor, rEq].filter((r) => r.status === "rejected");
      if (falhas.length) {
        const msg = falhas.map((f) => f.reason?.message || "Erro ao carregar dados").join(" ");
        $("erroCarga").innerHTML = `${esc(msg)} <button type="button" class="btn sec peq" id="tentar">Tentar de novo</button>`;
        $("erroCarga").hidden = false;
        $("tentar").addEventListener("click", carregar);
      }
      montarFiltroTag();
      desenhar();
    } catch (e) {
      $("erroCarga").innerHTML = `${esc(e.message)} <button type="button" class="btn sec peq" id="tentar">Tentar de novo</button>`;
      $("erroCarga").hidden = false;
      $("tentar").addEventListener("click", carregar);
      desenhar();
    }
  }

  // ---------- navegação ----------
  function mudarMes(delta) {
    mes = new Date(mes.getFullYear(), mes.getMonth() + delta, 1);
    const hoje = new Date();
    selecionado = (mes.getFullYear() === hoje.getFullYear() && mes.getMonth() === hoje.getMonth()) ? hojeISO() : Fmt.isoDia(mes);
    desenhar();
  }
  $("mesAnt").addEventListener("click", () => mudarMes(-1));
  $("mesProx").addEventListener("click", () => mudarMes(1));
  $("mesHoje").addEventListener("click", () => irParaDia(hojeISO()));
  $("grade").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-dia]");
    if (b) irParaDia(b.dataset.dia);
  });
  ["filtroTag", "filtroStatus"].forEach((id) => $(id).addEventListener("change", desenhar));

  // ---------- formulário ----------
  const rotuloInativo = (x) => (x.status === false ? " (inativo)" : "");

  function montarSelect(sel, itens, vazio, nomeFn) {
    sel.innerHTML = `<option value="">${vazio}</option>` +
      itens.map((i) => `<option value="${i.codigo}">${esc(nomeFn(i))}${rotuloInativo(i)}</option>`).join("");
  }
  function montarChecks(el, itens, marcados, nomeFn, vazio) {
    el.innerHTML = itens.length
      ? itens.map((i) => `<label class="check mini"><input type="checkbox" value="${i.codigo}"${marcados.has(i.codigo) ? " checked" : ""}> ${esc(nomeFn(i))}${rotuloInativo(i)}</label>`).join("")
      : `<span class="vazio-lista">${vazio}</span>`;
  }
  const marcados = (el) => [...el.querySelectorAll("input:checked")].map((i) => Number(i.value));
  const ativosOu = (lista, mantidos) => lista.filter((x) => x.status || mantidos.has(x.codigo));

  function atualizarClientesAdicionais(extras) {
    extras = extras instanceof Set ? extras : new Set(marcados($("listaClientes")));
    const principal = $("cliente").value ? Number($("cliente").value) : null;
    if (principal) extras.delete(principal);
    const itens = ativosOu(clientes, extras).filter((x) => x.codigo !== principal);
    montarChecks($("listaClientes"), itens, extras, (x) => x.razaoSocial_NomeEmpresa, "Nenhum outro cliente disponível.");
  }

  function atualizarAmostra() {
    const t = tags.find((x) => String(x.codigo) === $("tag").value);
    $("amostraTag").style.background = t?.cor || "";
  }
  $("tag").addEventListener("change", atualizarAmostra);
  $("cliente").addEventListener("change", () => atualizarClientesAdicionais());

  // Tira a marca de erro assim que o campo é corrigido
  ["titulo", "tag", "inicio", "fim"].forEach((id) => {
    $(id).addEventListener("input", () => $(id).removeAttribute("aria-invalid"));
  });

  // Início sugerido: dia selecionado às 9h (hoje: próxima hora cheia). Dia passado: em branco.
  function horariosPadrao(dia) {
    if (!dia || dia < hojeISO()) return ["", ""];
    let ini = new Date(dia + "T09:00:00");
    if (dia === hojeISO()) { ini = new Date(); ini.setMinutes(0, 0, 0); ini.setHours(ini.getHours() + 1); }
    const fim = new Date(ini.getTime() + 36e5);
    return [Fmt.paraInputLocal(ini.toISOString()), Fmt.paraInputLocal(fim.toISOString())];
  }

  async function abrirForm(c, dia) {
    let det = null;
    if (c) {
      try { det = await CompromissoApi.obter(c.codigo); }
      catch (e) { return Ui.toast(e.message); }
    }
    editando = c;
    $("form").reset();
    $("erroForm").hidden = true;
    ["titulo", "tag", "inicio", "fim"].forEach((id) => $(id).removeAttribute("aria-invalid"));
    $("modalTitulo").textContent = c ? "Editar compromisso" : "Novo compromisso";

    const extras = new Set((det?.clientes || []).map((x) => x.codigo));
    if (c?.codCliente) extras.delete(c.codCliente);
    const equipeSel = new Set((det?.participantesEquipe || c?.participantesEquipe || []).map((x) => x.codigo));

    montarSelect($("tag"), ativosOu(tags, new Set([c?.codTag])), "Selecione a tag", (t) => t.nome);
    montarSelect($("cliente"), ativosOu(clientes, new Set([c?.codCliente])), "Nenhum", (x) => x.razaoSocial_NomeEmpresa);
    montarSelect($("jornalista"), ativosOu(jornalistas, new Set([c?.codJornalista])), "Nenhum", (x) => x.nome);
    montarChecks($("listaEquipe"), ativosOu(equipe, equipeSel), equipeSel, (x) => x.nome, "Nenhum integrante cadastrado.");

    if (!tags.some((t) => t.status || t.codigo === c?.codTag)) {
      $("erroForm").textContent = "Nenhuma tag ativa cadastrada. Cadastre uma tag antes de criar compromissos.";
      $("erroForm").hidden = false;
    }

    if (c) {
      $("titulo").value = c.titulo ?? "";
      $("tag").value = c.codTag ?? "";
      $("status").value = c.status ?? "Agendado";
      $("inicio").value = Fmt.paraInputLocal(c.dataHoraInicio);
      $("fim").value = Fmt.paraInputLocal(c.dataHoraFim);
      $("cliente").value = c.codCliente ?? "";
      $("jornalista").value = c.codJornalista ?? "";
      $("anotacoes").value = c.anotacoes ?? "";
    } else {
      [$("inicio").value, $("fim").value] = horariosPadrao(dia);
    }
    atualizarClientesAdicionais(extras);
    atualizarAmostra();
    $("modal").showModal();
    $("modal").scrollTop = 0;
    $("titulo").focus();
  }

  function validar(enviaDatas) {
    const c = { titulo: $("titulo"), tag: $("tag"), inicio: $("inicio"), fim: $("fim") };
    const ini = c.inicio.value, fim = c.fim.value;
    const agora = new Date();
    const regras = [
      [c.titulo, c.titulo.value.trim().length > 0, "Informe o título do compromisso."],
      [c.tag, !!c.tag.value, "Selecione a tag."],
      [c.inicio, !!ini, "Informe a data e hora de início."],
      [c.fim, !!fim, "Informe a data e hora de fim."],
      [c.fim, !ini || !fim || new Date(fim) > new Date(ini), "A data e hora de fim deve ser posterior à de início."],
      // o back-end recusa datas no passado, então só conferimos quando elas serão enviadas
      [c.inicio, !enviaDatas || !ini || new Date(ini) >= agora, "A data e hora de início não pode ser no passado."],
      [c.fim, !enviaDatas || !fim || new Date(fim) >= agora, "A data e hora de fim não pode ser no passado."]
    ];
    Object.values(c).forEach((i) => i.removeAttribute("aria-invalid"));
    const erro = regras.find(([, ok]) => !ok);
    if (!erro) return null;
    erro[0].setAttribute("aria-invalid", "true");
    erro[0].focus();
    return erro[2];
  }

  $("form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const ini = $("inicio").value, fim = $("fim").value;
    // Na edição, as datas só vão se mudaram (o back-end rejeita datas passadas até em compromissos antigos)
    const mudouDatas = !editando || ini !== Fmt.paraInputLocal(editando.dataHoraInicio) || fim !== Fmt.paraInputLocal(editando.dataHoraFim);

    const msg = validar(mudouDatas);
    $("erroForm").hidden = !msg;
    if (msg) { $("erroForm").textContent = msg; return; }

    const principal = $("cliente").value ? Number($("cliente").value) : null;
    const corpo = {
      titulo: $("titulo").value.trim(),
      codTag: Number($("tag").value),
      codCliente: principal,
      codJornalista: $("jornalista").value ? Number($("jornalista").value) : null,
      status: $("status").value,
      anotacoes: $("anotacoes").value.trim(),
      cliente: marcados($("listaClientes")).filter((c) => c !== principal),
      participantesEquipe: marcados($("listaEquipe"))
    };
    if (!editando || mudouDatas) { corpo.dataHoraInicio = Fmt.paraApi(ini); corpo.dataHoraFim = Fmt.paraApi(fim); }

    $("btnSalvar").disabled = true;
    $("btnSalvar").textContent = "Salvando…";
    try {
      const eraEdicao = !!editando;
      if (editando) await CompromissoApi.atualizar(editando.codigo, corpo);
      else await CompromissoApi.criar(corpo);
      $("modal").close();
      Ui.toast(eraEdicao ? "Compromisso atualizado com sucesso." : "Compromisso cadastrado com sucesso.");
      selecionado = ini.slice(0, 10);
      const d = new Date(selecionado + "T12:00:00");
      mes = new Date(d.getFullYear(), d.getMonth(), 1);
      await carregar();
    } catch (err) {
      $("erroForm").textContent = err.message;
      $("erroForm").hidden = false;
    } finally {
      $("btnSalvar").disabled = false;
      $("btnSalvar").textContent = "Salvar";
    }
  });

  $("btnNovo").addEventListener("click", () => abrirForm(null, selecionado));
  $("btnCancelar").addEventListener("click", () => $("modal").close());

  // ---------- ações do painel do dia ----------
  $("listaDia").addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-acao]");
    if (!btn) return;
    if (btn.dataset.acao === "novoDia") return abrirForm(null, selecionado);

    const c = compromissos.find((x) => x.codigo === Number(btn.closest("li").dataset.codigo));
    if (!c) return;
    if (btn.dataset.acao === "editar") return abrirForm(c);
    if (btn.dataset.acao === "concluir") {
      btn.disabled = true;
      try {
        await PendenciaApi.realizar(c.codigo);
        Ui.toast("Pendência concluída.");
        await carregar();
      } catch (err) {
        btn.disabled = false;
        Ui.toast(err.message);
      }
      return;
    }
    excluindo = c;
    $("excluirTexto").textContent = `“${c.titulo}” (${Fmt.data(c.dataHoraInicio)} às ${Fmt.hora(c.dataHoraInicio)}) será removido. Essa ação não pode ser desfeita.`;
    $("erroExcluir").hidden = true;
    $("modalExcluir").showModal();
  });

  $("btnExcluirCancelar").addEventListener("click", () => $("modalExcluir").close());
  $("formExcluir").addEventListener("submit", async (e) => {
    e.preventDefault();
    $("btnExcluirOk").disabled = true;
    try {
      await CompromissoApi.excluir(excluindo.codigo);
      $("modalExcluir").close();
      Ui.toast("Compromisso excluído.");
      await carregar();
    } catch (err) {
      $("erroExcluir").textContent = err.message;
      $("erroExcluir").hidden = false;
    } finally {
      $("btnExcluirOk").disabled = false;
    }
  });

  // ---------- tags ----------
  function montarSelectCores(sel, valor) {
    sel.innerHTML = '<option value="">Selecione a cor</option>' +
      (cores || []).map((c) => `<option value="${c.valor}">${esc(c.nome)}</option>`).join("");
    if (valor) sel.value = valor;
  }

  function desenharTags() {
    $("corpoTags").innerHTML = (tags || []).map((t) => `
      <tr data-codigo="${t.codigo}">
        <td data-label="Tag"><span class="tag-chip"><span class="tag-dot" style="background:${esc(t.cor || "#ccc")}"></span><strong>${esc(t.nome)}</strong></span></td>
        <td data-label="Cor">${esc(t.corNome || t.cor || "")}</td>
        <td data-label="Status"><span class="pill ${t.status ? "ativo" : "inativo"}">${t.status ? "Ativa" : "Inativa"}</span></td>
        <td class="acoes">
          <button type="button" class="btn sec peq" data-tag-acao="editar" aria-label="Editar ${esc(t.nome)}">Editar</button>
          <button type="button" class="btn sec peq" data-tag-acao="excluir" aria-label="Excluir ${esc(t.nome)}">Excluir</button>
        </td>
      </tr>`).join("");
    const estado = $("estadoTags");
    estado.hidden = (tags || []).length > 0;
    if (!(tags || []).length) estado.textContent = "Nenhuma tag cadastrada ainda.";
  }

  async function carregarTags() {
    if ($("estadoTags")) { $("estadoTags").hidden = false; $("estadoTags").textContent = "Carregando tags…"; }
    $("corpoTags").innerHTML = "";
    try {
      [tags, cores] = await Promise.all([TagApi.listar(), TagApi.cores()]);
      montarFiltroTag();
      desenhar();
      desenharTags();
    } catch (e) {
      $("estadoTags").hidden = false;
      $("estadoTags").innerHTML = `${esc(e.message)}<br><button type="button" class="btn sec peq" id="tentarTags">Tentar de novo</button>`;
      $("tentarTags").addEventListener("click", carregarTags);
    }
  }

  function abrirFormTag(t) {
    editandoTag = t;
    $("formTag").reset();
    $("erroTagForm").hidden = true;
    $("tagNome").removeAttribute("aria-invalid");
    $("tagCor").removeAttribute("aria-invalid");
    $("tagFormTitulo").textContent = t ? "Editar tag" : "Nova tag";
    montarSelectCores($("tagCor"), t?.cor || "");
    if (t) {
      $("tagNome").value = t.nome ?? "";
      $("tagDescricao").value = t.descricao ?? "";
      $("tagAtiva").checked = !!t.status;
    }
    $("modalTagForm").showModal();
    $("tagNome").focus();
  }

  $("formTag").addEventListener("submit", async (e) => {
    e.preventDefault();
    const nome = $("tagNome").value.trim();
    const cor = $("tagCor").value;
    $("tagNome").removeAttribute("aria-invalid");
    $("tagCor").removeAttribute("aria-invalid");
    if (!nome) {
      $("tagNome").setAttribute("aria-invalid", "true"); $("tagNome").focus();
      $("erroTagForm").textContent = "Informe o nome da tag."; $("erroTagForm").hidden = false; return;
    }
    if (!cor) {
      $("tagCor").setAttribute("aria-invalid", "true"); $("tagCor").focus();
      $("erroTagForm").textContent = "Selecione uma cor."; $("erroTagForm").hidden = false; return;
    }
    $("erroTagForm").hidden = true;
    const corpo = { nome, cor, descricao: $("tagDescricao").value.trim() || null, status: $("tagAtiva").checked };
    $("btnSalvarTag").disabled = true; $("btnSalvarTag").textContent = "Salvando…";
    try {
      const eraEdicao = !!editandoTag;
      if (editandoTag) await TagApi.atualizar(editandoTag.codigo, corpo);
      else await TagApi.criar(corpo);
      $("modalTagForm").close();
      Ui.toast(eraEdicao ? "Tag atualizada com sucesso." : "Tag cadastrada com sucesso.");
      await carregarTags();
    } catch (err) {
      $("erroTagForm").textContent = err.message;
      $("erroTagForm").hidden = false;
    } finally {
      $("btnSalvarTag").disabled = false; $("btnSalvarTag").textContent = "Salvar";
    }
  });

  $("btnTags").addEventListener("click", () => { $("modalTags").showModal(); carregarTags(); });
  $("btnFecharTags").addEventListener("click", () => $("modalTags").close());
  $("btnNovaTag").addEventListener("click", () => abrirFormTag(null));
  $("btnCancelarTag").addEventListener("click", () => $("modalTagForm").close());

  $("corpoTags").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-tag-acao]");
    if (!btn) return;
    const t = tags.find((x) => x.codigo === Number(btn.closest("tr").dataset.codigo));
    if (!t) return;
    if (btn.dataset.tagAcao === "editar") return abrirFormTag(t);
    excluindoTag = t;
    $("tagExcluirTexto").textContent = `“${t.nome}” será removida. Essa ação não pode ser desfeita.`;
    $("erroTagExcluir").hidden = true;
    $("modalTagExcluir").showModal();
  });

  $("btnTagExcluirCancelar").addEventListener("click", () => $("modalTagExcluir").close());
  $("formTagExcluir").addEventListener("submit", async (e) => {
    e.preventDefault();
    $("btnTagExcluirOk").disabled = true;
    try {
      await TagApi.excluir(excluindoTag.codigo);
      $("modalTagExcluir").close();
      Ui.toast("Tag excluída.");
      await carregarTags();
    } catch (err) {
      $("erroTagExcluir").textContent = err.message;
      $("erroTagExcluir").hidden = false;
    } finally {
      $("btnTagExcluirOk").disabled = false;
    }
  });

  carregar();
})();