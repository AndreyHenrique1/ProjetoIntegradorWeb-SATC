// Página: pages/usuarios/cargos.html
(() => {
  const $ = (id) => document.getElementById(id);
  const { esc } = Fmt;
  const normalizar = Ui.normalizar;

  let cargos = [];
  let editando = null;
  let excluindo = null;

  function filtrados() {
    const q = normalizar($("busca").value.trim());
    const st = $("filtroStatus").value;
    return cargos.filter((c) => {
      if (st === "ativos" && !c.status) return false;
      if (st === "inativos" && c.status) return false;
      return !q || normalizar(c.nome).includes(q);
    });
  }

  function desenhar() {
    const lista = filtrados();
    $("total").textContent = `${lista.length} de ${cargos.length} cargo${cargos.length === 1 ? "" : "s"}`;
    $("corpo").innerHTML = lista.map((c) => {
      const n = Number(c.quantidadeIntegrantes) || 0;
      return `
      <tr data-codigo="${c.codigo}">
        <td data-label="Cargo"><strong>${esc(c.nome)}</strong></td>
        <td data-label="Integrantes ativos">${n} ${n === 1 ? "pessoa" : "pessoas"}</td>
        <td data-label="Status"><span class="pill ${c.status ? "ativo" : "inativo"}">${c.status ? "Ativo" : "Inativo"}</span></td>
        <td class="acoes">
          <button type="button" class="btn sec peq" data-acao="editar" aria-label="Editar ${esc(c.nome)}">Editar</button>
          <button type="button" class="btn sec peq" data-acao="excluir" aria-label="Excluir ${esc(c.nome)}">Excluir</button>
        </td>
      </tr>`;
    }).join("");

    const estado = $("estado");
    estado.hidden = lista.length > 0;
    if (!lista.length) estado.textContent = cargos.length ? "Nenhum cargo encontrado com esses filtros." : "Nenhum cargo cadastrado ainda.";
  }

  async function carregar() {
    $("estado").hidden = false;
    $("estado").textContent = "Carregando cargos…";
    $("corpo").innerHTML = "";
    try {
      cargos = await CargoApi.listar();
      desenhar();
    } catch (e) {
      $("total").textContent = "";
      $("estado").innerHTML = `${esc(e.message)}<br><button type="button" class="btn sec peq" id="tentar">Tentar de novo</button>`;
      $("tentar").addEventListener("click", carregar);
    }
  }

  // ---------- formulário ----------
  function abrirForm(c) {
    editando = c;
    $("form").reset();
    $("erroForm").hidden = true;
    $("nome").removeAttribute("aria-invalid");
    $("modalTitulo").textContent = c ? "Editar cargo" : "Novo cargo";
    if (c) {
      $("nome").value = c.nome ?? "";
      $("ativo").checked = !!c.status;
    }
    $("modal").showModal();
    $("nome").focus();
  }

  $("form").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!$("nome").value.trim()) {
      $("nome").setAttribute("aria-invalid", "true");
      $("nome").focus();
      $("erroForm").textContent = "Informe o nome do cargo.";
      $("erroForm").hidden = false;
      return;
    }
    $("nome").removeAttribute("aria-invalid");
    $("erroForm").hidden = true;

    const corpo = { nome: $("nome").value.trim(), status: $("ativo").checked };
    $("btnSalvar").disabled = true;
    $("btnSalvar").textContent = "Salvando…";
    try {
      const eraEdicao = !!editando;
      if (editando) await CargoApi.atualizar(editando.codigo, corpo);
      else await CargoApi.criar(corpo);
      $("modal").close();
      Ui.toast(eraEdicao ? "Cargo atualizado com sucesso." : "Cargo cadastrado com sucesso.");
      await carregar();
    } catch (err) {
      $("erroForm").textContent = err.message;
      $("erroForm").hidden = false;
    } finally {
      $("btnSalvar").disabled = false;
      $("btnSalvar").textContent = "Salvar";
    }
  });

  $("btnNovo").addEventListener("click", () => abrirForm(null));
  $("btnCancelar").addEventListener("click", () => $("modal").close());

  // ---------- exclusão ----------
  $("corpo").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-acao]");
    if (!btn) return;
    const c = cargos.find((x) => x.codigo === Number(btn.closest("tr").dataset.codigo));
    if (!c) return;
    if (btn.dataset.acao === "editar") return abrirForm(c);
    excluindo = c;
    $("excluirTexto").textContent = `“${c.nome}” será removido. Essa ação não pode ser desfeita.`;
    $("erroExcluir").hidden = true;
    $("modalExcluir").showModal();
  });

  $("btnExcluirCancelar").addEventListener("click", () => $("modalExcluir").close());
  $("formExcluir").addEventListener("submit", async (e) => {
    e.preventDefault();
    $("btnExcluirOk").disabled = true;
    try {
      await CargoApi.excluir(excluindo.codigo);
      $("modalExcluir").close();
      Ui.toast("Cargo excluído.");
      await carregar();
    } catch (err) {
      // ex.: 409 quando o cargo tem funcionários vinculados
      $("erroExcluir").textContent = err.message;
      $("erroExcluir").hidden = false;
    } finally {
      $("btnExcluirOk").disabled = false;
    }
  });

  $("busca").addEventListener("input", desenhar);
  $("filtroStatus").addEventListener("change", desenhar);

  carregar();
})();