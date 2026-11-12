import express from "express";
import cors from "cors";
import cargoRoutes from "./routes/cargoRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import loginRoutes from "./routes/loginRoutes.js";
import equipeRoutes from "./routes/equipeRoutes.js";
import tipoVeiculoRoutes from "./routes/tipoVeiculoRoutes.js";
import veiculoRoutes from "./routes/veiculoRoutes.js";
import jornalistaRoutes from "./routes/jornalistaRoutes.js";
import clienteRoutes from "./routes/clienteRoutes.js";
import tagRoutes from "./routes/tagRoutes.js";
import compromissoRoutes from "./routes/compromissoRoutes.js";
import pendenciasRoutes from "./routes/pendenciasRoutes.js";
import historicoRoutes from "./routes/historicoRoutes.js";
import { authMiddleware } from "./middleware/authMiddleware.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Criar a aplicação express
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "../../frontend/frontend")));

// Rota pública de autenticação
app.use("/login", loginRoutes);

// Rotas protegidas (exigem token JWT)
app.use(authMiddleware);

app.use("/usuario/equipe", equipeRoutes);
app.use("/usuario/cargo", cargoRoutes);
app.use("/Dashboard", dashboardRoutes);
app.use("/contatos/tipoVeiculo", tipoVeiculoRoutes);
app.use("/contatos/veiculo", veiculoRoutes);
app.use("/contatos/jornalista", jornalistaRoutes);
app.use("/contatos/cliente", clienteRoutes);
app.use("/agenda/tag", tagRoutes);
app.use("/agenda/compromisso", compromissoRoutes);
app.use("/agenda/pendencias", pendenciasRoutes);
app.use("/contatos/historico", historicoRoutes);

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
