// Controller do dashboard

import { db } from "../config/database.js";

export const getLogin = async (req, res) => {
    try {
        return res.json({ mensagem: "Rota de login, tudo certo por aqui!!!"});
    } 
    
    catch (error) {
        return res.status(500).json({ erro: error.message });
    }
};