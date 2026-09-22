// Criação de rotas e metodos http dos cargos

import express from "express";
import {
    getCargo,
    createCargo,
    updateCargo,
    deleteCargo
} from "../controllers/cargoController.js";

const router = express.Router();

router.get("/", getCargo);
router.get("/:codigo", getCargo);
router.post("/", createCargo);
router.put("/:codigo", updateCargo);
router.delete("/:codigo", deleteCargo);

export default router;
