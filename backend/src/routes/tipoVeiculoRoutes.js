// Criação de rotas e metodos http dos tipos de veículos

import express from "express";
import {
    getTipoVeiculo,
    createTipoVeiculo,
    updateTipoVeiculo,
    deleteTipoVeiculo
} from "../controllers/tipoVeiculoController.js";

const router = express.Router();

router.get("/", getTipoVeiculo);
router.get("/:codigo", getTipoVeiculo);
router.post("/", createTipoVeiculo);
router.put("/:codigo", updateTipoVeiculo);
router.delete("/:codigo", deleteTipoVeiculo);

export default router;