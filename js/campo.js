// =====================================================================
// VARIÁVEIS GLOBAIS
// =====================================================================
let alunoSelecionado = null;
let tamanhoSelecionado = null;
let estoqueAtual = {};
let html5QrCode = null;
let isScanning = false;
let distribuicoesPendentes = [];
let contextoPendente = null;
let isSubmittingPendente = false;
let signaturePad = null;
let distribuicaoPendenteAssinatura = null;

// =====================================================================
// INICIALIZAÇÃO
// =====================================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Modo Campo inicializado');
    carregarEstoque();
    setupBusca();
    setupScanner();
    carregarDistribuicoesPendentes();
    atualizarStatusConexao();

    // Fechamento por ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const assinatura = document.getElementById('modal-assinatura');
            const escolha = document.getElementById('modal-escolher-tamanho');
            const pendentes = document.getElementById('modal-pendentes');
            const jaRecebeu = document.getElementById('modal-ja-recebeu');
            const confirmacao = document.getElementById('confirmacao-area');

            if (assinatura && assinatura.style.display === 'flex') cancelarAssinatura();
            else if (escolha && escolha.style.display === 'flex') fecharEscolhaTamanho();
            else if (pendentes && pendentes.style.display === 'flex') fecharModalPendentes();
            else if (jaRecebeu && jaRecebeu.style.display === 'flex') fecharModalJaRecebeu();
            else if (confirmacao && confirmacao.style.display === 'flex') cancelarDistribuicao();
        }
    });

    // Fechamento ao clicar fora (no overlay)
    document.addEventListener('click', (e) => {
        if (e.target.id === 'modal-assinatura') cancelarAssinatura();
        else if (e.target.id === 'modal-escolher-tamanho') fecharEscolhaTamanho();
        else if (e.target.id === 'modal-pendentes') fecharModalPendentes();
        else if (e.target.id === 'modal-ja-recebeu') fecharModalJaRecebeu();
        else if (e.target.id === 'confirmacao-area') cancelarDistribuicao();
    });
});

// =====================================================================
// GERENCIAMENTO OFFLINE E SINCRONIZAÇÃO
// =====================================================================
function atualizarStatusConexao() {
    const isOnline = navigator.onLine;
    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');
    const offlineBanner = document.getElementById('offline-banner');

    if (isOnline) {
        if (statusDot) statusDot.style.color = '#10b981';
        if (statusText) statusText.textContent = 'Online';
        if (offlineBanner) offlineBanner.style.display = 'none';
    } else {
        if (statusDot) statusDot.style.color = '#ef4444';
        if (statusText) statusText.textContent = 'Offline';
        if (offlineBanner) {
            offlineBanner.style.display = 'flex';
            atualizarContadorSync();
        }
    }
}

window.addEventListener('offline', () => {
    atualizarStatusConexao();
    showToast('⚠️ Você está offline. As distribuições serão salvas localmente.', 'warning');
});

window.addEventListener('online', () => {
    atualizarStatusConexao();
    showToast('✅ Conexão restabelecida! Sincronizando...', 'success');
    if (distribuicoesPendentes.length > 0) setTimeout(() => sincronizarPendentes(), 2000);
});

function salvarDistribuicaoLocal(dados) {
    const distribuicao = { idLocal: 'local_' + Date.now(), dataLocal: new Date().toISOString(), dados: dados };
    distribuicoesPendentes.push(distribuicao);
    localStorage.setItem('distribuicoesPendentes', JSON.stringify(distribuicoesPendentes));
    atualizarContadorSync();
}

function carregarDistribuicoesPendentes() {
    const salvas = localStorage.getItem('distribuicoesPendentes');
    if (salvas) {
        distribuicoesPendentes = JSON.parse(salvas);
        atualizarContadorSync();
    }
}

function atualizarContadorSync() {
    const countEl = document.getElementById('sync-count');
    if (countEl) countEl.textContent = distribuicoesPendentes.length;
}

async function sincronizarPendentes() {
    if (!navigator.onLine) return showToast('❌ Sem conexão com a internet', 'error');
    if (distribuicoesPendentes.length === 0) return showToast('✅ Não há distribuições pendentes', 'success');

    const btnSync = document.querySelector('.btn-sync-manual');
    if (btnSync) { btnSync.classList.add('sincronizando'); btnSync.disabled = true; }

    let sucessos = 0, falhas = 0;
    const pendentesParaRemover = [];

    for (const distribuicao of distribuicoesPendentes) {
        try {
            const { idLocal, dataLocal, ...dadosParaEnvio } = distribuicao;
            await api.post('/distribuicao', dadosParaEnvio);
            pendentesParaRemover.push(distribuicao.idLocal);
            sucessos++;
        } catch (error) {
            if (error.message && error.message.includes('já recebeu')) {
                pendentesParaRemover.push(distribuicao.idLocal);
                sucessos++;
            } else {
                console.error('❌ Erro ao sincronizar:', error);
                falhas++;
            }
        }
    }

    distribuicoesPendentes = distribuicoesPendentes.filter(d => !pendentesParaRemover.includes(d.idLocal));
    localStorage.setItem('distribuicoesPendentes', JSON.stringify(distribuicoesPendentes));
    atualizarContadorSync();

    if (btnSync) { btnSync.classList.remove('sincronizando'); btnSync.disabled = false; }
    if (sucessos > 0) showToast(`✅ ${sucessos} distribuição(ões) sincronizada(s)!`, 'success');
    if (falhas > 0) showToast(`⚠️ ${falhas} falha(s) na sincronização`, 'warning');
    carregarEstoque();
}

// =====================================================================
// CONTROLE DE ESTOQUE
// =====================================================================
async function carregarEstoque() {
    try {
        const response = await api.get('/estoque');
        estoqueAtual = {};
        response.forEach(item => {
            const tamanho = item.Tamanho || item.tamanho;
            const saldo = item.SaldoDisponivel || item.saldoDisponivel || item.saldo || 0;
            if (!tamanho) return;

            let tamanhoIdx;
            if (tamanho === '4' || tamanho === 'PP') tamanhoIdx = 0;
            else if (tamanho === 'P' || tamanho === '1') tamanhoIdx = 1;
            else if (tamanho === 'M' || tamanho === '2') tamanhoIdx = 2;
            else if (tamanho === 'G' || tamanho === '3') tamanhoIdx = 3;
            else if (tamanho === 'GG') tamanhoIdx = 4;
            else if (tamanho === '5' || tamanho === 'XGG' || tamanho === '6') tamanhoIdx = 5;
            else tamanhoIdx = 2;

            estoqueAtual[tamanhoIdx] = saldo;
        });
        atualizarIndicadoresEstoque();
    } catch (error) {
        console.error('Erro ao carregar estoque:', error);
        showToast('Erro ao carregar estoque', 'error');
    }
}

function atualizarIndicadoresEstoque() {
    for (let i = 0; i <= 5; i++) {
        const el = document.getElementById(`estoque-${i}`);
        const btn = document.querySelector(`[data-tamanho="${i}"]`);
        const qtd = estoqueAtual[i] || 0;
        if (el) el.textContent = `${qtd} disp.`;
        if (btn) btn.classList.toggle('sem-estoque', qtd === 0);
    }
}

// =====================================================================
// BUSCA E EXIBIÇÃO
// =====================================================================
function setupBusca() {
    const inputBusca = document.getElementById('busca-aluno');
    const btnLimpar = document.getElementById('btn-limpar-busca');
    let timeoutBusca;

    inputBusca.addEventListener('input', (e) => {
        const valor = e.target.value.trim();
        btnLimpar.style.display = valor ? 'block' : 'none';
        clearTimeout(timeoutBusca);
        if (valor.length < 2) {
            document.getElementById('resultados-busca').innerHTML = '';
            return;
        }
        timeoutBusca = setTimeout(() => buscarAlunos(valor), 300);
    });

    btnLimpar.addEventListener('click', () => {
        inputBusca.value = '';
        btnLimpar.style.display = 'none';
        document.getElementById('resultados-busca').innerHTML = '';
        inputBusca.focus();
    });
}

function extrairData(obj, palavrasChave) {
    for (let chave of palavrasChave) {
        if (obj[chave]) return obj[chave];
    }
    const chavesObjeto = Object.keys(obj);
    const chaveEncontrada = chavesObjeto.find(k => palavrasChave.some(p => k.toLowerCase().includes(p.toLowerCase())));
    return chaveEncontrada ? obj[chaveEncontrada] : '';
}

function formatarData(data) {
    if (!data) return '';
    if (typeof data === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(data)) return data;
    if (data instanceof Date && !isNaN(data.getTime())) return data.toLocaleDateString('pt-BR');
    try {
        const dataObj = new Date(data);
        return isNaN(dataObj.getTime()) ? '' : dataObj.toLocaleDateString('pt-BR');
    } catch (e) {
        return '';
    }
}

async function buscarAlunos(termo) {
    try {
        const response = await api.get(`/sincronizacao/alunos?busca=${encodeURIComponent(termo)}`);
        const container = document.getElementById('resultados-busca');
        const alunosData = Array.isArray(response) ? response : (response.data || []);

        if (!alunosData || alunosData.length === 0) {
            container.innerHTML = '<div class="resultado-item"><div class="resultado-nome">Nenhum aluno encontrado</div></div>';
            return;
        }

        const resultados = alunosData.slice(0, 10);
        const codigosTurma = [...new Set(resultados.map(a => a.codigoTurmaExterno || a.CodigoTurmaExterno).filter(Boolean))];

        let turmasMap = {};
        if (codigosTurma.length > 0) {
            try {
                const turmasPromises = codigosTurma.map(codigo => api.get(`/sincronizacao/turmas?busca=${encodeURIComponent(codigo)}`));
                const turmasResults = await Promise.all(turmasPromises);
                turmasResults.forEach(turmasArray => {
                    if (turmasArray && turmasArray.length > 0) {
                        const turma = turmasArray[0];
                        turmasMap[turma.codigoTurmaExterno || turma.CodigoTurmaExterno] = turma;
                    }
                });
            } catch (err) {
                console.warn('Erro ao buscar turmas:', err);
            }
        }

        container.innerHTML = '';
        for (const aluno of resultados) {
            const matricula = aluno.numeroMatricula || aluno.NumeroMatricula || '';
            const nome = aluno.nomeCompleto || aluno.NomeCompleto || '';
            const turma = aluno.codigoTurmaExterno || aluno.CodigoTurmaExterno || '';
            const statusAluno = aluno.statusMatricula || aluno.StatusMatricula || '';
            const cpf = aluno.cpf || aluno.Cpf || '';

            const dadosTurma = turmasMap[turma] || {};
            const nomeCurso = dadosTurma.nomeCurso || dadosTurma.NomeCurso || '';

            const dataInicioFmt = formatarData(extrairData(dadosTurma, ['inic', 'inicio']));
            const dataFimFmt = formatarData(extrairData(dadosTurma, ['fim']));
            const periodo = (dataInicioFmt && dataFimFmt) ? `${dataInicioFmt} a ${dataFimFmt}` : 'Não informado';

            const div = document.createElement('div');
            div.className = 'resultado-item-completo';
            div.innerHTML = `
                <div class="resultado-header">
                    <div class="resultado-nome">${nome}</div>
                    <div class="resultado-badges">
                        <span class="resultado-status status-${statusAluno.toLowerCase()}">${statusAluno}</span>
                    </div>
                </div>
                <div class="resultado-info-principal">
                    <div class="info-coluna">
                        <div class="info-item"><i class="fas fa-id-card"></i><span><strong>Matrícula:</strong> ${matricula}</span></div>
                        <div class="info-item"><i class="fas fa-user"></i><span><strong>CPF:</strong> ${cpf || 'Não informado'}</span></div>
                    </div>
                    <div class="info-coluna">
                        <div class="info-item"><i class="fas fa-chalkboard"></i><span><strong>Turma:</strong> ${turma}</span></div>
                        <div class="info-item"><i class="fas fa-graduation-cap"></i><span><strong>Curso:</strong> ${nomeCurso || 'Não informado'}</span></div>
                        <div class="info-item"><i class="fas fa-calendar-alt"></i><span><strong>Período:</strong> ${periodo}</span></div>
                    </div>
                </div>
            `;
            div.addEventListener('click', () => selecionarAluno(matricula, nome, turma, statusAluno, cpf));
            container.appendChild(div);
        }
    } catch (error) {
        console.error('Erro na busca:', error);
        if (error.message && (error.message.includes('fetch') || error.message.includes('network'))) {
            showToast('❌ Sem conexão com o servidor. Verifique sua internet.', 'error');
        } else {
            showToast('Erro ao buscar alunos', 'error');
        }
    }
}

// =====================================================================
// SELEÇÃO E AÇÕES
// =====================================================================
function selecionarAluno(matricula, nome, turma, status, cpf = '') {
    alunoSelecionado = { matricula, nome, turma, status, cpf };
    document.getElementById('aluno-nome').textContent = nome;
    document.getElementById('aluno-matricula').textContent = matricula;
    document.getElementById('aluno-turma').textContent = turma;
    document.getElementById('aluno-curso').textContent = status;

    document.getElementById('aluno-card').style.display = 'flex';
    document.getElementById('resultados-busca').innerHTML = '';
    document.getElementById('busca-aluno').value = '';
    document.getElementById('btn-limpar-busca').style.display = 'none';
    document.querySelector('.tamanhos-container').scrollIntoView({ behavior: 'smooth', block: 'center' });
    showToast(`Aluno ${nome} selecionado!`, 'success');
}

function voltarBusca() {
    alunoSelecionado = null;
    tamanhoSelecionado = null;
    document.getElementById('aluno-card').style.display = 'none';
    document.getElementById('confirmacao-area').style.display = 'none';
    document.querySelectorAll('.btn-tamanho').forEach(btn => btn.classList.remove('selecionado'));
    document.getElementById('busca-aluno').focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function selecionarTamanho(tamanho) {
    if (!alunoSelecionado) return showToast('Busque e selecione um aluno primeiro!', 'error');
    const qtd = estoqueAtual[tamanho] || 0;
    if (qtd === 0) return showToast('Sem estoque deste tamanho', 'error');

    tamanhoSelecionado = tamanho;
    document.querySelectorAll('.btn-tamanho').forEach(btn => btn.classList.remove('selecionado'));
    const btnSelecionado = document.querySelector(`[data-tamanho="${tamanho}"]`);
    if (btnSelecionado) btnSelecionado.classList.add('selecionado');

    const nomesTamanho = ['PP', 'P', 'M', 'G', 'GG', 'XGG'];
    document.getElementById('conf-aluno').textContent = alunoSelecionado.nome;
    document.getElementById('conf-tamanho').textContent = nomesTamanho[tamanho];
    document.getElementById('confirmacao-area').style.display = 'flex';
}

function cancelarDistribuicao() {
    tamanhoSelecionado = null;
    document.getElementById('confirmacao-area').style.display = 'none';
    document.querySelectorAll('.btn-tamanho').forEach(btn => btn.classList.remove('selecionado'));
}

// =====================================================================
// MODAL "JÁ RECEBEU"
// =====================================================================
async function mostrarModalJaRecebeu(aluno, codigoTurma) {
    try {
        const response = await api.get(`/distribuicao/historico?matricula=${aluno.matricula}&turma=${codigoTurma}`);
        let dataRecebimento = 'Não disponível';
        let tamanhoRecebido = 'Desconhecido';

        if (response && response.length > 0) {
            const registro = response[0];
            const dataRaw = registro.dataDistribuicao || registro.DataDistribuicao;
            if (dataRaw) {
                const data = new Date(dataRaw);
                if (!isNaN(data.getTime())) {
                    dataRecebimento = data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
                }
            }
            const tamanhoRaw = registro.tamanho !== undefined ? registro.tamanho : registro.Tamanho;
            if (tamanhoRaw !== undefined && tamanhoRaw !== null) {
                const tamanhoNum = parseInt(tamanhoRaw);
                if (!isNaN(tamanhoNum) && tamanhoNum >= 0 && tamanhoNum <= 5) {
                    tamanhoRecebido = getNomeTamanho(tamanhoNum);
                }
            }
        }

        document.getElementById('alerta-nome').textContent = aluno.nomeCompleto || aluno.nome || '-';
        document.getElementById('alerta-cpf').textContent = aluno.cpf || aluno.Cpf || 'Não informado';
        document.getElementById('alerta-matricula').textContent = aluno.matricula || '-';
        document.getElementById('alerta-turma').textContent = codigoTurma || '-';
        document.getElementById('alerta-data').textContent = dataRecebimento;
        document.getElementById('alerta-tamanho-texto').textContent = `Recebeu uma Camiseta Tamanho "${tamanhoRecebido}"`;
        document.getElementById('modal-ja-recebeu').style.display = 'flex';
    } catch (error) {
        console.error('❌ Erro ao buscar histórico:', error);
        showToast('Erro ao buscar histórico de distribuição', 'error');
    }
}

function getNomeTamanho(indice) {
    const nomesTamanho = ['PP', 'P', 'M', 'G', 'GG', 'XGG'];
    return nomesTamanho[indice] || 'Desconhecido';
}

function fecharModalJaRecebeu() {
    const modal = document.getElementById('modal-ja-recebeu');
    if (modal) modal.style.display = 'none';
    voltarBusca();
}

// =====================================================================
// CONFIRMAR DISTRIBUIÇÃO (abre assinatura)
// =====================================================================
async function confirmarDistribuicao() {
    if (!alunoSelecionado || tamanhoSelecionado === null) {
        showToast('Dados incompletos', 'error');
        return;
    }

    const dadosDistribuicao = {
        matriculaAluno: alunoSelecionado.matricula,
        codigoTurma: alunoSelecionado.turma,
        tamanho: tamanhoSelecionado,
        quantidade: 1,
        anoReferencia: new Date().getFullYear(),
        semestreReferencia: new Date().getMonth() < 6 ? 1 : 2,
        responsavel: 'Modo Campo'
    };

    if (!navigator.onLine) {
        salvarDistribuicaoLocal(dadosDistribuicao);
        estoqueAtual[tamanhoSelecionado]--;
        atualizarIndicadoresEstoque();
        showToast('✅ Sem internet. Distribuição salva localmente!', 'warning');
        setTimeout(() => voltarBusca(), 1500);
        return;
    }

    document.getElementById('confirmacao-area').style.display = 'none';
    abrirModalAssinatura({ dados: dadosDistribuicao, nomeAluno: alunoSelecionado.nome });
}

function mostrarFeedbackSucesso() {
    const feedback = document.getElementById('feedback');
    feedback.style.display = 'flex';
    setTimeout(() => { feedback.style.display = 'none'; }, 1500);
}

function showToast(mensagem, tipo = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = mensagem;
    toast.className = `toast show ${tipo}`;
    setTimeout(() => { toast.classList.remove('show'); }, 3000);
}

// =====================================================================
// SCANNER DE QR CODE
// =====================================================================
function setupScanner() {
    const btnScan = document.getElementById('btn-scan');
    if (!btnScan) return;

    btnScan.addEventListener('click', () => {
        const leitorContainer = document.getElementById('leitor-qr');
        leitorContainer.style.display = 'block';
        leitorContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });

        if (!html5QrCode) html5QrCode = new Html5Qrcode("reader");

        const config = { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 };

        html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess, onScanFailure)
            .then(() => { isScanning = true; })
            .catch((err) => {
                console.error('❌ Erro ao iniciar câmera:', err);
                showToast('Erro ao acessar a câmera. Verifique as permissões.', 'error');
                pararScanner();
            });
    });
}

function onScanSuccess(decodedText) {
    if (!isScanning) return;
    const inputBusca = document.getElementById('busca-aluno');
    inputBusca.value = decodedText;
    pararScanner();
    showToast('Código lido! Buscando aluno...', 'success');
    buscarAlunos(decodedText);
}

function onScanFailure() { }

function pararScanner() {
    if (html5QrCode && isScanning) {
        html5QrCode.stop().then(() => {
            isScanning = false;
            document.getElementById('leitor-qr').style.display = 'none';
        }).catch((err) => console.error('Falha ao parar câmera:', err));
    } else {
        document.getElementById('leitor-qr').style.display = 'none';
    }
}

// =====================================================================
// RELATÓRIO DE PENDÊNCIAS E MINI-POPUP
// =====================================================================
async function abrirModalPendentes() {
    if (!alunoSelecionado || !alunoSelecionado.turma) {
        return showToast('Selecione um aluno primeiro', 'error');
    }

    const codigoTurma = alunoSelecionado.turma;
    const modal = document.getElementById('modal-pendentes');
    const lista = document.getElementById('lista-pendentes');
    const titulo = document.getElementById('pendentes-turma-nome');

    modal.style.display = 'flex';
    lista.innerHTML = '<p style="text-align:center;color:#9ca3af;padding:20px;"><i class="fas fa-spinner fa-spin"></i> Carregando...</p>';
    if (titulo) titulo.textContent = `Turma: ${codigoTurma}`;

    try {
        const response = await api.get(`/relatorios-sgs/pendentes?codigoTurma=${encodeURIComponent(codigoTurma)}`);
        const pendentes = Array.isArray(response) ? response : (response.data || []);

        if (pendentes.length === 0) {
            lista.innerHTML = '<p style="text-align:center;color:#10b981;padding:20px;"><i class="fas fa-check-circle"></i> Todos já receberam!</p>';
            return;
        }

        lista.innerHTML = '';
        pendentes.forEach(aluno => {
            const div = document.createElement('div');
            div.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:10px;border-bottom:1px solid #f3f4f6;';
            const nomeSeguro = (aluno.nomeCompleto || '').replace(/'/g, "\\'");
            div.innerHTML = `
                <div>
                    <div style="font-weight:600;color:#1a1a1a;">${aluno.nomeCompleto}</div>
                    <div style="font-size:0.8rem;color:#6b7280;">Matrícula: ${aluno.numeroMatricula}</div>
                </div>
                <button class="btn-confirmar" onclick="abrirEscolhaTamanho('${aluno.numeroMatricula}', '${nomeSeguro}', '${codigoTurma}')"
                    style="padding:8px 12px;font-size:0.85rem;border:none;border-radius:6px;background:#10b981;color:white;cursor:pointer;">
                    <i class="fas fa-check"></i> Entregue
                </button>`;
            lista.appendChild(div);
        });
    } catch (error) {
        lista.innerHTML = '<p style="text-align:center;color:#ef4444;padding:20px;">Erro ao carregar dados.</p>';
    }
}

function fecharModalPendentes() {
    const modal = document.getElementById('modal-pendentes');
    if (modal) modal.style.display = 'none';
}

function abrirEscolhaTamanho(matricula, nome, turma) {
    contextoPendente = { matricula, nome, turma };
    const label = document.getElementById('escolha-aluno-nome');
    if (label) label.textContent = `Aluno: ${nome} • Turma: ${turma}`;

    for (let i = 0; i <= 5; i++) {
        const el = document.getElementById(`mini-estoque-${i}`);
        const btn = document.querySelector(`.btn-tamanho-mini[data-tamanho="${i}"]`);
        const qtd = estoqueAtual[i] || 0;
        if (el) el.textContent = `${qtd} disp.`;
        if (btn) btn.classList.toggle('sem-estoque', qtd === 0);
    }
    document.getElementById('modal-escolher-tamanho').style.display = 'flex';
}

function fecharEscolhaTamanho() {
    const modal = document.getElementById('modal-escolher-tamanho');
    if (modal) modal.style.display = 'none';
    contextoPendente = null;
}

async function confirmarTamanho(tamanho) {
    if (!contextoPendente || isSubmittingPendente) return;
    if ((estoqueAtual[tamanho] || 0) === 0) {
        showToast('❌ Sem estoque neste tamanho', 'error');
        return;
    }

    const turmaAtual = contextoPendente.turma;
    const nomePendente = contextoPendente.nome;
    const matriculaPendente = contextoPendente.matricula;
    const nomesTamanho = ['PP', 'P', 'M', 'G', 'GG', 'XGG'];

    const dados = {
        matriculaAluno: matriculaPendente,
        codigoTurma: turmaAtual,
        tamanho: tamanho,
        quantidade: 1,
        anoReferencia: new Date().getFullYear(),
        semestreReferencia: new Date().getMonth() < 6 ? 1 : 2,
        responsavel: 'Modo Campo'
    };

    isSubmittingPendente = true;
    try {
        if (!navigator.onLine) {
            salvarDistribuicaoLocal(dados);
            estoqueAtual[tamanho]--;
            atualizarIndicadoresEstoque();
            showToast(`✅ ${nomesTamanho[tamanho]} salvo localmente para ${nomePendente}`, 'warning');
            fecharEscolhaTamanho();
            abrirModalPendentes();
        } else {
            await api.post('/distribuicao', dados);
            estoqueAtual[tamanho]--;
            atualizarIndicadoresEstoque();
            showToast(`✅ ${nomesTamanho[tamanho]} entregue para ${nomePendente}!`, 'success');
            fecharEscolhaTamanho();
            abrirModalPendentes();
        }
    } catch (error) {
        const msg = error.message || 'Erro';
        fecharEscolhaTamanho();

        if (msg.includes('já recebeu')) {
            // ✅ ABRE O MODAL VERMELHO COMPLETO
            await mostrarModalJaRecebeu(
                {
                    matricula: matriculaPendente,
                    nome: nomePendente,
                    cpf: ''
                },
                turmaAtual
            );
            // Recarrega pendentes em segundo plano
            abrirModalPendentes();
        } else if (msg.includes('fetch') || msg.includes('network') || msg.includes('Failed to fetch')) {
            salvarDistribuicaoLocal(dados);
            estoqueAtual[tamanho]--;
            atualizarIndicadoresEstoque();
            showToast('✅ Falha de rede. Salvo localmente.', 'warning');
            abrirModalPendentes();
        } else {
            showToast('Erro: ' + msg, 'error');
            abrirModalPendentes();
        }
    } finally {
        isSubmittingPendente = false;
    }
}

// =====================================================================
// ASSINATURA DIGITAL (VERSÃO ÚNICA E CORRETA)
// =====================================================================
function inicializarSignaturePad() {
    const canvas = document.getElementById('signature-canvas');
    if (!canvas) return;

    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext('2d').scale(ratio, ratio);

    signaturePad = new SignaturePad(canvas, {
        backgroundColor: 'rgba(255, 255, 255, 0)',
        penColor: 'rgb(0, 0, 0)',
        minWidth: 1,
        maxWidth: 2.5,
        throttle: 16
    });
}

function abrirModalAssinatura(payload) {
    // payload = { dados: {...}, nomeAluno: "..." }
    distribuicaoPendenteAssinatura = payload;

    const modal = document.getElementById('modal-assinatura');
    const info = document.getElementById('assinatura-info');
    const nomesTamanho = ['PP', 'P', 'M', 'G', 'GG', 'XGG'];

    if (info) {
        info.innerHTML = `Aluno: <strong>${payload.nomeAluno}</strong> | Tamanho: <strong>${nomesTamanho[payload.dados.tamanho]}</strong>`;
    }

    modal.style.display = 'flex';

    setTimeout(() => {
        inicializarSignaturePad();
    }, 100);
}

function limparAssinatura() {
    if (signaturePad) signaturePad.clear();
}

function cancelarAssinatura() {
    const modal = document.getElementById('modal-assinatura');
    if (modal) modal.style.display = 'none';
    distribuicaoPendenteAssinatura = null;
    if (signaturePad) signaturePad.clear();
}

async function confirmarAssinatura() {
    if (!signaturePad || signaturePad.isEmpty()) {
        showToast('⚠️ Por favor, assina antes de confirmar', 'warning');
        return;
    }
    if (!distribuicaoPendenteAssinatura) {
        showToast('❌ Dados da distribuição não encontrados', 'error');
        return;
    }

    const payload = distribuicaoPendenteAssinatura;
    const dadosBase = payload.dados;
    const nomeAluno = payload.nomeAluno;
    const tamanho = dadosBase.tamanho;

    const assinaturaBase64 = signaturePad.toDataURL('image/png');
    const dadosEnvio = {
        ...dadosBase,
        assinatura: assinaturaBase64,
        dataAssinatura: new Date().toISOString()
    };

    // Fecha o modal de assinatura imediatamente
    const modalAssinatura = document.getElementById('modal-assinatura');
    if (modalAssinatura) modalAssinatura.style.display = 'none';
    distribuicaoPendenteAssinatura = null;
    if (signaturePad) signaturePad.clear();

    try {
        await api.post('/distribuicao', dadosEnvio);

        // ✅ FEEDBACK DE SUCESSO
        estoqueAtual[tamanho]--;
        atualizarIndicadoresEstoque();
        mostrarFeedbackSucesso();
        setTimeout(() => voltarBusca(), 2000);

    } catch (error) {
        const msg = error.message || 'Erro desconhecido';

        if (msg.includes('já recebeu')) {
            // ✅ MODAL VERMELHO COMPLETO (não mais toast simples)
            await mostrarModalJaRecebeu(
                {
                    matricula: dadosBase.matriculaAluno,
                    nome: nomeAluno,
                    cpf: alunoSelecionado?.cpf || ''
                },
                dadosBase.codigoTurma
            );
        } else if (msg.includes('fetch') || msg.includes('network') || msg.includes('Failed to fetch')) {
            salvarDistribuicaoLocal(dadosEnvio);
            estoqueAtual[tamanho]--;
            atualizarIndicadoresEstoque();
            showToast('✅ Falha de rede. Salvo localmente com assinatura.', 'warning');
            setTimeout(() => voltarBusca(), 1500);
        } else {
            showToast('Erro: ' + msg, 'error');
            setTimeout(() => voltarBusca(), 1500);
        }
    }
}


// // =====================================================================
// // VARIÁVEIS GLOBAIS
// // =====================================================================
// let alunoSelecionado = null;
// let tamanhoSelecionado = null;
// let estoqueAtual = {};
// let html5QrCode = null;
// let isScanning = false;
// let distribuicoesPendentes = [];
// let contextoPendente = null;
// let isSubmittingPendente = false;

// // =====================================================================
// // INICIALIZAÇÃO
// // =====================================================================
// document.addEventListener('DOMContentLoaded', () => {
//     console.log('✅ Modo Campo inicializado');
//     carregarEstoque();
//     setupBusca();
//     setupScanner();
//     carregarDistribuicoesPendentes();
//     atualizarStatusConexao();

//     // Fechamento por ESC
//     document.addEventListener('keydown', (e) => {
//         if (e.key === 'Escape') {
//             const escolha = document.getElementById('modal-escolher-tamanho');
//             const pendentes = document.getElementById('modal-pendentes');
//             const jaRecebeu = document.getElementById('modal-ja-recebeu');
//             if (escolha && escolha.style.display === 'flex') fecharEscolhaTamanho();
//             else if (pendentes && pendentes.style.display === 'flex') fecharModalPendentes();
//             else if (jaRecebeu && jaRecebeu.style.display === 'flex') fecharModalJaRecebeu();
//         }
//     });

//     // Fechamento ao clicar fora (no overlay escuro)
//     document.addEventListener('click', (e) => {
//         if (e.target.id === 'modal-escolher-tamanho') fecharEscolhaTamanho();
//         else if (e.target.id === 'modal-pendentes') fecharModalPendentes();
//         else if (e.target.id === 'modal-ja-recebeu') fecharModalJaRecebeu();
//     });
// });

// // =====================================================================
// // GERENCIAMENTO OFFLINE E SINCRONIZAÇÃO
// // =====================================================================
// function atualizarStatusConexao() {
//     const isOnline = navigator.onLine;
//     const statusDot = document.getElementById('status-dot');
//     const statusText = document.getElementById('status-text');
//     const offlineBanner = document.getElementById('offline-banner');

//     if (isOnline) {
//         if (statusDot) statusDot.style.color = '#10b981';
//         if (statusText) statusText.textContent = 'Online';
//         if (offlineBanner) offlineBanner.style.display = 'none';
//     } else {
//         if (statusDot) statusDot.style.color = '#ef4444';
//         if (statusText) statusText.textContent = 'Offline';
//         if (offlineBanner) {
//             offlineBanner.style.display = 'flex';
//             atualizarContadorSync();
//         }
//     }
// }

// window.addEventListener('offline', () => {
//     atualizarStatusConexao();
//     showToast('⚠️ Você está offline. As distribuições serão salvas localmente.', 'warning');
// });

// window.addEventListener('online', () => {
//     atualizarStatusConexao();
//     showToast('✅ Conexão restabelecida! Sincronizando...', 'success');
//     if (distribuicoesPendentes.length > 0) setTimeout(() => sincronizarPendentes(), 2000);
// });

// function salvarDistribuicaoLocal(dados) {
//     const distribuicao = { idLocal: 'local_' + Date.now(), dataLocal: new Date().toISOString(), dados: dados };
//     distribuicoesPendentes.push(distribuicao);
//     localStorage.setItem('distribuicoesPendentes', JSON.stringify(distribuicoesPendentes));
//     atualizarContadorSync();
// }

// function carregarDistribuicoesPendentes() {
//     const salvas = localStorage.getItem('distribuicoesPendentes');
//     if (salvas) {
//         distribuicoesPendentes = JSON.parse(salvas);
//         atualizarContadorSync();
//     }
// }

// function atualizarContadorSync() {
//     const countEl = document.getElementById('sync-count');
//     if (countEl) countEl.textContent = distribuicoesPendentes.length;
// }

// async function sincronizarPendentes() {
//     if (!navigator.onLine) return showToast('❌ Sem conexão com a internet', 'error');
//     if (distribuicoesPendentes.length === 0) return showToast('✅ Não há distribuições pendentes', 'success');

//     const btnSync = document.querySelector('.btn-sync-manual');
//     if (btnSync) { btnSync.classList.add('sincronizando'); btnSync.disabled = true; }

//     let sucessos = 0, falhas = 0;
//     const pendentesParaRemover = [];

//     for (const distribuicao of distribuicoesPendentes) {
//         try {
//             const { idLocal, dataLocal, ...dadosParaEnvio } = distribuicao;
//             await api.post('/distribuicao', dadosParaEnvio);
//             pendentesParaRemover.push(distribuicao.idLocal);
//             sucessos++;
//         } catch (error) {
//             if (error.message && error.message.includes('já recebeu')) {
//                 pendentesParaRemover.push(distribuicao.idLocal);
//                 sucessos++;
//             } else {
//                 console.error('❌ Erro ao sincronizar:', error);
//                 falhas++;
//             }
//         }
//     }

//     distribuicoesPendentes = distribuicoesPendentes.filter(d => !pendentesParaRemover.includes(d.idLocal));
//     localStorage.setItem('distribuicoesPendentes', JSON.stringify(distribuicoesPendentes));
//     atualizarContadorSync();

//     if (btnSync) { btnSync.classList.remove('sincronizando'); btnSync.disabled = false; }
//     if (sucessos > 0) showToast(`✅ ${sucessos} distribuição(ões) sincronizada(s)!`, 'success');
//     if (falhas > 0) showToast(`⚠️ ${falhas} falha(s) na sincronização`, 'warning');
//     carregarEstoque();
// }

// // =====================================================================
// // CONTROLE DE ESTOQUE
// // =====================================================================
// async function carregarEstoque() {
//     try {
//         const response = await api.get('/estoque');
//         estoqueAtual = {};
//         response.forEach(item => {
//             const tamanho = item.Tamanho || item.tamanho;
//             const saldo = item.SaldoDisponivel || item.saldoDisponivel || item.saldo || 0;
//             if (!tamanho) return;

//             let tamanhoIdx;
//             if (tamanho === '4' || tamanho === 'PP') tamanhoIdx = 0;
//             else if (tamanho === 'P' || tamanho === '1') tamanhoIdx = 1;
//             else if (tamanho === 'M' || tamanho === '2') tamanhoIdx = 2;
//             else if (tamanho === 'G' || tamanho === '3') tamanhoIdx = 3;
//             else if (tamanho === 'GG') tamanhoIdx = 4;
//             else if (tamanho === '5' || tamanho === 'XGG' || tamanho === '6') tamanhoIdx = 5;
//             else tamanhoIdx = 2;

//             estoqueAtual[tamanhoIdx] = saldo;
//         });
//         atualizarIndicadoresEstoque();
//     } catch (error) {
//         console.error('Erro ao carregar estoque:', error);
//         showToast('Erro ao carregar estoque', 'error');
//     }
// }

// function atualizarIndicadoresEstoque() {
//     for (let i = 0; i <= 5; i++) {
//         const el = document.getElementById(`estoque-${i}`);
//         const btn = document.querySelector(`[data-tamanho="${i}"]`);
//         const qtd = estoqueAtual[i] || 0;
//         if (el) el.textContent = `${qtd} disp.`;
//         if (btn) btn.classList.toggle('sem-estoque', qtd === 0);
//     }
// }

// // =====================================================================
// // BUSCA E EXIBIÇÃO
// // =====================================================================
// function setupBusca() {
//     const inputBusca = document.getElementById('busca-aluno');
//     const btnLimpar = document.getElementById('btn-limpar-busca');
//     let timeoutBusca;

//     inputBusca.addEventListener('input', (e) => {
//         const valor = e.target.value.trim();
//         btnLimpar.style.display = valor ? 'block' : 'none';
//         clearTimeout(timeoutBusca);
//         if (valor.length < 2) {
//             document.getElementById('resultados-busca').innerHTML = '';
//             return;
//         }
//         timeoutBusca = setTimeout(() => buscarAlunos(valor), 300);
//     });

//     btnLimpar.addEventListener('click', () => {
//         inputBusca.value = '';
//         btnLimpar.style.display = 'none';
//         document.getElementById('resultados-busca').innerHTML = '';
//         inputBusca.focus();
//     });
// }

// function extrairData(obj, palavrasChave) {
//     for (let chave of palavrasChave) {
//         if (obj[chave]) return obj[chave];
//     }
//     const chavesObjeto = Object.keys(obj);
//     const chaveEncontrada = chavesObjeto.find(k => palavrasChave.some(p => k.toLowerCase().includes(p.toLowerCase())));
//     return chaveEncontrada ? obj[chaveEncontrada] : '';
// }

// function formatarData(data) {
//     if (!data) return '';
//     if (typeof data === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(data)) return data;
//     if (data instanceof Date && !isNaN(data.getTime())) return data.toLocaleDateString('pt-BR');
//     try {
//         const dataObj = new Date(data);
//         return isNaN(dataObj.getTime()) ? '' : dataObj.toLocaleDateString('pt-BR');
//     } catch (e) {
//         return '';
//     }
// }

// async function buscarAlunos(termo) {
//     try {
//         const response = await api.get(`/sincronizacao/alunos?busca=${encodeURIComponent(termo)}`);
//         const container = document.getElementById('resultados-busca');
//         const alunosData = Array.isArray(response) ? response : (response.data || []);

//         if (!alunosData || alunosData.length === 0) {
//             container.innerHTML = '<div class="resultado-item"><div class="resultado-nome">Nenhum aluno encontrado</div></div>';
//             return;
//         }

//         const resultados = alunosData.slice(0, 10);
//         const codigosTurma = [...new Set(resultados.map(a => a.codigoTurmaExterno || a.CodigoTurmaExterno).filter(Boolean))];

//         let turmasMap = {};
//         if (codigosTurma.length > 0) {
//             try {
//                 const turmasPromises = codigosTurma.map(codigo => api.get(`/sincronizacao/turmas?busca=${encodeURIComponent(codigo)}`));
//                 const turmasResults = await Promise.all(turmasPromises);
//                 turmasResults.forEach(turmasArray => {
//                     if (turmasArray && turmasArray.length > 0) {
//                         const turma = turmasArray[0];
//                         turmasMap[turma.codigoTurmaExterno || turma.CodigoTurmaExterno] = turma;
//                     }
//                 });
//             } catch (err) {
//                 console.warn('Erro ao buscar turmas:', err);
//             }
//         }

//         container.innerHTML = '';
//         for (const aluno of resultados) {
//             const matricula = aluno.numeroMatricula || aluno.NumeroMatricula || '';
//             const nome = aluno.nomeCompleto || aluno.NomeCompleto || '';
//             const turma = aluno.codigoTurmaExterno || aluno.CodigoTurmaExterno || '';
//             const statusAluno = aluno.statusMatricula || aluno.StatusMatricula || '';
//             const cpf = aluno.cpf || aluno.Cpf || '';

//             const dadosTurma = turmasMap[turma] || {};
//             const nomeCurso = dadosTurma.nomeCurso || dadosTurma.NomeCurso || '';

//             const dataInicioFmt = formatarData(extrairData(dadosTurma, ['inic', 'inicio']));
//             const dataFimFmt = formatarData(extrairData(dadosTurma, ['fim']));
//             const periodo = (dataInicioFmt && dataFimFmt) ? `${dataInicioFmt} a ${dataFimFmt}` : 'Não informado';

//             const div = document.createElement('div');
//             div.className = 'resultado-item-completo';
//             div.innerHTML = `
//                 <div class="resultado-header">
//                     <div class="resultado-nome">${nome}</div>
//                     <div class="resultado-badges">
//                         <span class="resultado-status status-${statusAluno.toLowerCase()}">${statusAluno}</span>
//                     </div>
//                 </div>
//                 <div class="resultado-info-principal">
//                     <div class="info-coluna">
//                         <div class="info-item"><i class="fas fa-id-card"></i><span><strong>Matrícula:</strong> ${matricula}</span></div>
//                         <div class="info-item"><i class="fas fa-user"></i><span><strong>CPF:</strong> ${cpf || 'Não informado'}</span></div>
//                     </div>
//                     <div class="info-coluna">
//                         <div class="info-item"><i class="fas fa-chalkboard"></i><span><strong>Turma:</strong> ${turma}</span></div>
//                         <div class="info-item"><i class="fas fa-graduation-cap"></i><span><strong>Curso:</strong> ${nomeCurso || 'Não informado'}</span></div>
//                         <div class="info-item"><i class="fas fa-calendar-alt"></i><span><strong>Período:</strong> ${periodo}</span></div>
//                     </div>
//                 </div>
//             `;
//             div.addEventListener('click', () => selecionarAluno(matricula, nome, turma, statusAluno, cpf));
//             container.appendChild(div);
//         }
//     } catch (error) {
//         console.error('Erro na busca:', error);
//         if (error.message && (error.message.includes('fetch') || error.message.includes('network'))) {
//             showToast('❌ Sem conexão com o servidor. Verifique sua internet.', 'error');
//         } else {
//             showToast('Erro ao buscar alunos', 'error');
//         }
//     }
// }

// // =====================================================================
// // SELEÇÃO E AÇÕES
// // =====================================================================
// function selecionarAluno(matricula, nome, turma, status, cpf = '') {
//     alunoSelecionado = { matricula, nome, turma, status, cpf };
//     document.getElementById('aluno-nome').textContent = nome;
//     document.getElementById('aluno-matricula').textContent = matricula;
//     document.getElementById('aluno-turma').textContent = turma;
//     document.getElementById('aluno-curso').textContent = status;

//     document.getElementById('aluno-card').style.display = 'flex';
//     document.getElementById('resultados-busca').innerHTML = '';
//     document.getElementById('busca-aluno').value = '';
//     document.getElementById('btn-limpar-busca').style.display = 'none';
//     document.querySelector('.tamanhos-container').scrollIntoView({ behavior: 'smooth', block: 'center' });
//     showToast(`Aluno ${nome} selecionado!`, 'success');
// }

// function voltarBusca() {
//     alunoSelecionado = null;
//     tamanhoSelecionado = null;
//     document.getElementById('aluno-card').style.display = 'none';
//     document.getElementById('confirmacao-area').style.display = 'none';
//     document.querySelectorAll('.btn-tamanho').forEach(btn => btn.classList.remove('selecionado'));
//     document.getElementById('busca-aluno').focus();
//     window.scrollTo({ top: 0, behavior: 'smooth' });
// }

// function selecionarTamanho(tamanho) {
//     if (!alunoSelecionado) return showToast('Busque e selecione um aluno primeiro!', 'error');
//     const qtd = estoqueAtual[tamanho] || 0;
//     if (qtd === 0) return showToast('Sem estoque deste tamanho', 'error');

//     tamanhoSelecionado = tamanho;
//     document.querySelectorAll('.btn-tamanho').forEach(btn => btn.classList.remove('selecionado'));
//     const btnSelecionado = document.querySelector(`[data-tamanho="${tamanho}"]`);
//     if (btnSelecionado) btnSelecionado.classList.add('selecionado');

//     const nomesTamanho = ['PP', 'P', 'M', 'G', 'GG', 'XGG'];
//     document.getElementById('conf-aluno').textContent = alunoSelecionado.nome;
//     document.getElementById('conf-tamanho').textContent = nomesTamanho[tamanho];
//     document.getElementById('confirmacao-area').style.display = 'flex';
// }

// function cancelarDistribuicao() {
//     tamanhoSelecionado = null;
//     document.getElementById('confirmacao-area').style.display = 'none';
//     document.querySelectorAll('.btn-tamanho').forEach(btn => btn.classList.remove('selecionado'));
// }

// // =====================================================================
// // DISTRIBUIÇÃO E MODAL "JÁ RECEBEU"
// // =====================================================================
// async function mostrarModalJaRecebeu(aluno, codigoTurma) {
//     try {
//         const response = await api.get(`/distribuicao/historico?matricula=${aluno.matricula}&turma=${codigoTurma}`);
//         let dataRecebimento = 'Não disponível';
//         let tamanhoRecebido = 'Desconhecido';

//         if (response && response.length > 0) {
//             const registro = response[0];
//             const dataRaw = registro.dataDistribuicao || registro.DataDistribuicao;
//             if (dataRaw) {
//                 const data = new Date(dataRaw);
//                 if (!isNaN(data.getTime())) {
//                     dataRecebimento = data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
//                 }
//             }
//             const tamanhoRaw = registro.tamanho !== undefined ? registro.tamanho : registro.Tamanho;
//             if (tamanhoRaw !== undefined && tamanhoRaw !== null) {
//                 const tamanhoNum = parseInt(tamanhoRaw);
//                 if (!isNaN(tamanhoNum) && tamanhoNum >= 0 && tamanhoNum <= 5) {
//                     tamanhoRecebido = getNomeTamanho(tamanhoNum);
//                 }
//             }
//         }

//         document.getElementById('alerta-nome').textContent = aluno.nomeCompleto || aluno.nome || '-';
//         document.getElementById('alerta-cpf').textContent = aluno.cpf || aluno.Cpf || 'Não informado';
//         document.getElementById('alerta-matricula').textContent = aluno.matricula || '-';
//         document.getElementById('alerta-turma').textContent = codigoTurma || '-';
//         document.getElementById('alerta-data').textContent = dataRecebimento;
//         document.getElementById('alerta-tamanho-texto').textContent = `Recebeu uma Camiseta Tamanho "${tamanhoRecebido}"`;
//         document.getElementById('modal-ja-recebeu').style.display = 'flex';
//     } catch (error) {
//         console.error('❌ Erro ao buscar histórico:', error);
//         showToast('Erro ao buscar histórico de distribuição', 'error');
//     }
// }

// function getNomeTamanho(indice) {
//     const nomesTamanho = ['PP', 'P', 'M', 'G', 'GG', 'XGG'];
//     return nomesTamanho[indice] || 'Desconhecido';
// }

// function fecharModalJaRecebeu() {
//     const modal = document.getElementById('modal-ja-recebeu');
//     if (modal) modal.style.display = 'none';
//     voltarBusca();
// }


// // async function confirmarDistribuicao() {
// //     if (!alunoSelecionado || tamanhoSelecionado === null) {
// //         showToast('Dados incompletos', 'error');
// //         return;
// //     }

// //     const dadosDistribuicao = {
// //         matriculaAluno: alunoSelecionado.matricula,
// //         codigoTurma: alunoSelecionado.turma,
// //         tamanho: tamanhoSelecionado,
// //         quantidade: 1,
// //         anoReferencia: new Date().getFullYear(),
// //         semestreReferencia: new Date().getMonth() < 6 ? 1 : 2,
// //         responsavel: 'Modo Campo',
// //         nomeAluno: alunoSelecionado.nome // ✅ Adicionado para o modal
// //     };

// //     if (!navigator.onLine) {
// //         salvarDistribuicaoLocal(dadosDistribuicao);
// //         estoqueAtual[tamanhoSelecionado]--;
// //         atualizarIndicadoresEstoque();
// //         showToast('✅ Sem internet. Distribuição salva localmente!', 'warning');
// //         setTimeout(() => voltarBusca(), 1500);
// //         return;
// //     }

// //     // ✅ ABRE MODAL DE ASSINATURA EM VEZ DE CONFIRMAR DIRETAMENTE
// //     document.getElementById('confirmacao-area').style.display = 'none';
// //     abrirModalAssinatura({ dados: dadosDistribuicao, nomeAluno: alunoSelecionado.nome });



// //     try {
// //         await api.post('/distribuicao', dadosDistribuicao);
// //         document.getElementById('confirmacao-area').style.display = 'none';
// //         estoqueAtual[tamanhoSelecionado]--;
// //         atualizarIndicadoresEstoque();
// //         mostrarFeedbackSucesso();
// //         setTimeout(() => voltarBusca(), 2000);
// //     } catch (error) {
// //         document.getElementById('confirmacao-area').style.display = 'none';
// //         const errorMsg = error.message || 'Erro desconhecido';

// //         if (errorMsg.includes('já recebeu')) {
// //             await mostrarModalJaRecebeu(alunoSelecionado, alunoSelecionado.turma);
// //         } else if (errorMsg.includes('fetch') || errorMsg.includes('network') || errorMsg.includes('Failed to fetch')) {
// //             salvarDistribuicaoLocal(dadosDistribuicao);
// //             showToast('✅ Falha na rede. Salvo localmente para sincronização.', 'warning');
// //             setTimeout(() => voltarBusca(), 1500);
// //         } else {
// //             showToast('Erro: ' + errorMsg, 'error');
// //             setTimeout(() => voltarBusca(), 1500);
// //         }
// //     }
// // }

// async function confirmarDistribuicao() {
//     if (!alunoSelecionado || tamanhoSelecionado === null) {
//         showToast('Dados incompletos', 'error');
//         return;
//     }

//     const dadosDistribuicao = {
//         matriculaAluno: alunoSelecionado.matricula,
//         codigoTurma: alunoSelecionado.turma,
//         tamanho: tamanhoSelecionado,
//         quantidade: 1,
//         anoReferencia: new Date().getFullYear(),
//         semestreReferencia: new Date().getMonth() < 6 ? 1 : 2,
//         responsavel: 'Modo Campo',
//         nomeAluno: alunoSelecionado.nome // ✅ Necessário para exibir no modal de assinatura
//     };

//     // 1. Se estiver offline, salva localmente e sai
//     if (!navigator.onLine) {
//         salvarDistribuicaoLocal(dadosDistribuicao);
//         estoqueAtual[tamanhoSelecionado]--;
//         atualizarIndicadoresEstoque();
//         showToast('✅ Sem internet. Distribuição salva localmente!', 'warning');
//         setTimeout(() => voltarBusca(), 1500);
//         return;
//     }

//     // 2. Se estiver online, esconde o modal de confirmação simples e ABRE o modal de assinatura
//     // A execução PARA aqui. O envio real para a API será feito dentro da função confirmarAssinatura()
//     document.getElementById('confirmacao-area').style.display = 'none';
//     abrirModalAssinatura({ dados: dadosDistribuicao, nomeAluno: alunoSelecionado.nome });
// }



// function mostrarFeedbackSucesso() {
//     const feedback = document.getElementById('feedback');
//     feedback.style.display = 'flex';
//     setTimeout(() => { feedback.style.display = 'none'; }, 1500);
// }

// function showToast(mensagem, tipo = 'info') {
//     const toast = document.getElementById('toast');
//     toast.textContent = mensagem;
//     toast.className = `toast show ${tipo}`;
//     setTimeout(() => { toast.classList.remove('show'); }, 3000);
// }

// // =====================================================================
// // SCANNER DE QR CODE
// // =====================================================================
// function setupScanner() {
//     const btnScan = document.getElementById('btn-scan');
//     if (!btnScan) return;

//     btnScan.addEventListener('click', () => {
//         const leitorContainer = document.getElementById('leitor-qr');
//         leitorContainer.style.display = 'block';
//         leitorContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });

//         if (!html5QrCode) html5QrCode = new Html5Qrcode("reader");

//         const config = { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 };

//         html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess, onScanFailure)
//             .then(() => { isScanning = true; })
//             .catch((err) => {
//                 console.error('❌ Erro ao iniciar câmera:', err);
//                 showToast('Erro ao acessar a câmera. Verifique as permissões.', 'error');
//                 pararScanner();
//             });
//     });
// }

// function onScanSuccess(decodedText) {
//     if (!isScanning) return;
//     const inputBusca = document.getElementById('busca-aluno');
//     inputBusca.value = decodedText;
//     pararScanner();
//     showToast('Código lido! Buscando aluno...', 'success');
//     buscarAlunos(decodedText);
// }

// function onScanFailure() { }

// function pararScanner() {
//     if (html5QrCode && isScanning) {
//         html5QrCode.stop().then(() => {
//             isScanning = false;
//             document.getElementById('leitor-qr').style.display = 'none';
//         }).catch((err) => console.error('Falha ao parar câmera:', err));
//     } else {
//         document.getElementById('leitor-qr').style.display = 'none';
//     }
// }

// // =====================================================================
// // RELATÓRIO DE PENDÊNCIAS E MINI-POPUP (VERSÃO BLINDADA)
// // =====================================================================
// async function abrirModalPendentes() {
//     if (!alunoSelecionado || !alunoSelecionado.turma) {
//         return showToast('Selecione um aluno primeiro', 'error');
//     }

//     const codigoTurma = alunoSelecionado.turma;
//     const modal = document.getElementById('modal-pendentes');
//     const lista = document.getElementById('lista-pendentes');
//     const titulo = document.getElementById('pendentes-turma-nome');

//     modal.style.display = 'flex';
//     lista.innerHTML = '<p style="text-align:center;color:#9ca3af;padding:20px;"><i class="fas fa-spinner fa-spin"></i> Carregando...</p>';
//     if (titulo) titulo.textContent = `Turma: ${codigoTurma}`;

//     try {
//         const response = await api.get(`/relatorios-sgs/pendentes?codigoTurma=${encodeURIComponent(codigoTurma)}`);
//         const pendentes = Array.isArray(response) ? response : (response.data || []);

//         if (pendentes.length === 0) {
//             lista.innerHTML = '<p style="text-align:center;color:#10b981;padding:20px;"><i class="fas fa-check-circle"></i> Todos já receberam!</p>';
//             return;
//         }

//         lista.innerHTML = '';
//         pendentes.forEach(aluno => {
//             const div = document.createElement('div');
//             div.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:10px;border-bottom:1px solid #f3f4f6;';
//             const nomeSeguro = (aluno.nomeCompleto || '').replace(/'/g, "\\'");
//             div.innerHTML = `
//                 <div>
//                     <div style="font-weight:600;color:#1a1a1a;">${aluno.nomeCompleto}</div>
//                     <div style="font-size:0.8rem;color:#6b7280;">Matrícula: ${aluno.numeroMatricula}</div>
//                 </div>
//                 <button class="btn-confirmar" onclick="abrirEscolhaTamanho('${aluno.numeroMatricula}', '${nomeSeguro}', '${codigoTurma}')"
//                     style="padding:8px 12px;font-size:0.85rem;border:none;border-radius:6px;background:#10b981;color:white;cursor:pointer;">
//                     <i class="fas fa-check"></i> Entregue
//                 </button>`;
//             lista.appendChild(div);
//         });
//     } catch (error) {
//         lista.innerHTML = '<p style="text-align:center;color:#ef4444;padding:20px;">Erro ao carregar dados.</p>';
//     }
// }

// function fecharModalPendentes() {
//     const modal = document.getElementById('modal-pendentes');
//     if (modal) modal.style.display = 'none';
// }

// function abrirEscolhaTamanho(matricula, nome, turma) {
//     contextoPendente = { matricula, nome, turma };
//     const label = document.getElementById('escolha-aluno-nome');
//     if (label) label.textContent = `Aluno: ${nome} • Turma: ${turma}`;

//     for (let i = 0; i <= 5; i++) {
//         const el = document.getElementById(`mini-estoque-${i}`);
//         const btn = document.querySelector(`.btn-tamanho-mini[data-tamanho="${i}"]`);
//         const qtd = estoqueAtual[i] || 0;
//         if (el) el.textContent = `${qtd} disp.`;
//         if (btn) btn.classList.toggle('sem-estoque', qtd === 0);
//     }
//     document.getElementById('modal-escolher-tamanho').style.display = 'flex';
// }

// function fecharEscolhaTamanho() {
//     const modal = document.getElementById('modal-escolher-tamanho');
//     if (modal) modal.style.display = 'none';
//     contextoPendente = null;
// }



// // async function confirmarTamanho(tamanho) {
// //     // ✅ BLINDAGEM: Se não houver contexto ou já estiver enviando, ignora
// //     if (!contextoPendente || isSubmittingPendente) return;
// //     if ((estoqueAtual[tamanho] || 0) === 0) return showToast('❌ Sem estoque', 'error');

// //     // ✅ SALVA A TURMA EM VARIÁVEL LOCAL ANTES DE FECHAR O MODAL
// //     const turmaAtual = contextoPendente.turma;
// //     const nomesTamanho = ['PP', 'P', 'M', 'G', 'GG', 'XGG'];

// //     const dados = {
// //         matriculaAluno: contextoPendente.matricula,
// //         codigoTurma: turmaAtual,
// //         tamanho: tamanho,
// //         quantidade: 1,
// //         anoReferencia: new Date().getFullYear(),
// //         semestreReferencia: new Date().getMonth() < 6 ? 1 : 2,
// //         responsavel: 'Modo Campo'
// //     };

// //     isSubmittingPendente = true; // Trava duplo clique
// //     try {
// //         if (!navigator.onLine) {
// //             salvarDistribuicaoLocal(dados);
// //             estoqueAtual[tamanho]--;
// //             atualizarIndicadoresEstoque();
// //             showToast(`✅ ${nomesTamanho[tamanho]} salvo localmente`, 'warning');
// //         } else {
// //             await api.post('/distribuicao', dados);
// //             estoqueAtual[tamanho]--;
// //             atualizarIndicadoresEstoque();
// //             showToast(`✅ ${nomesTamanho[tamanho]} entregue!`, 'success');
// //         }
// //     } catch (error) {
// //         const msg = error.message || 'Erro';
// //         if (msg.includes('já recebeu')) {
// //             showToast('⚠️ Já recebeu camiseta.', 'warning');
// //         } else if (msg.includes('fetch') || msg.includes('network') || msg.includes('Failed to fetch')) {
// //             salvarDistribuicaoLocal(dados);
// //             estoqueAtual[tamanho]--;
// //             atualizarIndicadoresEstoque();
// //             showToast('✅ Falha de rede. Salvo localmente.', 'warning');
// //         } else {
// //             showToast('Erro: ' + msg, 'error');
// //         }
// //     } finally {
// //         isSubmittingPendente = false; // Destrava
// //         fecharEscolhaTamanho();
// //         abrirModalPendentes(); // Recarrega a lista
// //     }
// // }


// // =====================================================================
// // RELATÓRIO DE PENDÊNCIAS - confirmarTamanho (com correção do modal)
// // =====================================================================
// async function confirmarTamanho(tamanho) {
//     if (!contextoPendente || isSubmittingPendente) return;
//     if ((estoqueAtual[tamanho] || 0) === 0) {
//         showToast('❌ Sem estoque neste tamanho', 'error');
//         return;
//     }

//     const turmaAtual = contextoPendente.turma;
//     const nomesTamanho = ['PP', 'P', 'M', 'G', 'GG', 'XGG'];

//     const dados = {
//         matriculaAluno: contextoPendente.matricula,
//         codigoTurma: turmaAtual,
//         tamanho: tamanho,
//         quantidade: 1,
//         anoReferencia: new Date().getFullYear(),
//         semestreReferencia: new Date().getMonth() < 6 ? 1 : 2,
//         responsavel: 'Modo Campo'
//     };

//     isSubmittingPendente = true;
//     try {
//         if (!navigator.onLine) {
//             salvarDistribuicaoLocal(dados);
//             estoqueAtual[tamanho]--;
//             atualizarIndicadoresEstoque();
//             showToast(`✅ ${nomesTamanho[tamanho]} salvo localmente para ${contextoPendente.nome}`, 'warning');
//         } else {
//             await api.post('/distribuicao', dados);
//             estoqueAtual[tamanho]--;
//             atualizarIndicadoresEstoque();
//             showToast(`✅ ${nomesTamanho[tamanho]} entregue para ${contextoPendente.nome}!`, 'success');
//         }
//     } catch (error) {
//         const msg = error.message || 'Erro';
//         if (msg.includes('já recebeu')) {
//             // ✅ ABRE O MODAL VERMELHO COMPLETO
//             fecharEscolhaTamanho();
//             await mostrarModalJaRecebeu(
//                 { 
//                     matricula: dados.matriculaAluno, 
//                     nome: contextoPendente.nome,
//                     cpf: ''
//                 }, 
//                 dados.codigoTurma
//             );
//         } else if (msg.includes('fetch') || msg.includes('network') || msg.includes('Failed to fetch')) {
//             salvarDistribuicaoLocal(dados);
//             estoqueAtual[tamanho]--;
//             atualizarIndicadoresEstoque();
//             showToast('✅ Falha de rede. Salvo localmente.', 'warning');
//             fecharEscolhaTamanho();
//             abrirModalPendentes();
//         } else {
//             showToast('Erro: ' + msg, 'error');
//             fecharEscolhaTamanho();
//             abrirModalPendentes();
//         }
//     } finally {
//         isSubmittingPendente = false;
//     }
// }




// // =====================================================================
// // ASSINATURA DIGITAL (com correção do modal "já recebeu")
// // =====================================================================
// let signaturePad = null;
// let distribuicaoPendenteAssinatura = null;

// function inicializarSignaturePad() {
//     const canvas = document.getElementById('signature-canvas');
//     if (!canvas) return;

//     const ratio = Math.max(window.devicePixelRatio || 1, 1);
//     canvas.width = canvas.offsetWidth * ratio;
//     canvas.height = canvas.offsetHeight * ratio;
//     canvas.getContext('2d').scale(ratio, ratio);

//     signaturePad = new SignaturePad(canvas, {
//         backgroundColor: 'rgba(255, 255, 255, 0)',
//         penColor: 'rgb(0, 0, 0)',
//         minWidth: 1,
//         maxWidth: 2.5,
//         throttle: 16
//     });
// }

// function abrirModalAssinatura(dadosDistribuicao) {
//     distribuicaoPendenteAssinatura = dadosDistribuicao;

//     const modal = document.getElementById('modal-assinatura');
//     const info = document.getElementById('assinatura-info');
//     const nomesTamanho = ['PP', 'P', 'M', 'G', 'GG', 'XGG'];

//     info.innerHTML = `Aluno: <strong>${dadosDistribuicao.nomeAluno}</strong> | Tamanho: <strong>${nomesTamanho[dadosDistribuicao.dados.tamanho]}</strong>`;
//     modal.style.display = 'flex';

//     setTimeout(() => {
//         inicializarSignaturePad();
//     }, 100);
// }

// function limparAssinatura() {
//     if (signaturePad) signaturePad.clear();
// }

// function cancelarAssinatura() {
//     document.getElementById('modal-assinatura').style.display = 'none';
//     distribuicaoPendenteAssinatura = null;
//     if (signaturePad) signaturePad.clear();
// }

// async function confirmarAssinatura() {
//     if (!signaturePad || signaturePad.isEmpty()) {
//         showToast('⚠️ Por favor, assina antes de confirmar', 'warning');
//         return;
//     }
//     if (!distribuicaoPendenteAssinatura) {
//         showToast('❌ Dados da distribuição não encontrados', 'error');
//         return;
//     }

//     const assinaturaBase64 = signaturePad.toDataURL('image/png');
//     const dadosEnvio = {
//         ...distribuicaoPendenteAssinatura.dados,
//         assinatura: assinaturaBase64,
//         dataAssinatura: new Date().toISOString()
//     };
//     const tamanho = distribuicaoPendenteAssinatura.dados.tamanho;
//     const nomeAluno = distribuicaoPendenteAssinatura.nomeAluno;

//     try {
//         await api.post('/distribuicao', dadosEnvio);

//         // ✅ FEEDBACK DE SUCESSO (voltou a funcionar)
//         estoqueAtual[tamanho]--;
//         atualizarIndicadoresEstoque();
//         mostrarFeedbackSucesso();

//         document.getElementById('modal-assinatura').style.display = 'none';
//         distribuicaoPendenteAssinatura = null;
//         if (signaturePad) signaturePad.clear();

//         setTimeout(() => voltarBusca(), 2000);

//     } catch (error) {
//         const msg = error.message || 'Erro desconhecido';
//         document.getElementById('modal-assinatura').style.display = 'none';
//         distribuicaoPendenteAssinatura = null;
//         if (signaturePad) signaturePad.clear();

//         if (msg.includes('já recebeu')) {
//             // ✅ AGORA ABRE O MODAL VERMELHO COMPLETO (não só toast)
//             await mostrarModalJaRecebeu(
//                 { 
//                     matricula: dadosEnvio.matriculaAluno, 
//                     nome: nomeAluno,
//                     cpf: alunoSelecionado?.cpf || ''
//                 }, 
//                 dadosEnvio.codigoTurma
//             );
//         } else if (msg.includes('fetch') || msg.includes('network') || msg.includes('Failed to fetch')) {
//             salvarDistribuicaoLocal(dadosEnvio);
//             estoqueAtual[tamanho]--;
//             atualizarIndicadoresEstoque();
//             showToast('✅ Falha de rede. Salvo localmente com assinatura.', 'warning');
//             setTimeout(() => voltarBusca(), 1500);
//         } else {
//             showToast('Erro: ' + msg, 'error');
//             setTimeout(() => voltarBusca(), 1500);
//         }
//     }
// }


// function abrirModalAssinatura(dadosDistribuicao) {
//     distribuicaoPendenteAssinatura = dadosDistribuicao;

//     const modal = document.getElementById('modal-assinatura');
//     const info = document.getElementById('assinatura-info');

//     const nomesTamanho = ['PP', 'P', 'M', 'G', 'GG', 'XGG'];
//     info.innerHTML = `Aluno: <strong>${dadosDistribuicao.nomeAluno}</strong> | Tamanho: <strong>${nomesTamanho[dadosDistribuicao.tamanho]}</strong>`;

//     modal.style.display = 'flex';

//     // Inicializa o signature pad após o modal estar visível
//     setTimeout(() => {
//         inicializarSignaturePad();
//     }, 100);
// }

// function limparAssinatura() {
//     if (signaturePad) {
//         signaturePad.clear();
//     }
// }

// function cancelarAssinatura() {
//     const modal = document.getElementById('modal-assinatura');
//     modal.style.display = 'none';
//     distribuicaoPendenteAssinatura = null;
//     if (signaturePad) {
//         signaturePad.clear();
//     }
// }

// async function confirmarAssinatura() {
//     if (!signaturePad || signaturePad.isEmpty()) {
//         showToast('⚠️ Por favor, assina antes de confirmar', 'warning');
//         return;
//     }

//     if (!distribuicaoPendenteAssinatura) {
//         showToast('❌ Dados da distribuição não encontrados', 'error');
//         return;
//     }

//     // Captura a assinatura como imagem base64
//     const assinaturaBase64 = signaturePad.toDataURL('image/png');

//     try {
//         // Envia a distribuição com a assinatura
//         const dadosEnvio = {
//             ...distribuicaoPendenteAssinatura.dados,
//             assinatura: assinaturaBase64,
//             dataAssinatura: new Date().toISOString()
//         };

//         await api.post('/distribuicao', dadosEnvio);

//         // Atualiza estoque
//         estoqueAtual[distribuicaoPendenteAssinatura.dados.tamanho]--;
//         atualizarIndicadoresEstoque();

//         showToast('✅ Distribuição registrada com assinatura!', 'success');

//         const modal = document.getElementById('modal-assinatura');
//         modal.style.display = 'none';
//         distribuicaoPendenteAssinatura = null;

//         if (signaturePad) {
//             signaturePad.clear();
//         }

//         // Volta para a busca após 2 segundos
//         setTimeout(() => voltarBusca(), 2000);

//     } catch (error) {
//         const msg = error.message || 'Erro desconhecido';
//         if (msg.includes('já recebeu')) {
//             showToast('⚠️ Este aluno já recebeu camiseta.', 'warning');
//         } else if (msg.includes('fetch') || msg.includes('network')) {
//             // Salva localmente com assinatura
//             salvarDistribuicaoLocal({
//                 ...distribuicaoPendenteAssinatura.dados,
//                 assinatura: assinaturaBase64,
//                 dataAssinatura: new Date().toISOString()
//             });
//             estoqueAtual[distribuicaoPendenteAssinatura.dados.tamanho]--;
//             atualizarIndicadoresEstoque();
//             showToast('✅ Falha de rede. Salvo localmente com assinatura.', 'warning');
//         } else {
//             showToast('Erro: ' + msg, 'error');
//         }

//         const modal = document.getElementById('modal-assinatura');
//         modal.style.display = 'none';
//         distribuicaoPendenteAssinatura = null;

//         setTimeout(() => voltarBusca(), 1500);
//     }
// }