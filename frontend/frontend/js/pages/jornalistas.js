// Página: pages/contatos/jornalistas.html
(() => {
  const $ = (id) => document.getElementById(id);
  const { esc } = Fmt;
  const normalizar = Ui.normalizar;

  let jornalistas = [];
  let veiculos = [];
  let editando = null;
  let excluindo = null;

  // ---------- lista ----------
  function filtrados() {
    const q = normalizar($("busca").value.trim());
    const st = $("filtroStatus").value;
    const v = $("filtroVeiculo").value;
    return jornalistas.filter((j) => {
      if (st === "ativos" && !j.status) return false;
      if (st === "inativos" && j.status) return false;
      if (v && String(j.codVeiculo) !== v) return false;
      if (!q) return true;
      return [j.nome, j.email, j.editoria, j.cidade, j.veiculoNome].some((x) => normalizar(x).includes(q));
    });
  }

  function desenhar() {
    const lista = filtrados();
    $("total").textContent = `${lista.length} de ${jornalistas.length} jornalista${jornalistas.length === 1 ? "" : "s"}`;
    $("corpo").innerHTML = lista.map((j) => `
      <tr data-codigo="${j.codigo}">
        <td data-label="Jornalista"><div><strong>${esc(j.nome)}</strong><small>${esc(j.email)}</small></div></td>
        <td data-label="Veículo"><div><strong>${esc(j.veiculoNome || "Sem veículo")}</strong>${j.cidade ? `<small>${esc(j.cidade)}</small>` : ""}</div></td>
        <td data-label="Editoria">${esc(j.editoria)}</td>
        <td data-label="Telefone">${esc(j.telefone)}</td>
        <td data-label="Status"><span class="pill ${j.status ? "ativo" : "inativo"}">${j.status ? "Ativo" : "Inativo"}</span></td>
        <td class="acoes">
          <button type="button" class="btn sec peq" data-acao="editar" aria-label="Editar ${esc(j.nome)}">Editar</button>
          <button type="button" class="btn sec peq" data-acao="excluir" aria-label="Excluir ${esc(j.nome)}">Excluir</button>
        </td>
      </tr>`).join("");

    const estado = $("estado");
    estado.hidden = lista.length > 0;
    if (!lista.length) {
      estado.textContent = jornalistas.length ? "Nenhum jornalista encontrado com esses filtros." : "Nenhum jornalista cadastrado ainda.";
    }
  }

  // Preenche o filtro de veículos com os que realmente têm jornalistas
  function montarFiltroVeiculo() {
    const atual = $("filtroVeiculo").value;
    const usados = new Map();
    jornalistas.forEach((j) => j.codVeiculo && usados.set(String(j.codVeiculo), j.veiculoNome || `Veículo ${j.codVeiculo}`));
    $("filtroVeiculo").innerHTML = '<option value="">Todos os veículos</option>' +
      [...usados].sort((a, b) => a[1].localeCompare(b[1], "pt-BR")).map(([c, n]) => `<option value="${esc(c)}">${esc(n)}</option>`).join("");
    $("filtroVeiculo").value = usados.has(atual) ? atual : "";
  }

  async function carregar() {
    $("estado").hidden = false;
    $("estado").textContent = "Carregando jornalistas…";
    $("corpo").innerHTML = "";
    try {
      [jornalistas, veiculos] = await Promise.all([JornalistaApi.listar(), VeiculoApi.listar()]);
      montarFiltroVeiculo();
      desenhar();
    } catch (e) {
      $("total").textContent = "";
      $("estado").innerHTML = `${esc(e.message)}<br><button type="button" class="btn sec peq" id="tentar">Tentar de novo</button>`;
      $("tentar").addEventListener("click", carregar);
    }
  }

  // ---------- formulário ----------
  const campos = () => ({ nome: $("nome"), veiculo: $("veiculo"), editoria: $("editoria"), tel: $("tel"), email: $("email") });

  // Veículos ativos; ao editar, mantém também o veículo atual mesmo se estiver inativo
  function montarSelectVeiculo(codAtual) {
    const opcoes = veiculos.filter((v) => v.status || v.codigo === codAtual);
    $("veiculo").innerHTML = '<option value="">Selecione o veículo</option>' +
      opcoes.map((v) => `<option value="${v.codigo}">${esc(v.nome)}${v.status ? "" : " (inativo)"}</option>`).join("");
    if (!opcoes.length) {
      $("erroForm").textContent = "Nenhum veículo ativo cadastrado. Cadastre um veículo antes de adicionar jornalistas.";
      $("erroForm").hidden = false;
    }
  }

  function abrirForm(j) {
    editando = j;
    $("form").reset();
    $("erroForm").hidden = true;
    Object.values(campos()).forEach((i) => i.removeAttribute("aria-invalid"));
    $("modalTitulo").textContent = j ? "Editar jornalista" : "Novo jornalista";
    montarSelectVeiculo(j?.codVeiculo);
    if (j) {
      $("nome").value = j.nome ?? "";
      $("veiculo").value = j.codVeiculo ?? "";
      $("editoria").value = j.editoria ?? "";
      $("tel").value = j.telefone ?? "";
      $("email").value = j.email ?? "";
      $("cidade").value = j.cidade ?? "";
      $("ativo").checked = !!j.status;
    }
    $("modal").showModal();
    $("nome").focus();
  }

  function validar() {
    const c = campos();
    const regras = [
      [c.nome, c.nome.value.trim().length > 0, "Informe o nome do jornalista."],
      [c.veiculo, !!c.veiculo.value, "Selecione o veículo."],
      [c.editoria, c.editoria.value.trim().length > 0, "Informe a editoria."],
      [c.tel, Masks.digitos(c.tel.value).length >= 10, "Informe um telefone com DDD."],
      [c.email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email.value.trim()), "Informe um e-mail válido."]
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
      codVeiculo: Number($("veiculo").value),
      editoria: $("editoria").value.trim(),
      telefone: $("tel").value.trim(),
      email: $("email").value.trim(),
      cidade: $("cidade").value.trim(),
      status: $("ativo").checked
    };

    $("btnSalvar").disabled = true;
    $("btnSalvar").textContent = "Salvando…";
    try {
      const eraEdicao = !!editando;
      if (editando) await JornalistaApi.atualizar(editando.codigo, corpo);
      else await JornalistaApi.criar(corpo);
      $("modal").close();
      Ui.toast(eraEdicao ? "Jornalista atualizado com sucesso." : "Jornalista cadastrado com sucesso.");
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
    const j = jornalistas.find((x) => x.codigo === Number(btn.closest("tr").dataset.codigo));
    if (!j) return;
    if (btn.dataset.acao === "editar") return abrirForm(j);
    excluindo = j;
    $("excluirTexto").textContent = `“${j.nome}” será removido. Essa ação não pode ser desfeita.`;
    $("erroExcluir").hidden = true;
    $("modalExcluir").showModal();
  });

  $("btnExcluirCancelar").addEventListener("click", () => $("modalExcluir").close());
  $("formExcluir").addEventListener("submit", async (e) => {
    e.preventDefault();
    $("btnExcluirOk").disabled = true;
    try {
      await JornalistaApi.excluir(excluindo.codigo);
      $("modalExcluir").close();
      Ui.toast("Jornalista excluído.");
      await carregar();
    } catch (err) {
      $("erroExcluir").textContent = err.message;
      $("erroExcluir").hidden = false;
    } finally {
      $("btnExcluirOk").disabled = false;
    }
  });

  // ---------- filtros ----------
  ["busca"].forEach((id) => $(id).addEventListener("input", desenhar));
  ["filtroStatus", "filtroVeiculo"].forEach((id) => $(id).addEventListener("change", desenhar));

  carregar();
})();
