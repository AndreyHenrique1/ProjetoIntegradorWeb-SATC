// Controller dos tipos de veículos 

import { db } from "../config/database.js";

// Verificação se o nome é uma string e não é só espaço em branco
const validarNome = (nome) => {
    return typeof nome === "string" && nome.trim().length > 0;
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

// Função para buscar os dados da tabela tipos de veículos
export const getTipoVeiculo = async (req, res) => {
    try {
        // Caso não tenha código informado, busca todos os tipos de veículos
        if (req.params.codigo === undefined) {
            const [tiposVeiculos] = await db.query(
                `SELECT codigo, nome, status
                 FROM tipoVeiculos
                 ORDER BY nome`
            );

            return res.status(200).json(
                tiposVeiculos.map((tipoVeiculo) => ({
                    codigo: tipoVeiculo.codigo,
                    nome: tipoVeiculo.nome,
                    status: tipoVeiculo.status === 1
                }))
            );
        }

        const codigo = validarCodigo(req.params.codigo);

        if (!codigo) {
            return res.status(400).json({
                mensagem: "Informe um código válido para o tipo de veículo."
            });
        }

        const [tiposVeiculos] = await db.query(
            "SELECT codigo, nome, status FROM tipoVeiculos WHERE codigo = ?",
            [codigo]
        );

        if (tiposVeiculos.length === 0) {
            return res.status(404).json({
                mensagem: "Tipo de veículo não encontrado."
            });
        }

        const tipoVeiculo = tiposVeiculos[0];

        return res.status(200).json({
            codigo: tipoVeiculo.codigo,
            nome: tipoVeiculo.nome,
            status: tipoVeiculo.status === 1
        });
    }

    // Caso tenha algum erro vem parar aqui
    catch (error) {
        console.error("Erro ao buscar tipo de veículo:", error);

        return res.status(500).json({
            mensagem: "Erro ao buscar tipo de veículo.",
            erro: error.message
        });
    }
};

// Função para criação de novos tipos de veículos
export const createTipoVeiculo = async (req, res) => {
    const { nome, status } = req.body ?? {};

    // Verificação do nome do tipo de veículo se está válido
    if (!validarNome(nome)) {
        return res.status(400).json({
            mensagem: "Informe um nome válido para o tipo de veículo."
        });
    }

    // Verificação se o status está válido
    if (!validarStatus(status)) {
        return res.status(400).json({
            mensagem: "Informe um status sendo true ou false."
        });
    }

    // Tirar espaços brancos do começo e do fim do nome
    const nomeFormatado = nome.trim();

    try {
        // Verificar se já existe um tipo de veículo com esse nome
        // A comparação ignora maiúsculas e minúsculas
        const [tiposDuplicados] = await db.query(
            "SELECT codigo FROM tipoVeiculos WHERE LOWER(TRIM(nome)) = LOWER(TRIM(?)) LIMIT 1",
            [nomeFormatado]
        );

        if (tiposDuplicados.length > 0) {
            return res.status(409).json({
                mensagem: "Já existe um tipo de veículo cadastrado com este nome."
            });
        }

        // Fazer o insert no banco de dados
        const [resultado] = await db.query(
            "INSERT INTO tipoVeiculos (nome, status) VALUES (?, ?)",
            [nomeFormatado, status]
        );

        return res.status(201).json({
            mensagem: "Tipo de veículo cadastrado com sucesso!",
            tipoVeiculo: {
                codigo: resultado.insertId,
                nome: nomeFormatado,
                status
            }
        });
    }

    catch (error) {
        // Se o índice UNIQUE do banco bloquear, cai aqui
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                mensagem: "Já existe um tipo de veículo cadastrado com este nome."
            });
        }

        console.error("Erro ao cadastrar tipo de veículo:", error);

        return res.status(500).json({
            mensagem: "Erro ao cadastrar tipo de veículo.",
            erro: error.message
        });
    }
};

// Função para alterar tipos de veículos
export const updateTipoVeiculo = async (req, res) => {
    const codigo = validarCodigo(req.params.codigo);
    const { nome, status } = req.body ?? {};

    // Verificar se o código é válido
    if (!codigo) {
        return res.status(400).json({
            mensagem: "Informe um código válido para o tipo de veículo."
        });
    }

    // A atualização é parcial: só precisa receber um dos dois campos
    if (nome === undefined && status === undefined) {
        return res.status(400).json({
            mensagem: "Informe o nome ou o status para atualizar."
        });
    }

    if (nome !== undefined && !validarNome(nome)) {
        return res.status(400).json({
            mensagem: "Informe um nome válido para o tipo de veículo."
        });
    }

    if (status !== undefined && !validarStatus(status)) {
        return res.status(400).json({
            mensagem: "Informe o status como true ou false."
        });
    }

    try {
        const [tipoVeiculoExistente] = await db.query(
            "SELECT codigo, nome FROM tipoVeiculos WHERE codigo = ?",
            [codigo]
        );

        if (tipoVeiculoExistente.length === 0) {
            return res.status(404).json({
                mensagem: "Tipo de veículo não encontrado."
            });
        }

        const nomeAtual = tipoVeiculoExistente[0].nome;
        const campos = [];
        const valores = [];

        // Monta o UPDATE só com os campos que vieram no body
        if (nome !== undefined) {
            const nomeFormatado = nome.trim();

            // A checagem de duplicidade só roda se o nome realmente mudou
            if (nomeFormatado.toLowerCase() !== String(nomeAtual).trim().toLowerCase()) {
                const [tiposDuplicados] = await db.query(
                    `SELECT codigo
                     FROM tipoVeiculos
                     WHERE LOWER(TRIM(nome)) = LOWER(TRIM(?))
                       AND codigo <> ?
                     LIMIT 1`,
                    [nomeFormatado, codigo]
                );

                if (tiposDuplicados.length > 0) {
                    return res.status(409).json({
                        mensagem: "Já existe outro tipo de veículo cadastrado com este nome."
                    });
                }
            }

            campos.push("nome = ?");
            valores.push(nomeFormatado);
        }

        if (status !== undefined) {
            campos.push("status = ?");
            valores.push(status);
        }

        valores.push(codigo);

        await db.query(
            `UPDATE tipoVeiculos SET ${campos.join(", ")} WHERE codigo = ?`,
            valores
        );

        return res.status(200).json({
            mensagem: "Tipo de veículo atualizado com sucesso.",
            tipoVeiculo: {
                codigo,
                nome: nome ?? nomeAtual,
                status: status ?? null
            }
        });
    }

    catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                mensagem: "Já existe outro tipo de veículo cadastrado com este nome."
            });
        }

        console.error("Erro ao atualizar tipo de veículo:", error);

        return res.status(500).json({
            mensagem: "Erro ao atualizar o tipo de veículo.",
            erro: error.message
        });
    }
};

// Função para deletar o tipo de veículo
export const deleteTipoVeiculo = async (req, res) => {
    const codigo = validarCodigo(req.params.codigo);

    // Verificar um código válido
    if (!codigo) {
        return res.status(400).json({
            mensagem: "Informe um código válido para o tipo de veículo."
        });
    }

    try {
        const [tipoVeiculoExistente] = await db.query(
            "SELECT codigo FROM tipoVeiculos WHERE codigo = ?",
            [codigo]
        );

        if (tipoVeiculoExistente.length === 0) {
            return res.status(404).json({
                mensagem: "Tipo de veículo não encontrado."
            });
        }

        // Não deixa excluir se já existir veículo vinculado a este tipo
        const [veiculosVinculados] = await db.query(
            "SELECT codigo FROM veiculos WHERE codTipoVeiculo = ? LIMIT 1",
            [codigo]
        );

        if (veiculosVinculados.length > 0) {
            return res.status(409).json({
                mensagem: "Não é possível excluir este tipo de veículo, pois ele possui veículos vinculados."
            });
        }

        await db.query("DELETE FROM tipoVeiculos WHERE codigo = ?", [codigo]);

        return res.status(200).json({
            mensagem: "Tipo de veículo excluído com sucesso."
        });
    }

    // Caso aconteça algum erro vem parar aqui
    catch (error) {
        // O banco também bloqueia a exclusão pela foreign key
        if (error.code === "ER_ROW_IS_REFERENCED_2" || error.errno === 1451) {
            return res.status(409).json({
                mensagem: "Não é possível excluir este tipo de veículo, pois ele possui veículos vinculados."
            });
        }

        console.error("Erro ao excluir tipo de veículo:", error);

        return res.status(500).json({
            mensagem: "Erro ao excluir tipo de veículo.",
            erro: error.message
        });
    }
};