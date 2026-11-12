// Página: pages/contatos/veiculos.html
(() => {
  const $ = (id) => document.getElementById(id);
  const { esc } = Fmt;
  const normalizar = Ui.normalizar;

  let veiculos = [];
  let tipos = [];
  let editando = null;
  let excluindo = null;
  let editandoTipo = null;
  let excluindoTipo = null;

  // ---------- lista ----------
  function filtrados() {
    const q = normalizar($("busca").value.trim());
    const st = $("filtroStatus").value;
    const t = $("filtroTipo").value;
    return veiculos.filter((v) => {
      if (st === "ativos" && !v.status) return false;
      if (st === "inativos" && v.status) return false;
      if (t && String(v.codTipoVeiculo) !== t) return false;
      if (!q) return true;
      return [v.nome, v.tipoVeiculoNome, v.abrangencia].some((x) => normalizar(x).includes(q));
    });
  }

  function desenhar() {
    const lista = filtrados();
    $("total").textContent = `${lista.length} de ${veiculos.length} veículo${veiculos.length === 1 ? "" : "s"}`;
    $("corpo").innerHTML = lista.map((v) => `
      <tr data-codigo="${v.codigo}">
        <td data-label="Veículo"><strong>${esc(v.nome)}</strong></td>
        <td data-label="Tipo">${esc(v.tipoVeiculoNome || "Sem tipo")}</td>
        <td data-label="Abrangência">${esc(v.abrangencia)}</td>
        <td data-label="Telefone da redação">${esc(v.telefoneDaRedacao)}</td>
        <td data-label="Status"><span class="pill ${v.status ? "ativo" : "inativo"}">${v.status ? "Ativo" : "Inativo"}</span></td>
        <td class="acoes">
          <button type="button" class="btn sec peq" data-acao="editar" aria-label="Editar ${esc(v.nome)}">Editar</button>
          <button type="button" class="btn sec peq" data-acao="excluir" aria-label="Excluir ${esc(v.nome)}">Excluir</button>
        </td>
      </tr>`).join("");

    const estado = $("estado");
    estado.hidden = lista.length > 0;
    if (!lista.length) {
      estado.textContent = veiculos.length ? "Nenhum veículo encontrado com esses filtros." : "Nenhum veículo cadastrado ainda.";
    }
  }

  // Filtro de tipos: só os que têm veículos
  function montarFiltroTipo() {
    const atual = $("filtroTipo").value;
    const usados = new Map();
    veiculos.forEach((v) => v.codTipoVeiculo && usados.set(String(v.codTipoVeiculo), v.tipoVeiculoNome || `Tipo ${v.codTipoVeiculo}`));
    $("filtroTipo").innerHTML = '<option value="">Todos os tipos</option>' +
      [...usados].sort((a, b) => a[1].localeCompare(b[1], "pt-BR")).map(([c, n]) => `<option value="${esc(c)}">${esc(n)}</option>`).join("");
    $("filtroTipo").value = usados.has(atual) ? atual : "";
  }

  async function carregar() {
    $("estado").hidden = false;
    $("estado").textContent = "Carregando veículos…";
    $("corpo").innerHTML = "";
    try {
      [veiculos, tipos] = await Promise.all([VeiculoApi.listar(), TipoVeiculoApi.listar()]);
      montarFiltroTipo();
      desenhar();
    } catch (e) {
      $("total").textContent = "";
      $("estado").innerHTML = `${esc(e.message)}<br><button type="button" class="btn sec peq" id="tentar">Tentar de novo</button>`;
      $("tentar").addEventListener("click", carregar);
    }
  }

  // ---------- formulário ----------
  const campos = () => ({ nome: $("nome"), tipo: $("tipo"), abrangencia: $("abrangencia"), tel: $("tel") });

  // Tipos ativos; ao editar, mantém o tipo atual mesmo se estiver inativo
  function montarSelectTipo(codAtual) {
    const opcoes = tipos.filter((t) => t.status || t.codigo === codAtual);
    $("tipo").innerHTML = '<option value="">Selecione o tipo</option>' +
      opcoes.map((t) => `<option value="${t.codigo}">${esc(t.nome)}${t.status ? "" : " (inativo)"}</option>`).join("");
    if (!opcoes.length) {
      $("erroForm").textContent = "Nenhum tipo de veículo ativo cadastrado. Cadastre um tipo antes de adicionar veículos.";
      $("erroForm").hidden = false;
    }
  }

  function abrirForm(v) {
    editando = v;
    $("form").reset();
    $("erroForm").hidden = true;
    Object.values(campos()).forEach((i) => i.removeAttribute("aria-invalid"));
    $("modalTitulo").textContent = v ? "Editar veículo" : "Novo veículo";
    montarSelectTipo(v?.codTipoVeiculo);
    if (v) {
      $("nome").value = v.nome ?? "";
      $("tipo").value = v.codTipoVeiculo ?? "";
      $("abrangencia").value = v.abrangencia ?? "";
      $("tel").value = v.telefoneDaRedacao ?? "";
      $("ativo").checked = !!v.status;
    }
    $("modal").showModal();
    $("nome").focus();
  }

  function validar() {
    const c = campos();
    const regras = [
      [c.nome, c.nome.value.trim().length > 0, "Informe o nome do veículo."],
      [c.tipo, !!c.tipo.value, "Selecione o tipo de veículo."],
      [c.abrangencia, c.abrangencia.value.trim().length > 0, "Informe a abrangência do veículo."],
      [c.tel, Masks.digitos(c.tel.value).length >= 8, "Informe um telefone válido para a redação."]
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
    const msg = validar();
    $("erroForm").hidden = !msg;
    if (msg) { $("erroForm").textContent = msg; return; }

    const corpo = {
      nome: $("nome").value.trim(),
      codTipoVeiculo: Number($("tipo").value),
      telefoneDaRedacao: $("tel").value.trim(),
      abrangencia: $("abrangencia").value.trim(),
      status: $("ativo").checked
    };

    $("btnSalvar").disabled = true;
    $("btnSalvar").textContent = "Salvando…";
    try {
      const eraEdicao = !!editando;
      if (editando) await VeiculoApi.atualizar(editando.codigo, corpo);
      else await VeiculoApi.criar(corpo);
      $("modal").close();
      Ui.toast(eraEdicao ? "Veículo atualizado com sucesso." : "Veículo cadastrado com sucesso.");
      await carregar();
    } catch (err) {
      $("erroForm").textContent = err.message;
      $("erroForm").hidden = false;
    } finally {
      $("btnSalvar").disabled = false;
      $("btnSalvar").textContent = "Salvar";
    }
  });

  $("tel").addEventListener("input", (e) => (e.target.value = Masks.telefone(e.target.value)));
  $("btnNovo").addEventListener("click", () => abrirForm(null));
  $("btnCancelar").addEventListener("click", () => $("modal").close());

  // ---------- exclusão ----------
  $("corpo").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-acao]");
    if (!btn) return;
    const v = veiculos.find((x) => x.codigo === Number(btn.closest("tr").dataset.codigo));
    if (!v) return;
    if (btn.dataset.acao === "editar") return abrirForm(v);
    excluindo = v;
    $("excluirTexto").textContent = `“${v.nome}” será removido. Essa ação não pode ser desfeita.`;
    $("erroExcluir").hidden = true;
    $("modalExcluir").showModal();
  });

  $("btnExcluirCancelar").addEventListener("click", () => $("modalExcluir").close());
  $("formExcluir").addEventListener("submit", async (e) => {
    e.preventDefault();
    $("btnExcluirOk").disabled = true;
    try {
      await VeiculoApi.excluir(excluindo.codigo);
      $("modalExcluir").close();
      Ui.toast("Veículo excluído.");
      await carregar();
    } catch (err) {
      // ex.: 409 quando o veículo tem jornalistas vinculados
      $("erroExcluir").textContent = err.message;
      $("erroExcluir").hidden = false;
    } finally {
      $("btnExcluirOk").disabled = false;
    }
  });

  // ---------- tipos de veículo ----------
  function desenharTipos() {
    $("corpoTipos").innerHTML = (tipos || []).map((t) => `
      <tr data-codigo="${t.codigo}">
        <td data-label="Tipo"><strong>${esc(t.nome)}</strong></td>
        <td data-label="Status"><span class="pill ${t.status ? "ativo" : "inativo"}">${t.status ? "Ativo" : "Inativo"}</span></td>
        <td class="acoes">
          <button type="button" class="btn sec peq" data-tipo-acao="editar" aria-label="Editar ${esc(t.nome)}">Editar</button>
          <button type="button" class="btn sec peq" data-tipo-acao="excluir" aria-label="Excluir ${esc(t.nome)}">Excluir</button>
        </td>
      </tr>`).join("");
    const estado = $("estadoTipos");
    estado.hidden = (tipos || []).length > 0;
    if (!(tipos || []).length) estado.textContent = "Nenhum tipo cadastrado ainda.";
  }

  async function carregarTipos() {
    if ($("estadoTipos")) { $("estadoTipos").hidden = false; $("estadoTipos").textContent = "Carregando tipos…"; }
    $("corpoTipos").innerHTML = "";
    try {
      tipos = await TipoVeiculoApi.listar();
      montarFiltroTipo();
      desenhar();
      desenharTipos();
    } catch (e) {
      $("estadoTipos").hidden = false;
      $("estadoTipos").innerHTML = `${esc(e.message)}<br><button type="button" class="btn sec peq" id="tentarTipos">Tentar de novo</button>`;
      $("tentarTipos").addEventListener("click", carregarTipos);
    }
  }

  function abrirFormTipo(t) {
    editandoTipo = t;
    $("formTipo").reset();
    $("erroTipoForm").hidden = true;
    $("tipoNome").removeAttribute("aria-invalid");
    $("tipoFormTitulo").textContent = t ? "Editar tipo de veículo" : "Novo tipo de veículo";
    if (t) {
      $("tipoNome").value = t.nome ?? "";
      $("tipoAtivo").checked = !!t.status;
    }
    $("modalTipoForm").showModal();
    $("tipoNome").focus();
  }

  $("formTipo").addEventListener("submit", async (e) => {
    e.preventDefault();
    const nome = $("tipoNome").value.trim();
    $("tipoNome").removeAttribute("aria-invalid");
    if (!nome) {
      $("tipoNome").setAttribute("aria-invalid", "true"); $("tipoNome").focus();
      $("erroTipoForm").textContent = "Informe o nome do tipo."; $("erroTipoForm").hidden = false; return;
    }
    $("erroTipoForm").hidden = true;
    const corpo = { nome, status: $("tipoAtivo").checked };
    $("btnSalvarTipo").disabled = true; $("btnSalvarTipo").textContent = "Salvando…";
    try {
      const eraEdicao = !!editandoTipo;
      if (editandoTipo) await TipoVeiculoApi.atualizar(editandoTipo.codigo, corpo);
      else await TipoVeiculoApi.criar(corpo);
      $("modalTipoForm").close();
      Ui.toast(eraEdicao ? "Tipo atualizado com sucesso." : "Tipo cadastrado com sucesso.");
      await carregarTipos();
    } catch (err) {
      $("erroTipoForm").textContent = err.message;
      $("erroTipoForm").hidden = false;
    } finally {
      $("btnSalvarTipo").disabled = false; $("btnSalvarTipo").textContent = "Salvar";
    }
  });

  $("btnTiposVeiculo").addEventListener("click", () => { $("modalTipos").showModal(); carregarTipos(); });
  $("btnFecharTipos").addEventListener("click", () => $("modalTipos").close());
  $("btnNovoTipo").addEventListener("click", () => abrirFormTipo(null));
  $("btnCancelarTipo").addEventListener("click", () => $("modalTipoForm").close());

  $("corpoTipos").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-tipo-acao]");
    if (!btn) return;
    const t = tipos.find((x) => x.codigo === Number(btn.closest("tr").dataset.codigo));
    if (!t) return;
    if (btn.dataset.tipoAcao === "editar") return abrirFormTipo(t);
    excluindoTipo = t;
    $("tipoExcluirTexto").textContent = `“${t.nome}” será removido. Essa ação não pode ser desfeita.`;
    $("erroTipoExcluir").hidden = true;
    $("modalTipoExcluir").showModal();
  });

  $("btnTipoExcluirCancelar").addEventListener("click", () => $("modalTipoExcluir").close());
  $("formTipoExcluir").addEventListener("submit", async (e) => {
    e.preventDefault();
    $("btnTipoExcluirOk").disabled = true;
    try {
      await TipoVeiculoApi.excluir(excluindoTipo.codigo);
      $("modalTipoExcluir").close();
      Ui.toast("Tipo excluído.");
      await carregarTipos();
    } catch (err) {
      $("erroTipoExcluir").textContent = err.message;
      $("erroTipoExcluir").hidden = false;
    } finally {
      $("btnTipoExcluirOk").disabled = false;
    }
  });

  // ---------- filtros ----------
  $("busca").addEventListener("input", desenhar);
  ["filtroStatus", "filtroTipo"].forEach((id) => $(id).addEventListener("change", desenhar));

  carregar();
})();
