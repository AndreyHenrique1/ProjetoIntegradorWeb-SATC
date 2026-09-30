// Criação de rotas e metodos http dos veículos

import express from "express";
import {
    getVeiculo,
    createVeiculo,
    updateVeiculo,
    deleteVeiculo
} from "../controllers/veiculoController.js";

const router = express.Router();

router.get("/", getVeiculo);
router.get("/:codigo", getVeiculo);
router.post("/", createVeiculo);
router.put("/:codigo", updateVeiculo);
router.delete("/:codigo", deleteVeiculo);

export default router;