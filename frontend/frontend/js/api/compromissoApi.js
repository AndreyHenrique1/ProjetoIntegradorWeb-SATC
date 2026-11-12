// Rotas: /agenda/compromisso  (GET, GET /:codigo, POST, PUT /:codigo, DELETE /:codigo)
const CompromissoApi = {
  listar: () => Http.lista("/agenda/compromisso"),
  obter: (codigo) => Http.get(`/agenda/compromisso/${codigo}`),   // traz também clientes adicionais e participantes
  criar: (dados) => Http.post("/agenda/compromisso", dados),
  atualizar: (codigo, dados) => Http.put(`/agenda/compromisso/${codigo}`, dados),
  excluir: (codigo) => Http.delete(`/agenda/compromisso/${codigo}`)
};