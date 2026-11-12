// Página: index.html (dashboard)
(() => {
  const $ = (id) => document.getElementById(id);
  const { pad, esc } = Fmt;

  const hoje = new Date();
  const dia = (h, m) => new Date(new Date(hoje).setHours(h, m, 0, 0)).toISOString();
  const DEMO = {
    pendencias: [{}, {}, {}],
    compromissos: [
      { titulo: "Alinhamento de pauta trimestral", tagNome: "Reunião", tagCor: "#16a870", clienteNome: "Cliente de teste", dataHoraInicio: dia(9, 0), dataHoraFim: dia(10, 0) },
      { titulo: "Dúvida sobre contrato via WhatsApp", tagNome: "Atendimento", tagCor: "#7c3aed", clienteNome: "Cliente de teste", dataHoraInicio: dia(11, 0), dataHoraFim: dia(11, 45) },
      { titulo: "Elaboração de release de imprensa", tagNome: "Assessoria", tagCor: "#f59a2b", clienteNome: "Cliente de teste", dataHoraInicio: dia(14, 0), dataHoraFim: dia(14, 30) }
    ],
    clientes: new Array(6), funcionarios: new Array(50), veiculos: new Array(50)
  };

  let dados = null;

  function desenhar(diaISO) {
    const ehHoje = diaISO === Fmt.isoDia(new Date());
    const sufixo = ehHoje ? "hoje" : "em " + Fmt.data(diaISO + "T12:00:00");
    const doDia = dados.compromissos.filter((c) => c.status !== "Cancelado" && Fmt.mesmoDia(c.dataHoraInicio, diaISO));

    const minutos = doDia.reduce((t, c) => c.dataHoraFim ? t + Math.max(0, (new Date(c.dataHoraFim) - new Date(c.dataHoraInicio)) / 6e4) : t, 0);
    $("sAbertos").textContent = pad(dados.pendencias.length);
    $("sHoras").textContent = `${Math.floor(minutos / 60)}H ${pad(Math.round(minutos % 60))}M`;
    $("sComp").textContent = doDia.length;
    $("lHoras").textContent = "Horas " + sufixo;
    $("lComp").textContent = "Compromissos " + sufixo;
    $("tComp").textContent = "Compromissos " + sufixo;
    $("cCli").textContent = pad(dados.clientes.length);
    $("cFun").textContent = pad(dados.funcionarios.length);
    $("cVei").textContent = pad(dados.veiculos.length);

    $("compList").innerHTML = doDia.length ? doDia.map((c) => `
      <li>
        <span class="badge" style="--cor:${esc(c.tagCor || "#2340e8")};color:${Fmt.corTexto(c.tagCor)}">${esc(c.tagNome || "Sem tag")}</span>
        <div><strong>${esc(c.titulo)}</strong><small>${Fmt.data(c.dataHoraInicio)} · ${esc(c.clienteNome || c.jornalistaNome || "Sem contato")}</small></div>
        <time>${Fmt.hora(c.dataHoraInicio)}</time>
      </li>`).join("") : '<li class="empty">Nenhum compromisso para este dia.</li>';
  }

  async function carregar() {
    try {
      const [pendencias, compromissos, clientes, funcionarios, veiculos] = await Promise.all([
        PendenciaApi.listar(), CompromissoApi.listar(), ClienteApi.listar(), EquipeApi.listar(), VeiculoApi.listar()
      ]);
      dados = { pendencias, compromissos, clientes, funcionarios, veiculos };
    } catch {
      $("offline").hidden = false;
      dados = DEMO;
    }
    desenhar($("data").value);
  }

  $("data").value = Fmt.isoDia(new Date());
  $("filtro").addEventListener("submit", (e) => {
    e.preventDefault();
    if (dados && $("data").value) desenhar($("data").value);
  });

  carregar();
})();