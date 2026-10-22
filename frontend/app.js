const API = "http://localhost:3000";
const $ = (id) => document.getElementById(id);

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pad = (n) => String(n).padStart(2, "0");
const isoDia = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const mesmoDia = (iso, dia) => iso && isoDia(new Date(iso)) === dia;
const fmtData = (iso) => new Date(iso).toLocaleDateString("pt-BR");
const fmtHora = (iso) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

// Texto branco ou escuro conforme a cor de fundo da tag
function corTexto(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return "#fff";
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16));
  return (r * 299 + g * 587 + b * 114) / 1000 > 160 ? "#111a33" : "#fff";
}

const hoje = new Date();
const DEMO = {
  pendencias: [{}, {}, {}],
  compromissos: [
    { titulo: "Alinhamento de pauta trimestral", tagNome: "Reunião", tagCor: "#16a870", clienteNome: "Cliente de teste", dataHoraInicio: new Date(hoje.setHours(9, 0)).toISOString(), dataHoraFim: new Date(hoje.setHours(10, 0)).toISOString() },
    { titulo: "Dúvida sobre contrato via WhatsApp", tagNome: "Atendimento", tagCor: "#7c3aed", clienteNome: "Cliente de teste", dataHoraInicio: new Date(hoje.setHours(11, 0)).toISOString(), dataHoraFim: new Date(hoje.setHours(11, 45)).toISOString() },
    { titulo: "Elaboração de release de imprensa", tagNome: "Assessoria", tagCor: "#f59a2b", clienteNome: "Cliente de teste", dataHoraInicio: new Date(hoje.setHours(14, 0)).toISOString(), dataHoraFim: new Date(hoje.setHours(14, 30)).toISOString() }
  ],
  clientes: new Array(6), funcionarios: new Array(50), veiculos: new Array(50)
};

let dados = null;

async function get(path) {
  const r = await fetch(API + path);
  if (!r.ok) throw new Error(r.status);
  const d = await r.json();
  return Array.isArray(d) ? d : [];
}

function desenhar(diaISO) {
  const ehHoje = diaISO === isoDia(new Date());
  const sufixo = ehHoje ? "hoje" : "em " + fmtData(diaISO + "T12:00:00");
  const doDia = dados.compromissos.filter((c) => mesmoDia(c.dataHoraInicio, diaISO));

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
      <span class="badge" style="--cor:${esc(c.tagCor || "#2340e8")};color:${corTexto(c.tagCor)}">${esc(c.tagNome || "Sem tag")}</span>
      <div><strong>${esc(c.titulo)}</strong><small>${fmtData(c.dataHoraInicio)} · ${esc(c.clienteNome || c.jornalistaNome || "Sem contato")}</small></div>
      <time>${fmtHora(c.dataHoraInicio)}</time>
    </li>`).join("") : '<li class="empty">Nenhum compromisso para este dia.</li>';
}

async function carregar() {
  try {
    const [pendencias, compromissos, clientes, funcionarios, veiculos] = await Promise.all([
      get("/agenda/pendencias"), get("/agenda/compromisso"), get("/contatos/cliente"),
      get("/usuario/equipe"), get("/contatos/veiculo")
    ]);
    dados = { pendencias, compromissos, clientes, funcionarios, veiculos };
  } catch {
    $("offline").hidden = false;
    dados = DEMO;
  }
  desenhar($("data").value);
}

$("data").value = isoDia(new Date());
$("filtro").addEventListener("submit", (e) => {
  e.preventDefault();
  if (dados && $("data").value) desenhar($("data").value);
});

// menu lateral no celular
const sidebar = $("sidebar"), menuBtn = $("menuBtn"), scrim = $("scrim");
function menu(abrir) {
  sidebar.classList.toggle("open", abrir);
  scrim.hidden = !abrir;
  menuBtn.setAttribute("aria-expanded", abrir);
}
menuBtn.addEventListener("click", () => menu(!sidebar.classList.contains("open")));
scrim.addEventListener("click", () => menu(false));
document.addEventListener("keydown", (e) => e.key === "Escape" && menu(false));

carregar();