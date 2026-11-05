// Rotas: /contatos/cliente  (GET, POST, PUT /:codigo, DELETE /:codigo)
const ClienteApi = {
  listar: () => Http.lista("/contatos/cliente"),
  criar: (dados) => Http.post("/contatos/cliente", dados),
  atualizar: (codigo, dados) => Http.put(`/contatos/cliente/${codigo}`, dados),
  excluir: (codigo) => Http.delete(`/contatos/cliente/${codigo}`)
};
