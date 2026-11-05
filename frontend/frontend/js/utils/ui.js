// Utilitários de interface usados em várias telas.
const Ui = {
  // Minúsculas e sem acentos, para buscas
  normalizar: (s) => String(s ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""),

  _timer: null,
  toast(msg) {
    let t = document.getElementById("toast");
    if (!t) {
      t = document.createElement("div");
      t.id = "toast"; t.className = "toast"; t.setAttribute("role", "status");
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(this._timer);
    this._timer = setTimeout(() => (t.hidden = true), 3500);
  }
};
