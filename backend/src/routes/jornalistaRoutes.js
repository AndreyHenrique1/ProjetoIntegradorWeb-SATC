// Criação de rotas e metodos http dos jornalistas

import express from "express";
import {
    getJornalista,
    createJornalista,
    updateJornalista,
    deleteJornalista
} from "../controllers/jornalistaController.js";

const router = express.Router();

router.get("/", getJornalista);
router.get("/:codigo", getJornalista);
router.post("/", createJornalista);
router.put("/:codigo", updateJornalista);
router.delete("/:codigo", deleteJornalista);

export default router;
