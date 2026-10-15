// Controller dos compromissos (agenda)

import { db } from "../config/database.js";

// -=-=-=-= Validações -=-=-=-=-=

// Validar se é uma string não vazia
const validarTexto = (valor) => {
    return typeof valor === "string" && valor.trim().length > 0;
};

// Validar código (número inteiro > 0)
const validarCodigo = (valor) => {
    const codigo = Number(valor);
    return Number.isInteger(codigo) && codigo > 0 ? codigo : null;
};

// Validar data/hora - não pode ser no passado
const validarDataHora = (dataHora) => {
    if (!dataHora) return false;
    const data = new Date(dataHora);
    const agora = new Date();
    return data >= agora && !isNaN(data.getTime());
};

// Validar se data fim é depois da data início
const validarIntervalo = (inicio, fim) => {
    if (!inicio || !fim) return false;
    return new Date(fim) > new Date(inicio);
};

// Validar status
const validarStatus = (status) => {
    const statusValidos = ['Agendado', 'Pendente', 'Concluido', 'Cancelado'];
    return typeof status === "string" && statusValidos.includes(status);
};

// Validar array de códigos (para múltiplos clientes/funcionários)
const validarArrayCodigos = (array) => {
    if (!Array.isArray(array)) return false;
    return array.every(codigo => Number.isInteger(Number(codigo)) && Number(codigo) > 0);
};

// -=-=-=-=-= Função para buscar compromissos -=-=-=-=-=-=

export const getCompromisso = async (req, res) => {
    try {
        if (req.params.codigo === undefined) {
            const [compromissos] = await db.query(
                `SELECT 
                    c.codigo,
                    c.titulo,
                    c.codTag,
                    t.nome AS tagNome,
                    t.cor AS tagCor,
                    c.codCliente,
                    cl.razaoSocial_NomeEmpresa AS clienteNome,
                    c.codJornalista,
                    j.nome AS jornalistaNome,
                    c.dataHoraInicio,
                    c.dataHoraFim,
                    c.anotacoes,
                    c.status
                FROM compromisso c
                LEFT JOIN tag t ON c.codTag = t.codigo
                LEFT JOIN cliente cl ON c.codCliente = cl.codigo
                LEFT JOIN jornalista j ON c.codJornalista = j.codigo
                ORDER BY c.dataHoraInicio`
            );

            for (const compromisso of compromissos) {
                const [participantes] = await db.query(
                    `SELECT f.codigo, f.nome, f.email
                     FROM participantecompromisso pc
                     JOIN funcionario f ON pc.codFuncionario = f.codigo
                     WHERE pc.codCompromisso = ?`,
                    [compromisso.codigo]
                );
                compromisso.participantesEquipe = participantes;
            }

            return res.status(200).json(compromissos);
        }

        const codigo = validarCodigo(req.params.codigo);
        if (!codigo) {
            return res.status(400).json({
                mensagem: "Informe um código válido para o compromisso."
            });
        }

        const [compromissos] = await db.query(
            `SELECT 
                c.codigo,
                c.titulo,
                c.codTag,
                t.nome AS tagNome,
                t.cor AS tagCor,
                c.codCliente,
                cl.razaoSocial_NomeEmpresa AS clienteNome,
                c.codJornalista,
                j.nome AS jornalistaNome,
                c.dataHoraInicio,
                c.dataHoraFim,
                c.anotacoes,
                c.status
            FROM compromisso c
            LEFT JOIN tag t ON c.codTag = t.codigo
            LEFT JOIN cliente cl ON c.codCliente = cl.codigo
            LEFT JOIN jornalista j ON c.codJornalista = j.codigo
            WHERE c.codigo = ?`,
            [codigo]
        );

        if (compromissos.length === 0) {
            return res.status(404).json({
                mensagem: "Compromisso não encontrado."
            });
        }

        const compromisso = compromissos[0];

        const [clientesAssoc] = await db.query(
            `SELECT c.codigo, c.razaoSocial_NomeEmpresa
             FROM clientecompromisso cc
             JOIN cliente c ON cc.codCliente = c.codigo
             WHERE cc.codCompromisso = ?`,
            [codigo]
        );
        compromisso.clientes = clientesAssoc;

        const [participantes] = await db.query(
            `SELECT f.codigo, f.nome, f.email, f.telefone
             FROM participantecompromisso pc
             JOIN funcionario f ON pc.codFuncionario = f.codigo
             WHERE pc.codCompromisso = ?`,
            [codigo]
        );
        compromisso.participantesEquipe = participantes;

        return res.status(200).json(compromisso);
    } catch (error) {
        console.error("Erro ao buscar compromisso:", error);
        return res.status(500).json({
            mensagem: "Erro ao buscar compromisso.",
            erro: error.message
        });
    }
};

// -=-=-=-=-= Função para listar compromissos por tag -=-=-=-=-=-=

export const getCompromissoPorTag = async (req, res) => {
    try {
        const codigo = validarCodigo(req.params.codigo);
        if (!codigo) {
            return res.status(400).json({
                mensagem: "Informe um código válido para a tag."
            });
        }

        const [compromissos] = await db.query(
            `SELECT 
                c.codigo,
                c.titulo,
                c.dataHoraInicio,
                c.dataHoraFim,
                c.status,
                cl.razaoSocial_NomeEmpresa AS clienteNome
            FROM compromisso c
            LEFT JOIN cliente cl ON c.codCliente = cl.codigo
            WHERE c.codTag = ?
            ORDER BY c.dataHoraInicio`,
            [codigo]
        );

        return res.status(200).json(compromissos);
    } catch (error) {
        console.error("Erro ao buscar compromissos por tag:", error);
        return res.status(500).json({
            mensagem: "Erro ao buscar compromissos por tag.",
            erro: error.message
        });
    }
};

// -=-=-=-=-= Função para listar pedências (compromissos pendentes) -=-=-=-=-=-=

export const getPedencias = async (req, res) => {
    try {
        const [pedencias] = await db.query(
            `SELECT 
                c.codigo,
                c.titulo,
                c.dataHoraInicio,
                c.dataHoraFim,
                c.anotacoes,
                cl.razaoSocial_NomeEmpresa AS clienteNome,
                t.nome AS tagNome,
                t.cor AS tagCor
            FROM compromisso c
            LEFT JOIN cliente cl ON c.codCliente = cl.codigo
            LEFT JOIN tag t ON c.codTag = t.codigo
            WHERE c.status = 'Pendente'
            ORDER BY c.dataHoraInicio`
        );

        return res.status(200).json(pedencias);
    } catch (error) {
        console.error("Erro ao buscar pedências:", error);
        return res.status(500).json({
            mensagem: "Erro ao buscar pedências.",
            erro: error.message
        });
    }
};

// -=-=-=-=-=-=-= Função para criar novo compromisso -=-=-=-=-=-=-=

export const createCompromisso = async (req, res) => {
    const {
        titulo,
        codTag,
        codCliente,
        codJornalista,
        dataHoraInicio,
        dataHoraFim,
        anotacoes,
        status,
        cliente,
        participantesEquipe
    } = req.body ?? {};

    if (!validarTexto(titulo)) {
        return res.status(400).json({
            mensagem: "Informe um título válido para o compromisso."
        });
    }

    if (!validarCodigo(codTag)) {
        return res.status(400).json({
            mensagem: "Informe um código de tag válido."
        });
    }

    if (!validarDataHora(dataHoraInicio)) {
        return res.status(400).json({
            mensagem: "A data e hora de início não pode ser no passado."
        });
    }

    if (!validarDataHora(dataHoraFim)) {
        return res.status(400).json({
            mensagem: "A data e hora de fim não pode ser no passado."
        });
    }

    if (!validarIntervalo(dataHoraInicio, dataHoraFim)) {
        return res.status(400).json({
            mensagem: "A data e hora de fim deve ser posterior à data e hora de início."
        });
    }

    if (status && !validarStatus(status)) {
        return res.status(400).json({
            mensagem: "Status inválido. Valores permitidos: Agendado, Pendente, Concluido, Cancelado."
        });
    }

    if (cliente !== undefined && !validarArrayCodigos(cliente)) {
        return res.status(400).json({
            mensagem: "Lista de clientes inválida. Deve ser um array de códigos inteiros positivos."
        });
    }

    if (participantesEquipe !== undefined && !validarArrayCodigos(participantesEquipe)) {
        return res.status(400).json({
            mensagem: "Lista de participantes da equipe inválida. Deve ser um array de códigos inteiros positivos."
        });
    }

    if (codCliente !== undefined && codCliente !== null && !validarCodigo(codCliente)) {
        return res.status(400).json({
            mensagem: "Informe um código de cliente válido."
        });
    }

    if (codJornalista !== undefined && codJornalista !== null && !validarCodigo(codJornalista)) {
        return res.status(400).json({
            mensagem: "Informe um código de jornalista válido."
        });
    }

    const tituloFormatado = titulo.trim();
    const anotacoesFormatada = anotacoes?.trim() ? anotacoes.trim() : null;
    const statusFormatado = status || 'Agendado';

    try {
        const [tagExiste] = await db.query("SELECT codigo FROM tag WHERE codigo = ?", [codTag]);
        if (tagExiste.length === 0) {
            return res.status(404).json({
                mensagem: "Tag informada não existe."
            });
        }

        if (codCliente) {
            const [clienteExiste] = await db.query("SELECT codigo FROM cliente WHERE codigo = ?", [codCliente]);
            if (clienteExiste.length === 0) {
                return res.status(404).json({
                    mensagem: "Cliente principal informado não existe."
                });
            }
        }

        if (codJornalista) {
            const [jornalistaExiste] = await db.query("SELECT codigo FROM jornalista WHERE codigo = ?", [codJornalista]);
            if (jornalistaExiste.length === 0) {
                return res.status(404).json({
                    mensagem: "Jornalista informado não existe."
                });
            }
        }

        if (cliente && cliente.length > 0) {
            const [clientesExistem] = await db.query(
                `SELECT codigo FROM cliente WHERE codigo IN (${cliente.map(() => '?').join(',')})`,
                cliente
            );
            if (clientesExistem.length !== cliente.length) {
                return res.status(404).json({
                    mensagem: "Um ou mais clientes adicionais não existem."
                });
            }
        }

        if (participantesEquipe && participantesEquipe.length > 0) {
            const [funcExistem] = await db.query(
                `SELECT codigo FROM funcionario WHERE codigo IN (${participantesEquipe.map(() => '?').join(',')})`,
                participantesEquipe
            );
            if (funcExistem.length !== participantesEquipe.length) {
                return res.status(404).json({
                    mensagem: "Um ou mais funcionários da equipe não existem."
                });
            }
        }

        const [resultado] = await db.query(
            `INSERT INTO compromisso (titulo, codTag, codCliente, codJornalista, dataHoraInicio, dataHoraFim, anotacoes, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [tituloFormatado, codTag, codCliente || null, codJornalista || null, dataHoraInicio, dataHoraFim, anotacoesFormatada, statusFormatado]
        );

        const compromissoId = resultado.insertId;

        if (cliente && cliente.length > 0) {
            const clienteUnicos = [...new Set(cliente.filter(c => c !== codCliente))];
            if (clienteUnicos.length > 0) {
                const values = clienteUnicos.map(cod => [compromissoId, cod]);
                await db.query(
                    `INSERT INTO clientecompromisso (codCompromisso, codCliente) VALUES ?`,
                    [values]
                );
            }
        }

        if (participantesEquipe && participantesEquipe.length > 0) {
            const values = participantesEquipe.map(cod => [compromissoId, cod]);
            await db.query(
                `INSERT INTO participantecompromisso (codCompromisso, codFuncionario) VALUES ?`,
                [values]
            );
        }

        const [novoCompromisso] = await db.query(
            `SELECT 
                c.codigo,
                c.titulo,
                c.codTag,
                t.nome AS tagNome,
                t.cor AS tagCor,
                c.codCliente,
                cl.razaoSocial_NomeEmpresa AS clienteNome,
                c.codJornalista,
                j.nome AS jornalistaNome,
                c.dataHoraInicio,
                c.dataHoraFim,
                c.anotacoes,
                c.status
            FROM compromisso c
            LEFT JOIN tag t ON c.codTag = t.codigo
            LEFT JOIN cliente cl ON c.codCliente = cl.codigo
            LEFT JOIN jornalista j ON c.codJornalista = j.codigo
            WHERE c.codigo = ?`,
            [compromissoId]
        );

        const [clientesAssoc] = await db.query(
            `SELECT c.codigo, c.razaoSocial_NomeEmpresa
             FROM clientecompromisso cc
             JOIN cliente c ON cc.codCliente = c.codigo
             WHERE cc.codCompromisso = ?`,
            [compromissoId]
        );

        const [participantes] = await db.query(
            `SELECT f.codigo, f.nome, f.email
             FROM participantecompromisso pc
             JOIN funcionario f ON pc.codFuncionario = f.codigo
             WHERE pc.codCompromisso = ?`,
            [compromissoId]
        );

        return res.status(201).json({
            mensagem: "Compromisso cadastrado com sucesso!",
            compromisso: {
                ...novoCompromisso[0],
                clientes: clientesAssoc,
                participantesEquipe: participantes
            }
        });
    } catch (error) {
        console.error("Erro ao cadastrar compromisso:", error);
        return res.status(500).json({
            mensagem: "Erro ao cadastrar compromisso.",
            erro: error.message
        });
    }
};

// -=-=-=-=-=-=-= Função para atualizar compromisso -=-=-=-=-=-=-=

export const updateCompromisso = async (req, res) => {
    const codigo = validarCodigo(req.params.codigo);
    const {
        titulo,
        codTag,
        codCliente,
        codJornalista,
        dataHoraInicio,
        dataHoraFim,
        anotacoes,
        status,
        cliente,
        participantesEquipe
    } = req.body ?? {};

    if (!codigo) {
        return res.status(400).json({
            mensagem: "Informe um código válido para o compromisso."
        });
    }

    const camposEnviados = [titulo, codTag, codCliente, codJornalista, dataHoraInicio, dataHoraFim, anotacoes, status, cliente, participantesEquipe]
        .filter(v => v !== undefined);

    if (camposEnviados.length === 0) {
        return res.status(400).json({
            mensagem: "Informe ao menos um campo para atualizar."
        });
    }

    if (titulo !== undefined && !validarTexto(titulo)) {
        return res.status(400).json({
            mensagem: "Informe um título válido para o compromisso."
        });
    }

    if (codTag !== undefined && !validarCodigo(codTag)) {
        return res.status(400).json({
            mensagem: "Informe um código de tag válido."
        });
    }

    if (dataHoraInicio !== undefined && !validarDataHora(dataHoraInicio)) {
        return res.status(400).json({
            mensagem: "A data e hora de início não pode ser no passado."
        });
    }

    if (dataHoraFim !== undefined && !validarDataHora(dataHoraFim)) {
        return res.status(400).json({
            mensagem: "A data e hora de fim não pode ser no passado."
        });
    }

    if (dataHoraInicio !== undefined && dataHoraFim !== undefined && !validarIntervalo(dataHoraInicio, dataHoraFim)) {
        return res.status(400).json({
            mensagem: "A data e hora de fim deve ser posterior à data e hora de início."
        });
    }

    if (status !== undefined && !validarStatus(status)) {
        return res.status(400).json({
            mensagem: "Status inválido. Valores permitidos: Agendado, Pendente, Concluido, Cancelado."
        });
    }

    if (cliente !== undefined && !validarArrayCodigos(cliente)) {
        return res.status(400).json({
            mensagem: "Lista de clientes inválida."
        });
    }

    if (participantesEquipe !== undefined && !validarArrayCodigos(participantesEquipe)) {
        return res.status(400).json({
            mensagem: "Lista de participantes da equipe inválida."
        });
    }

    if (codCliente !== undefined && codCliente !== null && !validarCodigo(codCliente)) {
        return res.status(400).json({
            mensagem: "Informe um código de cliente válido."
        });
    }

    if (codJornalista !== undefined && codJornalista !== null && !validarCodigo(codJornalista)) {
        return res.status(400).json({
            mensagem: "Informe um código de jornalista válido."
        });
    }

    try {
        const [compromissoExistente] = await db.query("SELECT codigo FROM compromisso WHERE codigo = ?", [codigo]);
        if (compromissoExistente.length === 0) {
            return res.status(404).json({
                mensagem: "Compromisso não encontrado."
            });
        }

        if (codTag) {
            const [tagExiste] = await db.query("SELECT codigo FROM tag WHERE codigo = ?", [codTag]);
            if (tagExiste.length === 0) {
                return res.status(404).json({
                    mensagem: "Tag informada não existe."
                });
            }
        }

        if (codCliente) {
            const [clienteExiste] = await db.query("SELECT codigo FROM cliente WHERE codigo = ?", [codCliente]);
            if (clienteExiste.length === 0) {
                return res.status(404).json({
                    mensagem: "Cliente principal informado não existe."
                });
            }
        }

        if (codJornalista) {
            const [jornalistaExiste] = await db.query("SELECT codigo FROM jornalista WHERE codigo = ?", [codJornalista]);
            if (jornalistaExiste.length === 0) {
                return res.status(404).json({
                    mensagem: "Jornalista informado não existe."
                });
            }
        }

        if (cliente && cliente.length > 0) {
            const [clientesExistem] = await db.query(
                `SELECT codigo FROM cliente WHERE codigo IN (${cliente.map(() => '?').join(',')})`,
                cliente
            );
            if (clientesExistem.length !== cliente.length) {
                return res.status(404).json({
                    mensagem: "Um ou mais clientes adicionais não existem."
                });
            }
        }

        if (participantesEquipe && participantesEquipe.length > 0) {
            const [funcExistem] = await db.query(
                `SELECT codigo FROM funcionario WHERE codigo IN (${participantesEquipe.map(() => '?').join(',')})`,
                participantesEquipe
            );
            if (funcExistem.length !== participantesEquipe.length) {
                return res.status(404).json({
                    mensagem: "Um ou mais funcionários da equipe não existem."
                });
            }
        }

        const campos = [];
        const valores = [];

        if (titulo !== undefined) {
            campos.push("titulo = ?");
            valores.push(titulo.trim());
        }
        if (codTag !== undefined) {
            campos.push("codTag = ?");
            valores.push(codTag);
        }
        if (codCliente !== undefined) {
            campos.push("codCliente = ?");
            valores.push(codCliente || null);
        }
        if (codJornalista !== undefined) {
            campos.push("codJornalista = ?");
            valores.push(codJornalista || null);
        }
        if (dataHoraInicio !== undefined) {
            campos.push("dataHoraInicio = ?");
            valores.push(dataHoraInicio);
        }
        if (dataHoraFim !== undefined) {
            campos.push("dataHoraFim = ?");
            valores.push(dataHoraFim);
        }
        if (anotacoes !== undefined) {
            campos.push("anotacoes = ?");
            valores.push(anotacoes?.trim() ? anotacoes.trim() : null);
        }
        if (status !== undefined) {
            campos.push("status = ?");
            valores.push(status);
        }

        if (campos.length > 0) {
            valores.push(codigo);
            await db.query(
                `UPDATE compromisso SET ${campos.join(", ")} WHERE codigo = ?`,
                valores
            );
        }

        if (cliente !== undefined) {
            await db.query("DELETE FROM clientecompromisso WHERE codCompromisso = ?", [codigo]);
            
            const clienteUnicos = [...new Set(cliente.filter(c => c !== codCliente))];
            if (clienteUnicos.length > 0) {
                const values = clienteUnicos.map(cod => [codigo, cod]);
                await db.query(
                    `INSERT INTO clientecompromisso (codCompromisso, codCliente) VALUES ?`,
                    [values]
                );
            }
        }

        if (participantesEquipe !== undefined) {
            await db.query("DELETE FROM participantecompromisso WHERE codCompromisso = ?", [codigo]);
            
            if (participantesEquipe.length > 0) {
                const values = participantesEquipe.map(cod => [codigo, cod]);
                await db.query(
                    `INSERT INTO participantecompromisso (codCompromisso, codFuncionario) VALUES ?`,
                    [values]
                );
            }
        }

        return res.status(200).json({
            mensagem: "Compromisso atualizado com sucesso.",
            compromisso: { codigo }
        });
    } catch (error) {
        console.error("Erro ao atualizar compromisso:", error);
        return res.status(500).json({
            mensagem: "Erro ao atualizar compromisso.",
            erro: error.message
        });
    }
};

// -=-=-=-=-=-= Função para deletar compromisso -=-=-=-=-=-=

export const deleteCompromisso = async (req, res) => {
    const codigo = validarCodigo(req.params.codigo);

    if (!codigo) {
        return res.status(400).json({
            mensagem: "Informe um código válido para o compromisso."
        });
    }

    try {
        const [compromissoExistente] = await db.query("SELECT codigo FROM compromisso WHERE codigo = ?", [codigo]);
        if (compromissoExistente.length === 0) {
            return res.status(404).json({
                mensagem: "Compromisso não encontrado."
            });
        }

        await db.query("DELETE FROM clientecompromisso WHERE codCompromisso = ?", [codigo]);
        await db.query("DELETE FROM participantecompromisso WHERE codCompromisso = ?", [codigo]);
        await db.query("DELETE FROM compromisso WHERE codigo = ?", [codigo]);

        return res.status(200).json({
            mensagem: "Compromisso excluído com sucesso."
        });
    } catch (error) {
        if (error.code === "ER_ROW_IS_REFERENCED_2" || error.errno === 1451) {
            return res.status(409).json({
                mensagem: "Não é possível excluir este compromisso pois ele possui referências."
            });
        }
        console.error("Erro ao excluir compromisso:", error);
        return res.status(500).json({
            mensagem: "Erro ao excluir compromisso.",
            erro: error.message
        });
    }
};