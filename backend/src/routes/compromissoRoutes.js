// Criação de rotas e métodos HTTP dos compromissos

import express from "express";
import {
    getCompromisso,
    createCompromisso,
    updateCompromisso,
    deleteCompromisso,
    getCompromissoPorTag,
    getPedencias
} from "../controllers/compromissoController.js";

const router = express.Router();

// Listar todos os compromissos
router.get("/", getCompromisso);

// Listar compromissos por tag (para o botão de tags)
router.get("/tag/:codigo", getCompromissoPorTag);

// Listar pedências (compromissos pendentes)
router.get("/pedencias", getPedencias);

// Buscar compromisso por código
router.get("/:codigo", getCompromisso);

// Criar novo compromisso
router.post("/", createCompromisso);

// Atualizar compromisso
router.put("/:codigo", updateCompromisso);

// Excluir compromisso
router.delete("/:codigo", deleteCompromisso);

export default router;