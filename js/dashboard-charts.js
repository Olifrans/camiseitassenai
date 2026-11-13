/**
 * Módulo de Gráficos do Dashboard - Versão Premium e Estável
 */

let chartDistribuicoesCurso = null;
let chartDistribuicoesTamanho = null;
let chartEvolucaoEstoque = null;
let chartTopCursos = null;

const COLORS = {
    primary: '#E30613', secondary: '#0055A4',
    chart: ['#E30613', '#0066CC', '#FFB800', '#28A745', '#6F42C1', '#FD7E14', '#20C997', '#DC3545', '#6C757D', '#17A2B8'],
    success: '#28A745', warning: '#FFC107', danger: '#DC3545', info: '#17A2B8'
};

async function carregarGraficosDashboard() {
    try {
        await Promise.all([
            carregarDistribuicoesPorCurso(),
            carregarDistribuicoesPorTamanho(),
            carregarEvolucaoEstoque(),
            carregarAlertasEstoque(),
            carregarMetaDistribuicao(),
            carregarTopCursos()
        ]);
    } catch (error) {
        console.error('Erro ao carregar gráficos:', error);
    }
}

async function carregarMetaDistribuicao() {
    try {
        const dados = await api.get('/dashboard/metas-distribuicao');
        const realizadoEl = document.getElementById('kpi-meta-realizado');
        const totalEl = document.getElementById('kpi-meta-total');
        const barraEl = document.getElementById('kpi-meta-barra');
        const percentualEl = document.getElementById('kpi-meta-percentual');

        if (realizadoEl) realizadoEl.textContent = dados.realizadoMes;
        if (totalEl) totalEl.textContent = dados.metaMensal;
        if (percentualEl) percentualEl.textContent = `${dados.percentualConcluido}%`;

        if (barraEl) {
            setTimeout(() => { barraEl.style.width = `${Math.min(dados.percentualConcluido, 100)}%`; }, 300);
        }

        const card = realizadoEl?.closest('.stat-card');
        if (card) {
            card.style.background = dados.status === 'abaixo_alvo'
                ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
        }
    } catch (error) { console.error('Erro ao carregar meta:', error); }
}

async function carregarDistribuicoesPorCurso() {
    try {
        const canvas = document.getElementById('chartDistribuicoesCurso');
        if (!canvas) return;

        const response = await api.get('/relatorios-sgs/resumo-por-curso');
        let dados = Array.isArray(response) ? response : (response?.data || response?.dados || []);

        if (!Array.isArray(dados) || dados.length === 0) {
            if (chartDistribuicoesCurso) { chartDistribuicoesCurso.destroy(); chartDistribuicoesCurso = null; }
            const ctx = canvas.getContext('2d');
            chartDistribuicoesCurso = new Chart(ctx, {
                type: 'doughnut',
                data: { labels: ['Sem dados'], datasets: [{ data: [1], backgroundColor: ['#e5e7eb'] }] },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
            });
            return;
        }

        const labels = dados.map(d => d.curso?.length > 30 ? d.curso.substring(0, 30) + '...' : (d.curso || 'Sem Curso'));
        const valores = dados.map(d => d.totalDistribuido || 0);

        if (chartDistribuicoesCurso) chartDistribuicoesCurso.destroy();
        const ctx = canvas.getContext('2d');

        chartDistribuicoesCurso = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data: valores,
                    backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'],
                    borderWidth: 3,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { font: { size: 11 } } },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const pct = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.parsed} camisetas (${pct}%)`;
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.warn('Erro gráfico cursos (silenciado):', error.message);
    }
}

async function carregarDistribuicoesPorTamanho() {
    try {
        const canvasEl = document.getElementById('chartDistribuicoesTamanho');
        if (!canvasEl) return;

        const response = await api.get('/dashboard/distribuicoes-por-tamanho');
        let dados = Array.isArray(response) ? response : (response?.data || response?.dados || []);

        if (!Array.isArray(dados) || dados.length === 0) {
            canvasEl.parentElement.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:300px;color:#6c757d;"><div style="text-align:center;"><i class="fas fa-chart-bar" style="font-size:3rem;margin-bottom:15px;opacity:0.3;"></i><p>Nenhuma distribuição registrada ainda</p></div></div>';
            return;
        }

        const ctx = canvasEl.getContext('2d');
        if (chartDistribuicoesTamanho) chartDistribuicoesTamanho.destroy();
        const tamanhoLabels = { '0': 'PP', '1': 'P', '2': 'M', '3': 'G', '4': 'GG', '5': 'XGG' };

        chartDistribuicoesTamanho = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: dados.map(d => tamanhoLabels[d.tamanho] || `Tam. ${d.tamanho}`),
                datasets: [{
                    label: 'Quantidade Distribuída',
                    data: dados.map(d => d.total),
                    backgroundColor: COLORS.chart.slice(0, dados.length),
                    borderRadius: 8,
                    borderWidth: 0,
                    barPercentage: 0.7
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: true, aspectRatio: 2,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { font: { size: 10 }, color: '#6c757d', maxTicksLimit: 10 }, grid: { color: 'rgba(0,0,0,0.05)', drawBorder: false } },
                    x: { ticks: { font: { size: 11, weight: '600' }, color: '#495057' }, grid: { display: false, drawBorder: false } }
                }
            }
        });
    } catch (error) { console.error('Erro gráfico tamanhos:', error); }
}

async function carregarEvolucaoEstoque() {
    try {
        const canvasEl = document.getElementById('chartEvolucaoEstoque');
        if (!canvasEl) return;

        const response = await api.get('/dashboard/evolucao-estoque');
        let dados = Array.isArray(response) ? response : (response?.data || response?.dados || []);

        if (!Array.isArray(dados) || dados.length === 0) {
            canvasEl.parentElement.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:300px;color:#6c757d;"><div style="text-align:center;"><i class="fas fa-chart-line" style="font-size:3rem;margin-bottom:15px;opacity:0.3;"></i><p>Nenhuma movimentação nos últimos 30 dias</p></div></div>';
            return;
        }

        const ctx = canvasEl.getContext('2d');
        if (chartEvolucaoEstoque) chartEvolucaoEstoque.destroy();

        const gradientEntradas = ctx.createLinearGradient(0, 0, 0, 300);
        gradientEntradas.addColorStop(0, 'rgba(40, 167, 69, 0.3)');
        gradientEntradas.addColorStop(1, 'rgba(40, 167, 69, 0.01)');

        const gradientSaidas = ctx.createLinearGradient(0, 0, 0, 300);
        gradientSaidas.addColorStop(0, 'rgba(227, 6, 19, 0.3)');
        gradientSaidas.addColorStop(1, 'rgba(227, 6, 19, 0.01)');

        chartEvolucaoEstoque = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dados.map(d => d.data),
                datasets: [
                    { label: 'Entradas', data: dados.map(d => d.entradas), borderColor: COLORS.success, backgroundColor: gradientEntradas, borderWidth: 3, fill: true, tension: 0.4, pointRadius: 4, pointHoverRadius: 7, pointBackgroundColor: '#ffffff', pointBorderColor: COLORS.success, pointBorderWidth: 2 },
                    { label: 'Saídas/Distribuições', data: dados.map(d => d.saidas), borderColor: COLORS.primary, backgroundColor: gradientSaidas, borderWidth: 3, fill: true, tension: 0.4, pointRadius: 4, pointHoverRadius: 7, pointBackgroundColor: '#ffffff', pointBorderColor: COLORS.primary, pointBorderWidth: 2 }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: true, aspectRatio: 3, interaction: { mode: 'index', intersect: false },
                plugins: { legend: { position: 'top', labels: { padding: 20, font: { size: 12, weight: '600' }, color: '#495057', usePointStyle: true, pointStyle: 'rect', boxWidth: 15, boxHeight: 15 } } },
                scales: {
                    y: { beginAtZero: true, ticks: { font: { size: 11 }, color: '#6c757d', maxTicksLimit: 10 }, grid: { color: 'rgba(0,0,0,0.05)', drawBorder: false } },
                    x: { ticks: { font: { size: 10 }, color: '#6c757d', maxRotation: 45, minRotation: 45 }, grid: { display: false, drawBorder: false } }
                }
            }
        });
    } catch (error) { console.error('Erro gráfico evolução:', error); }
}

async function carregarAlertasEstoque() {
    try {
        const response = await api.get('/dashboard/alertas-estoque');
        const alertas = Array.isArray(response) ? response : (response?.data || response?.dados || []);
        const container = document.getElementById('alertas-container');
        const lista = document.getElementById('alertas-lista');

        if (!Array.isArray(alertas) || alertas.length === 0) {
            if (container) container.classList.add('hidden');
            return;
        }
        if (container) container.classList.remove('hidden');

        const alertasAgrupados = alertas.reduce((acc, alerta) => {
            if (!acc[alerta.tamanho]) {
                acc[alerta.tamanho] = { tamanho: alerta.tamanho, saldoMinimo: alerta.saldo, minimo: alerta.minimo, diferencaMaxima: alerta.diferenca, status: alerta.saldo === 0 ? 'CRÍTICO' : 'BAIXO' };
            } else {
                if (alerta.saldo < acc[alerta.tamanho].saldoMinimo) {
                    acc[alerta.tamanho].saldoMinimo = alerta.saldo;
                    acc[alerta.tamanho].diferencaMaxima = alerta.diferenca;
                    if (alerta.saldo === 0) acc[alerta.tamanho].status = 'CRÍTICO';
                }
            }
            return acc;
        }, {});

        const listaAgrupada = Object.values(alertasAgrupados);
        const criticos = listaAgrupada.filter(a => a.status === 'CRÍTICO');
        const baixos = listaAgrupada.filter(a => a.status === 'BAIXO');

        let html = `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
            <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 15px; border-radius: 10px; box-shadow: 0 4px 6px rgba(220,53,69,0.3);">
                <div style="display: flex; align-items: center; gap: 12px;"><i class="fas fa-exclamation-circle" style="font-size: 2rem; opacity: 0.9;"></i>
                <div><div style="font-size: 0.85rem; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px;">Críticos</div><div style="font-size: 2rem; font-weight: bold;">${criticos.length}</div><div style="font-size: 0.8rem; opacity: 0.85;">Estoque zerado</div></div></div>
            </div>
            <div style="background: linear-gradient(135deg, #fd7e14 0%, #e8590c 100%); color: white; padding: 15px; border-radius: 10px; box-shadow: 0 4px 6px rgba(253,126,20,0.3);">
                <div style="display: flex; align-items: center; gap: 12px;"><i class="fas fa-exclamation-triangle" style="font-size: 2rem; opacity: 0.9;"></i>
                <div><div style="font-size: 0.85rem; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px;">Em Baixa</div><div style="font-size: 2rem; font-weight: bold;">${baixos.length}</div><div style="font-size: 0.8rem; opacity: 0.85;">Abaixo do mínimo</div></div></div>
            </div>
        </div><div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px;">`;

        listaAgrupada.forEach(alerta => {
            const isCritico = alerta.status === 'CRÍTICO';
            const corPrincipal = isCritico ? '#dc3545' : '#fd7e14';
            const corFundo = isCritico ? '#fff5f5' : '#fff8f0';
            const percentual = Math.min((alerta.saldoMinimo / alerta.minimo) * 100, 100);
            const corBarra = percentual === 0 ? '#dc3545' : percentual < 50 ? '#fd7e14' : '#ffc107';

            html += `<div style="background: ${corFundo}; border-radius: 10px; padding: 15px; border-left: 5px solid ${corPrincipal}; box-shadow: 0 2px 4px rgba(0,0,0,0.08); transition: all 0.3s ease;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <i class="fas ${isCritico ? 'fa-exclamation-circle' : 'fa-exclamation-triangle'}" style="color: ${corPrincipal}; font-size: 1.3rem;"></i>
                        <div><div style="font-weight: bold; color: #212529; font-size: 1.1rem;">Tamanho ${alerta.tamanho}</div>
                        <span style="display: inline-block; padding: 2px 8px; background: ${corPrincipal}; color: white; border-radius: 12px; font-size: 0.7rem; font-weight: 600; margin-top: 3px;">${alerta.status}</span></div>
                    </div>
                </div>
                <div style="background: #e9ecef; border-radius: 8px; height: 8px; overflow: hidden; margin-bottom: 10px;">
                    <div style="width: ${percentual}%; height: 100%; background: ${corBarra}; border-radius: 8px; transition: width 0.5s ease;"></div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem;">
                    <div style="color: #495057;"><strong style="color: ${corPrincipal}; font-size: 1.1rem;">${alerta.saldoMinimo}</strong><span style="color: #6c757d;"> / ${alerta.minimo}</span></div>
                    <div style="color: ${corPrincipal}; font-weight: 600;"><i class="fas fa-arrow-down" style="font-size: 0.7rem;"></i> Faltam ${alerta.diferencaMaxima}</div>
                </div>
            </div>`;
        });
        html += '</div>';
        if (lista) lista.innerHTML = html;
    } catch (error) { console.error('Erro ao carregar alertas:', error); }
}

async function carregarTopCursos() {
    try {
        const canvasEl = document.getElementById('chartTopCursos');
        if (!canvasEl) return;

        const response = await api.get('/dashboard/top-cursos-distribuicao');
        let dados = Array.isArray(response) ? response : (response?.data || response?.dados || []);

        if (!Array.isArray(dados) || dados.length === 0) {
            canvasEl.parentElement.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:200px;color:#6c757d;"><div style="text-align:center;"><i class="fas fa-trophy" style="font-size:2.5rem;margin-bottom:10px;opacity:0.3;"></i><p>Nenhuma distribuição registrada ainda</p></div></div>';
            return;
        }

        const ctx = canvasEl.getContext('2d');
        if (chartTopCursos) chartTopCursos.destroy();

        const coresTop5 = ['#E30613', '#0066CC', '#FFB800', '#28A745', '#6F42C1'];

        chartTopCursos = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: dados.map(d => d.curso.length > 30 ? d.curso.substring(0, 30) + '...' : d.curso),
                datasets: [{
                    label: 'Camisetas Distribuídas',
                    data: dados.map(d => d.total),
                    backgroundColor: coresTop5.slice(0, dados.length),
                    borderRadius: 6,
                    borderWidth: 0,
                    barPercentage: 0.7
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true, maintainAspectRatio: true, aspectRatio: 2,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(33, 37, 41, 0.95)', titleFont: { size: 13, weight: 'bold' }, bodyFont: { size: 12 }, padding: 12, cornerRadius: 8,
                        callbacks: {
                            label: function (context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed.x / total) * 100).toFixed(1);
                                return [`📊 Distribuídas: ${context.parsed.x} unidades`, `📈 Representa: ${percentage}% do total`];
                            }
                        }
                    }
                },
                scales: {
                    x: { beginAtZero: true, ticks: { font: { size: 10 }, color: '#6c757d', maxTicksLimit: 10 }, grid: { color: 'rgba(0,0,0,0.05)', drawBorder: false }, title: { display: true, text: 'Quantidade Distribuída', font: { size: 11, weight: '600' }, color: '#495057' } },
                    y: { ticks: { font: { size: 11, weight: '600' }, color: '#495057' }, grid: { display: false, drawBorder: false } }
                },
                animation: { duration: 1200, easing: 'easeOutQuart' }
            }
        });
    } catch (error) { console.error('Erro ao carregar top cursos:', error); }
}

document.addEventListener('DOMContentLoaded', () => {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.target.id === 'dashboard' && !mutation.target.classList.contains('hidden')) {
                carregarGraficosDashboard();
            }
        });
    });
    const dashboard = document.getElementById('dashboard');
    if (dashboard) {
        observer.observe(dashboard, { attributes: true, attributeFilter: ['class'] });
    }
    if (dashboard && !dashboard.classList.contains('hidden')) {
        carregarGraficosDashboard();
    }
});