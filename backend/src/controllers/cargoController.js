// logica mysql dos cargos (jornalista, estagiarios...)

import { db } from "../config/database.js";

// Verificação se o nome realmente é uma string e verificação
// do usuario não mandar espaços em brancos
const validarNome = (nome) => {
    return typeof nome === "string" && nome.trim().length > 0;
}


// Verificação se o codigo é um numero, se é maior que zero
// e não deixa ser um número nulo
const validarCodigo = (valor) => {
    const codigo = Number(valor);

    return Number.isInteger(codigo) && codigo > 0 ? codigo : null;
};


// Verificar se o status é boolean
const validarStatus = (status) => {
    return typeof status === "boolean";
}

// Função para buscar os dados da tabela cargos
export const getCargo = async (req, res) => {
    try {

        // Caso não tenha codigo informado faz um select com todos os cargos
        // Com a quantidade de integrantes por cargo
        // Com o status de true
        if (req.params.codigo === undefined) {
            const [cargos] = await db.query(
                `SELECT 
                cargo.codigo,
                cargo.nome,
                cargo.status,
                COUNT(CASE WHEN funcionario.status = 1 THEN 1 END) AS quantidadeIntegrantes
                FROM cargo
                LEFT JOIN funcionario
                ON funcionario.codCargo = cargo.codigo
                group by cargo.codigo, cargo.nome, cargo.status
                `
            );

            return res.status(200).json(
                cargos.map((cargo) => ({
                    codigo: cargo.codigo,
                    nome: cargo.nome,
                    status: cargo.status === 1,
                    quantidadeIntegrantes: cargo.quantidadeIntegrantes
                }))
            )
        }

        const codigo = validarCodigo(req.params.codigo);

        // Verificar se o codigo está valido
        if (!codigo) {
            return res.status(400).json({
                mensagem: "Informe um código válido para o cargo."
            });
        }

        // Buscando cargos com o codigo informado
        // E buscando a quantidade de integrantes com esse cargo
        // Com o status de true
        const [cargos] = await db.query(
            `SELECT
            cargo.codigo,
            cargo.nome,
            cargo.status,
            COUNT(CASE WHEN funcionario.status = 1 THEN 1 END) AS quantidadeIntegrantes
            FROM cargo
            LEFT JOIN funcionario 
            ON funcionario.codCargo = cargo.codigo
            WHERE cargo.codigo = ?
            GROUP BY cargo.codigo, cargo.nome, cargo.status`,
            [codigo]
        );

        if (cargos.length === 0) {
            return res.status(404).json({
                mensagem: "Cargo não encontrado."
            });
        }

        const cargo = cargos[0];

        return res.status(200).json({
            codigo: cargo.codigo,
            nome: cargo.nome,
            status: cargo.status === 1,
            quantidadeIntegrantes: cargo.quantidadeIntegrantes
        })
    } 
    
    
    catch (error) {
        console.error("Erro ao buscar cargo:", error);

        return res.status(500).json({
            mensagem: "Erro ao buscar cargo.",
            erro: error.message
        });
    }
};

// Função para criação de novos cargos
export const createCargo = async(req, res) => {
    const { nome, status } = req.body ?? {};

    // Verificação do nome do cargo se está valido
    if (!validarNome(nome)) {
        return res.status(400).json({
            mensagem: "Informe um nome valido para o nome do cargo"
        })
    }

    // Verificação se o status está valido 
    if (!validarStatus(status)) {
        return res.status(400).json ({
            mensagem: "Informe um status sendo true ou false"
        })
    }

    // Fazer com que o nome não fique com espaços brancos
    const nomeFormatado = nome.trim();

    try {

        // Fazer uma verificação para deixar existir cargos com o mesmo nome
        const [cargosDuplicados] = await db.query(
            "SELECT codigo FROM cargo WHERE LOWER(nome) = LOWER(?) LIMIT 1",
            [nomeFormatado]
        );

        if (cargosDuplicados.length > 0) {
            return res.status(409).json({
                mensagem: "Já existe um cargo cadastrado com este nome."
            });
        }

        // Fazer o insert no banco de dados
        const [resultado] = await db.query(
            "INSERT INTO cargo (nome, status) VALUES (?, ?)",
            [nomeFormatado, status]
        );

        return res.status(201).json({
            mensagem: "Cargo cadastrado com sucesso!!!",

            cargo: {
            codigo: resultado.insertId,
            nome: nomeFormatado,
            status
            }

        });
    }

    // Caso tenha algum erro vem aqui
    catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                mensagem: "Já existe um cargo cadastrado com este nome."
            });
        }

        console.error("Erro ao cadastrar cargo: ", error);

        return res.status(500).json({
            mensagem: "Erro ao cadastrar cargo, ",
            erro: error.message
        })
    }
}

// Função de alterar cargos
export const updateCargo = async (req, res) => {
    const codigo = validarCodigo(req.params.codigo);
    const { nome, status } = req.body ?? {};

    // Verificar se codigo é valido
    if (!codigo) {
        return res.status(400).json({
            mensagem: "Informe um código válido para o cargo"
        });
    }


    // Verificar se o nome realmente é válido
    if (!validarNome(nome)) {
        return res.status(400).json({
            mensagem: "Informe um nome válido parao cargo"
        });
    }

    // Verificar um status valido
    if (!validarStatus(status)) {
        return res.status(400).json({
            mensagem: "Informe o status como true ou false"
        });
    }

    const nomeFormatado = nome.trim();

    try {
        const [cargoExistente] = await db.query(
            "SELECT codigo FROM cargo WHERE codigo = ?",
            [codigo]
        );

        if (cargoExistente.length === 0) {
            return res.status(404).json({
                mensagem: "Cargo não encontrado."
            });
        }

       const [cargosDuplicados] = await db.query(
            `SELECT codigo
             FROM cargo
             WHERE LOWER(nome) = LOWER(?)
               AND codigo <> ?
             LIMIT 1`,
            [nomeFormatado, codigo]
        );

        if (cargosDuplicados.length > 0) {
            return res.status(409).json({
                mensagem: "Já existe outro cargo cadastrado com este nome."
            });
        }

        await db.query(
            "UPDATE cargo SET nome = ?, status = ? WHERE codigo = ?",
            [nomeFormatado, status, codigo]
        );

        return res.status(200).json({
            mensagem: "Cargo atualizado com sucesso.",
            cargo: {
                codigo,
                nome: nomeFormatado,
                status
            }
        });
    } 
    
    // Se acontecer algum erro vem parar aqui
    catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                mensagem: "Já existe outro cargo cadastrado com este nome."
            });
        }

        console.error("Erro ao atualizar cargo:", error);

        return res.status(500).json({
            mensagem: "Erro ao atualizar o cargo.",
            erro: error.message
        });
    }
};

// Função para deletar o cargo
export const deleteCargo = async (req, res) => {
    const codigo = validarCodigo(req.params.codigo);

    // Verificar um codigo válido
    if (!codigo) {
        return res.status(400).json({
            mensagem: "Informe um código válido para o cargo."
        });
    }

    try {
        const [funcionariosVinculados] = await db.query(
            "SELECT codigo FROM funcionario WHERE codCargo = ? LIMIT 1",
            [codigo]
        );

        // Verificando para não excluir cargo vinculado a um cargo
        if (funcionariosVinculados.length > 0) {
            return res.status(409).json({
                mensagem: "Não é possível excluir este cargo, pois ele possui funcionários vinculados."
            });
        }

        const [cargoExistente] = await db.query(
            "SELECT codigo FROM cargo WHERE codigo = ?",
            [codigo]
        );

        // Caso o cargo não tenha sido encontrado
        if (cargoExistente.length === 0) {
            return res.status(404).json({
                mensagem: "Cargo não encontrado."
            });
        }

        await db.query(
            "DELETE FROM cargo WHERE codigo = ?",
            [codigo]
        );

        return res.status(200).json({
            mensagem: "Cargo excluído com sucesso."
        });
    } 
    
    // Caso aconteça algum erro vem parar aqui
    catch (error) {
        if (
            error.code === "ER_ROW_IS_REFERENCED_2" ||
            error.errno === 1451
        ) {
            return res.status(409).json({
                mensagem: "Não é possível excluir este cargo, pois ele possui funcionários vinculados."
            });
        }

        console.error("Erro ao excluir cargo:", error);

        return res.status(500).json({
            mensagem: "Erro ao excluir cargo.",
            erro: error.message
        });
    }
};