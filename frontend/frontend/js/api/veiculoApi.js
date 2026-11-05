// Rotas: /contatos/veiculo  (GET, POST, PUT /:codigo, DELETE /:codigo)
const VeiculoApi = {
  listar: () => Http.lista("/contatos/veiculo"),
  criar: (dados) => Http.post("/contatos/veiculo", dados),
  atualizar: (codigo, dados) => Http.put(`/contatos/veiculo/${codigo}`, dados),
  excluir: (codigo) => Http.delete(`/contatos/veiculo/${codigo}`)
};
