/**
 * SENAI Gestão de Camisetas - Controlador Principal (app.js)
 * Versão Completa com Sidebar Colapsável e Botões no Header
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Sistema SENAI Gestão de Camisetas inicializado');

    // 1. Navegação pelo Menu Lateral
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const paginaId = item.getAttribute('data-page');
            document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
            item.classList.add('active');
            showPage(paginaId);
            if (window.innerWidth <= 768) fecharSidebar();
        });
    });

    // 2. Controle do Modal de Entrada
    const modal = document.getElementById('modal-entrada');
    const btnAbrir = document.getElementById('btn-abrir-modal-entrada');
    const btnFechar = document.getElementById('btn-fechar-modal');
    const btnCancelar = document.getElementById('btn-cancelar-entrada');

    if (btnAbrir) btnAbrir.addEventListener('click', () => toggleModal(modal, true));
    if (btnFechar) btnFechar.addEventListener('click', () => toggleModal(modal, false));
    if (btnCancelar) btnCancelar.addEventListener('click', () => toggleModal(modal, false));

    if (modal) {
        modal.addEventListener('click', (e) => { if (e.target === modal) toggleModal(modal, false); });
    }

    // 3. Controle da Sidebar Mobile
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('active');
            overlay?.classList.toggle('active');
        });
        overlay?.addEventListener('click', fecharSidebar);
    }

    // 4. CONTROLE DA SIDEBAR COLAPSÁVEL (Desktop)
    const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
    if (sidebarToggleBtn && sidebar) {
        sidebarToggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
        });
        if (localStorage.getItem('sidebarCollapsed') === 'true') {
            sidebar.classList.add('collapsed');
        }
    }

    // 5. Acessibilidade: Fechar com ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (modal && !modal.classList.contains('hidden')) toggleModal(modal, false);
            else fecharSidebar();
        }
    });

    // 6. CONEXÃO DO MODAL DE ENTRADA COM O BACKEND
    const formEntrada = document.getElementById('form-entrada');
    if (formEntrada) {
        formEntrada.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btnSalvar = document.getElementById('btn-salvar-entrada');
            const textoOriginal = btnSalvar.innerHTML;

            btnSalvar.disabled = true;
            btnSalvar.innerHTML = '<span class="loading"></span> Salvando...';

            try {
                const dados = {
                    tamanho: parseInt(document.getElementById('ent-tamanho').value),
                    quantidade: parseInt(document.getElementById('ent-qtd').value),
                    responsavel: document.getElementById('ent-resp').value.trim(),
                    observacao: document.getElementById('ent-obs').value.trim() || null
                };

                const response = await api.post('/estoque/entrada', dados);

                if (typeof showToast === 'function') {
                    showToast(response.message || 'Entrada registrada com sucesso!', 'success');
                }

                // Registrar no histórico
                if (typeof registrarEvento === 'function') {
                    registrarEvento(
                        'ENTRADA_ESTOQUE',
                        `Entrada de ${dados.quantidade} unidades do tamanho ${formatarTamanho(dados.tamanho)}`,
                        `Responsável: ${dados.responsavel}${dados.observacao ? ' | Obs: ' + dados.observacao : ''}`
                    );
                }

                toggleModal(modal, false);
                formEntrada.reset();

                if (typeof loadEstoque === 'function') loadEstoque();
                if (typeof loadDashboard === 'function') loadDashboard();

            } catch (error) {
                console.error('Erro na entrada:', error);
                if (typeof showToast === 'function') {
                    showToast('Erro ao registrar entrada: ' + (error.message || 'Tente novamente'), 'error');
                }
            } finally {
                btnSalvar.disabled = false;
                btnSalvar.innerHTML = textoOriginal;
            }
        });
    }

    // 7. Carregar página inicial
    showPage('dashboard');
});

// ============================================================================
// FUNÇÕES GLOBAIS
// ============================================================================

function showPage(paginaId) {
    document.querySelectorAll('.menu-item').forEach(m => {
        m.classList.toggle('active', m.getAttribute('data-page') === paginaId);
    });

    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    const paginaAlvo = document.getElementById(paginaId);
    if (paginaAlvo) {
        paginaAlvo.classList.remove('hidden');
        carregarPagina(paginaId);
    }

    atualizarBotaoExportar(paginaId);
    atualizarTituloPagina(paginaId);

    if (window.innerWidth <= 768) fecharSidebar();
}

function atualizarBotaoExportar(paginaId) {
    const btnExportar = document.getElementById('btn-exportar-dashboard-header');
    const btnHistorico = document.getElementById('btn-historico-alertas');

    if (btnExportar) {
        btnExportar.style.display = paginaId === 'dashboard' ? 'inline-flex' : 'none';
    }
    if (btnHistorico) {
        btnHistorico.style.display = paginaId === 'dashboard' ? 'inline-flex' : 'none';
    }
}

function atualizarTituloPagina(paginaId) {
    const titulos = {
        'dashboard': '<i class="fas fa-home"></i> Dashboard',
        'estoque': '<i class="fas fa-boxes-stacked"></i> Controle de Estoque',
        'importar': '<i class="fas fa-file-csv"></i> Importar Turmas',
        'distribuir': '<i class="fas fa-hand-holding-heart"></i> Distribuição',
        'relatorios': '<i class="fas fa-chart-bar"></i> Relatórios',
        'relatorios-sgs': '<i class="fas fa-chart-line"></i> Relatórios SGS',
        'sincronizacao': '<i class="fas fa-sync-alt"></i> Sincronização SGS',
        'consulta-sgs': '<i class="fas fa-database"></i> Base de Dados SGS'
    };

    const pageTitle = document.getElementById('page-title');
    if (pageTitle) {
        pageTitle.innerHTML = titulos[paginaId] || '<i class="fas fa-home"></i> Dashboard';
    }
}

// function carregarPagina(paginaId) {
//     switch (paginaId) {
//         case 'dashboard': if (typeof loadDashboard === 'function') loadDashboard(); break;
//         case 'estoque': if (typeof loadEstoque === 'function') loadEstoque(); break;
//         case 'relatorios': if (typeof loadMovimentacoes === 'function') loadMovimentacoes(); break;
//         case 'distribuir': if (typeof limparFormulario === 'function') limparFormulario('form-dist'); break;
//         case 'relatorios-sgs': if (typeof loadDistribuicoesSGS === 'function') loadDistribuicoesSGS(); break;
//         case 'consulta-sgs': if (typeof loadTurmasSGS === 'function') loadTurmasSGS(); break;
//         case 'campo':
//             window.location.href = 'campo.html';
//             break;
//     }
// }


function carregarPagina(paginaId) {
    switch (paginaId) {
        case 'dashboard':
            if (typeof loadDashboard === 'function') loadDashboard();
            break;
        case 'estoque':
            if (typeof loadEstoque === 'function') loadEstoque();
            break;
        case 'relatorios':
            if (typeof loadMovimentacoes === 'function') loadMovimentacoes();
            break;
        case 'distribuir':
            if (typeof limparFormulario === 'function') limparFormulario('form-dist');
            break;
        case 'relatorios-sgs':
            if (typeof loadDistribuicoesSGS === 'function') loadDistribuicoesSGS();
            break;
        case 'consulta-sgs':
            if (typeof loadTurmasSGS === 'function') loadTurmasSGS();
            break;
        case 'campo':
            // ✅ REDIRECIONAR PARA O ARQUIVO SEPARADO
            window.location.href = 'campo.html';
            break;
    }
}

// function toggleModal(modalElement, show) {
//     if (!modalElement) return;
//     if (show) {
//         modalElement.classList.remove('hidden');
//         setTimeout(() => {
//             const firstInput = modalElement.querySelector('input, select, textarea');
//             if (firstInput) firstInput.focus();
//         }, 100);
//     } else {
//         modalElement.classList.add('hidden');
//         const form = modalElement.querySelector('form');
//         if (form) form.reset();
//     }
// }

// function toggleModal(modalElement, show) {
//     // ✅ VERIFICAÇÃO DE SEGURANÇA
//     if (!modalElement) {
//         console.warn('Modal não encontrado!');
//         return;
//     }
    
//     if (show) {
//         modalElement.classList.remove('hidden');
//         setTimeout(() => {
//             const firstInput = modalElement.querySelector('input, select, textarea');
//             if (firstInput) firstInput.focus();
//         }, 100);
//     } else {
//         modalElement.classList.add('hidden');
//         const form = modalElement.querySelector('form');
//         if (form) form.reset();
//     }
// }


function toggleModal(modalElement, show) {
    if (!modalElement) return; // ✅ Essa linha evita o erro
    
    if (show) {
        modalElement.classList.remove('hidden');
        setTimeout(() => {
            const firstInput = modalElement.querySelector('input, select, textarea');
            if (firstInput) firstInput.focus();
        }, 100);
    } else {
        modalElement.classList.add('hidden');
        const form = modalElement.querySelector('form');
        if (form) form.reset();
    }
}

function fecharSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    sidebar?.classList.remove('active');
    overlay?.classList.remove('active');
}

window.showPage = showPage;
window.toggleModal = toggleModal;


