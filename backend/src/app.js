import express from "express";
import cors from "cors";
import cargoRoutes from "./routes/cargoRoutes.js";


// Criar a aplicação express
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
    return res.json({
        mensagem: "Back-end funcionando!"
    });
});

//Rota de cargos
app.use("/usuario/cargo", cargoRoutes);

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});