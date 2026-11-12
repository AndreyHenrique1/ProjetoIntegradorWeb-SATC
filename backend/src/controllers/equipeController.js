// Controller da equipe

import { db } from "../config/database.js";
// Biblioteca para criptografar e proteger senhas 
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

// -=-=-=-= Validações -=-=-=-=-=

// Validando o nome, verificando se realmente é uma string
// e se o usuário não está colocando somente espaços 
const validarNome = (nome) => typeof nome === "string" && nome.trim().length > 0;

// Validação de email
const validarEmail = (email) => {
    if (typeof email !== "string") return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
};

// validação de telefone 
const validarTelefone = (telefone) => typeof telefone === "string" && telefone.trim().length > 0;

// validação de codigo
const validarCodigo = (valor) => {
    const codigo = Number(valor);
    return Number.isInteger(codigo) && codigo > 0 ? codigo : null;
};

// Validação de status 
const validarStatus = (status) => typeof status === "boolean";

// Validação de senha
// Tem que ser maior que 6 caracteres 
const validarSenha = (senha) => typeof senha === "string" && senha.length >= 6;

const TELAS_PERMISSAO = ["dashboard", "cargos", "equipes", "clientes", "veiculos", "jornalistas", "historico", "agenda"];
const NIVEIS = new Set(["none", "view", "edit"]);

const normalizarPermissoes = (valor) => {
    let obj = valor;
    if (typeof obj === "string") {
        try { obj = JSON.parse(obj); } catch { obj = {}; }
    }
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) obj = {};
    const out = {};
    for (const tela of TELAS_PERMISSAO) {
        let nivel = obj[tela];
        if (!NIVEIS.has(nivel)) nivel = tela === "dashboard" ? "view" : "edit";
        out[tela] = nivel;
    }
    if (out.dashboard === "edit") out.dashboard = "view";
    return out;
};

const permissoesParaLinhas = (codFuncionario, permissoes) => {
    const p = normalizarPermissoes(permissoes);
    return TELAS_PERMISSAO.map((modulo) => {
        const nivel = p[modulo];
        return [codFuncionario, modulo, nivel !== "none", nivel === "edit"];
    });
};

const linhasParaPermissoes = (linhas) => {
    const base = {};
    for (const tela of TELAS_PERMISSAO) base[tela] = tela === "dashboard" ? "view" : "edit";
    for (const l of linhas || []) {
        if (!TELAS_PERMISSAO.includes(l.modulo)) continue;
        const ver = l.podeVisualizar === 1 || l.podeVisualizar === true;
        const ed = l.podeCriarEditar === 1 || l.podeCriarEditar === true;
        base[l.modulo] = !ver ? "none" : (ed ? "edit" : "view");
    }
    if (base.dashboard === "edit") base.dashboard = "view";
    return base;
};

const salvarPermissoes = async (conn, codFuncionario, permissoes) => {
    await conn.query("DELETE FROM permissaoFuncionario WHERE codFuncionario = ?", [codFuncionario]);
    const linhas = permissoesParaLinhas(codFuncionario, permissoes);
    if (linhas.length) {
        await conn.query(
            "INSERT INTO permissaoFuncionario (codFuncionario, modulo, podeVisualizar, podeCriarEditar) VALUES ?",
            [linhas]
        );
    }
};

const buscarPermissoesMap = async (codigos) => {
    if (!codigos.length) return new Map();
    const [rows] = await db.query(
        "SELECT codFuncionario, modulo, podeVisualizar, podeCriarEditar FROM permissaoFuncionario WHERE codFuncionario IN (?)",
        [codigos]
    );
    const map = new Map();
    for (const r of rows) {
        if (!map.has(r.codFuncionario)) map.set(r.codFuncionario, []);
        map.get(r.codFuncionario).push(r);
    }
    return map;
};

const mapFuncionario = (f, permMap) => ({
    codigo: f.codigo,
    nome: f.nome,
    email: f.email,
    telefone: f.telefone,
    codCargo: f.codCargo,
    cargoNome: f.cargoNome,
    status: f.status === 1,
    dataCadastro: f.dataCadastro,
    permissoes: linhasParaPermissoes((permMap && permMap.get(f.codigo)) || [])
});

// -=-=-=-=-= Função para buscar funcionario -=-=-=-=-=-=
export const getFuncionario = async (req, res) => {
    try {
        if (req.params.codigo === undefined) {
            const [funcionarios] = await db.query(
                `SELECT 
                    funcionario.codigo,
                    funcionario.nome,
                    funcionario.email,
                    funcionario.telefone,
                    funcionario.codCargo,
                    cargo.nome AS cargoNome,
                    funcionario.status,
                    funcionario.dataCadastro
                FROM funcionario 
                LEFT JOIN cargo  ON funcionario.codCargo = cargo.codigo`
            );
            const permMap = await buscarPermissoesMap(funcionarios.map((f) => f.codigo));
            return res.status(200).json(funcionarios.map((f) => mapFuncionario(f, permMap)));
        }

        const codigo = validarCodigo(req.params.codigo);

        if (!codigo) {
            return res.status(400).json({
                mensagem: "Informe um código válido para o funcionário."
            });
        }

        const [funcionarios] = await db.query(
            `SELECT 
                funcionario.codigo,
                funcionario.nome,
                funcionario.email,
                funcionario.telefone,
                funcionario.codCargo,
                cargo.nome AS cargoNome,
                funcionario.status,
                funcionario.dataCadastro
            FROM funcionario 
            LEFT JOIN cargo ON funcionario.codCargo = cargo.codigo
            WHERE funcionario.codigo = ?`,
            [codigo]
        );

        if (funcionarios.length === 0) {
            return res.status(404).json({
                mensagem: "Funcionário não encontrado."
            });
        }

        const permMap = await buscarPermissoesMap([codigo]);
        return res.status(200).json(mapFuncionario(funcionarios[0], permMap));
    } 
    
    catch (error) {
        console.error("Erro ao buscar funcionário:", error);
        return res.status(500).json({
            mensagem: "Erro ao buscar funcionário.",
            erro: error.message
        });
    }
};

// -=-=-=-=-=--=-= Função para criar novos funcionarios -=-=-=-=-=-=-=
export const createFuncionario = async (req, res) => {
    const { nome, email, telefone, codCargo, senha, status, permissoes } = req.body ?? {};

    // Validações

    // Validar nome de usuário
    if (!validarNome(nome)) {
        return res.status(400).json({ mensagem: "Informe um nome válido." });
    }

    // Validar e-mail
    if (!validarEmail(email)) {
        return res.status(400).json({ mensagem: "Informe um email válido." });
    }

    // Validar telefone 
    if (!validarTelefone(telefone)) {
        return res.status(400).json({ mensagem: "Informe um telefone válido." });
    }

    // Validar codigo
    if (!validarCodigo(codCargo)) {
        return res.status(400).json({ mensagem: "Informe um código de cargo válido." });
    }

    // Validar senha
    if (!validarSenha(senha)) {
        return res.status(400).json({ mensagem: "A senha deve ter no mínimo 6 caracteres." });
    }

    // Validar status
    if (!validarStatus(status)) {
        return res.status(400).json({ mensagem: "Informe o status como true ou false." });
    }

    const nomeFormatado = nome.trim();
    const emailFormatado = email.trim().toLowerCase();
    const telefoneFormatado = telefone.trim();

    try {
        // Verificar se cargo existe
        const [cargoExiste] = await db.query("SELECT codigo FROM cargo WHERE codigo = ?", [codCargo]);
        if (cargoExiste.length === 0) {
            return res.status(404).json({ mensagem: "Cargo informado não existe." });
        }

        // Verificar email duplicado
        const [emailDuplicado] = await db.query(
            "SELECT codigo FROM funcionario WHERE LOWER(email) = LOWER(?) LIMIT 1",
            [emailFormatado]
        );

        if (emailDuplicado.length > 0) {
            return res.status(409).json({ mensagem: "Já existe um funcionário cadastrado com este email." });
        }

        // Hash da senha
        const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);
        const perms = normalizarPermissoes(permissoes);

        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();
            const [resultado] = await conn.query(
                `INSERT INTO funcionario (nome, email, telefone, codCargo, senha, status, dataCadastro) 
                 VALUES (?, ?, ?, ?, ?, ?, CURDATE())`,
                [nomeFormatado, emailFormatado, telefoneFormatado, codCargo, senhaHash, status]
            );
            await salvarPermissoes(conn, resultado.insertId, perms);
            await conn.commit();
            return res.status(201).json({
                mensagem: "Funcionário cadastrado com sucesso!",
                funcionario: {
                    codigo: resultado.insertId,
                    nome: nomeFormatado,
                    email: emailFormatado,
                    telefone: telefoneFormatado,
                    codCargo,
                    status,
                    dataCadastro: new Date().toISOString().split('T')[0],
                    permissoes: perms
                }
            });
        } catch (e) {
            await conn.rollback();
            throw e;
        } finally {
            conn.release();
        }
    } 
    
    catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ mensagem: "Já existe um funcionário com este email." });
        }
        console.error("Erro ao cadastrar funcionário:", error);
        return res.status(500).json({ mensagem: "Erro ao cadastrar funcionário.", erro: error.message });
    }
};

// -=-=-=-=-=-=-=-= Função para atualizar funcionario -=-=-=-=--=
export const updateFuncionario = async (req, res) => {
    const codigo = validarCodigo(req.params.codigo);
    const { nome, email, telefone, codCargo, senha, status, permissoes } = req.body ?? {};

    // Validações 
    if (!codigo) {
        return res.status(400).json({ mensagem: "Informe um código válido para o funcionário." });
    }
    if (!validarNome(nome)) {
        return res.status(400).json({ mensagem: "Informe um nome válido." });
    }
    if (!validarEmail(email)) {
        return res.status(400).json({ mensagem: "Informe um email válido." });
    }
    if (!validarTelefone(telefone)) {
        return res.status(400).json({ mensagem: "Informe um telefone válido." });
    }
    if (!validarCodigo(codCargo)) {
        return res.status(400).json({ mensagem: "Informe um código de cargo válido." });
    }
    if (!validarStatus(status)) {
        return res.status(400).json({ mensagem: "Informe o status como true ou false." });
    }
    // Senha é opcional na atualização
    if (senha !== undefined && !validarSenha(senha)) {
        return res.status(400).json({ mensagem: "A senha deve ter no mínimo 6 caracteres." });
    }

    const nomeFormatado = nome.trim();
    const emailFormatado = email.trim().toLowerCase();
    const telefoneFormatado = telefone.trim();

    try {
        // Verificar se funcionário existe
        const [funcionarioExistente] = await db.query("SELECT codigo FROM funcionario WHERE codigo = ?", [codigo]);
        if (funcionarioExistente.length === 0) {
            return res.status(404).json({ mensagem: "Funcionário não encontrado." });
        }

        // Verificar se cargo existe
        const [cargoExiste] = await db.query("SELECT codigo FROM cargo WHERE codigo = ?", [codCargo]);
        if (cargoExiste.length === 0) {
            return res.status(404).json({ mensagem: "Cargo informado não existe." });
        }

        // Verificar email duplicado (exceto o próprio)
        const [emailDuplicado] = await db.query(
            `SELECT codigo FROM funcionario WHERE LOWER(email) = LOWER(?) AND codigo <> ? LIMIT 1`,
            [emailFormatado, codigo]
        );

        if (emailDuplicado.length > 0) {
            return res.status(409).json({ mensagem: "Já existe outro funcionário com este email." });
        }

        // Montar query dinamicamente (senha opcional)
        const perms = normalizarPermissoes(permissoes);
        let query = `UPDATE funcionario SET nome = ?, email = ?, telefone = ?, codCargo = ?, status = ?`;
        const params = [nomeFormatado, emailFormatado, telefoneFormatado, codCargo, status];

        if (senha) {
            const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);
            query += `, senha = ?`;
            params.push(senhaHash);
        }

        query += ` WHERE codigo = ?`;
        params.push(codigo);

        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();
            await conn.query(query, params);
            await salvarPermissoes(conn, codigo, perms);
            await conn.commit();
        } catch (e) {
            await conn.rollback();
            throw e;
        } finally {
            conn.release();
        }

        return res.status(200).json({
            mensagem: "Funcionário atualizado com sucesso.",
            funcionario: {
                codigo,
                nome: nomeFormatado,
                email: emailFormatado,
                telefone: telefoneFormatado,
                codCargo,
                status,
                permissoes: perms
            }
        });
    } 
    
    catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ mensagem: "Já existe outro funcionário com este email." });
        }
        console.error("Erro ao atualizar funcionário:", error);
        return res.status(500).json({ mensagem: "Erro ao atualizar funcionário.", erro: error.message });
    }
};

// -=-=-=-=-=- Função de deletar funcionario -=-=-==-=- 
export const deleteFuncionario = async (req, res) => {
    const codigo = validarCodigo(req.params.codigo);

    // Validação do codigo
    if (!codigo) {
        return res.status(400).json({ mensagem: "Informe um código válido para o funcionário." });
    }

    try {
        const [funcionarioExistente] = await db.query("SELECT codigo FROM funcionario WHERE codigo = ?", [codigo]);

        if (funcionarioExistente.length === 0) {
            return res.status(404).json({ mensagem: "Funcionário não encontrado." });
        }

        await db.query("DELETE FROM permissaoFuncionario WHERE codFuncionario = ?", [codigo]);
        await db.query("DELETE FROM funcionario WHERE codigo = ?", [codigo]);

        return res.status(200).json({ mensagem: "Funcionário excluído com sucesso." });
    } catch (error) {
        console.error("Erro ao excluir funcionário:", error);
        return res.status(500).json({ mensagem: "Erro ao excluir funcionário.", erro: error.message });
    }
};


