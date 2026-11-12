// Rota: /contatos/historico (query: inicio,fim,funcionario,cliente,veiculo,tag,status)
const HistoricoApi = {
  listar(filtros = {}) {
    const params = new URLSearchParams();
    Object.entries(filtros).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") params.set(k, v); });
    const qs = params.toString();
    return Http.lista(`/contatos/historico${qs ? "?" + qs : ""}`);
  }
};