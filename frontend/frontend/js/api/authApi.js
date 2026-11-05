// POST /login (ainda a ser criado no back-end). Devolve a Response para o chamador tratar o status.
const AuthApi = {
  login(email, senha) {
    return fetch(`${Config.API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha })
    });
  }
};
