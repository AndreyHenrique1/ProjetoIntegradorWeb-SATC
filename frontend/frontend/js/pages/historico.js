(() => {
  const $ = (id) => document.getElementById(id);
  const { esc } = Fmt;

  let registros = [], equipe = [], clientes = [], veiculos = [], tags = [];

  const toLocalInput = (d) => {
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  };
  const inicioSemana = (ref) => {
    const d = new Date(ref); d.setHours(0,0,0,0);
    const day = d.getDay(); const diff = day === 0 ? -6 : 1 - day; // segunda
    d.setDate(d.getDate() + diff);
    return d;
  };
  const fmtHoras = (h) => { const v = Number(h) || 0; const hh = Math.floor(v); const mm = Math.round((v - hh) * 60); return `${hh}H ${String(mm).padStart(2,"0")}M`; };
  const horasEntre = (ini, fim) => { if (!ini || !fim) return 0; const ms = new Date(fim) - new Date(ini); return ms > 0 ? ms / 36e5 : 0; };

  function montarSelect(sel, itens, vazio, nomeFn) {
    sel.innerHTML = `<option value="">${vazio}</option>` + itens.map((i) => `<option value="${i.codigo}">${esc(nomeFn(i))}</option>`).join("");
  }

  function lerFiltros() {
    const v = (id) => $(id).value;
    const f = { inicio: v("fInicio"), fim: v("fFim"), funcionario: v("fFuncionario"), cliente: v("fCliente"), veiculo: v("fVeiculo"), tag: v("fTag"), status: v("fStatus") };
    if (f.inicio) f.inicio = f.inicio.replace("T", " ") + ":00";
    if (f.fim) f.fim = f.fim.replace("T", " ") + ":00";
    Object.keys(f).forEach((k) => { if (!f[k]) delete f[k]; });
    return f;
  }

  function desenharIndicadores() {
    const agora = new Date();
    const iniHoje = new Date(agora); iniHoje.setHours(0,0,0,0);
    const fimHoje = new Date(agora); fimHoje.setHours(23,59,59,999);
    const iniSem = inicioSemana(agora);
    const fimSem = new Date(iniSem); fimSem.setDate(fimSem.getDate() + 6); fimSem.setHours(23,59,59,999);
    const em = (d, a, b) => d && new Date(d) >= a && new Date(d) <= b;
    const realizados = registros.filter((r) => r.status !== "Pendente" && r.status !== "Cancelado");
    const hHoje = realizados.filter((r) => em(r.dataHoraInicio, iniHoje, fimHoje)).reduce((s,r)=>s+horasEntre(r.dataHoraInicio,r.dataHoraFim),0);
    const hSem = realizados.filter((r) => em(r.dataHoraInicio, iniSem, fimSem)).reduce((s,r)=>s+horasEntre(r.dataHoraInicio,r.dataHoraFim),0);
    const abertos = registros.filter((r) => r.status === "Pendente").length;
    $("hHoje").textContent = fmtHoras(hHoje);
    $("hSemana").textContent = fmtHoras(hSem);
    $("hAbertos").textContent = String(abertos).padStart(2,"0");
  }

  function desenharTabela() {
    $("total").textContent = `${registros.length} registro${registros.length === 1 ? "" : "s"}`;
    $("corpo").innerHTML = registros.map((r) => {
      const parts = (r.participantesEquipe || []).map((p) => esc(p.nome)).join(", ");
      const tag = r.tagNome ? `<span class="tag-chip"><span class="tag-dot" style="background:${esc(r.tagCor||"#ccc")}"></span>${esc(r.tagNome)}</span>` : "—";
      const vj = [r.veiculoNome, r.jornalistaNome].filter(Boolean).map(esc).join(" · ") || "—";
      const st = r.status === "Concluido" ? "Concluído" : (r.status || "—");
      const stClass = r.status === "Concluido" ? "ativo" : (r.status === "Cancelado" ? "inativo" : "");
      const th = horasEntre(r.dataHoraInicio, r.dataHoraFim);
      return `<tr>
        <td data-label="Data">${r.dataHoraInicio ? esc(Fmt.data(r.dataHoraInicio)) : "—"}</td>
        <td data-label="Tag">${tag}</td>
        <td data-label="Título"><strong>${esc(r.titulo || "")}</strong></td>
        <td data-label="Cliente">${esc(r.clienteNome || "—")}</td>
        <td data-label="Veículo / Jornalista">${vj}</td>
        <td data-label="Início">${r.dataHoraInicio ? esc(Fmt.hora(r.dataHoraInicio)) : "—"}</td>
        <td data-label="Fim">${r.dataHoraFim ? esc(Fmt.hora(r.dataHoraFim)) : "—"}</td>
        <td data-label="Total (h)">${th ? th.toFixed(2) : "—"}</td>
        <td data-label="Participantes">${parts || "—"}</td>
        <td data-label="Status"><span class="pill ${stClass}">${esc(st)}</span></td>
      </tr>`;
    }).join("");
    const estado = $("estado");
    estado.hidden = registros.length > 0;
    if (!registros.length) estado.textContent = "Nenhum registro encontrado com esses filtros.";
  }

  async function carregar() {
    $("erroCarga").hidden = true;
    $("estado").hidden = false; $("estado").textContent = "Carregando histórico…"; $("corpo").innerHTML = "";
    try {
      registros = await HistoricoApi.listar(lerFiltros());
      desenharIndicadores();
      desenharTabela();
    } catch (e) {
      $("estado").hidden = true; $("total").textContent = "";
      $("erroCarga").innerHTML = `${esc(e.message)} <button type="button" class="btn sec peq" id="tentar">Tentar de novo</button>`;
      $("erroCarga").hidden = false;
      $("tentar").addEventListener("click", carregar);
    }
  }

  async function carregarFiltros() {
    try {
      [equipe, clientes, veiculos, tags] = await Promise.all([EquipeApi.listar(), ClienteApi.listar(), VeiculoApi.listar(), TagApi.listar()]);
    } catch { equipe = []; clientes = []; veiculos = []; tags = []; }
    montarSelect($("fFuncionario"), equipe, "Todos", (x) => x.nome);
    montarSelect($("fCliente"), clientes, "Todos", (x) => x.razaoSocial_NomeEmpresa);
    montarSelect($("fVeiculo"), veiculos, "Todos", (x) => x.nome);
    montarSelect($("fTag"), tags, "Todas", (x) => x.nome);
  }

  $("filtros").addEventListener("submit", (e) => { e.preventDefault(); carregar(); });
  $("btnLimpar").addEventListener("click", () => { $("filtros").reset(); carregar(); });

  $("btnExportar").addEventListener("click", () => {
    const w = window.open("", "_blank");
    if (!w) return;
    const css = `
      <style>
        body{font-family:Arial,Helvetica,sans-serif;color:#111;padding:16px}
        h1{font-size:20px;margin:0 0 4px} p{margin:0 0 12px;color:#444;font-size:13px}
        .kpis{display:flex;gap:12px;margin:12px 0}
        .kpi{border:1px solid #ddd;border-radius:8px;padding:10px 14px;flex:1}
        .kpi small{display:block;color:#555;font-size:12px}.kpi b{font-size:18px}
        table{width:100%;border-collapse:collapse;font-size:12px}
        th,td{border:1px solid #ddd;padding:6px 8px;text-align:left;vertical-align:top}
        th{background:#f4f6fb}
      </style>`;
    const kpis = `<div class="kpis">
      <div class="kpi"><small>Horas realizadas hoje</small><b>${esc($("hHoje").textContent)}</b></div>
      <div class="kpi"><small>Horas realizadas esta semana</small><b>${esc($("hSemana").textContent)}</b></div>
      <div class="kpi"><small>Registros em aberto</small><b>${esc($("hAbertos").textContent)}</b></div>
    </div>`;
    const tabela = document.getElementById("tabelaHistorico").outerHTML;
    const periodo = `Exportado em ${new Date().toLocaleString("pt-BR")} · ${esc($("total").textContent || "")}`;
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Histórico de relacionamento</title>${css}</head><body>
      <h1>Histórico de relacionamento</h1><p>${periodo}</p>${kpis}${tabela}
      <script>window.onload=()=>{window.print();};<\/script></body></html>`);
    w.document.close();
  });

  carregarFiltros();
  carregar();
})();