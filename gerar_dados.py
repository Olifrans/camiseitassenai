import csv
import random
import unicodedata
from datetime import datetime, timedelta

# ==============================================================================
# CONFIGURAÇÕES
# ==============================================================================
random.seed(2026)  # remova para dados diferentes a cada execução
DATA_REF = datetime(2026, 11, 13)  # data de referência para cálculo de idade

# Cursos REAIS no padrão SENAI: nome, sigla (usada no código da turma), nível, CH
CURSOS = [
    {"nome": "Excel Completo", "sigla": "EXCS", "nivel": "Aperfeiçoamento Profissional", "ch": 40},
    {"nome": "Microsoft Power BI", "sigla": "MPOWEB", "nivel": "Aperfeiçoamento Profissional", "ch": 60},
    {"nome": "Administração de Sistemas Servidores", "sigla": "ASRVNOW", "nivel": "Aperfeiçoamento Profissional", "ch": 80},
    {"nome": "Inteligências Artificiais Generativas", "sigla": "IAGGPT", "nivel": "Aperfeiçoamento Profissional", "ch": 40},
    {"nome": "Marketing Digital com Inteligência Artificial", "sigla": "MKTDGIA", "nivel": "Aperfeiçoamento Profissional", "ch": 60},
    {"nome": "Implantação de Serviços de Inteligência Artificial", "sigla": "AI900", "nivel": "Aperfeiçoamento Profissional", "ch": 100},
    {"nome": "Informática Básica", "sigla": "IFBT", "nivel": "Iniciação Profissional", "ch": 40},
    {"nome": "Programação Python para Automação", "sigla": "PYTHA", "nivel": "Qualificação Profissional", "ch": 120},
    {"nome": "Enfermagem", "sigla": "ENF", "nivel": "Especialização Profissional", "ch": 160},
    {"nome": "Mecânica Industrial", "sigla": "MEC", "nivel": "Qualificação Profissional", "ch": 200},
    {"nome": "Eletrotécnica", "sigla": "ELET", "nivel": "Qualificação Profissional", "ch": 400},
    {"nome": "Desenvolvimento de Sistemas", "sigla": "DEV", "nivel": "Especialização Profissional", "ch": 400},
    {"nome": "Administração", "sigla": "ADM", "nivel": "Iniciação Profissional", "ch": 120},
    {"nome": "Logística", "sigla": "LOG", "nivel": "Aperfeiçoamento Profissional", "ch": 200},
]

UNIDADES = ["LACYT", "BSS", "BSN", "PIAGT", "ECT", "EBIS"]  # códigos de unidade (como no print)
turnos = ["Manhã", "Tarde", "Noite", "Integral"]
HORARIOS = {
    "Manhã": ("07:30:00", "11:30:00"),
    "Tarde": ("13:00:00", "17:00:00"),
    "Noite": ("18:00:00", "22:00:00"),
    "Integral": ("07:30:00", "17:00:00"),
}
docentes = ["EROS RODRIGUES MARTINS", "ANA PAULA FERREIRA", "MARIA HELENA SOUZA", "JULIANA COSTA", "CARLOS EDUARDO LIMA"]
bairros = ["Centro", "Jardim América", "Vila Industrial", "Bairro Novo", "Jardim Paulista", "Centro Histórico", "Vila Esperança"]
empresas = ["Empresa ABC Ltda", "Corporação XYZ", "Indústria 123 S.A.", "Comércio Silva ME", "Tech Solutions", "Metalúrgica Forte"]

status_turma_codigos = {1: "Matrícula definitiva", 3: "Criação", 5: "Concluída", 19: "Matrícula provisória", 40: "Iniciada"}

# ✅ Status do aluno coerente com o status da turma (pesos)
STATUS_ALUNO_POR_TURMA = {
    1:  {"Matriculado": 45, "Inscrito": 15, "Concluinte": 20, "Certificado": 5,  "Evadido": 10, "Cancelado": 5},
    3:  {"Inscrito": 40, "Matriculado": 40, "Cancelado": 10, "Evadido": 5,  "Concluinte": 5},
    5:  {"Certificado": 45, "Concluinte": 25, "Evadido": 15, "Cancelado": 10, "Matriculado": 5},
    19: {"Matriculado": 40, "Inscrito": 20, "Concluinte": 20, "Evadido": 10, "Cancelado": 10},
    40: {"Matriculado": 45, "Concluinte": 20, "Evadido": 15, "Cancelado": 10, "Inscrito": 10},
}

# ✅ Pools grandes (50x60 + sobrenome duplo = milhares de combinações únicas)
NOMES_M = ["João", "Pedro", "Lucas", "Marcos", "Rafael", "Bruno", "Gabriel", "Thiago", "Felipe", "Gustavo",
           "Carlos", "André", "Fernando", "Rodrigo", "Diego", "Vinícius", "Matheus", "Leandro", "Ricardo", "Eduardo",
           "Roberto", "Sérgio", "Alexandre", "Douglas", "Everton", "Fabiano", "Henrique", "Igor", "Jonathan", "Leonardo",
           "Marcelo", "Nelson", "Otávio", "Paulo", "Renato", "Samuel", "Tiago", "Victor", "William", "Yuri",
           "Adriano", "Alan", "Bernardo", "Caio", "Daniel", "Davi", "Fábio", "Guilherme", "Heitor", "Jorge"]
NOMES_F = ["Maria", "Ana", "Juliana", "Camila", "Patrícia", "Larissa", "Mariana", "Amanda", "Beatriz", "Fernanda",
           "Gabriela", "Luana", "Paula", "Renata", "Sofia", "Letícia", "Bianca", "Carolina", "Daniela", "Eduarda",
           "Fabiana", "Giovana", "Helena", "Isabela", "Joana", "Kelly", "Laura", "Melissa", "Natália", "Olívia",
           "Priscila", "Rafaela", "Sabrina", "Tatiana", "Vanessa", "Adriana", "Aline", "Bárbara", "Cláudia", "Débora",
           "Elaine", "Fabiola", "Gisele", "Heloísa", "Ingrid", "Josefa", "Karina", "Lúcia", "Michele", "Nara"]
SOBRENOMES = ["Silva", "Oliveira", "Santos", "Souza", "Pereira", "Costa", "Rodrigues", "Alves", "Martins", "Gomes",
              "Ribeiro", "Nascimento", "Araújo", "Mendes", "Fernandes", "Carvalho", "Xavier", "Lima", "Freitas", "Barbosa",
              "Rocha", "Dias", "Nunes", "Teixeira", "Moreira", "Correia", "Cavalcanti", "Pinto", "Melo", "Cardoso",
              "Vieira", "Campos", "Azevedo", "Monteiro", "Farias", "Guimarães", "Moraes", "Reis", "Antunes", "Ferreira",
              "Machado", "Braga", "Duarte", "Siqueira", "Tavares", "Vasconcelos", "Pacheco", "Andrade", "Barros", "Coelho",
              "Cunha", "Fonseca", "Franco", "Klein", "Lopes", "Marques", "Neves", "Ramos", "Sales", "Tolentino"]

# ==============================================================================
# FUNÇÕES AUXILIARES
# ==============================================================================
def fmt(d):
    return d.strftime("%d/%m/%Y")

def gerar_cpf():
    cpf = [random.randint(0, 9) for _ in range(9)]
    soma1 = sum(cpf[i] * (10 - i) for i in range(9))
    r1 = soma1 % 11
    cpf.append(0 if r1 < 2 else 11 - r1)
    soma2 = sum(cpf[i] * (11 - i) for i in range(10))
    r2 = soma2 % 11
    cpf.append(0 if r2 < 2 else 11 - r2)
    return f"{cpf[0]}{cpf[1]}{cpf[2]}.{cpf[3]}{cpf[4]}{cpf[5]}.{cpf[6]}{cpf[7]}{cpf[8]}-{cpf[9]}{cpf[10]}"

def gerar_telefone():
    return f"(11) 9{random.randint(1000, 9999)}-{random.randint(1000, 9999)}"

def slug(texto):
    """Remove acentos e espaços para e-mail: 'Ana Araújo' -> 'ana.araujo'"""
    t = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode()
    return t.lower().replace(" ", ".")

NOMES_USADOS = set()
def gerar_nome_unico():
    """Retorna (nome, sexo) SEM repetição e com sexo coerente com o nome."""
    for _ in range(200):
        sexo = random.choice(["M", "F"])
        primeiro = random.choice(NOMES_M if sexo == "M" else NOMES_F)
        sobrenome = (f"{random.choice(SOBRENOMES)} {random.choice(SOBRENOMES)}"
                     if random.random() < 0.35 else random.choice(SOBRENOMES))
        nome = f"{primeiro} {sobrenome}"
        if nome not in NOMES_USADOS:
            NOMES_USADOS.add(nome)
            return nome, sexo
    # fallback (improvável): acrescenta sobrenome extra
    sexo = random.choice(["M", "F"])
    primeiro = random.choice(NOMES_M if sexo == "M" else NOMES_F)
    nome = f"{primeiro} {' '.join(random.sample(SOBRENOMES, 3))}"
    NOMES_USADOS.add(nome)
    return nome, sexo

def gerar_datas_turma(ch):
    """Datas coerentes: cursos curtos (CH<=100) duram ~1-2 meses; técnicos, meses."""
    ini_prev = datetime(2026, 1, 1) + timedelta(days=random.randint(0, 320))
    if ch <= 100:
        dur = random.randint(25, 75)
    elif ch <= 200:
        dur = random.randint(90, 200)
    else:
        dur = random.randint(240, 420)
    fim_prev = ini_prev + timedelta(days=dur)
    ini_real = ini_prev + timedelta(days=random.randint(-3, 10))
    fim_real = fim_prev + timedelta(days=random.randint(-10, 15))
    ini_insc = ini_prev - timedelta(days=random.randint(20, 45))
    fim_insc = ini_prev - timedelta(days=random.randint(3, 15))
    return ini_prev, fim_prev, ini_real, fim_real, ini_insc, fim_insc

# ==============================================================================
# 1. GERAR TURMAS (100 registros) — código no padrão real: SIGLA+UNIDADE+SEQ/26
# ==============================================================================
print("📋 Gerando turmas...")
turmas = []
codigos_usados = set()

for i in range(1, 101):
    curso = random.choice(CURSOS)
    while True:
        unidade = random.choice(UNIDADES) if random.random() > 0.35 else ""
        cod = f"{curso['sigla']}{unidade}{random.randint(1, 99):02d}/26"
        if cod not in codigos_usados:
            codigos_usados.add(cod)
            break

    codigo_status = random.choice(list(status_turma_codigos.keys()))
    gratuita = random.random() < 0.35
    turno = random.choice(turnos)
    ini_prev, fim_prev, ini_real, fim_real, ini_insc, fim_insc = gerar_datas_turma(curso["ch"])

    dias = [random.random() > 0.55 for _ in range(5)]
    if not any(dias):
        dias[random.randrange(5)] = True

    turmas.append({
        "CDG_TURM": f"TURMA-{i:03d}-2024",
        "CDG_ESCO": "124",
        "NIVEL": curso["nivel"],
        "CH": str(curso["ch"]),
        "CURSO": curso["nome"],
        "TURMA": cod,
        "STA_TURM": str(codigo_status),
        "STA_TURMA": status_turma_codigos[codigo_status],
        "TURMA_GRATUITA": "Sim" if gratuita else "Não",
        "VALOR": "0,00" if gratuita else f"{random.randint(500, 2000)},00",
        "DIA_SEMANA": "Semana",
        "TURNO": turno,
        "HRA_INIC": HORARIOS[turno][0],
        "HRA_FIM": HORARIOS[turno][1],
        "site": random.choice(["Sim", "Não"]),
        "NRO_MATR_ESTM": str(random.randint(20, 40)),
        "QTD_MATR_TOTAL": "0",
        "QTD_MATR_GRATUIDADE": "0",
        "QTD_N_CERTIFICADOS": "0",
        "QTD_CONCLUINTES": "0",
        "QTD_EVADIDOS": "0",
        "DTA_INIC_INSC": fmt(ini_insc),
        "DTA_FIM_INSC": fmt(fim_insc),
        "DTA_INIC_PREVISTO": fmt(ini_prev),
        "DTA_FIM_PREVISTO": fmt(fim_prev),
        "DTA_INIC_RELZ": fmt(ini_real),
        "DTA_FIM_RELZ": fmt(fim_real),
        "SEG": "X" if dias[0] else "",
        "TER": "X" if dias[1] else "",
        "QUA": "X" if dias[2] else "",
        "QUI": "X" if dias[3] else "",
        "SEX": "X" if dias[4] else "",
        "SAB": "",
        "DOCENTE": random.choice(docentes),
        # metadados internos (não vão para o CSV)
        "_cod_status": codigo_status, "_ini_insc": ini_insc, "_fim_insc": fim_insc,
        "_ini_real": ini_real, "_fim_real": fim_real,
    })

# ==============================================================================
# 2. GERAR ALUNOS — nomes ÚNICOS, sexo coerente, datas dentro do período
# ==============================================================================
print("👥 Gerando alunos...")
alunos = []
matricula_base = 26000000

for turma in turmas:
    qtd_alunos_turma = random.randint(12, 30)
    janela_insc = max(1, (turma["_fim_insc"] - turma["_ini_insc"]).days)
    janela_curso = max(1, (turma["_fim_real"] - turma["_ini_real"]).days)

    for _ in range(qtd_alunos_turma):
        nome, sexo = gerar_nome_unico()
        status = random.choices(
            list(STATUS_ALUNO_POR_TURMA[turma["_cod_status"]].keys()),
            weights=list(STATUS_ALUNO_POR_TURMA[turma["_cod_status"]].values())
        )[0]

        dta_nasc = datetime(1980, 1, 1) + timedelta(days=random.randint(0, 10500))
        idade = (DATA_REF - dta_nasc).days // 365
        dta_matr = turma["_ini_insc"] + timedelta(days=random.randint(0, janela_insc))

        if status in ("Certificado", "Concluinte"):
            dta_conc = turma["_fim_real"] + timedelta(days=random.randint(-10, 30))
        else:
            dta_conc = turma["_fim_real"] + timedelta(days=random.randint(60, 400))

        dta_trnc = (turma["_ini_real"] + timedelta(days=random.randint(0, janela_curso))
                    if status in ("Evadido", "Cancelado") else "")

        alunos.append({
            "CDG_TURM": turma["CDG_TURM"],
            "MATRICULA": str(matricula_base),
            "CPF": gerar_cpf(),
            "CDG_ESCO": "124",
            "NIVEL": turma["NIVEL"],
            "CH": turma["CH"],
            "CURSO": turma["CURSO"],
            "TURMA": turma["TURMA"],
            "STA_TURM": turma["STA_TURM"],
            "STA_TURMA": turma["STA_TURMA"],
            "VALOR": turma["VALOR"],
            "TURNO": turma["TURNO"],
            "DOCENTE": turma["DOCENTE"],
            "DTA_MATR": fmt(dta_matr),
            "DTA_INIC_PREVISTO": turma["DTA_INIC_PREVISTO"],
            "DTA_FIM_PREVISTO": turma["DTA_FIM_PREVISTO"],
            "DTA_INIC_RELZ": turma["DTA_INIC_RELZ"],
            "DTA_FIM_RELZ": turma["DTA_FIM_RELZ"],
            "DTA_CONC_CURS": fmt(dta_conc),
            "DTA_TRNC": fmt(dta_trnc) if dta_trnc else "",
            "QTD_FLTA": str(random.randint(0, 10)),
            "VLR_NOTA": f"{random.uniform(6.0, 10.0):.1f}",
            "STATUS": status,
            "TURMA_GRATUITA": turma["TURMA_GRATUITA"],
            "BOLSA_ESTUDOS": "Sim" if turma["TURMA_GRATUITA"] == "Sim" and random.random() > 0.4 else "Não",
            "NOME": nome,
            "SEXO": sexo,
            "EMAIL": f"{slug(nome)}{matricula_base}@email.com",
            "TELEFONE": gerar_telefone(),
            "DTA_NASC": fmt(dta_nasc),
            "IDADE": str(idade),
            "CEP": f"{random.randint(10000, 99999)}-{random.randint(100, 999)}",
            "BAIRRO": random.choice(bairros),
            "ESTRANGEIRO": "Não",
            "SITUACAO_OCUP": random.choice(["Empregado", "Desempregado", "Estudante"]),
            "EMPRESA": random.choice(empresas),
            "VOUCHER": "",
            "CNPJ_EMISSOR_VOUCHER": ""
        })
        matricula_base += 1

# ==============================================================================
# 3. ATUALIZAR CONTADORES DA TURMA COM DADOS REAIS DOS ALUNOS
# ==============================================================================
for turma in turmas:
    mats = [a for a in alunos if a["CDG_TURM"] == turma["CDG_TURM"]]
    turma["QTD_MATR_TOTAL"] = str(len(mats))
    turma["QTD_MATR_GRATUIDADE"] = str(sum(1 for a in mats if a["BOLSA_ESTUDOS"] == "Sim"))
    turma["QTD_N_CERTIFICADOS"] = str(sum(1 for a in mats if a["STATUS"] == "Certificado"))
    turma["QTD_CONCLUINTES"] = str(sum(1 for a in mats if a["STATUS"] == "Concluinte"))
    turma["QTD_EVADIDOS"] = str(sum(1 for a in mats if a["STATUS"] == "Evadido"))

# ==============================================================================
# 4. EXPORTAR CSVs
# ==============================================================================
TURMA_FIELDS = [k for k in turmas[0].keys() if not k.startswith("_")]
with open("turmas_carga.csv", "w", encoding="utf-8", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=TURMA_FIELDS, delimiter=";", extrasaction="ignore")
    writer.writeheader()
    writer.writerows(turmas)

with open("alunos_carga.csv", "w", encoding="utf-8", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=alunos[0].keys(), delimiter=";")
    writer.writeheader()
    writer.writerows(alunos)

print(f"✅ Sucesso! Arquivos gerados:")
print(f"   - turmas_carga.csv ({len(turmas)} registros) — ex.: {turmas[0]['TURMA']} | {turmas[0]['CURSO']}")
print(f"   - alunos_carga.csv ({len(alunos)} registros) — {len(NOMES_USADOS)} nomes únicos")
print("\n💡 Importe na tela 'Sincronização SGS' (Plano B).")