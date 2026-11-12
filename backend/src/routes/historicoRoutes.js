import express from "express";
import { getHistoricoRelacionamento } from "../controllers/historicoController.js";

const router = express.Router();

router.get("/", getHistoricoRelacionamento);

export default router;