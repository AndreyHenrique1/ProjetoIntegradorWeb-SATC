// Funções de formatação usadas em várias páginas.
const Fmt = {
  esc: (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])),
  pad: (n) => String(n).padStart(2, "0"),
  isoDia(d) { return `${d.getFullYear()}-${this.pad(d.getMonth() + 1)}-${this.pad(d.getDate())}`; },
  mesmoDia(iso, dia) { return !!iso && this.isoDia(new Date(iso)) === dia; },
  data: (iso) => iso ? new Date(iso).toLocaleDateString("pt-BR") : "–",
  hora: (iso) => iso ? new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "–",
  // Texto branco ou escuro conforme a cor de fundo da tag
  corTexto(hex) {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
    if (!m) return "#fff";
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16));
    return (r * 299 + g * 587 + b * 114) / 1000 > 160 ? "#111a33" : "#fff";
  },
  // Converte um ISO da API para o valor de <input type="datetime-local"> (hora local)
  paraInputLocal(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    return `${this.isoDia(d)}T${this.pad(d.getHours())}:${this.pad(d.getMinutes())}`;
  },
  // "2026-11-12T14:00" -> "2026-11-12 14:00:00" (formato aceito pelo back-end/MySQL)
  paraApi: (valorLocal) => valorLocal ? valorLocal.replace("T", " ") + ":00" : null
};