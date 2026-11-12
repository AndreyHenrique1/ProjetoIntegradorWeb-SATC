// Página: pages/usuarios/equipes.html  ("equipe" = funcionários)
(() => {
  const $ = (id) => document.getElementById(id);
  const { esc } = Fmt;
  const normalizar = Ui.normalizar;

  let equipe = [];
  let cargos = [];
  let editando = null;
  let excluindo = null;

  // ---------- lista ----------
  function filtrados() {
    const q = normalizar($("busca").value.trim());
    const st = $("filtroStatus").value;
    const c = $("filtroCargo").value;
    return equipe.filter((p) => {
      if (st === "ativos" && !p.status) return false;
      if (st === "inativos" && p.status) return false;
      if (c && String(p.codCargo) !== c) return false;
      return !q || [p.nome, p.email, p.cargoNome].some((x) => normalizar(x).includes(q));
    });
  }

  function desenhar() {
    const lista = filtrados();
    $("total").textContent = `${lista.length} de ${equipe.length} integrante${equipe.length === 1 ? "" : "s"}`;
    $("corpo").innerHTML = lista.map((p) => `
      <tr data-codigo="${p.codigo}">
        <td data-label="Integrante"><div><strong>${esc(p.nome)}</strong><small>${esc(p.email)}</small></div></td>
        <td data-label="Cargo">${esc(p.cargoNome || "Sem cargo")}</td>
        <td data-label="Telefone">${esc(p.telefone)}</td>
        <td data-label="Cadastro">${p.dataCadastro ? Fmt.data(p.dataCadastro) : "–"}</td>
        <td data-label="Status"><span class="pill ${p.status ? "ativo" : "inativo"}">${p.status ? "Ativo" : "Inativo"}</span></td>
        <td class="acoes">
          <button type="button" class="btn sec peq" data-acao="editar" aria-label="Editar ${esc(p.nome)}">Editar</button>
          <button type="button" class="btn sec peq" data-acao="excluir" aria-label="Excluir ${esc(p.nome)}">Excluir</button>
        </td>
      </tr>`).join("");

    const estado = $("estado");
    estado.hidden = lista.length > 0;
    if (!lista.length) estado.textContent = equipe.length ? "Nenhum integrante encontrado com esses filtros." : "Nenhum integrante cadastrado ainda.";
  }

  function montarFiltroCargo() {
    const atual = $("filtroCargo").value;
    const usados = new Map();
    equipe.forEach((p) => p.codCargo && usados.set(String(p.codCargo), p.cargoNome || `Cargo ${p.codCargo}`));
    $("filtroCargo").innerHTML = '<option value="">Todos os cargos</option>' +
      [...usados].sort((a, b) => a[1].localeCompare(b[1], "pt-BR")).map(([c, n]) => `<option value="${esc(c)}">${esc(n)}</option>`).join("");
    $("filtroCargo").value = usados.has(atual) ? atual : "";
  }

  async function carregar() {
    $("estado").hidden = false;
    $("estado").textContent = "Carregando equipe…";
    $("corpo").innerHTML = "";
    try {
      [equipe, cargos] = await Promise.all([EquipeApi.listar(), CargoApi.listar()]);
      montarFiltroCargo();
      desenhar();
    } catch (e) {
      $("total").textContent = "";
      $("estado").innerHTML = `${esc(e.message)}<br><button type="button" class="btn sec peq" id="tentar">Tentar de novo</button>`;
      $("tentar").addEventListener("click", carregar);
    }
  }

  // ---------- formulário ----------
  const campos = () => ({ nome: $("nome"), cargo: $("cargo"), tel: $("tel"), email: $("email"), senha: $("senha") });

  function montarSelectCargo(codAtual) {
    const opcoes = cargos.filter((c) => c.status || c.codigo === codAtual);
    $("cargo").innerHTML = '<option value="">Selecione o cargo</option>' +
      opcoes.map((c) => `<option value="${c.codigo}">${esc(c.nome)}${c.status ? "" : " (inativo)"}</option>`).join("");
    if (!opcoes.length) {
      $("erroForm").textContent = "Nenhum cargo ativo cadastrado. Cadastre um cargo antes de adicionar integrantes.";
      $("erroForm").hidden = false;
    }
  }

  function abrirForm(p) {
    editando = p;
    $("form").reset();
    $("erroForm").hidden = true;
    Object.values(campos()).forEach((i) => i.removeAttribute("aria-invalid"));
    $("modalTitulo").textContent = p ? "Editar integrante" : "Novo integrante";
    // Senha: obrigatória ao criar, opcional ao editar
    $("rotuloSenha").textContent = p ? "Nova senha" : "Senha *";
    $("dicaSenha").textContent = p ? "Deixe em branco para manter a senha atual." : "";
    montarSelectCargo(p?.codCargo);
    if (p) {
      $("nome").value = p.nome ?? "";
      $("cargo").value = p.codCargo ?? "";
      $("tel").value = p.telefone ?? "";
      $("email").value = p.email ?? "";
      $("ativo").checked = !!p.status;
    }
    $("modal").showModal();
    $("nome").focus();
  }

  function validar() {
    const c = campos();
    const senha = c.senha.value;
    const regras = [
      [c.nome, c.nome.value.trim().length > 0, "Informe o nome do integrante."],
      [c.cargo, !!c.cargo.value, "Selecione o cargo."],
      [c.tel, Masks.digitos(c.tel.value).length >= 10, "Informe um telefone com DDD."],
      [c.email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email.value.trim()), "Informe um e-mail válido."],
      [c.senha, editando ? (senha === "" || senha.length >= 6) : senha.length >= 6, "A senha deve ter no mínimo 6 caracteres."]
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
      email: $("email").value.trim(),
      telefone: $("tel").value.trim(),
      codCargo: Number($("cargo").value),
      status: $("ativo").checked
    };
    // Na edição, só envia a senha se foi digitada (o back-end rejeita senha vazia)
    if ($("senha").value) corpo.senha = $("senha").value;

    $("btnSalvar").disabled = true;
    $("btnSalvar").textContent = "Salvando…";
    try {
      const eraEdicao = !!editando;
      if (editando) await EquipeApi.atualizar(editando.codigo, corpo);
      else await EquipeApi.criar(corpo);
      $("modal").close();
      Ui.toast(eraEdicao ? "Integrante atualizado com sucesso." : "Integrante cadastrado com sucesso.");
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
    const p = equipe.find((x) => x.codigo === Number(btn.closest("tr").dataset.codigo));
    if (!p) return;
    if (btn.dataset.acao === "editar") return abrirForm(p);
    excluindo = p;
    $("excluirTexto").textContent = `“${p.nome}” será removido. Essa ação não pode ser desfeita.`;
    $("erroExcluir").hidden = true;
    $("modalExcluir").showModal();
  });

  $("btnExcluirCancelar").addEventListener("click", () => $("modalExcluir").close());
  $("formExcluir").addEventListener("submit", async (e) => {
    e.preventDefault();
    $("btnExcluirOk").disabled = true;
    try {
      await EquipeApi.excluir(excluindo.codigo);
      $("modalExcluir").close();
      Ui.toast("Integrante excluído.");
      await carregar();
    } catch (err) {
      $("erroExcluir").textContent = err.message;
      $("erroExcluir").hidden = false;
    } finally {
      $("btnExcluirOk").disabled = false;
    }
  });

  $("busca").addEventListener("input", desenhar);
  ["filtroStatus", "filtroCargo"].forEach((id) => $(id).addEventListener("change", desenhar));

  carregar();
})();