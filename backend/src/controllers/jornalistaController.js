// Controller dos jornalistas

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

// Verificação da editoria, só não pode ser vazia
const validarEditoria = (editoria) => {
    return typeof editoria === "string" && editoria.trim().length > 0;
};

// A cidade é opcional, mas se vier precisa ser string
const validarCidade = (cidade) => {
    return cidade === undefined || cidade === null || typeof cidade === "string";
};

// Função para buscar os dados da tabela jornalistas
export const getJornalista = async (req, res) => {
    try {
        // Caso não tenha código informado, busca todos os jornalistas
        // Trazendo o nome do veículo junto
        if (req.params.codigo === undefined) {
            const [jornalistas] = await db.query(
                `SELECT jornalista.codigo,
                        jornalista.nome,
                        jornalista.codVeiculo,
                        veiculo.nome AS veiculoNome,
                        jornalista.editoria,
                        jornalista.telefone,
                        jornalista.email,
                        jornalista.cidade,
                        jornalista.status
                 FROM jornalista
                 LEFT JOIN veiculos AS veiculo
                    ON jornalista.codVeiculo = veiculo.codigo
                 ORDER BY jornalista.nome`
            );

            return res.status(200).json(
                jornalistas.map((jornalista) => ({
                    codigo: jornalista.codigo,
                    nome: jornalista.nome,
                    codVeiculo: jornalista.codVeiculo,
                    veiculoNome: jornalista.veiculoNome,
                    editoria: jornalista.editoria,
                    telefone: jornalista.telefone,
                    email: jornalista.email,
                    cidade: jornalista.cidade,
                    status: jornalista.status === 1
                }))
            );
        }

        const codigo = validarCodigo(req.params.codigo);

        if (!codigo) {
            return res.status(400).json({
                mensagem: "Informe um código válido para o jornalista."
            });
        }

        const [jornalistas] = await db.query(
            `SELECT jornalista.codigo,
                    jornalista.nome,
                    jornalista.codVeiculo,
                    veiculo.nome AS veiculoNome,
                    jornalista.editoria,
                    jornalista.telefone,
                    jornalista.email,
                    jornalista.cidade,
                    jornalista.status
             FROM jornalista
             LEFT JOIN veiculos AS veiculo
                ON jornalista.codVeiculo = veiculo.codigo
             WHERE jornalista.codigo = ?`,
            [codigo]
        );

        if (jornalistas.length === 0) {
            return res.status(404).json({
                mensagem: "Jornalista não encontrado."
            });
        }

        const jornalista = jornalistas[0];

        return res.status(200).json({
            codigo: jornalista.codigo,
            nome: jornalista.nome,
            codVeiculo: jornalista.codVeiculo,
            veiculoNome: jornalista.veiculoNome,
            editoria: jornalista.editoria,
            telefone: jornalista.telefone,
            email: jornalista.email,
            cidade: jornalista.cidade,
            status: jornalista.status === 1
        });
    }

    catch (error) {
        console.error("Erro ao buscar jornalista:", error);

        return res.status(500).json({
            mensagem: "Erro ao buscar jornalista.",
            erro: error.message
        });
    }
};

// Função para criação de novos jornalistas
export const createJornalista = async (req, res) => {
    const { nome, codVeiculo, editoria, telefone, email, cidade, status } = req.body ?? {};

    // Verificação do nome do jornalista se está válido
    if (!validarNome(nome)) {
        return res.status(400).json({
            mensagem: "Informe um nome válido para o jornalista."
        });
    }

    // Verificação se o veículo é válido
    if (!validarCodigo(codVeiculo)) {
        return res.status(400).json({
            mensagem: "Informe um código de veículo válido."
        });
    }

    // Verificação da editoria
    if (!validarEditoria(editoria)) {
        return res.status(400).json({
            mensagem: "Informe a editoria do jornalista."
        });
    }

    // Verificação do telefone
    if (!validarTelefone(telefone)) {
        return res.status(400).json({
            mensagem: "Informe um telefone válido."
        });
    }

    // Verificação do email
    if (!validarEmail(email)) {
        return res.status(400).json({
            mensagem: "Informe um email válido."
        });
    }

    // Verificação da cidade, que é opcional
    if (!validarCidade(cidade)) {
        return res.status(400).json({
            mensagem: "Informe uma cidade válida."
        });
    }

    // Verificação se o status está válido
    if (!validarStatus(status)) {
        return res.status(400).json({
            mensagem: "Informe um status sendo true ou false."
        });
    }

    // Tirar espaços brancos do começo e do fim
    const nomeFormatado = nome.trim();
    const editoriaFormatada = editoria.trim();
    const telefoneFormatado = telefone.trim();
    const emailFormatado = email.trim().toLowerCase();
    const cidadeFormatada = cidade?.trim() ? cidade.trim() : null;

    try {
        // Verificar se o veículo informado existe
        const [veiculoExiste] = await db.query(
            "SELECT codigo FROM veiculos WHERE codigo = ?",
            [codVeiculo]
        );

        if (veiculoExiste.length === 0) {
            return res.status(404).json({
                mensagem: "Veículo informado não existe."
            });
        }

        // Verificar se já existe um jornalista com esse email
        // A comparação ignora maiúsculas e minúsculas
        const [emailDuplicado] = await db.query(
            "SELECT codigo FROM jornalista WHERE LOWER(TRIM(email)) = LOWER(TRIM(?)) LIMIT 1",
            [emailFormatado]
        );

        if (emailDuplicado.length > 0) {
            return res.status(409).json({
                mensagem: "Já existe um jornalista cadastrado com este email."
            });
        }

        // Fazer o insert no banco de dados
        const [resultado] = await db.query(
            `INSERT INTO jornalista (nome, codVeiculo, editoria, telefone, email, cidade, status)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                nomeFormatado,
                codVeiculo,
                editoriaFormatada,
                telefoneFormatado,
                emailFormatado,
                cidadeFormatada,
                status
            ]
        );

        return res.status(201).json({
            mensagem: "Jornalista cadastrado com sucesso!",
            jornalista: {
                codigo: resultado.insertId,
                nome: nomeFormatado,
                codVeiculo,
                editoria: editoriaFormatada,
                telefone: telefoneFormatado,
                email: emailFormatado,
                cidade: cidadeFormatada,
                status
            }
        });
    }

    catch (error) {
        // Se o índice UNIQUE do banco bloquear, cai aqui
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                mensagem: "Já existe um jornalista cadastrado com este email."
            });
        }

        console.error("Erro ao cadastrar jornalista:", error);

        return res.status(500).json({
            mensagem: "Erro ao cadastrar jornalista.",
            erro: error.message
        });
    }
};

// Função para alterar jornalistas
export const updateJornalista = async (req, res) => {
    const codigo = validarCodigo(req.params.codigo);
    const { nome, codVeiculo, editoria, telefone, email, cidade, status } = req.body ?? {};

    // Verificar se o código é válido
    if (!codigo) {
        return res.status(400).json({
            mensagem: "Informe um código válido para o jornalista."
        });
    }

    // A atualização é parcial: só precisa receber um dos campos
    const camposRecebidos = [nome, codVeiculo, editoria, telefone, email, cidade, status]
        .filter((valor) => valor !== undefined);

    if (camposRecebidos.length === 0) {
        return res.status(400).json({
            mensagem: "Informe ao menos um campo para atualizar."
        });
    }

    if (nome !== undefined && !validarNome(nome)) {
        return res.status(400).json({
            mensagem: "Informe um nome válido para o jornalista."
        });
    }

    if (codVeiculo !== undefined && !validarCodigo(codVeiculo)) {
        return res.status(400).json({
            mensagem: "Informe um código de veículo válido."
        });
    }

    if (editoria !== undefined && !validarEditoria(editoria)) {
        return res.status(400).json({
            mensagem: "Informe a editoria do jornalista."
        });
    }

    if (telefone !== undefined && !validarTelefone(telefone)) {
        return res.status(400).json({
            mensagem: "Informe um telefone válido."
        });
    }

    if (email !== undefined && !validarEmail(email)) {
        return res.status(400).json({
            mensagem: "Informe um email válido."
        });
    }

    if (cidade !== undefined && !validarCidade(cidade)) {
        return res.status(400).json({
            mensagem: "Informe uma cidade válida."
        });
    }

    if (status !== undefined && !validarStatus(status)) {
        return res.status(400).json({
            mensagem: "Informe o status como true ou false."
        });
    }

    try {
        const [jornalistaExistente] = await db.query(
            "SELECT codigo, email FROM jornalista WHERE codigo = ?",
            [codigo]
        );

        if (jornalistaExistente.length === 0) {
            return res.status(404).json({
                mensagem: "Jornalista não encontrado."
            });
        }

        const emailAtual = jornalistaExistente[0].email;
        const campos = [];
        const valores = [];

        // Monta o UPDATE só com os campos que vieram no body
        if (nome !== undefined) {
            campos.push("nome = ?");
            valores.push(nome.trim());
        }

        if (codVeiculo !== undefined) {
            // Antes de trocar o veículo, garante que o novo veículo existe
            const [veiculoExiste] = await db.query(
                "SELECT codigo FROM veiculos WHERE codigo = ?",
                [codVeiculo]
            );

            if (veiculoExiste.length === 0) {
                return res.status(404).json({
                    mensagem: "Veículo informado não existe."
                });
            }

            campos.push("codVeiculo = ?");
            valores.push(codVeiculo);
        }

        if (editoria !== undefined) {
            campos.push("editoria = ?");
            valores.push(editoria.trim());
        }

        if (telefone !== undefined) {
            campos.push("telefone = ?");
            valores.push(telefone.trim());
        }

        if (email !== undefined) {
            const emailFormatado = email.trim().toLowerCase();

            // A checagem de duplicidade só roda se o email realmente mudou
            if (emailFormatado !== String(emailAtual).trim().toLowerCase()) {
                const [emailDuplicado] = await db.query(
                    `SELECT codigo
                     FROM jornalista
                     WHERE LOWER(TRIM(email)) = LOWER(TRIM(?))
                       AND codigo <> ?
                     LIMIT 1`,
                    [emailFormatado, codigo]
                );

                if (emailDuplicado.length > 0) {
                    return res.status(409).json({
                        mensagem: "Já existe outro jornalista cadastrado com este email."
                    });
                }
            }

            campos.push("email = ?");
            valores.push(emailFormatado);
        }

        if (cidade !== undefined) {
            campos.push("cidade = ?");
            valores.push(cidade?.trim() ? cidade.trim() : null);
        }

        if (status !== undefined) {
            campos.push("status = ?");
            valores.push(status);
        }

        valores.push(codigo);

        await db.query(
            `UPDATE jornalista SET ${campos.join(", ")} WHERE codigo = ?`,
            valores
        );

        return res.status(200).json({
            mensagem: "Jornalista atualizado com sucesso.",
            jornalista: {
                codigo
            }
        });
    }

    catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                mensagem: "Já existe outro jornalista cadastrado com este email."
            });
        }

        console.error("Erro ao atualizar jornalista:", error);

        return res.status(500).json({
            mensagem: "Erro ao atualizar o jornalista.",
            erro: error.message
        });
    }
};

// Função para deletar o jornalista
export const deleteJornalista = async (req, res) => {
    const codigo = validarCodigo(req.params.codigo);

    // Verificar um código válido
    if (!codigo) {
        return res.status(400).json({
            mensagem: "Informe um código válido para o jornalista."
        });
    }

    try {
        const [jornalistaExistente] = await db.query(
            "SELECT codigo FROM jornalista WHERE codigo = ?",
            [codigo]
        );

        if (jornalistaExistente.length === 0) {
            return res.status(404).json({
                mensagem: "Jornalista não encontrado."
            });
        }

        // O jornalista não é referenciado por nenhuma outra tabela,
        // então pode ser excluído direto
        await db.query("DELETE FROM jornalista WHERE codigo = ?", [codigo]);

        return res.status(200).json({
            mensagem: "Jornalista excluído com sucesso."
        });
    }

    // Caso aconteça algum erro vem parar aqui
    catch (error) {
        console.error("Erro ao excluir jornalista:", error);

        return res.status(500).json({
            mensagem: "Erro ao excluir jornalista.",
            erro: error.message
        });
    }
};
