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

// -=-=-=-=-= Função para buscar funcionario -=-=-=-=-=-=
export const getFuncionario = async (req, res) => {
    try {
        // Se não tem código, lista todos com nome do cargo
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

            return res.status(200).json(
                funcionarios.map((f) => ({
                    codigo: f.codigo,
                    nome: f.nome,
                    email: f.email,
                    telefone: f.telefone,
                    codCargo: f.codCargo,
                    cargoNome: f.cargoNome,
                    status: f.status === 1,
                    dataCadastro: f.dataCadastro
                }))
            );
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

        const f = funcionarios[0];

        return res.status(200).json({
            codigo: f.codigo,
            nome: f.nome,
            email: f.email,
            telefone: f.telefone,
            codCargo: f.codCargo,
            cargoNome: f.cargoNome,
            status: f.status === 1,
            dataCadastro: f.dataCadastro
        });
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
    const { nome, email, telefone, codCargo, senha, status } = req.body ?? {};

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

        // Insert
        const [resultado] = await db.query(
            `INSERT INTO funcionario (nome, email, telefone, codCargo, senha, status, dataCadastro) 
             VALUES (?, ?, ?, ?, ?, ?, CURDATE())`,
            [nomeFormatado, emailFormatado, telefoneFormatado, codCargo, senhaHash, status]
        );

        return res.status(201).json({
            mensagem: "Funcionário cadastrado com sucesso!",
            funcionario: {
                codigo: resultado.insertId,
                nome: nomeFormatado,
                email: emailFormatado,
                telefone: telefoneFormatado,
                codCargo,
                status,
                dataCadastro: new Date().toISOString().split('T')[0]
            }
        });
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
    const { nome, email, telefone, codCargo, senha, status } = req.body ?? {};

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
        let query = `UPDATE funcionario SET nome = ?, email = ?, telefone = ?, codCargo = ?, status = ?`;
        const params = [nomeFormatado, emailFormatado, telefoneFormatado, codCargo, status];

        if (senha) {
            const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);
            query += `, senha = ?`;
            params.push(senhaHash);
        }

        query += ` WHERE codigo = ?`;
        params.push(codigo);

        await db.query(query, params);

        return res.status(200).json({
            mensagem: "Funcionário atualizado com sucesso.",
            funcionario: {
                codigo,
                nome: nomeFormatado,
                email: emailFormatado,
                telefone: telefoneFormatado,
                codCargo,
                status
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

        await db.query("DELETE FROM funcionario WHERE codigo = ?", [codigo]);

        return res.status(200).json({ mensagem: "Funcionário excluído com sucesso." });
    } catch (error) {
        console.error("Erro ao excluir funcionário:", error);
        return res.status(500).json({ mensagem: "Erro ao excluir funcionário.", erro: error.message });
    }
};


