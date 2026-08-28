<div align="center">

# PROJETO INTEGRADOR WEB

### SATC · Engenharia de Software · 2026

**Sistema Web para Alfa Comunicação e Conteúdo**

<br>

[![Status](https://img.shields.io/badge/STATUS-EM%20DESENVOLVIMENTO-1f6f54?style=for-the-badge)]()
[![Projeto](https://img.shields.io/badge/PROJETO%20INTEGRADOR-SATC-164a3a?style=for-the-badge)]()
[![GitHub](https://img.shields.io/badge/VERSIONAMENTO-GITHUB-24292f?style=for-the-badge\&logo=github)]()

</div>

---

## Sobre o projeto

Este repositório contém o desenvolvimento do **Projeto Integrador de Sistemas Web** do curso de Engenharia de Software da SATC.

A aplicação está sendo desenvolvida para a **Alfa Comunicação e Conteúdo**, com base no levantamento dos processos realizados junto à empresa e nas necessidades identificadas durante a análise.

O objetivo é desenvolver uma solução que auxilie na **organização dos processos, centralização das informações e redução de atividades manuais e retrabalho**.

---

## Equipe

<table>
<tr>
<td align="center" width="33%">

### Yasmin Morais

Liderança,
Scrum,
QA

</td>

<td align="center" width="33%">

### Dyuli Antunes

Front-end

</td>

<td align="center" width="33%">

### Andrey Henrique

Back-end,
Banco de Dados

</td>
</tr>
</table>

---

## Arquitetura

A arquitetura do sistema será definida e documentada durante o desenvolvimento, contemplando a comunicação entre as camadas da aplicação, estrutura do banco de dados e organização dos serviços.

```text
┌───────────────────────────────────────────┐
│                  CLIENTE                  │
│                 Front-end                 │
└─────────────────────┬─────────────────────┘
                      │
                      ▼
┌───────────────────────────────────────────┐
│                 BACK-END                  │
│            Regras de negócio              │
│                   API                     │
└─────────────────────┬─────────────────────┘
                      │
                      ▼
┌───────────────────────────────────────────┐
│                BANCO DE DADOS             │
│          Persistência das informações     │
└───────────────────────────────────────────┘
```

---

## Tecnologias

| Camada         | Tecnologia   |
| :------------- | :----------- |
| Front-end      | `A definir`  |
| Back-end       | `A definir`  |
| Banco de dados | `A definir`  |
| Versionamento  | Git / GitHub |

---

## Desenvolvimento

O projeto utiliza **Git e GitHub** para controle de versão e colaboração entre os integrantes.

### Branches

As funcionalidades e correções devem ser desenvolvidas em branches próprias antes da integração com a branch principal.

```text
main
│
├── feature/nome-da-funcionalidade
├── feature/nova-tela
└── fix/correcao
```

### Commits

Os commits devem descrever de forma objetiva a alteração realizada.

```text
feat: adiciona tela de login
fix: corrige validação do formulário
docs: atualiza documentação
refactor: reorganiza estrutura da API
```

---

## Documentação

A documentação técnica do projeto será mantida junto ao desenvolvimento e deverá contemplar os principais aspectos da solução:

* Requisitos
* Regras de negócio
* Arquitetura
* Modelagem do banco de dados
* Entidades e relacionamentos
* Diagramas
* Decisões técnicas

---

<div align="center">

### PROJETO INTEGRADOR · SATC

**Engenharia de Software · 2026**

<br>

`Alfa Comunicação e Conteúdo`

</div>
