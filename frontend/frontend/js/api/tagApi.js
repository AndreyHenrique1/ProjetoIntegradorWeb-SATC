// Rotas: /agenda/tag
const TagApi = {
  listar: () => Http.lista("/agenda/tag"),
  cores: () => Http.get("/agenda/tag/cores").catch(() => []),
  criar: (dados) => Http.post("/agenda/tag", dados),
  atualizar: (codigo, dados) => Http.put(`/agenda/tag/${codigo}`, dados),
  excluir: (codigo) => Http.delete(`/agenda/tag/${codigo}`)
};