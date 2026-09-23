import express from "express";
import cors from "cors";
import cargoRoutes from "./routes/cargoRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js"
import loginRoutes from "./routes/loginRoutes.js"
import equipeRoutes from "./routes/equipeRoutes.js"

// Criar a aplicação express
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

//Rota de login
app.use("/", loginRoutes)

//Rota de Equipes
app.use("/usuario/equipe", equipeRoutes)

//Rota de cargos
app.use("/usuario/cargo", cargoRoutes);

//Rota do dashboard
app.use("/Dashboard", dashboardRoutes);



app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});