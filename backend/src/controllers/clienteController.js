// Controller dos clientes

import { db } from "../config/database.js";
import * as cpfLib from "@fnando/cpf";
import * as cnpjLib from "@fnando/cnpj";

// Verificação se é uma string e não é só espaço em branco
const validarTexto = (valor) => {
    return typeof valor === "string" && valor.trim().length > 0;
};

// Verificação se o código é um número inteiro maior que zero
const validarCodigo = (valor) => {
    const codigo = Number(valor);

    return Number.isInteger(codigo) && codigo > 0 ? codigo : null;
};

// Verificação se o status é boolean
const validarStatus = (status) => {
    return typeof status === "boolean";
};

// Verificação do telefone, só não pode ser vazio
const validarTelefone = (telefone) => {
    return typeof telefone === "string" && telefone.trim().length > 0;
};

// Verificação do email
const validarEmail = (email) => {
    if (typeof email !== "string") return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
};

// Verificação se o documento é um CPF ou CNPJ válido
// O mesmo campo aceita os dois, o que decide é o tamanho
// A validação dos dígitos verificadores vem da biblioteca,
// que também rejeita sequências repetidas como 111.111.111-11
const validarCpfCnpj = (documento) => {
    if (typeof documento !== "string" || documento.trim().length === 0) {
        return false;
    }

    const digitos = documento.replace(/\D/g, "");

    if (digitos.length === 11) return cpfLib.isValid(digitos);
    if (digitos.length === 14) return cnpjLib.isValid(digitos);

    return false;
};

// Formata o documento com a pontuação para devolver na resposta
const formatarCpfCnpj = (documento) => {
    const digitos = documento.replace(/\D/g, "");

    if (digitos.length === 11) {
        return cpfLib.format(digitos);
    }

    return cnpjLib.format(digitos);
};

// Função para buscar os dados da tabela clientes
export const getCliente = async (req, res) => {
    try {
        // Caso não tenha código informado, busca todos os clientes
        if (req.params.codigo === undefined) {
            const [clientes] = await db.query(
                `SELECT codigo,
                        razaoSocial_NomeEmpresa,
                        cpf_cnpj,
                        email,
                        telefone,
                        endereco,
                        site_RedesSociais,
                        observacoes,
                        status
                 FROM cliente
                 ORDER BY razaoSocial_NomeEmpresa`
            );

            return res.status(200).json(
                clientes.map((cliente) => ({
                    codigo: cliente.codigo,
                    razaoSocial_NomeEmpresa: cliente.razaoSocial_NomeEmpresa,
                    cpfCnpj: formatarCpfCnpj(cliente.cpf_cnpj),
                    email: cliente.email,
                    telefone: cliente.telefone,
                    endereco: cliente.endereco,
                    siteRedesSociais: cliente.site_RedesSociais,
                    observacoes: cliente.observacoes,
                    status: cliente.status === 1
                }))
            );
        }

        const codigo = validarCodigo(req.params.codigo);

        if (!codigo) {
            return res.status(400).json({
                mensagem: "Informe um código válido para o cliente."
            });
        }

        const [clientes] = await db.query(
            "SELECT codigo, razaoSocial_NomeEmpresa, cpf_cnpj, email, telefone, endereco, site_RedesSociais, observacoes, status FROM cliente WHERE codigo = ?",
            [codigo]
        );

        if (clientes.length === 0) {
            return res.status(404).json({
                mensagem: "Cliente não encontrado."
            });
        }

        const cliente = clientes[0];

        return res.status(200).json({
            codigo: cliente.codigo,
            razaoSocial_NomeEmpresa: cliente.razaoSocial_NomeEmpresa,
            cpfCnpj: formatarCpfCnpj(cliente.cpf_cnpj),
            email: cliente.email,
            telefone: cliente.telefone,
            endereco: cliente.endereco,
            siteRedesSociais: cliente.site_RedesSociais,
            observacoes: cliente.observacoes,
            status: cliente.status === 1
        });
    }

    catch (error) {
        console.error("Erro ao buscar cliente:", error);

        return res.status(500).json({
            mensagem: "Erro ao buscar cliente.",
            erro: error.message
        });
    }
};

// Função para criação de novos clientes
export const createCliente = async (req, res) => {
    const {
        razaoSocial_NomeEmpresa,
        cpf_cnpj,
        email,
        telefone,
        endereco,
        site_RedesSociais,
        observacoes,
        status
    } = req.body ?? {};

    // Verificação da razão social ou nome da empresa
    if (!validarTexto(razaoSocial_NomeEmpresa)) {
        return res.status(400).json({
            mensagem: "Informe a razão social ou o nome do cliente."
        });
    }

    // Verificação se o CPF ou CNPJ é válido
    if (!validarCpfCnpj(cpf_cnpj)) {
        return res.status(400).json({
            mensagem: "Informe um CPF ou CNPJ válido."
        });
    }

    // Verificação do email
    if (!validarEmail(email)) {
        return res.status(400).json({
            mensagem: "Informe um email válido."
        });
    }

    // Verificação do telefone
    if (!validarTelefone(telefone)) {
        return res.status(400).json({
            mensagem: "Informe um telefone válido."
        });
    }

    // Verificação do endereço
    if (!validarTexto(endereco)) {
        return res.status(400).json({
            mensagem: "Informe um endereço válido."
        });
    }

    // Verificação se o status está válido
    if (!validarStatus(status)) {
        return res.status(400).json({
            mensagem: "Informe um status sendo true ou false."
        });
    }

    // Site e observações são NOT NULL no banco, mas podem ser enviados vazios
    if (site_RedesSociais !== undefined && typeof site_RedesSociais !== "string") {
        return res.status(400).json({
            mensagem: "Informe o site ou redes sociais como texto."
        });
    }

    if (observacoes !== undefined && typeof observacoes !== "string") {
        return res.status(400).json({
            mensagem: "Informe as observações como texto."
        });
    }

    // Tirar espaços brancos do começo e do fim
    const razaoSocialFormatada = razaoSocial_NomeEmpresa.trim();
    const cpfCnpjFormatado = cpf_cnpj.replace(/\D/g, "");
    const emailFormatado = email.trim().toLowerCase();
    const telefoneFormatado = telefone.trim();
    const enderecoFormatado = endereco.trim();
    const siteFormatado = site_RedesSociais?.trim() ?? "";
    const observacoesFormatadas = observacoes?.trim() ?? "";

    try {
        // Verificar se já existe um cliente com esse email
        const [emailDuplicado] = await db.query(
            "SELECT codigo FROM cliente WHERE LOWER(TRIM(email)) = LOWER(TRIM(?)) LIMIT 1",
            [emailFormatado]
        );

        if (emailDuplicado.length > 0) {
            return res.status(409).json({
                mensagem: "Já existe um cliente cadastrado com este email."
            });
        }

        // Verificar se já existe um cliente com esse CPF ou CNPJ
        const [documentoDuplicado] = await db.query(
            "SELECT codigo FROM cliente WHERE cpf_cnpj = ? LIMIT 1",
            [cpfCnpjFormatado]
        );

        if (documentoDuplicado.length > 0) {
            return res.status(409).json({
                mensagem: "Já existe um cliente cadastrado com este CPF ou CNPJ."
            });
        }

        // Fazer o insert no banco de dados
        const [resultado] = await db.query(
            `INSERT INTO cliente (razaoSocial_NomeEmpresa, cpf_cnpj, email, telefone, endereco, site_RedesSociais, observacoes, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                razaoSocialFormatada,
                cpfCnpjFormatado,
                emailFormatado,
                telefoneFormatado,
                enderecoFormatado,
                siteFormatado,
                observacoesFormatadas,
                status
            ]
        );

        return res.status(201).json({
            mensagem: "Cliente cadastrado com sucesso!",
            cliente: {
                codigo: resultado.insertId,
                razaoSocial_NomeEmpresa: razaoSocialFormatada,
                cpfCnpj: formatarCpfCnpj(cpfCnpjFormatado),
                email: emailFormatado,
                telefone: telefoneFormatado,
                endereco: enderecoFormatado,
                siteRedesSociais: siteFormatado,
                observacoes: observacoesFormatadas,
                status
            }
        });
    }

    catch (error) {
        // Se o índice UNIQUE do banco bloquear, cai aqui
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                mensagem: "Já existe um cliente cadastrado com este email ou CPF/CNPJ."
            });
        }

        console.error("Erro ao cadastrar cliente:", error);

        return res.status(500).json({
            mensagem: "Erro ao cadastrar cliente.",
            erro: error.message
        });
    }
};

// Função para alterar clientes
export const updateCliente = async (req, res) => {
    const codigo = validarCodigo(req.params.codigo);
    const {
        razaoSocial_NomeEmpresa,
        cpf_cnpj,
        email,
        telefone,
        endereco,
        site_RedesSociais,
        observacoes,
        status
    } = req.body ?? {};

    // Verificar se o código é válido
    if (!codigo) {
        return res.status(400).json({
            mensagem: "Informe um código válido para o cliente."
        });
    }

    // A atualização é parcial: só precisa receber um dos campos
    const camposRecebidos = [
        razaoSocial_NomeEmpresa,
        cpf_cnpj,
        email,
        telefone,
        endereco,
        site_RedesSociais,
        observacoes,
        status
    ].filter((valor) => valor !== undefined);

    if (camposRecebidos.length === 0) {
        return res.status(400).json({
            mensagem: "Informe ao menos um campo para atualizar."
        });
    }

    if (razaoSocial_NomeEmpresa !== undefined && !validarTexto(razaoSocial_NomeEmpresa)) {
        return res.status(400).json({
            mensagem: "Informe a razão social ou o nome do cliente."
        });
    }

    if (cpf_cnpj !== undefined && !validarCpfCnpj(cpf_cnpj)) {
        return res.status(400).json({
            mensagem: "Informe um CPF ou CNPJ válido."
        });
    }

    if (email !== undefined && !validarEmail(email)) {
        return res.status(400).json({
            mensagem: "Informe um email válido."
        });
    }

    if (telefone !== undefined && !validarTelefone(telefone)) {
        return res.status(400).json({
            mensagem: "Informe um telefone válido."
        });
    }

    if (endereco !== undefined && !validarTexto(endereco)) {
        return res.status(400).json({
            mensagem: "Informe um endereço válido."
        });
    }

    if (site_RedesSociais !== undefined && typeof site_RedesSociais !== "string") {
        return res.status(400).json({
            mensagem: "Informe o site ou redes sociais como texto."
        });
    }

    if (observacoes !== undefined && typeof observacoes !== "string") {
        return res.status(400).json({
            mensagem: "Informe as observações como texto."
        });
    }

    if (status !== undefined && !validarStatus(status)) {
        return res.status(400).json({
            mensagem: "Informe o status como true ou false."
        });
    }

    try {
        const [clienteExistente] = await db.query(
            "SELECT codigo, email, cpf_cnpj FROM cliente WHERE codigo = ?",
            [codigo]
        );

        if (clienteExistente.length === 0) {
            return res.status(404).json({
                mensagem: "Cliente não encontrado."
            });
        }

        const emailAtual = clienteExistente[0].email;
        const documentoAtual = clienteExistente[0].cpf_cnpj;
        const campos = [];
        const valores = [];

        // Monta o UPDATE só com os campos que vieram no body
        if (razaoSocial_NomeEmpresa !== undefined) {
            campos.push("razaoSocial_NomeEmpresa = ?");
            valores.push(razaoSocial_NomeEmpresa.trim());
        }

        if (cpf_cnpj !== undefined) {
            const documentoFormatado = cpf_cnpj.replace(/\D/g, "");

            // A checagem de duplicidade só roda se o documento realmente mudou
            if (documentoFormatado !== String(documentoAtual)) {
                const [documentoDuplicado] = await db.query(
                    "SELECT codigo FROM cliente WHERE cpf_cnpj = ? AND codigo <> ? LIMIT 1",
                    [documentoFormatado, codigo]
                );

                if (documentoDuplicado.length > 0) {
                    return res.status(409).json({
                        mensagem: "Já existe outro cliente cadastrado com este CPF ou CNPJ."
                    });
                }
            }

            campos.push("cpf_cnpj = ?");
            valores.push(documentoFormatado);
        }

        if (email !== undefined) {
            const emailFormatado = email.trim().toLowerCase();

            // A checagem de duplicidade só roda se o email realmente mudou
            if (emailFormatado !== String(emailAtual).trim().toLowerCase()) {
                const [emailDuplicado] = await db.query(
                    `SELECT codigo
                     FROM cliente
                     WHERE LOWER(TRIM(email)) = LOWER(TRIM(?))
                       AND codigo <> ?
                     LIMIT 1`,
                    [emailFormatado, codigo]
                );

                if (emailDuplicado.length > 0) {
                    return res.status(409).json({
                        mensagem: "Já existe outro cliente cadastrado com este email."
                    });
                }
            }

            campos.push("email = ?");
            valores.push(emailFormatado);
        }

        if (telefone !== undefined) {
            campos.push("telefone = ?");
            valores.push(telefone.trim());
        }

        if (endereco !== undefined) {
            campos.push("endereco = ?");
            valores.push(endereco.trim());
        }

        if (site_RedesSociais !== undefined) {
            campos.push("site_RedesSociais = ?");
            valores.push(site_RedesSociais.trim());
        }

        if (observacoes !== undefined) {
            campos.push("observacoes = ?");
            valores.push(observacoes.trim());
        }

        if (status !== undefined) {
            campos.push("status = ?");
            valores.push(status);
        }

        valores.push(codigo);

        await db.query(
            `UPDATE cliente SET ${campos.join(", ")} WHERE codigo = ?`,
            valores
        );

        return res.status(200).json({
            mensagem: "Cliente atualizado com sucesso.",
            cliente: {
                codigo
            }
        });
    }

    catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                mensagem: "Já existe outro cliente cadastrado com este email ou CPF/CNPJ."
            });
        }

        console.error("Erro ao atualizar cliente:", error);

        return res.status(500).json({
            mensagem: "Erro ao atualizar o cliente.",
            erro: error.message
        });
    }
};

// Função para deletar o cliente
export const deleteCliente = async (req, res) => {
    const codigo = validarCodigo(req.params.codigo);

    // Verificar um código válido
    if (!codigo) {
        return res.status(400).json({
            mensagem: "Informe um código válido para o cliente."
        });
    }

    try {
        const [clienteExistente] = await db.query(
            "SELECT codigo FROM cliente WHERE codigo = ?",
            [codigo]
        );

        if (clienteExistente.length === 0) {
            return res.status(404).json({
                mensagem: "Cliente não encontrado."
            });
        }

        // Não deixa excluir se já existir compromisso vinculado a este cliente
        const [compromissosVinculados] = await db.query(
            "SELECT codigo FROM compromisso WHERE codCliente = ? LIMIT 1",
            [codigo]
        );

        if (compromissosVinculados.length > 0) {
            return res.status(409).json({
                mensagem: "Não é possível excluir este cliente, pois ele possui compromissos vinculados."
            });
        }

        await db.query("DELETE FROM cliente WHERE codigo = ?", [codigo]);

        return res.status(200).json({
            mensagem: "Cliente excluído com sucesso."
        });
    }

    // Caso aconteça algum erro vem parar aqui
    catch (error) {
        // O banco também bloqueia a exclusão pela foreign key
        if (error.code === "ER_ROW_IS_REFERENCED_2" || error.errno === 1451) {
            return res.status(409).json({
                mensagem: "Não é possível excluir este cliente, pois ele possui compromissos vinculados."
            });
        }

        console.error("Erro ao excluir cliente:", error);

        return res.status(500).json({
            mensagem: "Erro ao excluir cliente.",
            erro: error.message
        });
    }
};
