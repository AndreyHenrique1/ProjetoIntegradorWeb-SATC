// Criação de rotas e metodos http dos clientes

import express from "express";
import {
    getCliente,
    createCliente,
    updateCliente,
    deleteCliente
} from "../controllers/clienteController.js";

const router = express.Router();

router.get("/", getCliente);
router.get("/:codigo", getCliente);
router.post("/", createCliente);
router.put("/:codigo", updateCliente);
router.delete("/:codigo", deleteCliente);

export default router;
