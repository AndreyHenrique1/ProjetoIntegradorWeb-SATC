// Rotas: /contatos/jornalista  (GET, POST, PUT /:codigo, DELETE /:codigo)
const JornalistaApi = {
  listar: () => Http.lista("/contatos/jornalista"),
  criar: (dados) => Http.post("/contatos/jornalista", dados),
  atualizar: (codigo, dados) => Http.put(`/contatos/jornalista/${codigo}`, dados),
  excluir: (codigo) => Http.delete(`/contatos/jornalista/${codigo}`)
};
