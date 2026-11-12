import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "../config/database.js";

const JWT_SECRET = process.env.JWT_SECRET || "alfa-dev-secret-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";

const DEV_LOGIN = {
    email: "mododesenvolvedor@volantis.com.br",
    senha: "desenvolvedor@123",
    usuario: {
        codigo: 0,
        nome: "Modo Desenvolvedor",
        email: "mododesenvolvedor@volantis.com.br",
        telefone: null,
        codCargo: null,
        permissoes: {
            dashboard: "view", cargos: "edit", equipes: "edit", clientes: "edit",
            veiculos: "edit", jornalistas: "edit", historico: "edit", agenda: "edit"
        }
    }
};

const PERM_DEFAULT = { dashboard: "view", cargos: "edit", equipes: "edit", clientes: "edit", veiculos: "edit", jornalistas: "edit", historico: "edit", agenda: "edit" };
const TELAS = Object.keys(PERM_DEFAULT);

const normalizarPermissoes = (linhas) => {
    if (!Array.isArray(linhas)) return { ...PERM_DEFAULT };
    const out = { ...PERM_DEFAULT };
    for (const l of linhas) {
        if (!TELAS.includes(l.modulo)) continue;
        const ver = l.podeVisualizar === 1 || l.podeVisualizar === true;
        const ed = l.podeCriarEditar === 1 || l.podeCriarEditar === true;
        out[l.modulo] = !ver ? "none" : (ed ? "edit" : "view");
    }
    if (out.dashboard === "edit") out.dashboard = "view";
    return out;
};

export const login = async (req, res) => {
    const { email, senha } = req.body ?? {};

    if (typeof email !== "string" || !email.trim()) {
        return res.status(400).json({ mensagem: "Informe o e-mail." });
    }
    if (typeof senha !== "string" || !senha) {
        return res.status(400).json({ mensagem: "Informe a senha." });
    }

    const emailFormatado = email.trim().toLowerCase();

    if (emailFormatado === DEV_LOGIN.email && senha === DEV_LOGIN.senha) {
        const token = jwt.sign(
            { codigo: DEV_LOGIN.usuario.codigo, email: DEV_LOGIN.usuario.email, codCargo: DEV_LOGIN.usuario.codCargo, dev: true },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );
        return res.status(200).json({ token, usuario: DEV_LOGIN.usuario });
    }

    try {
        const [rows] = await db.query(
            `SELECT codigo, nome, email, telefone, codCargo, senha, status
             FROM funcionario
             WHERE LOWER(email) = ?
             LIMIT 1`,
            [emailFormatado]
        );

        if (rows.length === 0) {
            return res.status(401).json({ mensagem: "E-mail ou senha incorretos." });
        }

        const funcionario = rows[0];

        if (funcionario.status !== 1 && funcionario.status !== true) {
            return res.status(403).json({ mensagem: "Usuário inativo. Contate o administrador." });
        }

        const senhaValida = await bcrypt.compare(senha, funcionario.senha);
        if (!senhaValida) {
            return res.status(401).json({ mensagem: "E-mail ou senha incorretos." });
        }

        const [permRows] = await db.query(
            "SELECT modulo, podeVisualizar, podeCriarEditar FROM permissaoFuncionario WHERE codFuncionario = ?",
            [funcionario.codigo]
        );

        const payload = {
            codigo: funcionario.codigo,
            email: funcionario.email,
            codCargo: funcionario.codCargo
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        return res.status(200).json({
            token,
            usuario: {
                codigo: funcionario.codigo,
                nome: funcionario.nome,
                email: funcionario.email,
                telefone: funcionario.telefone,
                codCargo: funcionario.codCargo,
                permissoes: normalizarPermissoes(permRows)
            }
        });
    } catch (error) {
        console.error("Erro no login:", error);
        return res.status(500).json({ mensagem: "Erro ao realizar login.", erro: error.message });
    }
};