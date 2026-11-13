// =====================================================================
// DASHBOARD PRINCIPAL
// =====================================================================
async function loadDashboard() {
    try {
        showToast('Carregando dashboard...', 'info');

        const resumo = await api.get('/distribuicao/resumo');

        animateValue('dash-total-estoque', parseInt(document.getElementById('dash-total-estoque')?.textContent) || 0, resumo.totalEstoque || 0, 500);
        animateValue('dash-total-dist', parseInt(document.getElementById('dash-total-dist')?.textContent) || 0, resumo.totalDistribuido || 0, 500);
        animateValue('dash-alertas', parseInt(document.getElementById('dash-alertas')?.textContent) || 0, resumo.alertas || 0, 500);
        animateValue('dash-total-alunos', parseInt(document.getElementById('dash-total-alunos')?.textContent) || 0, resumo.totalAlunos || 0, 500);

        const tbody = document.querySelector('#tbl-estoque-dash tbody');
        if (tbody) {
            tbody.innerHTML = '';

            if (resumo.estoque && Array.isArray(resumo.estoque) && resumo.estoque.length > 0) {
                const ordemTamanhos = ['PP', 'P', 'M', 'G', 'GG', 'XGG'];
                const estoqueOrdenado = [...resumo.estoque].sort((a, b) => {
                    return ordemTamanhos.indexOf(a.tamanho) - ordemTamanhos.indexOf(b.tamanho);
                });

                estoqueOrdenado.forEach(e => {
                    const saldo = parseInt(e.saldoDisponivel) || 0;
                    const minimo = parseInt(e.estoqueMinimo) || 0;
                    const isCritico = saldo <= minimo;
                    const statusClass = isCritico ? 'badge-err' : 'badge-ok';
                    const statusText = isCritico ? 'CRÍTICO' : 'NORMAL';
                    const statusIcon = isCritico ? '⚠️' : '✓';

                    const row = `
                        <tr>
                            <td><strong>${e.tamanho}</strong></td>
                            <td class="text-center">${saldo}</td>
                            <td class="text-center">${minimo}</td>
                            <td class="text-center">
                                <span class="badge ${statusClass}">${statusIcon} ${statusText}</span>
                            </td>
                        </tr>
                    `;
                    tbody.innerHTML += row;
                });
            } else {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 40px; color: var(--text-light);"><i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 10px; display: block;"></i>Nenhum dado de estoque disponível</td></tr>';
            }
        }
        showToast('Dashboard atualizado!', 'success');
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        showToast('Erro ao carregar dashboard: ' + error.message, 'error');
    }
}

function animateValue(elementId, start, end, duration) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const range = end - start;
    if (range === 0) return;

    if (Math.abs(range) > 100) {
        element.textContent = end;
        return;
    }

    const increment = end > start ? 1 : -1;
    const stepTime = Math.abs(Math.floor(duration / range));
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        element.textContent = current;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            element.textContent = end;
            clearInterval(timer);
        }
    }, stepTime > 0 ? stepTime : 50);
}

// =====================================================================
// ESTATÍSTICAS AVANÇADAS
// =====================================================================
let chartEvolucaoMensal = null;
let chartDistribuicaoTamanhos = null;

async function carregarEstatisticas() {
    try {
        const response = await api.get('/relatorios-sgs/estatisticas-gerais');
        const dados = response.data || response;

        if (!dados || !Array.isArray(dados.distribuicoesPorMes)) {
            const elCobertura = document.getElementById('stat-taxa-cobertura');
            if (elCobertura) elCobertura.textContent = '0%';
            const elTotal = document.getElementById('stat-total-distribuido');
            if (elTotal) elTotal.textContent = '0';
            const elAtivos = document.getElementById('stat-alunos-ativos');
            if (elAtivos) elAtivos.textContent = '0';
            const elTop = document.getElementById('stat-top-turma');
            if (elTop) elTop.textContent = '-';
            return;
        }

        const elCobertura = document.getElementById('stat-taxa-cobertura');
        if (elCobertura) elCobertura.textContent = `${dados.taxaCobertura}%`;

        const elTotal = document.getElementById('stat-total-distribuido');
        if (elTotal) elTotal.textContent = dados.totalDistribuidos;

        const elAtivos = document.getElementById('stat-alunos-ativos');
        if (elAtivos) elAtivos.textContent = dados.totalAlunosAtivos;

        if (dados.topTurmas && dados.topTurmas.length > 0) {
            const elTopTurma = document.getElementById('stat-top-turma');
            const elTopTotal = document.getElementById('stat-top-turma-total');
            if (elTopTurma) elTopTurma.textContent = dados.topTurmas[0].turma;
            if (elTopTotal) elTopTotal.textContent = `${dados.topTurmas[0].total} distribuições`;
        }

        // Gráfico evolução mensal
        const ctxEvolucao = document.getElementById('chartEvolucaoMensal');
        if (ctxEvolucao) {
            if (chartEvolucaoMensal) chartEvolucaoMensal.destroy();
            chartEvolucaoMensal = new Chart(ctxEvolucao.getContext('2d'), {
                type: 'line',
                data: {
                    labels: dados.distribuicoesPorMes.map(x => x.mes),
                    datasets: [{
                        label: 'Distribuições',
                        data: dados.distribuicoesPorMes.map(x => x.total),
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
                }
            });
        }

        // Gráfico por tamanho
        const ctxTamanhos = document.getElementById('chartDistribuicaoTamanhos');
        if (ctxTamanhos) {
            if (chartDistribuicaoTamanhos) chartDistribuicaoTamanhos.destroy();
            chartDistribuicaoTamanhos = new Chart(ctxTamanhos.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: dados.distribuicoesPorTamanho.map(x => x.tamanho),
                    datasets: [{
                        data: dados.distribuicoesPorTamanho.map(x => x.total),
                        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'right' } }
                }
            });
        }
    } catch (error) {
        console.warn('Estatísticas indisponíveis (silenciado):', error.message);
    }
}

// =====================================================================
// INICIALIZAÇÃO UNIFICADA
// =====================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Botão de atualizar dashboard
    const btnAtualizar = document.getElementById('btn-atualizar-dash');
    if (btnAtualizar) {
        btnAtualizar.addEventListener('click', () => loadDashboard());
    }

    // Observer para carregar estatísticas quando o dashboard ficar visível
    const dashboard = document.getElementById('dashboard');
    if (dashboard) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.target.id === 'dashboard' && !mutation.target.classList.contains('hidden')) {
                    carregarEstatisticas();
                }
            });
        });
        observer.observe(dashboard, { attributes: true, attributeFilter: ['class'] });

        // Carrega na primeira vez se já estiver visível
        if (!dashboard.classList.contains('hidden')) {
            carregarEstatisticas();
        }
    }
});