import { db } from "../config/database.js";

const num = (v) => {
    const n = Number(v);
    return Number.isInteger(n) && n > 0 ? n : null;
};

export const getHistoricoRelacionamento = async (req, res) => {
    try {
        const { inicio, fim, funcionario, cliente, veiculo, tag, status } = req.query || {};
        const usuarioCodigo = Number(req.usuario?.codigo);
        const filtrarUsuario = Number.isInteger(usuarioCodigo) && usuarioCodigo > 0;

        const where = [];
        const params = [];

        if (filtrarUsuario) {
            where.push("EXISTS (SELECT 1 FROM participantecompromisso pcx WHERE pcx.codCompromisso = c.codigo AND pcx.codFuncionario = ?)");
            params.push(usuarioCodigo);
        }
        if (inicio) { where.push("c.dataHoraInicio >= ?"); params.push(inicio.replace("T", " ")); }
        if (fim) { where.push("c.dataHoraInicio <= ?"); params.push(fim.replace("T", " ")); }
        if (num(tag)) { where.push("c.codTag = ?"); params.push(num(tag)); }
        if (num(cliente)) { where.push("c.codCliente = ?"); params.push(num(cliente)); }
        if (num(veiculo)) { where.push("j.codVeiculo = ?"); params.push(num(veiculo)); }
        if (typeof status === "string" && ["Pendente", "Concluido", "Cancelado", "Agendado"].includes(status)) {
            where.push("c.status = ?"); params.push(status);
        }
        if (num(funcionario)) {
            where.push("EXISTS (SELECT 1 FROM participantecompromisso pcf WHERE pcf.codCompromisso = c.codigo AND pcf.codFuncionario = ?)");
            params.push(num(funcionario));
        }

        const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
        const [rows] = await db.query(
            `SELECT 
                c.codigo,
                c.titulo,
                c.status,
                c.dataHoraInicio,
                c.dataHoraFim,
                c.anotacoes,
                c.codTag,
                t.nome AS tagNome,
                t.cor AS tagCor,
                c.codCliente,
                cl.razaoSocial_NomeEmpresa AS clienteNome,
                c.codJornalista,
                j.nome AS jornalistaNome,
                j.codVeiculo,
                v.nome AS veiculoNome,
                ROUND(TIMESTAMPDIFF(MINUTE, c.dataHoraInicio, c.dataHoraFim) / 60, 2) AS totalHoras
            FROM compromisso c
            LEFT JOIN tag t ON c.codTag = t.codigo
            LEFT JOIN cliente cl ON c.codCliente = cl.codigo
            LEFT JOIN jornalista j ON c.codJornalista = j.codigo
            LEFT JOIN veiculos v ON j.codVeiculo = v.codigo
            ${whereSql}
            ORDER BY c.dataHoraInicio DESC`,
            params
        );

        for (const r of rows) {
            const [participantes] = await db.query(
                `SELECT f.codigo, f.nome
                 FROM participantecompromisso pc
                 JOIN funcionario f ON pc.codFuncionario = f.codigo
                 WHERE pc.codCompromisso = ?`,
                [r.codigo]
            );
            r.participantesEquipe = participantes;
        }

        return res.status(200).json(rows);
    } catch (error) {
        console.error("Erro ao buscar histórico de relacionamento:", error);
        return res.status(500).json({ mensagem: "Erro ao buscar histórico de relacionamento.", erro: error.message });
    }
};