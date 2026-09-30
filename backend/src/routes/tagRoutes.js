// Criação de rotas e metodos http das tags

import express from "express";
import {
    getTag,
    getCores,
    createTag,
    updateTag,
    deleteTag
} from "../controllers/tagController.js";

const router = express.Router();

router.get("/", getTag);
router.get("/cores", getCores);
router.get("/:codigo", getTag);
router.post("/", createTag);
router.put("/:codigo", updateTag);
router.delete("/:codigo", deleteTag);

export default router;
