// Controller das pendências (compromissos com status Pendente)

import { db } from "../config/database.js";

// Validar código (número inteiro > 0)
const validarCodigo = (valor) => {
    const codigo = Number(valor);
    return Number.isInteger(codigo) && codigo > 0 ? codigo : null;
};

// -=-=-=-=-= Listar pendências -=-=-=-=-=
export const listarPendencias = async (req, res) => {
    try {
        const [pendencias] = await db.query(
            `SELECT 
                c.codigo,
                c.titulo,
                c.status,
                t.nome AS tagNome,
                t.cor AS tagCor,
                cl.razaoSocial_NomeEmpresa AS clienteNome,
                c.dataHoraInicio,
                c.dataHoraFim,
                CASE 
                    WHEN c.dataHoraInicio IS NOT NULL AND c.dataHoraFim IS NOT NULL
                    THEN ROUND(TIMESTAMPDIFF(MINUTE, c.dataHoraInicio, c.dataHoraFim) / 60, 2)
                    ELSE NULL
                END AS totalHoras
            FROM compromisso c
            LEFT JOIN cliente cl ON c.codCliente = cl.codigo
            LEFT JOIN tag t ON c.codTag = t.codigo
            WHERE c.status = 'Pendente'
            ORDER BY c.dataHoraInicio`
        );

        return res.status(200).json(pendencias);
    } catch (error) {
        console.error("Erro ao buscar pendências:", error);
        return res.status(500).json({
            mensagem: "Erro ao buscar pendências.",
            erro: error.message
        });
    }
};

// -=-=-=-=-= Confirmar/realizar pendência -=-=-=-=-=
export const confirmarPendencia = async (req, res) => {
    const codigo = validarCodigo(req.params.codigo);

    if (!codigo) {
        return res.status(400).json({
            mensagem: "Informe um código válido para a pendência."
        });
    }

    try {
        const [pendenciaExistente] = await db.query(
            "SELECT codigo, status FROM compromisso WHERE codigo = ?",
            [codigo]
        );

        if (pendenciaExistente.length === 0) {
            return res.status(404).json({
                mensagem: "Pendência não encontrada."
            });
        }

        if (pendenciaExistente[0].status !== "Pendente") {
            return res.status(409).json({
                mensagem: "Esta pendência já foi realizada ou não está pendente."
            });
        }

        await db.query(
            "UPDATE compromisso SET status = 'Concluido' WHERE codigo = ?",
            [codigo]
        );

        return res.status(200).json({
            mensagem: "Pendência confirmada como realizada com sucesso.",
            codigo
        });
    } catch (error) {
        console.error("Erro ao confirmar pendência:", error);
        return res.status(500).json({
            mensagem: "Erro ao confirmar pendência.",
            erro: error.message
        });
    }
};
