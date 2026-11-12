// Rota: /agenda/tag  (por enquanto só a listagem, usada no formulário de compromisso)
const TagApi = {
  listar: () => Http.lista("/agenda/tag")
};