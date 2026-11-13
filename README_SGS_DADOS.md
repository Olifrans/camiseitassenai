# 📊 Estrutura de Dados SGS: Turmas e Alunos

Este documento descreve a estrutura completa dos dados extraídos do sistema SGS (Core Business) e como essas informações são organizadas e expostas no frontend para facilitar a análise panorâmica e a tomada de decisões.

---

## 🗄️ 1. Estrutura Completa dos Dados (Fonte SGS)

Abaixo estão todos os campos disponíveis nas consultas originais do banco de dados, categorizados por entidade.

### 🏫 TURMAS (Campos da Consulta SGS)
* **Identificação**: Código (`CDG_TURM`), Curso (`NME_PROD`), Nome da Turma (`NME_TURM`), Nível (`NME_ELMT`), Carga Horária (`NRO_CRGA_MINI`).
* **Status e Organização**: Status da Turma (`STA_TURMA`), Turno (`CDG_TURN`), Docente Responsável.
* **Financeiro e Benefícios**: Valor (`VLR_PAGA`), Turma Gratuita (`IDR_BOLS_FIC_PRES`), Disponível no Site (`IDR_SITE`).
* **Datas e Horários**: 
  * Período de Inscrição (Início/Fim)
  * Período Previsto (Início/Fim)
  * Período Realizado (Início/Fim)
  * Horários de Aula (Início/Fim)
  * Dias da Semana (Segunda a Sábado)
* **Métricas de Acompanhamento**: 
  * Total de Matrículas Estimadas/Reais
  * Quantidade de Matrículas com Gratuidade
  * Quantidade de Concluintes
  * Quantidade de Evadidos
  * Quantidade de Não Certificados

### 🎓 ALUNOS (Campos da Consulta SGS)
* **Dados Pessoais**: Nome Completo, Sexo, Data de Nascimento, Idade, CPF, E-mail, Telefone (DDD + Número).
* **Endereço**: CEP, Bairro.
* **Dados da Matrícula**: Código da Matrícula (`CDG_MATR`), Status da Matrícula (`STA_MATR`), Data de Matrícula, Data de Conclusão, Data de Trancamento.
* **Vínculo com a Turma**: Código da Turma, Curso, Nível, Turno, Docente.
* **Situação Acadêmica**: Quantidade de Faltas (`QTD_FLTA`), Nota (`VLR_NOTA`), Status Ocupacional, Nome da Empresa.
* **Financeiro e Benefícios**: Valor Pago, Declaração de Renda/Bolsa de Estudos (`IDR_DECL_REND`), Turma Gratuita, Voucher de Marketing, CNPJ do Emissor do Voucher.

---

## 💻 2. Resumo da Implementação no Frontend (Visão Panorâmica)

Para garantir uma visualização limpa, organizada e de fácil compreensão, os dados foram consolidados nas seguintes colunas nas telas de "Base de Dados SGS".

### 📋 Visão de Turmas (9 Colunas)

| # | Coluna | Descrição dos Dados Exibidos |
|:--|:---|:---|
| 1 | **Código** | Identificador único da turma no SGS. |
| 2 | **Curso / Turma** | Nome do curso e identificação específica da turma. |
| 3 | **Nível** | Categoria do curso (Qualificação, Aperfeiçoamento, Iniciação, etc.). |
| 4 | **Carga Horária** | Total de horas do curso. |
| 5 | **Turno** | Período de realização (Manhã, Tarde, Noite, Integral, etc.). |
| 6 | **Docente** | Nome do professor/instrutor responsável. |
| 7 | **Período** | Datas de início e fim (priorizando as realizadas, ou previstas). |
| 8 | **Matrículas** | Total de alunos matriculados e quantidade de vagas de gratuidade. |
| 9 | **Status** | Indicador visual se a turma é **Paga** ou **Gratuita**. |

### 📋 Visão de Alunos (10 Colunas)

| # | Coluna | Descrição dos Dados Exibidos |
|:--|:---|:---|
| 1 | **Matrícula** | Número de identificação do aluno no SGS. |
| 2 | **Nome / Idade / Sexo** | Dados pessoais básicos consolidados em uma célula. |
| 3 | **CPF** | Documento formatado (XXX.XXX.XXX-XX). |
| 4 | **Situação** | Status atual (Matriculado, Evadido, Concluinte, Cancelado, etc.) com badge colorido. |
| 5 | **Gratuidade / Bolsa** | Indicadores visuais (badges) de posse de benefícios. |
| 6 | **Contato** | E-mail e telefone formatado. |
| 7 | **Endereço** | Bairro e CEP. |
| 8 | **Data Matrícula** | Data em que o vínculo foi iniciado. |
| 9 | **Data Conclusão** | Data de encerramento do curso (ou "-" se em andamento). |
| 10| **Ocupação / Empresa** | Situação profissional e nome da empresa (se aplicável). |

---

## 🎯 3. Benefícios desta Visualização

* ✅ **Separação Clara de Contextos**: Evita a sobrecarga de informação, permitindo que o gestor analise a saúde das turmas separadamente do perfil individual dos alunos.
* ✅ **Foco na Tomada de Decisão**: As métricas consolidadas (evadidos, concluintes, gratuidades) permitem identificar rapidamente turmas que precisam de intervenção pedagógica ou administrativa.
* ✅ **Performance**: A consolidação de campos relacionados (ex: Nome + Idade + Sexo) reduz a largura horizontal da tabela, melhorando a experiência do usuário (UX) em monitores padrão.
* ✅ **Rastreabilidade**: Mantém o vínculo direto com os identificadores originais do SGS (Código da Turma e Matrícula), facilitando auditorias e cruzamento de dados.

---
> *Documento gerado para fins de documentação técnica e alinhamento de regras de negócio do Sistema de Gestão de Camisetas SENAI.*