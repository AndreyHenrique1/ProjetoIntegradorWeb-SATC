const EquipeApi = {
  listar: () => Http.lista("/usuario/equipe"),
  criar: (dados) => Http.post("/usuario/equipe", dados),
  atualizar: (codigo, dados) => Http.put(`/usuario/equipe/${codigo}`, dados),
  excluir: (codigo) => Http.delete(`/usuario/equipe/${codigo}`)
};
