// Controller das tags usadas para classificar os compromissos

import { db } from "../config/database.js";

// Paleta de cores disponível para seleção
export const CORES_DISPONIVEIS = [
    { nome: "Vermelho", valor: "#DC2626" },
    { nome: "Laranja", valor: "#EA580C" },
    { nome: "Amarelo", valor: "#CA8A04" },
    { nome: "Verde", valor: "#16A34A" },
    { nome: "Azul", valor: "#2563EB" },
    { nome: "Roxo", valor: "#9333EA" },
    { nome: "Rosa", valor: "#DB2777" },
    { nome: "Cinza", valor: "#6B7280" }
];

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

// Verificação da cor, tem que existir na paleta
const validarCor = (cor) => {
    return typeof cor === "string"
        && CORES_DISPONIVEIS.some((corDisponivel) => corDisponivel.valor === cor.trim().toUpperCase());
};

// A descrição é opcional, mas se vier precisa ser texto
const validarDescricao = (descricao) => {
    return descricao === undefined || descricao === null || typeof descricao === "string";
};

// Devolve o nome da cor a partir do valor hexadecimal
const nomeDaCor = (valor) => {
    return CORES_DISPONIVEIS.find((cor) => cor.valor === String(valor).toUpperCase())?.nome ?? null;
};

// Função para buscar os dados da tabela tags
export const getTag = async (req, res) => {
    try {
        // Caso não tenha código informado, busca todas as tags
        if (req.params.codigo === undefined) {
            const [tags] = await db.query(
                `SELECT codigo, nome, cor, descricao, status
                 FROM tag
                 ORDER BY nome`
            );

            return res.status(200).json(
                tags.map((tag) => ({
                    codigo: tag.codigo,
                    nome: tag.nome,
                    cor: tag.cor,
                    corNome: nomeDaCor(tag.cor),
                    descricao: tag.descricao,
                    status: tag.status === 1
                }))
            );
        }

        const codigo = validarCodigo(req.params.codigo);

        if (!codigo) {
            return res.status(400).json({
                mensagem: "Informe um código válido para a tag."
            });
        }

        const [tags] = await db.query(
            "SELECT codigo, nome, cor, descricao, status FROM tag WHERE codigo = ?",
            [codigo]
        );

        if (tags.length === 0) {
            return res.status(404).json({
                mensagem: "Tag não encontrada."
            });
        }

        const tag = tags[0];

        return res.status(200).json({
            codigo: tag.codigo,
            nome: tag.nome,
            cor: tag.cor,
            corNome: nomeDaCor(tag.cor),
            descricao: tag.descricao,
            status: tag.status === 1
        });
    }

    catch (error) {
        console.error("Erro ao buscar tag:", error);

        return res.status(500).json({
            mensagem: "Erro ao buscar tag.",
            erro: error.message
        });
    }
};

// Função para listar as cores disponíveis para o seletor
export const getCores = async (req, res) => {
    return res.status(200).json(CORES_DISPONIVEIS);
};

// Função para criação de novas tags
export const createTag = async (req, res) => {
    const { nome, cor, descricao, status } = req.body ?? {};

    // Verificação do nome da tag se está válido
    if (!validarNome(nome)) {
        return res.status(400).json({
            mensagem: "Informe um nome válido para a tag."
        });
    }

    // Verificação se a cor pertence à paleta
    if (!validarCor(cor)) {
        return res.status(400).json({
            mensagem: "Informe uma cor válida. Consulte as cores disponíveis."
        });
    }

    // Verificação da descrição, que é opcional
    if (!validarDescricao(descricao)) {
        return res.status(400).json({
            mensagem: "Informe a descrição como texto."
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
    const corFormatada = cor.trim().toUpperCase();
    const descricaoFormatada = descricao?.trim() ? descricao.trim() : null;

    try {
        // Verificar se já existe uma tag com esse nome
        // A comparação ignora maiúsculas e minúsculas
        const [tagsDuplicadas] = await db.query(
            "SELECT codigo FROM tag WHERE LOWER(TRIM(nome)) = LOWER(TRIM(?)) LIMIT 1",
            [nomeFormatado]
        );

        if (tagsDuplicadas.length > 0) {
            return res.status(409).json({
                mensagem: "Já existe uma tag cadastrada com este nome."
            });
        }

        // Fazer o insert no banco de dados
        const [resultado] = await db.query(
            "INSERT INTO tag (nome, cor, descricao, status) VALUES (?, ?, ?, ?)",
            [nomeFormatado, corFormatada, descricaoFormatada, status]
        );

        return res.status(201).json({
            mensagem: "Tag cadastrada com sucesso!",
            tag: {
                codigo: resultado.insertId,
                nome: nomeFormatado,
                cor: corFormatada,
                corNome: nomeDaCor(corFormatada),
                descricao: descricaoFormatada,
                status
            }
        });
    }

    catch (error) {
        // Se o índice UNIQUE do banco bloquear, cai aqui
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                mensagem: "Já existe uma tag cadastrada com este nome."
            });
        }

        console.error("Erro ao cadastrar tag:", error);

        return res.status(500).json({
            mensagem: "Erro ao cadastrar tag.",
            erro: error.message
        });
    }
};

// Função para alterar tags
export const updateTag = async (req, res) => {
    const codigo = validarCodigo(req.params.codigo);
    const { nome, cor, descricao, status } = req.body ?? {};

    // Verificar se o código é válido
    if (!codigo) {
        return res.status(400).json({
            mensagem: "Informe um código válido para a tag."
        });
    }

    // A atualização é parcial: só precisa receber um dos campos
    const camposRecebidos = [nome, cor, descricao, status]
        .filter((valor) => valor !== undefined);

    if (camposRecebidos.length === 0) {
        return res.status(400).json({
            mensagem: "Informe ao menos um campo para atualizar."
        });
    }

    if (nome !== undefined && !validarNome(nome)) {
        return res.status(400).json({
            mensagem: "Informe um nome válido para a tag."
        });
    }

    if (cor !== undefined && !validarCor(cor)) {
        return res.status(400).json({
            mensagem: "Informe uma cor válida. Consulte as cores disponíveis."
        });
    }

    if (descricao !== undefined && !validarDescricao(descricao)) {
        return res.status(400).json({
            mensagem: "Informe a descrição como texto."
        });
    }

    if (status !== undefined && !validarStatus(status)) {
        return res.status(400).json({
            mensagem: "Informe o status como true ou false."
        });
    }

    try {
        const [tagExistente] = await db.query(
            "SELECT codigo, nome FROM tag WHERE codigo = ?",
            [codigo]
        );

        if (tagExistente.length === 0) {
            return res.status(404).json({
                mensagem: "Tag não encontrada."
            });
        }

        const nomeAtual = tagExistente[0].nome;
        const campos = [];
        const valores = [];

        // Monta o UPDATE só com os campos que vieram no body
        if (nome !== undefined) {
            const nomeFormatado = nome.trim();

            // A checagem de duplicidade só roda se o nome realmente mudou
            if (nomeFormatado.toLowerCase() !== String(nomeAtual).trim().toLowerCase()) {
                const [tagsDuplicadas] = await db.query(
                    `SELECT codigo
                     FROM tag
                     WHERE LOWER(TRIM(nome)) = LOWER(TRIM(?))
                       AND codigo <> ?
                     LIMIT 1`,
                    [nomeFormatado, codigo]
                );

                if (tagsDuplicadas.length > 0) {
                    return res.status(409).json({
                        mensagem: "Já existe outra tag cadastrada com este nome."
                    });
                }
            }

            campos.push("nome = ?");
            valores.push(nomeFormatado);
        }

        if (cor !== undefined) {
            campos.push("cor = ?");
            valores.push(cor.trim().toUpperCase());
        }

        if (descricao !== undefined) {
            campos.push("descricao = ?");
            valores.push(descricao?.trim() ? descricao.trim() : null);
        }

        if (status !== undefined) {
            campos.push("status = ?");
            valores.push(status);
        }

        valores.push(codigo);

        await db.query(
            `UPDATE tag SET ${campos.join(", ")} WHERE codigo = ?`,
            valores
        );

        return res.status(200).json({
            mensagem: "Tag atualizada com sucesso.",
            tag: {
                codigo
            }
        });
    }

    catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                mensagem: "Já existe outra tag cadastrada com este nome."
            });
        }

        console.error("Erro ao atualizar tag:", error);

        return res.status(500).json({
            mensagem: "Erro ao atualizar a tag.",
            erro: error.message
        });
    }
};

// Função para deletar a tag
export const deleteTag = async (req, res) => {
    const codigo = validarCodigo(req.params.codigo);

    // Verificar um código válido
    if (!codigo) {
        return res.status(400).json({
            mensagem: "Informe um código válido para a tag."
        });
    }

    try {
        const [tagExistente] = await db.query(
            "SELECT codigo FROM tag WHERE codigo = ?",
            [codigo]
        );

        if (tagExistente.length === 0) {
            return res.status(404).json({
                mensagem: "Tag não encontrada."
            });
        }

        // Não deixa excluir se já existir compromisso vinculado a esta tag
        const [compromissosVinculados] = await db.query(
            "SELECT codigo FROM compromisso WHERE codTag = ? LIMIT 1",
            [codigo]
        );

        if (compromissosVinculados.length > 0) {
            return res.status(409).json({
                mensagem: "Não é possível excluir esta tag, pois ela possui compromissos vinculados."
            });
        }

        await db.query("DELETE FROM tag WHERE codigo = ?", [codigo]);

        return res.status(200).json({
            mensagem: "Tag excluída com sucesso."
        });
    }

    // Caso aconteça algum erro vem parar aqui
    catch (error) {
        // O banco também bloqueia a exclusão pela foreign key
        if (error.code === "ER_ROW_IS_REFERENCED_2" || error.errno === 1451) {
            return res.status(409).json({
                mensagem: "Não é possível excluir esta tag, pois ela possui compromissos vinculados."
            });
        }

        console.error("Erro ao excluir tag:", error);

        return res.status(500).json({
            mensagem: "Erro ao excluir tag.",
            erro: error.message
        });
    }
};
