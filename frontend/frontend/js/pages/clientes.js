// Página: pages/contatos/clientes.html
(() => {
  const $ = (id) => document.getElementById(id);
  const { esc } = Fmt;

  let clientes = [];
  let editando = null;   // cliente em edição (null = novo)
  let excluindo = null;  // cliente aguardando confirmação de exclusão

  const normalizar = Ui.normalizar;

  // ---------- lista ----------
  function filtrados() {
    const q = normalizar($("busca").value.trim());
    const qDigitos = Masks.digitos(q);
    const st = $("filtroStatus").value;
    return clientes.filter((c) => {
      if (st === "ativos" && !c.status) return false;
      if (st === "inativos" && c.status) return false;
      if (!q) return true;
      return normalizar(c.razaoSocial_NomeEmpresa).includes(q)
        || normalizar(c.email).includes(q)
        || (qDigitos && Masks.digitos(c.cpfCnpj).includes(qDigitos));
    });
  }

  function desenhar() {
    const lista = filtrados();
    $("total").textContent = `${lista.length} de ${clientes.length} cliente${clientes.length === 1 ? "" : "s"}`;
    $("corpo").innerHTML = lista.map((c) => `
      <tr data-codigo="${c.codigo}">
        <td data-label="Cliente"><div><strong>${esc(c.razaoSocial_NomeEmpresa)}</strong><small>${esc(c.email)}</small></div></td>
        <td data-label="CPF / CNPJ">${esc(c.cpfCnpj)}</td>
        <td data-label="Telefone">${esc(c.telefone)}</td>
        <td data-label="Status"><span class="pill ${c.status ? "ativo" : "inativo"}">${c.status ? "Ativo" : "Inativo"}</span></td>
        <td class="acoes">
          <button type="button" class="btn sec peq" data-acao="editar" aria-label="Editar ${esc(c.razaoSocial_NomeEmpresa)}">Editar</button>
          <button type="button" class="btn sec peq" data-acao="excluir" aria-label="Excluir ${esc(c.razaoSocial_NomeEmpresa)}">Excluir</button>
        </td>
      </tr>`).join("");

    const estado = $("estado");
    estado.hidden = lista.length > 0;
    if (!lista.length) {
      estado.textContent = clientes.length ? "Nenhum cliente encontrado com esses filtros." : "Nenhum cliente cadastrado ainda.";
    }
  }

  async function carregar() {
    $("estado").hidden = false;
    $("estado").textContent = "Carregando clientes…";
    $("corpo").innerHTML = "";
    try {
      clientes = await ClienteApi.listar();
      desenhar();
    } catch (e) {
      $("total").textContent = "";
      $("estado").innerHTML = `${esc(e.message)}<br><button type="button" class="btn sec peq" id="tentar">Tentar de novo</button>`;
      $("tentar").addEventListener("click", carregar);
    }
  }

  // ---------- formulário ----------
  const campos = () => ({ nome: $("nome"), doc: $("doc"), tel: $("tel"), email: $("email"), endereco: $("endereco") });

  function abrirForm(cliente) {
    editando = cliente;
    $("form").reset();
    $("erroForm").hidden = true;
    Object.values(campos()).forEach((i) => { i.removeAttribute("aria-invalid"); });
    $("modalTitulo").textContent = cliente ? "Editar cliente" : "Novo cliente";
    if (cliente) {
      $("nome").value = cliente.razaoSocial_NomeEmpresa ?? "";
      $("doc").value = cliente.cpfCnpj ?? "";
      $("tel").value = cliente.telefone ?? "";
      $("email").value = cliente.email ?? "";
      $("endereco").value = cliente.endereco ?? "";
      $("site").value = cliente.siteRedesSociais ?? "";
      $("obs").value = cliente.observacoes ?? "";
      $("ativo").checked = !!cliente.status;
    }
    $("modal").showModal();
    $("nome").focus();
  }

  function validar() {
    const c = campos();
    const dig = Masks.digitos(c.doc.value);
    const regras = [
      [c.nome, c.nome.value.trim().length > 0, "Informe a razão social ou o nome."],
      [c.doc, dig.length === 11 || dig.length === 14, "Informe um CPF (11 dígitos) ou CNPJ (14 dígitos)."],
      [c.tel, Masks.digitos(c.tel.value).length >= 10, "Informe um telefone com DDD."],
      [c.email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email.value.trim()), "Informe um e-mail válido."],
      [c.endereco, c.endereco.value.trim().length > 0, "Informe o endereço."]
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
      razaoSocial_NomeEmpresa: $("nome").value.trim(),
      cpf_cnpj: Masks.digitos($("doc").value),
      email: $("email").value.trim(),
      telefone: $("tel").value.trim(),
      endereco: $("endereco").value.trim(),
      site_RedesSociais: $("site").value.trim(),
      observacoes: $("obs").value.trim(),
      status: $("ativo").checked
    };

    $("btnSalvar").disabled = true;
    $("btnSalvar").textContent = "Salvando…";
    try {
      if (editando) await ClienteApi.atualizar(editando.codigo, corpo);
      else await ClienteApi.criar(corpo);
      const eraEdicao = !!editando;
      $("modal").close();
      Ui.toast(eraEdicao ? "Cliente atualizado com sucesso." : "Cliente cadastrado com sucesso.");
      await carregar();
    } catch (err) {
      $("erroForm").textContent = err.message;
      $("erroForm").hidden = false;
    } finally {
      $("btnSalvar").disabled = false;
      $("btnSalvar").textContent = "Salvar";
    }
  });

  // máscaras
  $("doc").addEventListener("input", (e) => (e.target.value = Masks.cpfCnpj(e.target.value)));
  $("tel").addEventListener("input", (e) => (e.target.value = Masks.telefone(e.target.value)));

  $("btnNovo").addEventListener("click", () => abrirForm(null));
  $("btnCancelar").addEventListener("click", () => $("modal").close());

  // ---------- exclusão ----------
  $("corpo").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-acao]");
    if (!btn) return;
    const cliente = clientes.find((c) => c.codigo === Number(btn.closest("tr").dataset.codigo));
    if (!cliente) return;
    if (btn.dataset.acao === "editar") return abrirForm(cliente);
    excluindo = cliente;
    $("excluirTexto").textContent = `“${cliente.razaoSocial_NomeEmpresa}” será removido. Essa ação não pode ser desfeita.`;
    $("erroExcluir").hidden = true;
    $("modalExcluir").showModal();
  });

  $("btnExcluirCancelar").addEventListener("click", () => $("modalExcluir").close());
  $("formExcluir").addEventListener("submit", async (e) => {
    e.preventDefault();
    $("btnExcluirOk").disabled = true;
    try {
      await ClienteApi.excluir(excluindo.codigo);
      $("modalExcluir").close();
      Ui.toast("Cliente excluído.");
      await carregar();
    } catch (err) {
      // ex.: 409 quando o cliente tem compromissos vinculados
      $("erroExcluir").textContent = err.message;
      $("erroExcluir").hidden = false;
    } finally {
      $("btnExcluirOk").disabled = false;
    }
  });

  // ---------- filtros ----------
  $("busca").addEventListener("input", desenhar);
  $("filtroStatus").addEventListener("change", desenhar);

  carregar();
})();
