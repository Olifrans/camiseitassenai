/**
 * Módulo de Relatórios - Movimentações de Estoque
 * Versão Blindada com Verificações de Segurança (Null Checks)
 */

let filtrosAtuais = {
    tipo: '',
    tamanho: '',
    dataInicio: '',
    dataFim: '',
    responsavel: '',
    codigoTurma: '',
    matriculaAluno: '',
    limite: 10,
    pagina: 1
};

let movimentacoesCache = [];
let totalRegistros = 0;
let totalPaginas = 0;

// Carregar movimentações com filtros e paginação
async function loadMovimentacoes() {
    try {
        // ✅ VERIFICAÇÃO DE SEGURANÇA: Garante que a tabela existe antes de manipular
        const tbody = document.querySelector('#tbl-mov tbody');
        if (!tbody) {
            console.warn('Tabela de movimentações (#tbl-mov tbody) não encontrada no DOM.');
            return;
        }

        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding: 40px;"><span class="loading"></span> Carregando movimentações...</td></tr>';

        const params = new URLSearchParams();
        if (filtrosAtuais.tipo) params.append('tipo', filtrosAtuais.tipo);
        if (filtrosAtuais.tamanho) params.append('tamanho', filtrosAtuais.tamanho);
        if (filtrosAtuais.dataInicio) params.append('dataInicio', filtrosAtuais.dataInicio);
        if (filtrosAtuais.dataFim) params.append('dataFim', filtrosAtuais.dataFim);
        if (filtrosAtuais.responsavel) params.append('responsavel', filtrosAtuais.responsavel);
        if (filtrosAtuais.codigoTurma) params.append('codigoTurma', filtrosAtuais.codigoTurma);
        if (filtrosAtuais.matriculaAluno) params.append('matriculaAluno', filtrosAtuais.matriculaAluno);
        params.append('limite', filtrosAtuais.limite);
        params.append('pagina', filtrosAtuais.pagina);

        const endpoint = `/relatorios/movimentacoes?${params.toString()}`;
        const response = await api.get(endpoint);

        movimentacoesCache = response.dados || [];
        totalRegistros = response.total || 0;
        totalPaginas = response.totalPaginas || 0;

        tbody.innerHTML = '';

        if (movimentacoesCache.length > 0) {
            const totalEl = document.getElementById('total-registros');
            if (totalEl) {
                totalEl.textContent = `(${totalRegistros} registro${totalRegistros !== 1 ? 's' : ''} - Página ${response.pagina} de ${totalPaginas})`;
            }

            movimentacoesCache.forEach(m => {
                const tipoClass = getTipoBadgeClass(m.tipo);

                const alunoInfo = m.alunoNome
                    ? `<div style="font-weight:600; font-size:0.9rem;">${m.alunoNome}</div>`
                    : '<span style="color:var(--text-light); font-style:italic;">-</span>';

                const matriculaInfo = m.alunoMatricula
                    ? `<div style="font-family:monospace; font-size:0.85rem; font-weight:600; color:var(--senai-blue);">${m.alunoMatricula}</div>`
                    : '<span style="color:var(--text-light);">-</span>';

                const turmaInfo = m.turmaCodigo
                    ? `<div style="font-weight:600;">${m.turmaCodigo}</div>
                       <div style="font-size:0.8rem; color:var(--text-secondary);">${m.turmaCurso || ''}</div>`
                    : '<span style="color:var(--text-light);">-</span>';

                const row = `
                    <tr>
                        <td>${formatarData(m.data)}</td>
                        <td><span class="badge ${tipoClass}">${m.tipo}</span></td>
                        <td><strong>${formatarTamanho(m.tamanho)}</strong></td>
                        <td style="text-align:center; font-weight:600;">${m.quantidade}</td>
                        <td>${alunoInfo}</td>
                        <td>${matriculaInfo}</td>
                        <td>${turmaInfo}</td>
                        <td>${m.responsavel || '-'}</td>
                        <td style="max-width:250px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${m.observacao || ''}">${m.observacao || '-'}</td>
                    </tr>
                `;
                tbody.innerHTML += row;
            });

            renderizarPaginacao(response.pagina, totalPaginas);
        } else {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding: 40px; color: var(--text-light);"><i class="fas fa-inbox" style="font-size:2.5rem; display:block; margin-bottom:15px;"></i><strong>Nenhuma movimentação encontrada</strong><br><small>Experimente ajustar os filtros aplicados</small></td></tr>';
            const totalEl = document.getElementById('total-registros');
            if (totalEl) totalEl.textContent = '(0 registros)';
        }
    } catch (error) {
        console.error('Erro ao carregar movimentações:', error);
        const tbody = document.querySelector('#tbl-mov tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding: 30px; color: var(--danger);"><i class="fas fa-exclamation-triangle" style="font-size:2rem; display:block; margin-bottom:10px;"></i>Erro ao carregar dados</td></tr>';
        }
        if (typeof showToast === 'function') {
            showToast('Erro ao carregar movimentações: ' + error.message, 'error');
        }
    }
}

function renderizarPaginacao(paginaAtual, totalPaginas) {
    const container = document.getElementById('pagination-container');
    if (!container) return;

    if (totalPaginas <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = '<div class="pagination-info">Página ' + paginaAtual + ' de ' + totalPaginas + '</div>';
    html += '<div class="pagination-buttons">';

    html += `<button ${paginaAtual === 1 ? 'disabled' : ''} onclick="irParaPagina(${paginaAtual - 1})"><i class="fas fa-chevron-left"></i></button>`;

    const inicio = Math.max(1, paginaAtual - 2);
    const fim = Math.min(totalPaginas, paginaAtual + 2);

    for (let i = inicio; i <= fim; i++) {
        html += `<button class="${i === paginaAtual ? 'active' : ''}" onclick="irParaPagina(${i})">${i}</button>`;
    }

    html += `<button ${paginaAtual === totalPaginas ? 'disabled' : ''} onclick="irParaPagina(${paginaAtual + 1})"><i class="fas fa-chevron-right"></i></button>`;
    html += '</div>';
    container.innerHTML = html;
}

function irParaPagina(pagina) {
    filtrosAtuais.pagina = pagina;
    loadMovimentacoes();
}

function getTipoBadgeClass(tipo) {
    switch(tipo) {
        case 'Entrada': return 'badge-ok';
        case 'Saida': 
        case 'Saída': return 'badge-err';
        case 'Distribuicao': 
        case 'Distribuição': return 'badge-warning';
        case 'Ajuste': return 'badge-info';
        default: return 'badge-ok';
    }
}

function aplicarFiltros() {
    filtrosAtuais.tipo = document.getElementById('filtro-tipo')?.value || '';
    filtrosAtuais.tamanho = document.getElementById('filtro-tamanho')?.value || '';
    filtrosAtuais.dataInicio = document.getElementById('filtro-data-inicio')?.value || '';
    filtrosAtuais.dataFim = document.getElementById('filtro-data-fim')?.value || '';
    filtrosAtuais.responsavel = document.getElementById('filtro-responsavel')?.value.trim() || '';
    filtrosAtuais.codigoTurma = document.getElementById('filtro-turma')?.value.trim() || '';
    filtrosAtuais.matriculaAluno = document.getElementById('filtro-matricula')?.value.trim() || '';
    filtrosAtuais.limite = parseInt(document.getElementById('rel-results-per-page')?.value || '10');
    filtrosAtuais.pagina = 1;

    loadMovimentacoes();
    if (typeof showToast === 'function') showToast('Filtros aplicados!', 'success');
}

function limparFiltros() {
    const elTipo = document.getElementById('filtro-tipo'); if(elTipo) elTipo.value = '';
    const elTamanho = document.getElementById('filtro-tamanho'); if(elTamanho) elTamanho.value = '';
    const elDataInicio = document.getElementById('filtro-data-inicio'); if(elDataInicio) elDataInicio.value = '';
    const elDataFim = document.getElementById('filtro-data-fim'); if(elDataFim) elDataFim.value = '';
    const elResponsavel = document.getElementById('filtro-responsavel'); if(elResponsavel) elResponsavel.value = '';
    const elTurma = document.getElementById('filtro-turma'); if(elTurma) elTurma.value = '';
    const elMatricula = document.getElementById('filtro-matricula'); if(elMatricula) elMatricula.value = '';
    const elPerPage = document.getElementById('rel-results-per-page'); if(elPerPage) elPerPage.value = '10';

    filtrosAtuais = {
        tipo: '', tamanho: '', dataInicio: '', dataFim: '', responsavel: '',
        codigoTurma: '', matriculaAluno: '', limite: 10, pagina: 1
    };

    loadMovimentacoes();
    if (typeof showToast === 'function') showToast('Filtros limpos!', 'info');
}

// Exportar CSV
async function exportarCSV() {
    if (totalRegistros === 0) {
        if (typeof showToast === 'function') showToast('Nenhum dado para exportar', 'error');
        return;
    }

    try {
        if (typeof showToast === 'function') showToast('Gerando arquivo CSV...', 'info');

        const params = new URLSearchParams();
        if (filtrosAtuais.tipo) params.append('tipo', filtrosAtuais.tipo);
        if (filtrosAtuais.tamanho) params.append('tamanho', filtrosAtuais.tamanho);
        if (filtrosAtuais.dataInicio) params.append('dataInicio', filtrosAtuais.dataInicio);
        if (filtrosAtuais.dataFim) params.append('dataFim', filtrosAtuais.dataFim);
        if (filtrosAtuais.responsavel) params.append('responsavel', filtrosAtuais.responsavel);
        if (filtrosAtuais.codigoTurma) params.append('codigoTurma', filtrosAtuais.codigoTurma);
        if (filtrosAtuais.matriculaAluno) params.append('matriculaAluno', filtrosAtuais.matriculaAluno);

        const response = await fetch(`http://localhost:5055/api/relatorios/movimentacoes/exportar?${params.toString()}`);
        if (!response.ok) throw new Error('Erro ao exportar');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio_movimentacoes_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        if (typeof showToast === 'function') showToast('CSV exportado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao exportar:', error);
        if (typeof showToast === 'function') showToast('Erro ao exportar CSV: ' + error.message, 'error');
    }
}

// Exportar PDF
async function exportarPDF() {
    if (totalRegistros === 0) {
        if (typeof showToast === 'function') showToast('Nenhum dado para exportar', 'error');
        return;
    }

    try {
        if (typeof showToast === 'function') showToast('Gerando arquivo PDF...', 'info');

        const params = new URLSearchParams();
        if (filtrosAtuais.dataInicio) params.append('dataInicio', filtrosAtuais.dataInicio);
        if (filtrosAtuais.dataFim) params.append('dataFim', filtrosAtuais.dataFim);

        const response = await fetch(`http://localhost:5055/api/pdf/relatorio-distribuicoes?${params.toString()}`);
        if (!response.ok) throw new Error('Erro ao gerar PDF');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio_distribuicoes_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        if (typeof showToast === 'function') showToast('PDF exportado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao exportar PDF:', error);
        if (typeof showToast === 'function') showToast('Erro ao exportar PDF: ' + error.message, 'error');
    }
}

function toggleFiltros() {
    const content = document.getElementById('filtros-content');
    const btn = document.getElementById('btn-toggle-filtros');
    if (!content || !btn) return;

    content.classList.toggle('collapsed');

    if (content.classList.contains('collapsed')) {
        btn.innerHTML = '<i class="fas fa-chevron-down"></i> Expandir';
    } else {
        btn.innerHTML = '<i class="fas fa-chevron-up"></i> Recolher';
    }
}

// Inicializar event listeners de forma segura
document.addEventListener('DOMContentLoaded', () => {
    const btnCarregar = document.getElementById('btn-carregar-mov');
    if (btnCarregar) btnCarregar.addEventListener('click', () => loadMovimentacoes());

    const btnAplicar = document.getElementById('btn-aplicar-filtros');
    if (btnAplicar) btnAplicar.addEventListener('click', aplicarFiltros);

    const btnLimpar = document.getElementById('btn-limpar-filtros');
    if (btnLimpar) btnLimpar.addEventListener('click', limparFiltros);

    const btnToggle = document.getElementById('btn-toggle-filtros');
    if (btnToggle) btnToggle.addEventListener('click', toggleFiltros);

    const btnExportarCsv = document.getElementById('btn-exportar-csv');
    if (btnExportarCsv) btnExportarCsv.addEventListener('click', exportarCSV);

    const btnExportarPdf = document.getElementById('btn-exportar-pdf');
    if (btnExportarPdf) btnExportarPdf.addEventListener('click', exportarPDF);

    const selectPerPage = document.getElementById('rel-results-per-page');
    if (selectPerPage) {
        selectPerPage.addEventListener('change', () => {
            filtrosAtuais.limite = parseInt(selectPerPage.value);
            filtrosAtuais.pagina = 1;
            loadMovimentacoes();
        });
    }

    ['filtro-responsavel', 'filtro-turma', 'filtro-matricula'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    aplicarFiltros();
                }
            });
        }
    });

    // Carrega os dados apenas se a tabela existir na página
    if (document.querySelector('#tbl-mov tbody')) {
        loadMovimentacoes();
    }
});











// /**
//  * Módulo de Relatórios - Movimentações de Estoque
//  * Com filtros avançados, paginação e exportação CSV/PDF profissional.
//  */

// let filtrosAtuais = {
//     tipo: '',
//     tamanho: '',
//     dataInicio: '',
//     dataFim: '',
//     responsavel: '',
//     codigoTurma: '',
//     matriculaAluno: '',
//     limite: 10,
//     pagina: 1
// };

// let movimentacoesCache = [];
// let totalRegistros = 0;
// let totalPaginas = 0;

// async function loadMovimentacoes() {
//     try {
//         const tbody = document.querySelector('#tbl-mov tbody');
//         tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding: 40px;"><span class="loading"></span> Carregando movimentações...</td></tr>';

//         const params = new URLSearchParams();
//         if (filtrosAtuais.tipo) params.append('tipo', filtrosAtuais.tipo);
//         if (filtrosAtuais.tamanho) params.append('tamanho', filtrosAtuais.tamanho);
//         if (filtrosAtuais.dataInicio) params.append('dataInicio', filtrosAtuais.dataInicio);
//         if (filtrosAtuais.dataFim) params.append('dataFim', filtrosAtuais.dataFim);
//         if (filtrosAtuais.responsavel) params.append('responsavel', filtrosAtuais.responsavel);
//         if (filtrosAtuais.codigoTurma) params.append('codigoTurma', filtrosAtuais.codigoTurma);
//         if (filtrosAtuais.matriculaAluno) params.append('matriculaAluno', filtrosAtuais.matriculaAluno);
//         params.append('limite', filtrosAtuais.limite);
//         params.append('pagina', filtrosAtuais.pagina);

//         const endpoint = `/relatorios/movimentacoes?${params.toString()}`;
//         const response = await api.get(endpoint);

//         movimentacoesCache = response.dados || [];
//         totalRegistros = response.total || 0;
//         totalPaginas = response.totalPaginas || 0;

//         tbody.innerHTML = '';

//         if (movimentacoesCache.length > 0) {
//             const totalEl = document.getElementById('total-registros');
//             if (totalEl) {
//                 totalEl.textContent = `(${totalRegistros} registro${totalRegistros !== 1 ? 's' : ''} - Página ${response.pagina} de ${totalPaginas})`;
//             }

//             movimentacoesCache.forEach(m => {
//                 const tipoClass = getTipoBadgeClass(m.tipo);
//                 const alunoInfo = m.alunoNome ? `<div style="font-weight:600; font-size:0.9rem;">${m.alunoNome}</div>` : '<span style="color:var(--text-light); font-style:italic;">-</span>';
//                 const matriculaInfo = m.alunoMatricula ? `<div style="font-family:monospace; font-size:0.85rem; font-weight:600; color:var(--senai-blue);">${m.alunoMatricula}</div>` : '<span style="color:var(--text-light);">-</span>';
//                 const turmaInfo = m.turmaCodigo ? `<div style="font-weight:600;">${m.turmaCodigo}</div><div style="font-size:0.8rem; color:var(--text-secondary);">${m.turmaCurso || ''}</div>` : '<span style="color:var(--text-light);">-</span>';

//                 tbody.innerHTML += `
//                     <tr>
//                         <td>${formatarData(m.data)}</td>
//                         <td><span class="badge ${tipoClass}">${m.tipo}</span></td>
//                         <td><strong>${formatarTamanho(m.tamanho)}</strong></td>
//                         <td style="text-align:center; font-weight:600;">${m.quantidade}</td>
//                         <td>${alunoInfo}</td>
//                         <td>${matriculaInfo}</td>
//                         <td>${turmaInfo}</td>
//                         <td>${m.responsavel || '-'}</td>
//                         <td style="max-width:250px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${m.observacao || ''}">${m.observacao || '-'}</td>
//                     </tr>`;
//             });
//             renderizarPaginacao(response.pagina, totalPaginas);
//         } else {
//             tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding: 40px; color: var(--text-light);"><i class="fas fa-inbox" style="font-size:2.5rem; display:block; margin-bottom:15px;"></i><strong>Nenhuma movimentação encontrada</strong><br><small>Experimente ajustar os filtros aplicados</small></td></tr>';
//             const totalEl = document.getElementById('total-registros');
//             if (totalEl) totalEl.textContent = '(0 registros)';
//         }
//     } catch (error) {
//         console.error('Erro ao carregar movimentações:', error);
//         showToast('Erro ao carregar movimentações: ' + error.message, 'error');
//         document.querySelector('#tbl-mov tbody').innerHTML = '<tr><td colspan="9" style="text-align:center; padding: 30px; color: var(--danger);"><i class="fas fa-exclamation-triangle" style="font-size:2rem; display:block; margin-bottom:10px;"></i>Erro ao carregar dados</td></tr>';
//     }
// }

// function renderizarPaginacao(paginaAtual, totalPaginas) {
//     const container = document.getElementById('pagination-container');
//     if (!container || totalPaginas <= 1) {
//         if(container) container.innerHTML = '';
//         return;
//     }

//     let html = `<div class="pagination-info">Página ${paginaAtual} de ${totalPaginas}</div><div class="pagination-buttons">`;
//     html += `<button ${paginaAtual === 1 ? 'disabled' : ''} onclick="irParaPagina(${paginaAtual - 1})"><i class="fas fa-chevron-left"></i></button>`;

//     const inicio = Math.max(1, paginaAtual - 2);
//     const fim = Math.min(totalPaginas, paginaAtual + 2);

//     for (let i = inicio; i <= fim; i++) {
//         html += `<button class="${i === paginaAtual ? 'active' : ''}" onclick="irParaPagina(${i})">${i}</button>`;
//     }
//     html += `<button ${paginaAtual === totalPaginas ? 'disabled' : ''} onclick="irParaPagina(${paginaAtual + 1})"><i class="fas fa-chevron-right"></i></button></div>`;
//     container.innerHTML = html;
// }

// function irParaPagina(pagina) {
//     filtrosAtuais.pagina = pagina;
//     loadMovimentacoes();
// }

// function getTipoBadgeClass(tipo) {
//     switch(tipo) {
//         case 'Entrada': return 'badge-ok';
//         case 'Saida': case 'Saída': return 'badge-err';
//         case 'Distribuicao': case 'Distribuição': return 'badge-warning';
//         case 'Ajuste': return 'badge-info';
//         default: return 'badge-ok';
//     }
// }

// function aplicarFiltros() {
//     filtrosAtuais.tipo = document.getElementById('filtro-tipo').value;
//     filtrosAtuais.tamanho = document.getElementById('filtro-tamanho').value;
//     filtrosAtuais.dataInicio = document.getElementById('filtro-data-inicio').value;
//     filtrosAtuais.dataFim = document.getElementById('filtro-data-fim').value;
//     filtrosAtuais.responsavel = document.getElementById('filtro-responsavel').value.trim();
//     filtrosAtuais.codigoTurma = document.getElementById('filtro-turma').value.trim();
//     filtrosAtuais.matriculaAluno = document.getElementById('filtro-matricula').value.trim();
//     filtrosAtuais.limite = parseInt(document.getElementById('rel-results-per-page').value);
//     filtrosAtuais.pagina = 1;
//     loadMovimentacoes();
//     showToast('Filtros aplicados!', 'success');
// }

// function limparFiltros() {
//     document.getElementById('filtro-tipo').value = '';
//     document.getElementById('filtro-tamanho').value = '';
//     document.getElementById('filtro-data-inicio').value = '';
//     document.getElementById('filtro-data-fim').value = '';
//     document.getElementById('filtro-responsavel').value = '';
//     document.getElementById('filtro-turma').value = '';
//     document.getElementById('filtro-matricula').value = '';
//     document.getElementById('rel-results-per-page').value = '10';

//     filtrosAtuais = { tipo: '', tamanho: '', dataInicio: '', dataFim: '', responsavel: '', codigoTurma: '', matriculaAluno: '', limite: 10, pagina: 1 };
//     loadMovimentacoes();
//     showToast('Filtros limpos!', 'info');
// }

// async function exportarCSV() {
//     if (totalRegistros === 0) { showToast('Nenhum dado para exportar', 'error'); return; }
//     try {
//         showToast('Gerando arquivo CSV...', 'info');
//         const params = new URLSearchParams();
//         if (filtrosAtuais.tipo) params.append('tipo', filtrosAtuais.tipo);
//         if (filtrosAtuais.tamanho) params.append('tamanho', filtrosAtuais.tamanho);
//         if (filtrosAtuais.dataInicio) params.append('dataInicio', filtrosAtuais.dataInicio);
//         if (filtrosAtuais.dataFim) params.append('dataFim', filtrosAtuais.dataFim);
//         if (filtrosAtuais.responsavel) params.append('responsavel', filtrosAtuais.responsavel);
//         if (filtrosAtuais.codigoTurma) params.append('codigoTurma', filtrosAtuais.codigoTurma);
//         if (filtrosAtuais.matriculaAluno) params.append('matriculaAluno', filtrosAtuais.matriculaAluno);

//         const response = await fetch(`http://localhost:5055/api/relatorios/movimentacoes/exportar?${params.toString()}`);
//         if (!response.ok) throw new Error('Erro ao exportar');
//         const blob = await response.blob();
//         const url = window.URL.createObjectURL(blob);
//         const a = document.createElement('a');
//         a.href = url;
//         a.download = `relatorio_movimentacoes_${new Date().toISOString().split('T')[0]}.csv`;
//         document.body.appendChild(a); a.click();
//         window.URL.revokeObjectURL(url); document.body.removeChild(a);
//         showToast('CSV exportado com sucesso!', 'success');
//     } catch (error) {
//         console.error('Erro ao exportar:', error);
//         showToast('Erro ao exportar CSV: ' + error.message, 'error');
//     }
// }

// // ========================================================================
// // ✅ EXPORTAR PDF PROFISSIONAL (Estilo SENAI - Client-Side)
// // ========================================================================
// // async function exportarRelatoriosPDF() {
// //     if (totalRegistros === 0) { showToast('Nenhum dado para exportar', 'error'); return; }
    
// //     try {
// //         showToast('Gerando PDF profissional, aguarde...', 'info');
// //         const { jsPDF } = window.jspdf;
// //         const painel = document.querySelector('#relatorios .content-panel');
        
// //         // Oculta botões temporariamente para não sair no PDF
// //         const btnExportar = document.getElementById('btn-exportar-pdf');
// //         if(btnExportar) btnExportar.style.display = 'none';
// //         await new Promise(resolve => setTimeout(resolve, 300));

// //         // Captura o painel (escala 1.5 para boa qualidade, landscape para caber a tabela)
// //         const canvas = await html2canvas(painel, {
// //             scale: 1.5, useCORS: true, allowTaint: true, backgroundColor: '#ffffff',
// //             scrollX: 0, scrollY: 0, windowWidth: painel.scrollWidth, windowHeight: painel.scrollHeight, logging: false
// //         });

// //         if(btnExportar) btnExportar.style.display = 'inline-flex';
// //         const imgData = canvas.toDataURL('image/png');
        
// //         // PDF em modo Paisagem (Landscape) para caber todas as colunas da tabela
// //         const pdf = new jsPDF('l', 'mm', 'a4');
// //         const pdfWidth = pdf.internal.pageSize.getWidth();
// //         const pdfHeight = pdf.internal.pageSize.getHeight();
// //         const margem = 10;
// //         const larguraUtil = pdfWidth - (margem * 2);

// //         // 1. CABEÇALHO SENAI
// //         const logoCanvas = document.createElement('canvas');
// //         logoCanvas.width = 200; logoCanvas.height = 60;
// //         const logoCtx = logoCanvas.getContext('2d');
// //         logoCtx.fillStyle = '#FFFFFF'; logoCtx.fillRect(0, 0, 200, 60);
// //         logoCtx.fillStyle = '#E30613'; logoCtx.font = 'bold 36px Arial';
// //         logoCtx.fillText('SENAI', 10, 40);
        
// //         pdf.addImage(logoCanvas.toDataURL('image/png'), 'PNG', margem, 8, 40, 12);
// //         pdf.setFontSize(8); pdf.setTextColor(50, 50, 50); pdf.setFont(undefined, 'normal');
// //         pdf.text('Escola Senai "Luis Eulálio de Bueno Vidigal Filho"', 55, 10);
// //         pdf.text('CFP 124 - Gestão de Camisetas', 55, 14);
// //         pdf.text('Relatório de Movimentações de Estoque', 55, 18);

// //         pdf.setDrawColor(227, 6, 19); pdf.setLineWidth(0.5);
// //         pdf.line(margem, 22, pdfWidth - margem, 22);

// //         pdf.setFontSize(10); pdf.setTextColor(26, 58, 107); pdf.setFont(undefined, 'bold');
// //         pdf.text('RELATÓRIO DE MOVIMENTAÇÕES DE ESTOQUE', margem, 28);

// //         pdf.setFontSize(8); pdf.setTextColor(100, 100, 100); pdf.setFont(undefined, 'normal');
// //         const dataAtual = new Date().toLocaleString('pt-BR');
// //         pdf.text(`Gerado em: ${dataAtual}`, margem, 33);
// //         pdf.text(`Usuário: ADMINISTRADOR | Unidade: CFP 124`, margem, 37);

// //         // Mostra filtros aplicados no PDF
// //         let filtrosText = 'Filtros: ';
// //         if (filtrosAtuais.tipo) filtrosText += `Tipo: ${filtrosAtuais.tipo} | `;
// //         if (filtrosAtuais.dataInicio) filtrosText += `De: ${filtrosAtuais.dataInicio} | `;
// //         if (filtrosAtuais.dataFim) filtrosText += `Até: ${filtrosAtuais.dataFim}`;
// //         if (filtrosText === 'Filtros: ') filtrosText += 'Nenhum filtro aplicado (Todos os registros)';
// //         pdf.text(filtrosText, margem, 41);

// //         pdf.setDrawColor(200, 200, 200); pdf.line(margem, 44, pdfWidth - margem, 44);

// //         // 2. ADICIONA A TABELA CAPTURADA
// //         const imgProps = pdf.getImageProperties(imgData);
// //         const imgHeight = (imgProps.height * larguraUtil) / imgProps.width;
        
// //         let heightLeft = imgHeight;
// //         let position = 48;
// //         let pageNumber = 1;

// //         pdf.addImage(imgData, 'PNG', margem, position, larguraUtil, imgHeight);
// //         heightLeft -= (pdfHeight - position);

// //         while (heightLeft > 0) {
// //             pdf.addPage();
// //             pageNumber++;
// //             position = heightLeft - imgHeight;
            
// //             pdf.setFontSize(8); pdf.setTextColor(26, 58, 107);
// //             pdf.text(`Relatório de Movimentações - Página ${pageNumber}`, margem, 10);
// //             pdf.setDrawColor(200, 200, 200); pdf.line(margem, 12, pdfWidth - margem, 12);
// //             pdf.addImage(imgData, 'PNG', margem, 15, larguraUtil, imgHeight);
// //             heightLeft -= pdfHeight;
// //         }

// //         // 3. RODAPÉ COM NUMERAÇÃO
// //         const totalPages = pdf.internal.getNumberOfPages();
// //         for (let i = 1; i <= totalPages; i++) {
// //             pdf.setPage(i);
// //             pdf.setFontSize(7); pdf.setTextColor(150, 150, 150);
// //             pdf.text(`Página ${i} de ${totalPages}`, pdfWidth - 35, pdfHeight - 8);
// //         }

// //         pdf.save(`Relatorio_Movimentacoes_${new Date().toISOString().split('T')[0]}.pdf`);
// //         showToast('Relatório exportado com sucesso!', 'success');

// //     } catch (error) {
// //         console.error('Erro ao exportar PDF:', error);
// //         showToast('Erro ao gerar PDF do relatório.', 'error');
// //     }
// // }

// // ========================================================================
// // ✅ EXPORTAR PDF PROFISSIONAL (Apenas Dados + Cabeçalho)
// // ========================================================================
// async function exportarRelatoriosPDF() {
//     if (totalRegistros === 0) { showToast('Nenhum dado para exportar', 'error'); return; }
    
//     try {
//         showToast('Gerando PDF profissional, aguarde...', 'info');
//         const { jsPDF } = window.jspdf;
//         const painel = document.querySelector('#relatorios .content-panel');
        
//         // Elementos para ocultar temporariamente
//         const elementosParaOcultar = [
//             document.querySelector('.filter-section'),      // Filtros avançados
//             document.querySelector('.panel-toolbar'),        // Toolbar com botões
//             document.querySelector('.btn-voltar'),           // Botão Voltar
//             document.querySelector('.pagination'),           // Paginação
//             document.getElementById('pagination-container')  // Container de paginação
//         ];

//         // Oculta todos os elementos
//         elementosParaOcultar.forEach(el => {
//             if (el) el.style.display = 'none';
//         });

//         // Aguarda renderização
//         await new Promise(resolve => setTimeout(resolve, 300));

//         // Captura APENAS a tabela (sem filtros e botões)
//         const tabelaContainer = document.querySelector('#tbl-mov').parentElement;
        
//         const canvas = await html2canvas(tabelaContainer, {
//             scale: 2, // Qualidade maior para a tabela
//             useCORS: true, 
//             allowTaint: true, 
//             backgroundColor: '#ffffff',
//             scrollX: 0, 
//             scrollY: 0, 
//             windowWidth: tabelaContainer.scrollWidth, 
//             windowHeight: tabelaContainer.scrollHeight, 
//             logging: false
//         });

//         // Restaura os elementos ocultados
//         elementosParaOcultar.forEach(el => {
//             if (el) el.style.display = '';
//         });

//         const imgData = canvas.toDataURL('image/png');
        
//         // PDF em modo Paisagem (Landscape) para caber todas as colunas
//         const pdf = new jsPDF('l', 'mm', 'a4');
//         const pdfWidth = pdf.internal.pageSize.getWidth();
//         const pdfHeight = pdf.internal.pageSize.getHeight();
//         const margem = 10;
//         const larguraUtil = pdfWidth - (margem * 2);

//         // 1. CABEÇALHO SENAI PROFISSIONAL
//         const logoCanvas = document.createElement('canvas');
//         logoCanvas.width = 200; 
//         logoCanvas.height = 60;
//         const logoCtx = logoCanvas.getContext('2d');
//         logoCtx.fillStyle = '#FFFFFF'; 
//         logoCtx.fillRect(0, 0, 200, 60);
//         logoCtx.fillStyle = '#E30613'; 
//         logoCtx.font = 'bold 36px Arial';
//         logoCtx.fillText('SENAI', 10, 40);
        
//         pdf.addImage(logoCanvas.toDataURL('image/png'), 'PNG', margem, 8, 40, 12);
        
//         pdf.setFontSize(8); 
//         pdf.setTextColor(50, 50, 50); 
//         pdf.setFont(undefined, 'normal');
//         pdf.text('Escola Senai "Luis Eulálio de Bueno Vidigal Filho"', 55, 10);
//         pdf.text('CFP 124 - Gestão de Camisetas', 55, 14);
//         pdf.text('Relatório de Movimentações de Estoque', 55, 18);

//         pdf.setDrawColor(227, 6, 19); 
//         pdf.setLineWidth(0.5);
//         pdf.line(margem, 22, pdfWidth - margem, 22);

//         // 2. TÍTULO E INFORMAÇÕES
//         pdf.setFontSize(11); 
//         pdf.setTextColor(26, 58, 107); 
//         pdf.setFont(undefined, 'bold');
//         pdf.text('RELATÓRIO DE MOVIMENTAÇÕES DE ESTOQUE', margem, 30);

//         pdf.setFontSize(8); 
//         pdf.setTextColor(100, 100, 100); 
//         pdf.setFont(undefined, 'normal');
//         const dataAtual = new Date().toLocaleString('pt-BR');
//         pdf.text(`Gerado em: ${dataAtual}`, margem, 35);
//         pdf.text(`Usuário: ADMINISTRADOR | Unidade: CFP 124`, margem, 39);

//         // Mostra filtros aplicados (se houver)
//         let filtrosText = 'Filtros: ';
//         if (filtrosAtuais.tipo) filtrosText += `Tipo: ${filtrosAtuais.tipo} | `;
//         if (filtrosAtuais.dataInicio) filtrosText += `De: ${filtrosAtuais.dataInicio} | `;
//         if (filtrosAtuais.dataFim) filtrosText += `Até: ${filtrosAtuais.dataFim}`;
//         if (filtrosText === 'Filtros: ') filtrosText += 'Nenhum filtro aplicado (Todos os registros)';
        
//         pdf.text(filtrosText, margem, 43);

//         pdf.setDrawColor(200, 200, 200); 
//         pdf.line(margem, 46, pdfWidth - margem, 46);

//         // 3. ADICIONA A TABELA CAPTURADA
//         const imgProps = pdf.getImageProperties(imgData);
//         const imgHeight = (imgProps.height * larguraUtil) / imgProps.width;
        
//         let heightLeft = imgHeight;
//         let position = 50; // Começa após o cabeçalho
//         let pageNumber = 1;

//         pdf.addImage(imgData, 'PNG', margem, position, larguraUtil, imgHeight);
//         heightLeft -= (pdfHeight - position);

//         // Adiciona páginas extras se necessário
//         while (heightLeft > 0) {
//             pdf.addPage();
//             pageNumber++;
//             position = heightLeft - imgHeight;
            
//             // Cabeçalho simplificado nas páginas seguintes
//             pdf.setFontSize(8); 
//             pdf.setTextColor(26, 58, 107);
//             pdf.text(`Relatório de Movimentações - Página ${pageNumber}`, margem, 10);
//             pdf.setDrawColor(200, 200, 200); 
//             pdf.line(margem, 12, pdfWidth - margem, 12);
            
//             pdf.addImage(imgData, 'PNG', margem, 15, larguraUtil, imgHeight);
//             heightLeft -= pdfHeight;
//         }

//         // 4. RODAPÉ COM NUMERAÇÃO
//         const totalPages = pdf.internal.getNumberOfPages();
//         for (let i = 1; i <= totalPages; i++) {
//             pdf.setPage(i);
//             pdf.setFontSize(7); 
//             pdf.setTextColor(150, 150, 150);
//             pdf.text(`Página ${i} de ${totalPages}`, pdfWidth - 35, pdfHeight - 8);
//         }

//         pdf.save(`Relatorio_Movimentacoes_${new Date().toISOString().split('T')[0]}.pdf`);
//         showToast('Relatório exportado com sucesso!', 'success');

//     } catch (error) {
//         console.error('Erro ao exportar PDF:', error);
//         showToast('Erro ao gerar PDF do relatório.', 'error');
//     }
// }



// function toggleFiltros() {
//     const content = document.getElementById('filtros-content');
//     const btn = document.getElementById('btn-toggle-filtros');
//     content.classList.toggle('collapsed');
//     btn.innerHTML = content.classList.contains('collapsed') ? '<i class="fas fa-chevron-down"></i> Expandir' : '<i class="fas fa-chevron-up"></i> Recolher';
// }

// // Inicializar event listeners
// document.addEventListener('DOMContentLoaded', () => {
//     const btnCarregar = document.getElementById('btn-carregar-mov');
//     if (btnCarregar) btnCarregar.addEventListener('click', () => loadMovimentacoes());

//     const btnAplicar = document.getElementById('btn-aplicar-filtros');
//     if (btnAplicar) btnAplicar.addEventListener('click', aplicarFiltros);

//     const btnLimpar = document.getElementById('btn-limpar-filtros');
//     if (btnLimpar) btnLimpar.addEventListener('click', limparFiltros);

//     const btnToggle = document.getElementById('btn-toggle-filtros');
//     if (btnToggle) btnToggle.addEventListener('click', toggleFiltros);

//     const btnExportarCsv = document.getElementById('btn-exportar-csv');
//     if (btnExportarCsv) btnExportarCsv.addEventListener('click', exportarCSV);

//     // ✅ Listener atualizado para a nova função de PDF profissional
//     const btnExportarPdf = document.getElementById('btn-exportar-pdf');
//     if (btnExportarPdf) btnExportarPdf.addEventListener('click', exportarRelatoriosPDF);

//     const selectPerPage = document.getElementById('rel-results-per-page');
//     if (selectPerPage) {
//         selectPerPage.addEventListener('change', () => {
//             filtrosAtuais.limite = parseInt(selectPerPage.value);
//             filtrosAtuais.pagina = 1;
//             loadMovimentacoes();
//         });
//     }

//     ['filtro-responsavel', 'filtro-turma', 'filtro-matricula'].forEach(id => {
//         const el = document.getElementById(id);
//         if (el) {
//             el.addEventListener('keypress', (e) => {
//                 if (e.key === 'Enter') { e.preventDefault(); aplicarFiltros(); }
//             });
//         }
//     });

//     loadMovimentacoes();
// });










// // /**
// //  * Módulo de Relatórios - Movimentações de Estoque
// //  * Com filtros avançados, paginação e exportação CSV/PDF via backend.
// //  */

// // let filtrosAtuais = {
// //     tipo: '',
// //     tamanho: '',
// //     dataInicio: '',
// //     dataFim: '',
// //     responsavel: '',
// //     codigoTurma: '',
// //     matriculaAluno: '',
// //     limite: 10,
// //     pagina: 1
// // };

// // let movimentacoesCache = [];
// // let totalRegistros = 0;
// // let totalPaginas = 0;

// // // Carregar movimentações com filtros e paginação
// // async function loadMovimentacoes() {
// //     try {
// //         const tbody = document.querySelector('#tbl-mov tbody');
// //         tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding: 40px;"><span class="loading"></span> Carregando movimentações...</td></tr>';

// //         const params = new URLSearchParams();
// //         if (filtrosAtuais.tipo) params.append('tipo', filtrosAtuais.tipo);
// //         if (filtrosAtuais.tamanho) params.append('tamanho', filtrosAtuais.tamanho);
// //         if (filtrosAtuais.dataInicio) params.append('dataInicio', filtrosAtuais.dataInicio);
// //         if (filtrosAtuais.dataFim) params.append('dataFim', filtrosAtuais.dataFim);
// //         if (filtrosAtuais.responsavel) params.append('responsavel', filtrosAtuais.responsavel);
// //         if (filtrosAtuais.codigoTurma) params.append('codigoTurma', filtrosAtuais.codigoTurma);
// //         if (filtrosAtuais.matriculaAluno) params.append('matriculaAluno', filtrosAtuais.matriculaAluno);
// //         params.append('limite', filtrosAtuais.limite);
// //         params.append('pagina', filtrosAtuais.pagina);

// //         const endpoint = `/relatorios/movimentacoes?${params.toString()}`;
// //         const response = await api.get(endpoint);

// //         movimentacoesCache = response.dados || [];
// //         totalRegistros = response.total || 0;
// //         totalPaginas = response.totalPaginas || 0;

// //         tbody.innerHTML = '';

// //         if (movimentacoesCache.length > 0) {
// //             const totalEl = document.getElementById('total-registros');
// //             if (totalEl) {
// //                 totalEl.textContent = `(${totalRegistros} registro${totalRegistros !== 1 ? 's' : ''} - Página ${response.pagina} de ${totalPaginas})`;
// //             }

// //             movimentacoesCache.forEach(m => {
// //                 const tipoClass = getTipoBadgeClass(m.tipo);

// //                 const alunoInfo = m.alunoNome
// //                     ? `<div style="font-weight:600; font-size:0.9rem;">${m.alunoNome}</div>`
// //                     : '<span style="color:var(--text-light); font-style:italic;">-</span>';

// //                 const matriculaInfo = m.alunoMatricula
// //                     ? `<div style="font-family:monospace; font-size:0.85rem; font-weight:600; color:var(--senai-blue);">${m.alunoMatricula}</div>`
// //                     : '<span style="color:var(--text-light);">-</span>';

// //                 const turmaInfo = m.turmaCodigo
// //                     ? `<div style="font-weight:600;">${m.turmaCodigo}</div>
// //                        <div style="font-size:0.8rem; color:var(--text-secondary);">${m.turmaCurso || ''}</div>`
// //                     : '<span style="color:var(--text-light);">-</span>';

// //                 const row = `
// //                     <tr>
// //                         <td>${formatarData(m.data)}</td>
// //                         <td><span class="badge ${tipoClass}">${m.tipo}</span></td>
// //                         <td><strong>${formatarTamanho(m.tamanho)}</strong></td>
// //                         <td style="text-align:center; font-weight:600;">${m.quantidade}</td>
// //                         <td>${alunoInfo}</td>
// //                         <td>${matriculaInfo}</td>
// //                         <td>${turmaInfo}</td>
// //                         <td>${m.responsavel || '-'}</td>
// //                         <td style="max-width:250px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${m.observacao || ''}">${m.observacao || '-'}</td>
// //                     </tr>
// //                 `;
// //                 tbody.innerHTML += row;
// //             });

// //             renderizarPaginacao(response.pagina, totalPaginas);
// //         } else {
// //             tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding: 40px; color: var(--text-light);"><i class="fas fa-inbox" style="font-size:2.5rem; display:block; margin-bottom:15px;"></i><strong>Nenhuma movimentação encontrada</strong><br><small>Experimente ajustar os filtros aplicados</small></td></tr>';
// //             const totalEl = document.getElementById('total-registros');
// //             if (totalEl) totalEl.textContent = '(0 registros)';
// //         }
// //     } catch (error) {
// //         console.error('Erro ao carregar movimentações:', error);
// //         showToast('Erro ao carregar movimentações: ' + error.message, 'error');
// //         document.querySelector('#tbl-mov tbody').innerHTML = '<tr><td colspan="9" style="text-align:center; padding: 30px; color: var(--danger);"><i class="fas fa-exclamation-triangle" style="font-size:2rem; display:block; margin-bottom:10px;"></i>Erro ao carregar dados</td></tr>';
// //     }
// // }

// // function renderizarPaginacao(paginaAtual, totalPaginas) {
// //     const container = document.getElementById('pagination-container');
// //     if (!container) return;

// //     if (totalPaginas <= 1) {
// //         container.innerHTML = '';
// //         return;
// //     }

// //     let html = '<div class="pagination-info">Página ' + paginaAtual + ' de ' + totalPaginas + '</div>';
// //     html += '<div class="pagination-buttons">';

// //     html += `<button ${paginaAtual === 1 ? 'disabled' : ''} onclick="irParaPagina(${paginaAtual - 1})"><i class="fas fa-chevron-left"></i></button>`;

// //     const inicio = Math.max(1, paginaAtual - 2);
// //     const fim = Math.min(totalPaginas, paginaAtual + 2);

// //     for (let i = inicio; i <= fim; i++) {
// //         html += `<button class="${i === paginaAtual ? 'active' : ''}" onclick="irParaPagina(${i})">${i}</button>`;
// //     }

// //     html += `<button ${paginaAtual === totalPaginas ? 'disabled' : ''} onclick="irParaPagina(${paginaAtual + 1})"><i class="fas fa-chevron-right"></i></button>`;
// //     html += '</div>';
// //     container.innerHTML = html;
// // }

// // function irParaPagina(pagina) {
// //     filtrosAtuais.pagina = pagina;
// //     loadMovimentacoes();
// // }

// // function getTipoBadgeClass(tipo) {
// //     switch(tipo) {
// //         case 'Entrada': return 'badge-ok';
// //         case 'Saida': 
// //         case 'Saída': return 'badge-err';
// //         case 'Distribuicao': 
// //         case 'Distribuição': return 'badge-warning';
// //         case 'Ajuste': return 'badge-info';
// //         default: return 'badge-ok';
// //     }
// // }

// // function aplicarFiltros() {
// //     filtrosAtuais.tipo = document.getElementById('filtro-tipo').value;
// //     filtrosAtuais.tamanho = document.getElementById('filtro-tamanho').value;
// //     filtrosAtuais.dataInicio = document.getElementById('filtro-data-inicio').value;
// //     filtrosAtuais.dataFim = document.getElementById('filtro-data-fim').value;
// //     filtrosAtuais.responsavel = document.getElementById('filtro-responsavel').value.trim();
// //     filtrosAtuais.codigoTurma = document.getElementById('filtro-turma').value.trim();
// //     filtrosAtuais.matriculaAluno = document.getElementById('filtro-matricula').value.trim();
// //     filtrosAtuais.limite = parseInt(document.getElementById('rel-results-per-page').value);
// //     filtrosAtuais.pagina = 1;

// //     loadMovimentacoes();
// //     showToast('Filtros aplicados!', 'success');
// // }

// // function limparFiltros() {
// //     document.getElementById('filtro-tipo').value = '';
// //     document.getElementById('filtro-tamanho').value = '';
// //     document.getElementById('filtro-data-inicio').value = '';
// //     document.getElementById('filtro-data-fim').value = '';
// //     document.getElementById('filtro-responsavel').value = '';
// //     document.getElementById('filtro-turma').value = '';
// //     document.getElementById('filtro-matricula').value = '';
// //     document.getElementById('rel-results-per-page').value = '10';

// //     filtrosAtuais = {
// //         tipo: '', tamanho: '', dataInicio: '', dataFim: '', responsavel: '',
// //         codigoTurma: '', matriculaAluno: '', limite: 10, pagina: 1
// //     };

// //     loadMovimentacoes();
// //     showToast('Filtros limpos!', 'info');
// // }

// // // Exportar CSV
// // async function exportarCSV() {
// //     if (totalRegistros === 0) {
// //         showToast('Nenhum dado para exportar', 'error');
// //         return;
// //     }

// //     try {
// //         showToast('Gerando arquivo CSV...', 'info');

// //         const params = new URLSearchParams();
// //         if (filtrosAtuais.tipo) params.append('tipo', filtrosAtuais.tipo);
// //         if (filtrosAtuais.tamanho) params.append('tamanho', filtrosAtuais.tamanho);
// //         if (filtrosAtuais.dataInicio) params.append('dataInicio', filtrosAtuais.dataInicio);
// //         if (filtrosAtuais.dataFim) params.append('dataFim', filtrosAtuais.dataFim);
// //         if (filtrosAtuais.responsavel) params.append('responsavel', filtrosAtuais.responsavel);
// //         if (filtrosAtuais.codigoTurma) params.append('codigoTurma', filtrosAtuais.codigoTurma);
// //         if (filtrosAtuais.matriculaAluno) params.append('matriculaAluno', filtrosAtuais.matriculaAluno);

// //         const response = await fetch(`http://localhost:5055/api/relatorios/movimentacoes/exportar?${params.toString()}`);
// //         if (!response.ok) throw new Error('Erro ao exportar');

// //         const blob = await response.blob();
// //         const url = window.URL.createObjectURL(blob);
// //         const a = document.createElement('a');
// //         a.href = url;
// //         a.download = `relatorio_movimentacoes_${new Date().toISOString().split('T')[0]}.csv`;
// //         document.body.appendChild(a);
// //         a.click();
// //         window.URL.revokeObjectURL(url);
// //         document.body.removeChild(a);

// //         showToast('CSV exportado com sucesso!', 'success');
// //     } catch (error) {
// //         console.error('Erro ao exportar:', error);
// //         showToast('Erro ao exportar CSV: ' + error.message, 'error');
// //     }
// // }

// // // ✅ Exportar PDF (Com suporte aos filtros de data e tipo)
// // async function exportarPDF() {
// //     if (totalRegistros === 0) {
// //         showToast('Nenhum dado para exportar', 'error');
// //         return;
// //     }

// //     try {
// //         showToast('Gerando arquivo PDF...', 'info');

// //         const params = new URLSearchParams();
// //         if (filtrosAtuais.dataInicio) params.append('dataInicio', filtrosAtuais.dataInicio);
// //         if (filtrosAtuais.dataFim) params.append('dataFim', filtrosAtuais.dataFim);
// //         // O backend do PDF pode ser expandido para aceitar 'tipo' e 'tamanho' futuramente

// //         const response = await fetch(`http://localhost:5055/api/pdf/relatorio-distribuicoes?${params.toString()}`);
// //         if (!response.ok) throw new Error('Erro ao gerar PDF');

// //         const blob = await response.blob();
// //         const url = window.URL.createObjectURL(blob);
// //         const a = document.createElement('a');
// //         a.href = url;
// //         a.download = `relatorio_distribuicoes_${new Date().toISOString().split('T')[0]}.pdf`;
// //         document.body.appendChild(a);
// //         a.click();
// //         window.URL.revokeObjectURL(url);
// //         document.body.removeChild(a);

// //         showToast('PDF exportado com sucesso!', 'success');
// //     } catch (error) {
// //         console.error('Erro ao exportar PDF:', error);
// //         showToast('Erro ao exportar PDF: ' + error.message, 'error');
// //     }
// // }

// // function toggleFiltros() {
// //     const content = document.getElementById('filtros-content');
// //     const btn = document.getElementById('btn-toggle-filtros');

// //     content.classList.toggle('collapsed');

// //     if (content.classList.contains('collapsed')) {
// //         btn.innerHTML = '<i class="fas fa-chevron-down"></i> Expandir';
// //     } else {
// //         btn.innerHTML = '<i class="fas fa-chevron-up"></i> Recolher';
// //     }
// // }

// // // Inicializar event listeners
// // document.addEventListener('DOMContentLoaded', () => {
// //     const btnCarregar = document.getElementById('btn-carregar-mov');
// //     if (btnCarregar) btnCarregar.addEventListener('click', () => loadMovimentacoes());

// //     const btnAplicar = document.getElementById('btn-aplicar-filtros');
// //     if (btnAplicar) btnAplicar.addEventListener('click', aplicarFiltros);

// //     const btnLimpar = document.getElementById('btn-limpar-filtros');
// //     if (btnLimpar) btnLimpar.addEventListener('click', limparFiltros);

// //     const btnToggle = document.getElementById('btn-toggle-filtros');
// //     if (btnToggle) btnToggle.addEventListener('click', toggleFiltros);

// //     const btnExportarCsv = document.getElementById('btn-exportar-csv');
// //     if (btnExportarCsv) btnExportarCsv.addEventListener('click', exportarCSV);

// //     // ✅ Listener para o botão de PDF
// //     const btnExportarPdf = document.getElementById('btn-exportar-pdf');
// //     if (btnExportarPdf) btnExportarPdf.addEventListener('click', exportarPDF);

// //     const selectPerPage = document.getElementById('rel-results-per-page');
// //     if (selectPerPage) {
// //         selectPerPage.addEventListener('change', () => {
// //             filtrosAtuais.limite = parseInt(selectPerPage.value);
// //             filtrosAtuais.pagina = 1;
// //             loadMovimentacoes();
// //         });
// //     }

// //     ['filtro-responsavel', 'filtro-turma', 'filtro-matricula'].forEach(id => {
// //         const el = document.getElementById(id);
// //         if (el) {
// //             el.addEventListener('keypress', (e) => {
// //                 if (e.key === 'Enter') {
// //                     e.preventDefault();
// //                     aplicarFiltros();
// //                 }
// //             });
// //         }
// //     });

// //     loadMovimentacoes();
// // });
