/**
 * Módulo de Histórico de Alertas e Eventos
 * Usa localStorage para persistência local
 */

const HISTORICO_KEY = 'historico_alertas_senai';
const MAX_REGISTROS = 100;

// Tipos de eventos
const TIPOS_EVENTO = {
    ALERTA_CRITICO: { icone: 'fa-exclamation-circle', cor: '#dc3545', label: 'CRÍTICO' },
    ALERTA_BAIXO: { icone: 'fa-exclamation-triangle', cor: '#fd7e14', label: 'BAIXO' },
    ENTRADA_ESTOQUE: { icone: 'fa-plus-circle', cor: '#28a745', label: 'ENTRADA' },
    DISTRIBUICAO: { icone: 'fa-hand-holding-heart', cor: '#17a2b8', label: 'DISTRIBUIÇÃO' },
    SINCRONIZACAO: { icone: 'fa-sync', cor: '#6f42c1', label: 'SINCRONIZAÇÃO' }
};

// Adicionar evento ao histórico
function registrarEvento(tipo, mensagem, detalhes = null) {
    try {
        const evento = {
            id: Date.now(),
            tipo: tipo,
            mensagem: mensagem,
            detalhes: detalhes,
            data: new Date().toISOString(),
            usuario: 'ADMINISTRADOR'
        };

        let historico = getHistorico();
        historico.unshift(evento); // Adiciona no início
        
        // Limita a quantidade de registros
        if (historico.length > MAX_REGISTROS) {
            historico = historico.slice(0, MAX_REGISTROS);
        }

        localStorage.setItem(HISTORICO_KEY, JSON.stringify(historico));
        console.log('✅ Evento registrado:', evento);
    } catch (error) {
        console.error('Erro ao registrar evento:', error);
    }
}

// Obter histórico
function getHistorico() {
    try {
        const data = localStorage.getItem(HISTORICO_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

// Abrir modal do histórico
function abrirHistoricoAlertas() {
    const modal = document.getElementById('modal-historico');
    const lista = document.getElementById('lista-historico');
    
    if (modal) modal.classList.remove('hidden');
    
    const historico = getHistorico();
    
    if (historico.length === 0) {
        lista.innerHTML = `
            <div style="text-align:center; padding:40px; color:var(--text-light);">
                <i class="fas fa-inbox" style="font-size:3rem; opacity:0.3; margin-bottom:15px;"></i>
                <p><strong>Nenhum evento registrado</strong></p>
                <p style="font-size:0.85rem;">Os alertas e movimentações aparecerão aqui</p>
            </div>`;
        return;
    }

    let html = '<div style="display:flex; flex-direction:column; gap:10px;">';
    
    historico.forEach(evento => {
        const tipoInfo = TIPOS_EVENTO[evento.tipo] || TIPOS_EVENTO.ALERTA_BAIXO;
        const dataFormatada = new Date(evento.data).toLocaleString('pt-BR');
        
        html += `
            <div style="display:flex; gap:12px; padding:12px; background:#f8f9fa; border-radius:6px; border-left:4px solid ${tipoInfo.cor};">
                <div style="flex-shrink:0;">
                    <i class="fas ${tipoInfo.icone}" style="color:${tipoInfo.cor}; font-size:1.2rem;"></i>
                </div>
                <div style="flex:1;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                        <span style="font-weight:600; color:${tipoInfo.cor}; font-size:0.75rem; text-transform:uppercase;">
                            ${tipoInfo.label}
                        </span>
                        <span style="font-size:0.75rem; color:var(--text-light);">
                            ${dataFormatada}
                        </span>
                    </div>
                    <div style="font-size:0.9rem; color:var(--text-primary); margin-bottom:3px;">
                        ${evento.mensagem}
                    </div>
                    ${evento.detalhes ? `<div style="font-size:0.8rem; color:var(--text-secondary);">${evento.detalhes}</div>` : ''}
                </div>
            </div>`;
    });
    
    html += '</div>';
    lista.innerHTML = html;
}

// Fechar modal
function fecharHistoricoAlertas() {
    const modal = document.getElementById('modal-historico');
    if (modal) modal.classList.add('hidden');
}

// Limpar histórico
function limparHistoricoAlertas() {
    if (confirm('Deseja realmente limpar todo o histórico de eventos?')) {
        localStorage.removeItem(HISTORICO_KEY);
        abrirHistoricoAlertas();
        if (typeof showToast === 'function') {
            showToast('Histórico limpo com sucesso!', 'success');
        }
    }
}

// Fechar modal ao clicar fora
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('modal-historico');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) fecharHistoricoAlertas();
        });
    }
});

// Exportar funções globalmente
window.abrirHistoricoAlertas = abrirHistoricoAlertas;
window.fecharHistoricoAlertas = fecharHistoricoAlertas;
window.limparHistoricoAlertas = limparHistoricoAlertas;
window.registrarEvento = registrarEvento;