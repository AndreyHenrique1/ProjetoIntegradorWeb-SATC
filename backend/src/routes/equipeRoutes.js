// Criação de rotas e metodos http das Equipes

import express from "express";
import {
    getFuncionario,
    createFuncionario,
    updateFuncionario,
    deleteFuncionario
} from "../controllers/equipeController.js";

const router = express.Router();

router.get("/", getFuncionario);
router.get("/:codigo", getFuncionario);
router.post("/", createFuncionario);
router.put("/:codigo", updateFuncionario);
router.delete("/:codigo", deleteFuncionario);

export default router;