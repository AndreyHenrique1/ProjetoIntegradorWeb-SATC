// Configurações do front. Mude a URL da API só aqui.
const Config = {
  API_URL:
    location.hostname === "localhost" || location.hostname === "127.0.0.1"
      ? "http://localhost:3000"
      : "",
  MODO_DEV: false
};