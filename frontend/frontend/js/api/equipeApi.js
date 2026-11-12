const EquipeApi = {
  listar: () => Http.lista("/usuario/equipe"),
  obter: (codigo) => Http.get(`/usuario/equipe/${codigo}`),
  criar: (dados) => Http.post("/usuario/equipe", dados),
  atualizar: (codigo, dados) => Http.put(`/usuario/equipe/${codigo}`, dados),
  excluir: (codigo) => Http.delete(`/usuario/equipe/${codigo}`)
};
