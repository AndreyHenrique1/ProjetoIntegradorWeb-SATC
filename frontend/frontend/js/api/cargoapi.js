// Rotas: /usuario/cargo  (GET, POST, PUT /:codigo, DELETE /:codigo)
const CargoApi = {
  listar: () => Http.lista("/usuario/cargo"),
  criar: (dados) => Http.post("/usuario/cargo", dados),
  atualizar: (codigo, dados) => Http.put(`/usuario/cargo/${codigo}`, dados),
  excluir: (codigo) => Http.delete(`/usuario/cargo/${codigo}`)
};