// Controller dos veículos 

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

// Verificação do telefone da redação, só não pode ser vazio
const validarTelefone = (telefone) => {
    return typeof telefone === "string" && telefone.trim().length > 0;
};

// Verificação da abrangência, só não pode ser vazia
const validarAbrangencia = (abrangencia) => {
    return typeof abrangencia === "string" && abrangencia.trim().length > 0;
};

// Função para buscar os dados da tabela veículos
export const getVeiculo = async (req, res) => {
    try {
        // Caso não tenha código informado, busca todos os veículos
        // Trazendo o nome do tipo de veículo junto
        if (req.params.codigo === undefined) {
            const [veiculos] = await db.query(
                `SELECT                         veiculos.codigo,
                        veiculos.nome,
                        veiculos.codTipoVeiculo,
                        tipoVeiculo.nome AS tipoVeiculoNome,
                        veiculos.telefoneDaRedacao,
                        veiculos.abrangencia,
                        veiculos.status
                 FROM veiculos
                 LEFT JOIN tipoveiculos AS tipoVeiculo
                    ON veiculos.codTipoVeiculo = tipoVeiculo.codigo
                 ORDER BY veiculos.nome`
            );

            return res.status(200).json(
                veiculos.map((veiculo) => ({
                    codigo: veiculo.codigo,
                    nome: veiculo.nome,
                    codTipoVeiculo: veiculo.codTipoVeiculo,
                    tipoVeiculoNome: veiculo.tipoVeiculoNome,
                    telefoneDaRedacao: veiculo.telefoneDaRedacao,
                    abrangencia: veiculo.abrangencia,
                    status: veiculo.status === 1
                }))
            );
        }

        const codigo = validarCodigo(req.params.codigo);

        if (!codigo) {
            return res.status(400).json({
                mensagem: "Informe um código válido para o veículo."
            });
        }

        const [veiculos] = await db.query(
            `SELECT                     veiculos.codigo,
                    veiculos.nome,
                    veiculos.codTipoVeiculo,
                    tipoVeiculo.nome AS tipoVeiculoNome,
                    veiculos.telefoneDaRedacao,
                    veiculos.abrangencia,
                    veiculos.status
             FROM veiculos
             LEFT JOIN tipoveiculos AS tipoVeiculo
                ON veiculos.codTipoVeiculo = tipoVeiculo.codigo
             WHERE veiculos.codigo = ?`,
            [codigo]
        );

        if (veiculos.length === 0) {
            return res.status(404).json({
                mensagem: "Veículo não encontrado."
            });
        }

        const veiculo = veiculos[0];

        return res.status(200).json({
            codigo: veiculo.codigo,
            nome: veiculo.nome,
            codTipoVeiculo: veiculo.codTipoVeiculo,
            tipoVeiculoNome: veiculo.tipoVeiculoNome,
            telefoneDaRedacao: veiculo.telefoneDaRedacao,
            abrangencia: veiculo.abrangencia,
            status: veiculo.status === 1
        });
    }

    catch (error) {
        console.error("Erro ao buscar veículo:", error);

        return res.status(500).json({
            mensagem: "Erro ao buscar veículo.",
            erro: error.message
        });
    }
};

// Função para criação de novos veículos
export const createVeiculo = async (req, res) => {
    const { nome, codTipoVeiculo, telefoneDaRedacao, abrangencia, status } = req.body ?? {};

    // Verificação do nome do veículo se está válido
    if (!validarNome(nome)) {
        return res.status(400).json({
            mensagem: "Informe um nome válido para o veículo."
        });
    }

    // Verificação se o tipo do veículo é válido
    if (!validarCodigo(codTipoVeiculo)) {
        return res.status(400).json({
            mensagem: "Informe um código de tipo de veículo válido."
        });
    }

    // Verificação do telefone da redação
    if (!validarTelefone(telefoneDaRedacao)) {
        return res.status(400).json({
            mensagem: "Informe um telefone da redação válido."
        });
    }

    // Verificação da abrangência
    if (!validarAbrangencia(abrangencia)) {
        return res.status(400).json({
            mensagem: "Informe a abrangência do veículo."
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
    const telefoneFormatado = telefoneDaRedacao.trim();
    const abrangenciaFormatada = abrangencia.trim();

    try {
        // Verificar se o tipo de veículo informado existe
        const [tipoVeiculoExiste] = await db.query(
            "SELECT codigo FROM tipoVeiculos WHERE codigo = ?",
            [codTipoVeiculo]
        );

        if (tipoVeiculoExiste.length === 0) {
            return res.status(404).json({
                mensagem: "Tipo de veículo informado não existe."
            });
        }

        // Verificar se já existe um veículo com esse nome
        // A comparação ignora maiúsculas e minúsculas
        const [veiculosDuplicados] = await db.query(
            "SELECT codigo FROM veiculos WHERE LOWER(TRIM(nome)) = LOWER(TRIM(?)) LIMIT 1",
            [nomeFormatado]
        );

        if (veiculosDuplicados.length > 0) {
            return res.status(409).json({
                mensagem: "Já existe um veículo cadastrado com este nome."
            });
        }

        // Fazer o insert no banco de dados
        const [resultado] = await db.query(
            `INSERT INTO veiculos (nome, codTipoVeiculo, telefoneDaRedacao, abrangencia, status)
             VALUES (?, ?, ?, ?, ?)`,
            [nomeFormatado, codTipoVeiculo, telefoneFormatado, abrangenciaFormatada, status]
        );

        return res.status(201).json({
            mensagem: "Veículo cadastrado com sucesso!",
            veiculo: {
                codigo: resultado.insertId,
                nome: nomeFormatado,
                codTipoVeiculo,
                telefoneDaRedacao: telefoneFormatado,
                abrangencia: abrangenciaFormatada,
                status
            }
        });
    }

    catch (error) {
        // Se o índice UNIQUE do banco bloquear, cai aqui
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                mensagem: "Já existe um veículo cadastrado com este nome."
            });
        }

        console.error("Erro ao cadastrar veículo:", error);

        return res.status(500).json({
            mensagem: "Erro ao cadastrar veículo.",
            erro: error.message
        });
    }
};

// Função para alterar veículos
export const updateVeiculo = async (req, res) => {
    const codigo = validarCodigo(req.params.codigo);
    const { nome, codTipoVeiculo, telefoneDaRedacao, abrangencia, status } = req.body ?? {};

    // Verificar se o código é válido
    if (!codigo) {
        return res.status(400).json({
            mensagem: "Informe um código válido para o veículo."
        });
    }

    // A atualização é parcial: só precisa receber um dos campos
    const camposRecebidos = [nome, codTipoVeiculo, telefoneDaRedacao, abrangencia, status]
        .filter((valor) => valor !== undefined);

    if (camposRecebidos.length === 0) {
        return res.status(400).json({
            mensagem: "Informe ao menos um campo para atualizar."
        });
    }

    if (nome !== undefined && !validarNome(nome)) {
        return res.status(400).json({
            mensagem: "Informe um nome válido para o veículo."
        });
    }

    if (codTipoVeiculo !== undefined && !validarCodigo(codTipoVeiculo)) {
        return res.status(400).json({
            mensagem: "Informe um código de tipo de veículo válido."
        });
    }

    if (telefoneDaRedacao !== undefined && !validarTelefone(telefoneDaRedacao)) {
        return res.status(400).json({
            mensagem: "Informe um telefone da redação válido."
        });
    }

    if (abrangencia !== undefined && !validarAbrangencia(abrangencia)) {
        return res.status(400).json({
            mensagem: "Informe a abrangência do veículo."
        });
    }

    if (status !== undefined && !validarStatus(status)) {
        return res.status(400).json({
            mensagem: "Informe o status como true ou false."
        });
    }

    try {
        const [veiculoExistente] = await db.query(
            "SELECT codigo, nome FROM veiculos WHERE codigo = ?",
            [codigo]
        );

        if (veiculoExistente.length === 0) {
            return res.status(404).json({
                mensagem: "Veículo não encontrado."
            });
        }

        const nomeAtual = veiculoExistente[0].nome;
        const campos = [];
        const valores = [];

        // Monta o UPDATE só com os campos que vieram no body
        if (nome !== undefined) {
            const nomeFormatado = nome.trim();

            // A checagem de duplicidade só roda se o nome realmente mudou
            if (nomeFormatado.toLowerCase() !== String(nomeAtual).trim().toLowerCase()) {
                const [veiculosDuplicados] = await db.query(
                    `SELECT codigo
                     FROM veiculos
                     WHERE LOWER(TRIM(nome)) = LOWER(TRIM(?))
                       AND codigo <> ?
                     LIMIT 1`,
                    [nomeFormatado, codigo]
                );

                if (veiculosDuplicados.length > 0) {
                    return res.status(409).json({
                        mensagem: "Já existe outro veículo cadastrado com este nome."
                    });
                }
            }

            campos.push("nome = ?");
            valores.push(nomeFormatado);
        }

        if (codTipoVeiculo !== undefined) {
            // Antes de trocar o tipo, garante que o novo tipo existe
            const [tipoVeiculoExiste] = await db.query(
                "SELECT codigo FROM tipoVeiculos WHERE codigo = ?",
                [codTipoVeiculo]
            );

            if (tipoVeiculoExiste.length === 0) {
                return res.status(404).json({
                    mensagem: "Tipo de veículo informado não existe."
                });
            }

            campos.push("codTipoVeiculo = ?");
            valores.push(codTipoVeiculo);
        }

        if (telefoneDaRedacao !== undefined) {
            campos.push("telefoneDaRedacao = ?");
            valores.push(telefoneDaRedacao.trim());
        }

        if (abrangencia !== undefined) {
            campos.push("abrangencia = ?");
            valores.push(abrangencia.trim());
        }

        if (status !== undefined) {
            campos.push("status = ?");
            valores.push(status);
        }

        valores.push(codigo);

        await db.query(
            `UPDATE veiculos SET ${campos.join(", ")} WHERE codigo = ?`,
            valores
        );

        return res.status(200).json({
            mensagem: "Veículo atualizado com sucesso.",
            veiculo: {
                codigo,
                nome: nome ?? nomeAtual
            }
        });
    }

    catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                mensagem: "Já existe outro veículo cadastrado com este nome."
            });
        }

        console.error("Erro ao atualizar veículo:", error);

        return res.status(500).json({
            mensagem: "Erro ao atualizar o veículo.",
            erro: error.message
        });
    }
};

// Função para deletar o veículo
export const deleteVeiculo = async (req, res) => {
    const codigo = validarCodigo(req.params.codigo);

    // Verificar um código válido
    if (!codigo) {
        return res.status(400).json({
            mensagem: "Informe um código válido para o veículo."
        });
    }

    try {
        const [veiculoExistente] = await db.query(
            "SELECT codigo FROM veiculos WHERE codigo = ?",
            [codigo]
        );

        if (veiculoExistente.length === 0) {
            return res.status(404).json({
                mensagem: "Veículo não encontrado."
            });
        }

        // Não deixa excluir se já existir jornalista vinculado a este veículo
        const [jornalistasVinculados] = await db.query(
            "SELECT codigo FROM jornalista WHERE codVeiculo = ? LIMIT 1",
            [codigo]
        );

        if (jornalistasVinculados.length > 0) {
            return res.status(409).json({
                mensagem: "Não é possível excluir este veículo, pois ele possui jornalistas vinculados."
            });
        }

        await db.query("DELETE FROM veiculos WHERE codigo = ?", [codigo]);

        return res.status(200).json({
            mensagem: "Veículo excluído com sucesso."
        });
    }

    // Caso aconteça algum erro vem parar aqui
    catch (error) {
        // O banco também bloqueia a exclusão pela foreign key
        if (error.code === "ER_ROW_IS_REFERENCED_2" || error.errno === 1451) {
            return res.status(409).json({
                mensagem: "Não é possível excluir este veículo, pois ele possui jornalistas vinculados."
            });
        }

        console.error("Erro ao excluir veículo:", error);

        return res.status(500).json({
            mensagem: "Erro ao excluir veículo.",
            erro: error.message
        });
    }
};