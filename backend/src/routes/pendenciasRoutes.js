// Criação de rotas e métodos http das pendências

import express from "express";
import {
    listarPendencias,
    confirmarPendencia
} from "../controllers/pendenciasController.js";

const router = express.Router();

router.get("/", listarPendencias);
router.put("/:codigo/realizar", confirmarPendencia);

export default router;
