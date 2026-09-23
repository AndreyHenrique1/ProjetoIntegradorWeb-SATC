// logica do dashboard

import { db } from "../config/database.js";

export const getDashboard = async (req, res) => {
    try {
        return res.json({ mensagem: "Rota do Dashboard, tudo certo por aqui!!!"});
    } 
    
    catch (error) {
        return res.status(500).json({ erro: error.message });
    }
};