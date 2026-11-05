// Camada única de comunicação com a API. Envia o token quando existir
// e transforma as respostas de erro do back-end ({ mensagem }) em Error com .status.
const Http = {
  cabecalhos() {
    const h = { "Content-Type": "application/json" };
    const token = Auth.obter()?.token;
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  },
  async enviar(metodo, caminho, corpo) {
    let r;
    try {
      r = await fetch(Config.API_URL + caminho, {
        method: metodo,
        headers: this.cabecalhos(),
        body: corpo ? JSON.stringify(corpo) : undefined
      });
    } catch {
      throw Object.assign(new Error("Não consegui conectar ao servidor."), { status: 0 });
    }
    const dados = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(dados.mensagem || `Erro ${r.status}`), { status: r.status });
    return dados;
  },
  get(caminho) { return this.enviar("GET", caminho); },
  post(caminho, corpo) { return this.enviar("POST", caminho, corpo); },
  put(caminho, corpo) { return this.enviar("PUT", caminho, corpo); },
  delete(caminho) { return this.enviar("DELETE", caminho); },
  async lista(caminho) {
    const d = await this.get(caminho);
    return Array.isArray(d) ? d : [];
  }
};
