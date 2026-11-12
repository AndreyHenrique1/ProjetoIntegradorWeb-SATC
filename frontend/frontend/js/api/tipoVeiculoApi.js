// Rotas: /contatos/tipoVeiculo
const TipoVeiculoApi = {
  listar: () => Http.lista("/contatos/tipoVeiculo"),
  criar: (dados) => Http.post("/contatos/tipoVeiculo", dados),
  atualizar: (codigo, dados) => Http.put(`/contatos/tipoVeiculo/${codigo}`, dados),
  excluir: (codigo) => Http.delete(`/contatos/tipoVeiculo/${codigo}`)
};
