// Rota: /contatos/tipoVeiculo  (por enquanto só a listagem, usada no formulário de veículo)
const TipoVeiculoApi = {
  listar: () => Http.lista("/contatos/tipoVeiculo")
};
