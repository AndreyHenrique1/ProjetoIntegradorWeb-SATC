// Rotas: /agenda/pendencias  (GET e PUT /:codigo/realizar). Pendência = compromisso com status "Pendente".
const PendenciaApi = {
  listar: () => Http.lista("/agenda/pendencias"),
  realizar: (codigo) => Http.put(`/agenda/pendencias/${codigo}/realizar`)
};