/**
 * Módulo de Consulta da Base SGS (Cache Local)
 * Exibe turmas e alunos sincronizados do sistema SGS/Diário FIC.
 */

// ====================================================================
// CONTROLE DE ABAS (Função Global para funcionar no onclick do HTML)
// ====================================================================
function mostrarAba(aba) {
    // Esconde todas as seções
    const secaoTurmas = document.getElementById('secao-turmas');
    const secaoAlunos = document.getElementById('secao-alunos');
    
    if (secaoTurmas) secaoTurmas.classList.add('hidden');
    if (secaoAlunos) secaoAlunos.classList.add('hidden');

    // Remove destaque de todas as abas
    const tabTurmas = document.getElementById('tab-turmas');
    const tabAlunos = document.getElementById('tab-alunos');
    
    if (tabTurmas) tabTurmas.style.borderBottom = 'none';
    if (tabAlunos) tabAlunos.style.borderBottom = 'none';

    // Ativa a aba selecionada
    if (aba === 'turmas') {
        if (secaoTurmas) secaoTurmas.classList.remove('hidden');
        if (tabTurmas) tabTurmas.style.borderBottom = '3px solid var(--senai-blue)';
        loadTurmasSGS();
    } else {
        if (secaoAlunos) secaoAlunos.classList.remove('hidden');
        if (tabAlunos) tabAlunos.style.borderBottom = '3px solid var(--senai-blue)';
        loadAlunosSGS();
    }
}

// ====================================================================
// CARREGAR TURMAS SGS (COM TODOS OS CAMPOS)
// ====================================================================
async function loadTurmasSGS() {
    const tbody = document.querySelector('#tbl-turmas-sgs tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="15" style="text-align:center; padding: 30px;"><span class="loading"></span> Carregando turmas...</td></tr>';

    const buscaInput = document.getElementById('busca-turma');
    const busca = buscaInput ? buscaInput.value.trim() : '';

    try {
        const endpoint = busca
            ? `/sincronizacao/turmas?busca=${encodeURIComponent(busca)}`
            : '/sincronizacao/turmas';

        const data = await api.get(endpoint);
        tbody.innerHTML = '';

        if (data && data.length > 0) {
            data.forEach(t => {
                const badgeClass = t.isTurmaGratuita ? 'badge-ok' : 'badge-warning';
                const badgeText = t.isTurmaGratuita ? 'GRATUITA' : 'PAGA';

                const row = `
                    <tr>
                        <td><strong>${t.codigoTurmaExterno || '-'}</strong></td>
                        <td>
                            <div style="font-weight:600;">${t.nomeCurso || '-'}</div>
                            <div style="font-size:0.85rem; color:var(--text-secondary);">${t.nomeTurma || ''}</div>
                        </td>
                        <td>${t.nivel || '-'}</td>
                        <td style="text-align:center;">${t.cargaHoraria || 0}h</td>
                        <td>${t.turno || '-'}</td>
                        <td>${t.docente || '-'}</td>
                        <td style="text-align:center; font-weight:600; color:var(--senai-blue);">
                            ${t.periodoExibicao || '-'}
                        </td>
                        <td style="text-align:center;">
                            <div><strong>${t.quantidadeMatriculasTotal || 0}</strong> total</div>
                            <div style="font-size:0.8rem; color:var(--success);">${t.quantidadeMatriculasGratuidade || 0} grat.</div>
                        </td>
                        <td style="text-align:center;">
                            <span class="badge ${badgeClass}">${badgeText}</span>
                        </td>
                    </tr>
                `;
                tbody.innerHTML += row;
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding: 30px; color:var(--text-light);">Nenhuma turma encontrada.</td></tr>';
        }
    } catch (error) {
        console.error('Erro ao carregar turmas SGS:', error);
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding: 30px; color:var(--danger);">Erro ao carregar dados.<br><small>Verifique se o backend está rodando e se há dados sincronizados.</small></td></tr>';
    }
}

// ====================================================================
// CARREGAR ALUNOS SGS (COM TODOS OS CAMPOS - VISÃO PANORÂMICA)
// ====================================================================
async function loadAlunosSGS() {
    const tbody = document.querySelector('#tbl-alunos-sgs tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="12" style="text-align:center; padding: 30px;"><span class="loading"></span> Carregando alunos...</td></tr>';

    const buscaInput = document.getElementById('busca-aluno');
    const busca = buscaInput ? buscaInput.value.trim() : '';

    try {
        const endpoint = busca
            ? `/sincronizacao/alunos?busca=${encodeURIComponent(busca)}`
            : '/sincronizacao/alunos';

        const data = await api.get(endpoint);
        tbody.innerHTML = '';

        if (data && data.length > 0) {
            data.forEach(a => {
                // Define a cor do badge conforme a situação
                let statusClass = 'badge-ok';
                const status = a.statusMatricula || '-';
                if (status.includes('Evadido') || status.includes('Cancelado')) {
                    statusClass = 'badge-err';
                } else if (status.includes('Concluinte') || status.includes('Certificado')) {
                    statusClass = 'badge-warning';
                }

                const gratuidadeBadge = a.isTurmaGratuita
                    ? '<span class="badge badge-ok">SIM</span>'
                    : '<span class="badge badge-err">NÃO</span>';

                const bolsaBadge = a.isBolsaEstudos
                    ? '<span class="badge badge-ok">SIM</span>'
                    : '<span class="badge badge-err">NÃO</span>';

                // Formata o CPF (se existir)
                const cpfLimpo = (a.cpf || '').replace(/\D/g, '');
                const cpfFormatado = cpfLimpo.length === 11
                    ? cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
                    : (a.cpf || '-');

                // Formata telefone
                const telLimpo = (a.telefone || '').replace(/\D/g, '');
                const telFormatado = telLimpo.length === 11
                    ? `(${telLimpo.slice(0,2)}) ${telLimpo.slice(2,7)}-${telLimpo.slice(7)}`
                    : (a.telefone || '-');

                const row = `
                    <tr>
                        <td><strong>${a.numeroMatricula || '-'}</strong></td>
                        <td>
                            <strong>${a.nomeCompleto || '-'}</strong>
                            <br><span style="font-size:0.8rem; color:var(--text-light);">
                                ${a.idade ? a.idade + ' anos' : ''} 
                                ${a.sexo ? '• ' + a.sexo : ''}
                            </span>
                        </td>
                        <td style="text-align:center; font-family: monospace; font-size: 0.85rem;">
                            ${cpfFormatado}
                        </td>
                        <td style="text-align:center;">
                            <span class="badge ${statusClass}">${status}</span>
                        </td>
                        <td style="text-align:center;">
                            ${gratuidadeBadge}
                            <br>${bolsaBadge}
                        </td>
                        <td>
                            <div style="font-size:0.85rem;"><i class="fas fa-envelope" style="font-size:0.75rem; color:var(--text-secondary);"></i> ${a.email || '-'}</div>
                            <div style="font-size:0.85rem; color:var(--text-secondary);"><i class="fas fa-phone" style="font-size:0.75rem;"></i> ${telFormatado}</div>
                        </td>
                        <td>
                            <div style="font-size:0.85rem;">${a.bairro || '-'}</div>
                            <div style="font-size:0.8rem; color:var(--text-secondary);">CEP: ${a.cep || '-'}</div>
                        </td>
                        <td style="text-align:center;">
                            ${a.dataMatricula ? formatarData(a.dataMatricula) : '-'}
                        </td>
                        <td style="text-align:center;">
                            ${a.dataConclusao ? formatarData(a.dataConclusao) : '<span style="color:var(--text-light);">-</span>'}
                        </td>
                        <td style="text-align:center;">
                            ${a.statusOcupacional || '-'}
                            ${a.empresa ? `<br><span style="font-size:0.75rem; color:var(--text-secondary);">${a.empresa}</span>` : ''}
                        </td>
                    </tr>
                `;
                tbody.innerHTML += row;
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding: 30px; color:var(--text-light);">Nenhum aluno encontrado.</td></tr>';
        }
    } catch (error) {
        console.error('Erro ao carregar alunos SGS:', error);
        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding: 30px; color:var(--danger);">Erro ao carregar dados.<br><small>Verifique se o backend está rodando e se há dados sincronizados.</small></td></tr>';
    }
}

// ====================================================================
// INICIALIZAÇÃO
// ====================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Busca com Enter nas turmas
    const buscaTurma = document.getElementById('busca-turma');
    if (buscaTurma) {
        buscaTurma.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                loadTurmasSGS();
            }
        });
    }

    // Busca com Enter nos alunos
    const buscaAluno = document.getElementById('busca-aluno');
    if (buscaAluno) {
        buscaAluno.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                loadAlunosSGS();
            }
        });
    }

    // Verifica se a página de consulta SGS está visível ao carregar
    const paginaSgs = document.getElementById('consulta-sgs');
    if (paginaSgs && !paginaSgs.classList.contains('hidden')) {
        // Carrega a aba de turmas por padrão
        setTimeout(() => mostrarAba('turmas'), 100);
    }
});










// /**
//  * Módulo de Consulta da Base SGS (Cache Local)
//  * Exibe turmas e alunos sincronizados do sistema SGS/Diário FIC.
//  */

// // ====================================================================
// // CONTROLE DE ABAS (Função Global para funcionar no onclick do HTML)
// // ====================================================================
// function mostrarAba(aba) {
//     // Esconde todas as seções
//     const secaoTurmas = document.getElementById('secao-turmas');
//     const secaoAlunos = document.getElementById('secao-alunos');
    
//     if (secaoTurmas) secaoTurmas.classList.add('hidden');
//     if (secaoAlunos) secaoAlunos.classList.add('hidden');

//     // Remove destaque de todas as abas
//     const tabTurmas = document.getElementById('tab-turmas');
//     const tabAlunos = document.getElementById('tab-alunos');
    
//     if (tabTurmas) tabTurmas.style.borderBottom = 'none';
//     if (tabAlunos) tabAlunos.style.borderBottom = 'none';

//     // Ativa a aba selecionada
//     if (aba === 'turmas') {
//         if (secaoTurmas) secaoTurmas.classList.remove('hidden');
//         if (tabTurmas) tabTurmas.style.borderBottom = '3px solid var(--senai-blue)';
//         loadTurmasSGS();
//     } else {
//         if (secaoAlunos) secaoAlunos.classList.remove('hidden');
//         if (tabAlunos) tabAlunos.style.borderBottom = '3px solid var(--senai-blue)';
//         loadAlunosSGS();
//     }
// }

// // ====================================================================
// // CARREGAR TURMAS SGS
// // ====================================================================
// async function loadTurmasSGS() {
//     const tbody = document.querySelector('#tbl-turmas-sgs tbody');
//     if (!tbody) return;
    
//     tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 30px;"><span class="loading"></span> Carregando turmas...</td></tr>';

//     const buscaInput = document.getElementById('busca-turma');
//     const busca = buscaInput ? buscaInput.value.trim() : '';

//     try {
//         const endpoint = busca
//             ? `/sincronizacao/turmas?busca=${encodeURIComponent(busca)}`
//             : '/sincronizacao/turmas';

//         const data = await api.get(endpoint);
//         tbody.innerHTML = '';

//         if (data && data.length > 0) {
//             data.forEach(t => {
//                 const badgeClass = t.isTurmaGratuita ? 'badge-ok' : 'badge-warning';
//                 const badgeText = t.isTurmaGratuita ? 'GRATUITA' : 'PAGA';

//                 const row = `
//                     <tr>
//                         <td><strong>${t.codigoTurmaExterno || '-'}</strong></td>
//                         <td>
//                             <div style="font-weight:600;">${t.nomeCurso || '-'}</div>
//                             <div style="font-size:0.85rem; color:var(--text-secondary);">${t.nomeTurma || ''}</div>
//                         </td>
//                         <td>${t.turno || '-'}</td>
//                         <td>${t.docente || '-'}</td>
//                         <td style="text-align:center; font-weight:600; color:var(--senai-blue);">
//                             ${t.periodoExibicao || '-'}
//                         </td>
//                         <td style="text-align:center;">
//                             <div><strong>${t.quantidadeMatriculasTotal || 0}</strong> total</div>
//                             <div style="font-size:0.8rem; color:var(--success);">${t.quantidadeMatriculasGratuidade || 0} grat.</div>
//                         </td>
//                         <td style="text-align:center;">
//                             <span class="badge ${badgeClass}">${badgeText}</span>
//                         </td>
//                     </tr>
//                 `;
//                 tbody.innerHTML += row;
//             });
//         } else {
//             tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 30px; color:var(--text-light);">Nenhuma turma encontrada.</td></tr>';
//         }
//     } catch (error) {
//         console.error('Erro ao carregar turmas SGS:', error);
//         tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 30px; color:var(--danger);">Erro ao carregar dados.<br><small>Verifique se o backend está rodando.</small></td></tr>';
//     }
// }

// // ====================================================================
// // CARREGAR ALUNOS SGS
// // ====================================================================
// async function loadAlunosSGS() {
//     const tbody = document.querySelector('#tbl-alunos-sgs tbody');
//     if (!tbody) return;
    
//     tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 30px;"><span class="loading"></span> Carregando alunos...</td></tr>';

//     const buscaInput = document.getElementById('busca-aluno');
//     const busca = buscaInput ? buscaInput.value.trim() : '';

//     try {
//         const endpoint = busca
//             ? `/sincronizacao/alunos?busca=${encodeURIComponent(busca)}`
//             : '/sincronizacao/alunos';

//         const data = await api.get(endpoint);
//         tbody.innerHTML = '';

//         if (data && data.length > 0) {
//             data.forEach(a => {
//                 // Define a cor do badge conforme a situação
//                 let statusClass = 'badge-ok';
//                 const status = a.statusMatricula || '-';
//                 if (status.includes('Evadido') || status.includes('Cancelado')) {
//                     statusClass = 'badge-err';
//                 } else if (status.includes('Concluinte') || status.includes('Certificado')) {
//                     statusClass = 'badge-warning';
//                 }

//                 const gratuidadeBadge = a.isTurmaGratuita
//                     ? '<span class="badge badge-ok">SIM</span>'
//                     : '<span class="badge badge-err">NÃO</span>';

//                 // Formata o CPF (se existir)
//                 const cpfLimpo = (a.cpf || '').replace(/\D/g, '');
//                 const cpfFormatado = cpfLimpo.length === 11
//                     ? cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
//                     : (a.cpf || '-');

//                 const row = `
//                     <tr>
//                         <td><strong>${a.numeroMatricula || '-'}</strong></td>
//                         <td>
//                             <strong>${a.nomeCompleto || '-'}</strong>
//                             <br><span style="font-size:0.8rem; color:var(--text-light);">${a.idade ? a.idade + ' anos' : ''}</span>
//                         </td>
//                         <td style="text-align:center; font-family: monospace; font-size: 0.85rem;">
//                             ${cpfFormatado}
//                         </td>
//                         <td style="text-align:center;">
//                             <span class="badge ${statusClass}">${status}</span>
//                         </td>
//                         <td style="text-align:center;">
//                             ${gratuidadeBadge}
//                         </td>
//                         <td>
//                             <div style="font-size:0.85rem;">${a.email || '-'}</div>
//                             <div style="font-size:0.85rem; color:var(--text-secondary);">${a.telefone || '-'}</div>
//                         </td>
//                         <td style="text-align:center;">
//                             ${a.dataMatricula ? formatarData(a.dataMatricula) : '-'}
//                         </td>
//                     </tr>
//                 `;
//                 tbody.innerHTML += row;
//             });
//         } else {
//             tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 30px; color:var(--text-light);">Nenhum aluno encontrado.</td></tr>';
//         }
//     } catch (error) {
//         console.error('Erro ao carregar alunos SGS:', error);
//         tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 30px; color:var(--danger);">Erro ao carregar dados.<br><small>Verifique se o backend está rodando.</small></td></tr>';
//     }
// }

// // ====================================================================
// // INICIALIZAÇÃO
// // ====================================================================
// document.addEventListener('DOMContentLoaded', () => {
//     // Busca com Enter nas turmas
//     const buscaTurma = document.getElementById('busca-turma');
//     if (buscaTurma) {
//         buscaTurma.addEventListener('keypress', (e) => {
//             if (e.key === 'Enter') {
//                 e.preventDefault();
//                 loadTurmasSGS();
//             }
//         });
//     }

//     // Busca com Enter nos alunos
//     const buscaAluno = document.getElementById('busca-aluno');
//     if (buscaAluno) {
//         buscaAluno.addEventListener('keypress', (e) => {
//             if (e.key === 'Enter') {
//                 e.preventDefault();
//                 loadAlunosSGS();
//             }
//         });
//     }

//     // Verifica se a página de consulta SGS está visível ao carregar
//     const paginaSgs = document.getElementById('consulta-sgs');
//     if (paginaSgs && !paginaSgs.classList.contains('hidden')) {
//         // Carrega a aba de turmas por padrão com um pequeno delay para garantir que o DOM está pronto
//         setTimeout(() => mostrarAba('turmas'), 100);
//     }
// });











// // /**
// //  * Módulo de Relatórios - Movimentações de Estoque
// //  * Com filtros avançados, paginação e exportação CSV.
// //  */

// // let filtrosAtuais = {
// //     tipo: '',
// //     tamanho: '',
// //     dataInicio: '',
// //     dataFim: '',
// //     responsavel: '',
// //     codigoTurma: '',
// //     matriculaAluno: '',
// //     limite: 50,
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

// //         // Construir query string
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
// //             // Atualizar contador
// //             const totalEl = document.getElementById('total-registros');
// //             if (totalEl) {
// //                 totalEl.textContent = `(${totalRegistros} registro${totalRegistros !== 1 ? 's' : ''} - Página ${response.pagina} de ${totalPaginas})`;
// //             }

// //             movimentacoesCache.forEach(m => {
// //                 const tipoClass = getTipoBadgeClass(m.tipo);

// //                 // Formata dados do aluno (só existe em distribuições)
// //                 const alunoInfo = m.alunoNome
// //                     ? `<div style="font-weight:600;">${m.alunoNome}</div>`
// //                     : '<span style="color:var(--text-light); font-style:italic;">-</span>';

// //                 const matriculaInfo = m.alunoMatricula
// //                     ? `<div style="font-family:monospace; font-size:0.85rem; font-weight:600;">${m.alunoMatricula}</div>`
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
// //                         <td style="max-width:200px; overflow:hidden; text-overflow:ellipsis;" title="${m.observacao || ''}">${m.observacao || '-'}</td>
// //                     </tr>
// //                 `;
// //                 tbody.innerHTML += row;
// //             });

// //             // Renderizar paginação
// //             renderizarPaginacao(response.pagina, totalPaginas);
// //         } else {
// //             tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding: 40px; color: var(--text-light);"><i class="fas fa-inbox" style="font-size:2rem; display:block; margin-bottom:10px;"></i>Nenhuma movimentação encontrada</td></tr>';
// //             const totalEl = document.getElementById('total-registros');
// //             if (totalEl) totalEl.textContent = '(0 registros)';
// //         }
// //     } catch (error) {
// //         console.error('Erro ao carregar movimentações:', error);
// //         showToast('Erro ao carregar movimentações: ' + error.message, 'error');
// //         document.querySelector('#tbl-mov tbody').innerHTML = '<tr><td colspan="9" style="text-align:center; padding: 30px; color: var(--danger);">Erro ao carregar dados</td></tr>';
// //     }
// // }

// // // Renderizar controles de paginação
// // function renderizarPaginacao(paginaAtual, totalPaginas) {
// //     const container = document.getElementById('pagination-container');
// //     if (!container) return;

// //     if (totalPaginas <= 1) {
// //         container.innerHTML = '';
// //         return;
// //     }

// //     let html = '<div class="pagination-info">Página ' + paginaAtual + ' de ' + totalPaginas + '</div>';
// //     html += '<div class="pagination-buttons">';

// //     // Botão anterior
// //     html += `<button ${paginaAtual === 1 ? 'disabled' : ''} onclick="irParaPagina(${paginaAtual - 1})"><i class="fas fa-chevron-left"></i></button>`;

// //     // Páginas (mostra no máximo 5)
// //     const inicio = Math.max(1, paginaAtual - 2);
// //     const fim = Math.min(totalPaginas, paginaAtual + 2);

// //     for (let i = inicio; i <= fim; i++) {
// //         html += `<button class="${i === paginaAtual ? 'active' : ''}" onclick="irParaPagina(${i})">${i}</button>`;
// //     }

// //     // Botão próximo
// //     html += `<button ${paginaAtual === totalPaginas ? 'disabled' : ''} onclick="irParaPagina(${paginaAtual + 1})"><i class="fas fa-chevron-right"></i></button>`;

// //     html += '</div>';
// //     container.innerHTML = html;
// // }

// // // Navegar para página específica
// // function irParaPagina(pagina) {
// //     filtrosAtuais.pagina = pagina;
// //     loadMovimentacoes();
// // }

// // function getTipoBadgeClass(tipo) {
// //     switch(tipo) {
// //         case 'Entrada': return 'badge-ok';
// //         case 'Saída': return 'badge-err';
// //         case 'Distribuicao': return 'badge-warning';
// //         default: return 'badge-ok';
// //     }
// // }

// // // Aplicar filtros
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

// // // Limpar filtros
// // function limparFiltros() {
// //     document.getElementById('filtro-tipo').value = '';
// //     document.getElementById('filtro-tamanho').value = '';
// //     document.getElementById('filtro-data-inicio').value = '';
// //     document.getElementById('filtro-data-fim').value = '';
// //     document.getElementById('filtro-responsavel').value = '';
// //     document.getElementById('filtro-turma').value = '';
// //     document.getElementById('filtro-matricula').value = '';
// //     document.getElementById('rel-results-per-page').value = '50';

// //     filtrosAtuais = {
// //         tipo: '',
// //         tamanho: '',
// //         dataInicio: '',
// //         dataFim: '',
// //         responsavel: '',
// //         codigoTurma: '',
// //         matriculaAluno: '',
// //         limite: 50,
// //         pagina: 1
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

// //         // Construir URL de exportação com os mesmos filtros
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

// // // Toggle da seção de filtros
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

// //     const btnExportar = document.getElementById('btn-exportar-csv');
// //     if (btnExportar) btnExportar.addEventListener('click', exportarCSV);

// //     const selectPerPage = document.getElementById('rel-results-per-page');
// //     if (selectPerPage) {
// //         selectPerPage.addEventListener('change', () => {
// //             filtrosAtuais.limite = parseInt(selectPerPage.value);
// //             filtrosAtuais.pagina = 1;
// //             loadMovimentacoes();
// //         });
// //     }

// //     // Enter nos campos de filtro
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
// // });






// // // /**
// // //  * Módulo de Consulta da Base SGS (Cache Local)
// // //  * Exibe turmas e alunos sincronizados do sistema SGS/Diário FIC.
// // //  */

// // // // ====================================================================
// // // // CONTROLE DE ABAS
// // // // ====================================================================
// // // function mostrarAba(aba) {
// // //     document.getElementById('secao-turmas').classList.add('hidden');
// // //     document.getElementById('secao-alunos').classList.add('hidden');

// // //     const tabTurmas = document.getElementById('tab-turmas');
// // //     const tabAlunos = document.getElementById('tab-alunos');
// // //     if (tabTurmas) tabTurmas.style.borderBottom = 'none';
// // //     if (tabAlunos) tabAlunos.style.borderBottom = 'none';

// // //     if (aba === 'turmas') {
// // //         document.getElementById('secao-turmas').classList.remove('hidden');
// // //         if (tabTurmas) tabTurmas.style.borderBottom = '3px solid var(--senai-blue)';
// // //         loadTurmasSGS();
// // //     } else {
// // //         document.getElementById('secao-alunos').classList.remove('hidden');
// // //         if (tabAlunos) tabAlunos.style.borderBottom = '3px solid var(--senai-blue)';
// // //         loadAlunosSGS();
// // //     }
// // // }

// // // // ====================================================================
// // // // CARREGAR TURMAS SGS
// // // // ====================================================================
// // // async function loadTurmasSGS() {
// // //     const tbody = document.querySelector('#tbl-turmas-sgs tbody');
// // //     tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 30px;"><span class="loading"></span> Carregando turmas...</td></tr>';

// // //     const busca = document.getElementById('busca-turma').value.trim();

// // //     try {
// // //         const endpoint = busca
// // //             ? `/sincronizacao/turmas?busca=${encodeURIComponent(busca)}`
// // //             : '/sincronizacao/turmas';

// // //         const data = await api.get(endpoint);
// // //         tbody.innerHTML = '';

// // //         if (data && data.length > 0) {
// // //             data.forEach(t => {
// // //                 const badgeClass = t.isTurmaGratuita ? 'badge-ok' : 'badge-warning';
// // //                 const badgeText = t.isTurmaGratuita ? 'GRATUITA' : 'PAGA';

// // //                 const row = `
// // //                     <tr>
// // //                         <td><strong>${t.codigoTurmaExterno || '-'}</strong></td>
// // //                         <td>
// // //                             <div style="font-weight:600;">${t.nomeCurso || '-'}</div>
// // //                             <div style="font-size:0.85rem; color:var(--text-secondary);">${t.nomeTurma || ''}</div>
// // //                         </td>
// // //                         <td>${t.turno || '-'}</td>
// // //                         <td>${t.docente || '-'}</td>
// // //                         <td style="text-align:center; font-weight:600; color:var(--senai-blue);">
// // //                             ${t.periodoExibicao || '-'}
// // //                         </td>
// // //                         <td style="text-align:center;">
// // //                             <div><strong>${t.quantidadeMatriculasTotal || 0}</strong> total</div>
// // //                             <div style="font-size:0.8rem; color:var(--success);">${t.quantidadeMatriculasGratuidade || 0} grat.</div>
// // //                         </td>
// // //                         <td style="text-align:center;">
// // //                             <span class="badge ${badgeClass}">${badgeText}</span>
// // //                         </td>
// // //                     </tr>
// // //                 `;
// // //                 tbody.innerHTML += row;
// // //             });
// // //         } else {
// // //             tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 30px; color:var(--text-light);">Nenhuma turma encontrada.</td></tr>';
// // //         }
// // //     } catch (error) {
// // //         console.error('Erro ao carregar turmas SGS:', error);
// // //         tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 30px; color:var(--danger);">Erro ao carregar dados.</td></tr>';
// // //     }
// // // }

// // // // ====================================================================
// // // // CARREGAR ALUNOS SGS (COM MATRÍCULA, NOME, CPF, SITUAÇÃO)
// // // // ====================================================================
// // // async function loadAlunosSGS() {
// // //     const tbody = document.querySelector('#tbl-alunos-sgs tbody');
// // //     tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 30px;"><span class="loading"></span> Carregando alunos...</td></tr>';

// // //     const busca = document.getElementById('busca-aluno').value.trim();

// // //     try {
// // //         const endpoint = busca
// // //             ? `/sincronizacao/alunos?busca=${encodeURIComponent(busca)}`
// // //             : '/sincronizacao/alunos';

// // //         const data = await api.get(endpoint);
// // //         tbody.innerHTML = '';

// // //         if (data && data.length > 0) {
// // //             data.forEach(a => {
// // //                 // Define a cor do badge conforme a situação
// // //                 let statusClass = 'badge-ok';
// // //                 const status = a.statusMatricula || '-';
// // //                 if (status.includes('Evadido') || status.includes('Cancelado')) {
// // //                     statusClass = 'badge-err';
// // //                 } else if (status.includes('Concluinte') || status.includes('Certificado') || status.includes('Não certificado')) {
// // //                     statusClass = 'badge-warning';
// // //                 }

// // //                 const gratuidadeBadge = a.isTurmaGratuita
// // //                     ? '<span class="badge badge-ok">SIM</span>'
// // //                     : '<span class="badge badge-err">NÃO</span>';

// // //                 // Formata o CPF (se existir)
// // //                 const cpfLimpo = (a.cpf || '').replace(/\D/g, '');
// // //                 const cpfFormatado = cpfLimpo.length === 11
// // //                     ? cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
// // //                     : (a.cpf || '-');

// // //                 const row = `
// // //                     <tr>
// // //                         <td><strong>${a.numeroMatricula || '-'}</strong></td>
// // //                         <td>
// // //                             <strong>${a.nomeCompleto || '-'}</strong>
// // //                             <br><span style="font-size:0.8rem; color:var(--text-light);">${a.idade ? a.idade + ' anos' : ''}</span>
// // //                         </td>
// // //                         <td style="text-align:center; font-family: monospace; font-size: 0.85rem;">
// // //                             ${cpfFormatado}
// // //                         </td>
// // //                         <td style="text-align:center;">
// // //                             <span class="badge ${statusClass}">${status}</span>
// // //                         </td>
// // //                         <td style="text-align:center;">
// // //                             ${gratuidadeBadge}
// // //                         </td>
// // //                         <td>
// // //                             <div style="font-size:0.85rem;">${a.email || '-'}</div>
// // //                             <div style="font-size:0.85rem; color:var(--text-secondary);">${a.telefone || '-'}</div>
// // //                         </td>
// // //                         <td style="text-align:center;">
// // //                             ${a.dataMatricula ? formatarData(a.dataMatricula) : '-'}
// // //                         </td>
// // //                     </tr>
// // //                 `;
// // //                 tbody.innerHTML += row;
// // //             });
// // //         } else {
// // //             tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 30px; color:var(--text-light);">Nenhum aluno encontrado.</td></tr>';
// // //         }
// // //     } catch (error) {
// // //         console.error('Erro ao carregar alunos SGS:', error);
// // //         tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 30px; color:var(--danger);">Erro ao carregar dados.</td></tr>';
// // //     }
// // // }

// // // // ====================================================================
// // // // INICIALIZAÇÃO
// // // // ====================================================================
// // // document.addEventListener('DOMContentLoaded', () => {
// // //     const buscaTurma = document.getElementById('busca-turma');
// // //     if (buscaTurma) {
// // //         buscaTurma.addEventListener('keypress', (e) => {
// // //             if (e.key === 'Enter') {
// // //                 e.preventDefault();
// // //                 loadTurmasSGS();
// // //             }
// // //         });
// // //     }

// // //     const buscaAluno = document.getElementById('busca-aluno');
// // //     if (buscaAluno) {
// // //         buscaAluno.addEventListener('keypress', (e) => {
// // //             if (e.key === 'Enter') {
// // //                 e.preventDefault();
// // //                 loadAlunosSGS();
// // //             }
// // //         });
// // //     }

// // //     const paginaSgs = document.getElementById('consulta-sgs');
// // //     if (paginaSgs && !paginaSgs.classList.contains('hidden')) {
// // //         mostrarAba('turmas');
// // //     }
// // // });









// // // // /**
// // // //  * Módulo de Consulta da Base SGS (Cache Local)
// // // //  * Exibe turmas e alunos sincronizados do sistema SGS/Diário FIC.
// // // //  */

// // // // // ====================================================================
// // // // // CONTROLE DE ABAS
// // // // // ====================================================================
// // // // function mostrarAba(aba) {
// // // //     // Esconde todas as seções
// // // //     document.getElementById('secao-turmas').classList.add('hidden');
// // // //     document.getElementById('secao-alunos').classList.add('hidden');

// // // //     // Remove destaque de todas as abas
// // // //     const tabTurmas = document.getElementById('tab-turmas');
// // // //     const tabAlunos = document.getElementById('tab-alunos');
// // // //     if (tabTurmas) tabTurmas.style.borderBottom = 'none';
// // // //     if (tabAlunos) tabAlunos.style.borderBottom = 'none';

// // // //     // Ativa a aba selecionada
// // // //     if (aba === 'turmas') {
// // // //         document.getElementById('secao-turmas').classList.remove('hidden');
// // // //         if (tabTurmas) tabTurmas.style.borderBottom = '3px solid var(--senai-blue)';
// // // //         loadTurmasSGS();
// // // //     } else {
// // // //         document.getElementById('secao-alunos').classList.remove('hidden');
// // // //         if (tabAlunos) tabAlunos.style.borderBottom = '3px solid var(--senai-blue)';
// // // //         loadAlunosSGS();
// // // //     }
// // // // }

// // // // // ====================================================================
// // // // // CARREGAR TURMAS SGS
// // // // // ====================================================================
// // // // async function loadTurmasSGS() {
// // // //     const tbody = document.querySelector('#tbl-turmas-sgs tbody');
// // // //     tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 30px;"><span class="loading"></span> Carregando turmas...</td></tr>';

// // // //     const busca = document.getElementById('busca-turma').value.trim();

// // // //     try {
// // // //         const endpoint = busca
// // // //             ? `/sincronizacao/turmas?busca=${encodeURIComponent(busca)}`
// // // //             : '/sincronizacao/turmas';

// // // //         const data = await api.get(endpoint);

// // // //         tbody.innerHTML = '';

// // // //         if (data && data.length > 0) {
// // // //             data.forEach(t => {
// // // //                 const badgeClass = t.isTurmaGratuita ? 'badge-ok' : 'badge-warning';
// // // //                 const badgeText = t.isTurmaGratuita ? 'GRATUITA' : 'PAGA';

// // // //                 const row = `
// // // //                     <tr>
// // // //                         <td><strong>${t.codigoTurmaExterno || '-'}</strong></td>
// // // //                         <td>
// // // //                             <div style="font-weight:600;">${t.nomeCurso || '-'}</div>
// // // //                             <div style="font-size:0.85rem; color:var(--text-secondary);">${t.nomeTurma || ''}</div>
// // // //                         </td>
// // // //                         <td>${t.turno || '-'}</td>
// // // //                         <td>${t.docente || '-'}</td>
// // // //                         <td style="text-align:center; font-weight:600; color:var(--senai-blue);">
// // // //                             ${t.periodoExibicao || '-'}
// // // //                         </td>
// // // //                         <td style="text-align:center;">
// // // //                             <div><strong>${t.quantidadeMatriculasTotal || 0}</strong> total</div>
// // // //                             <div style="font-size:0.8rem; color:var(--success);">${t.quantidadeMatriculasGratuidade || 0} grat.</div>
// // // //                         </td>
// // // //                         <td style="text-align:center;">
// // // //                             <span class="badge ${badgeClass}">${badgeText}</span>
// // // //                         </td>
// // // //                     </tr>
// // // //                 `;
// // // //                 tbody.innerHTML += row;
// // // //             });
// // // //         } else {
// // // //             tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 30px; color:var(--text-light);">Nenhuma turma encontrada.</td></tr>';
// // // //         }
// // // //     } catch (error) {
// // // //         console.error('Erro ao carregar turmas SGS:', error);
// // // //         tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 30px; color:var(--danger);">Erro ao carregar dados.</td></tr>';
// // // //     }
// // // // }

// // // // // ====================================================================
// // // // // CARREGAR ALUNOS SGS
// // // // // ====================================================================
// // // // async function loadAlunosSGS() {
// // // //     const tbody = document.querySelector('#tbl-alunos-sgs tbody');
// // // //     tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 30px;"><span class="loading"></span> Carregando alunos...</td></tr>';

// // // //     const busca = document.getElementById('busca-aluno').value.trim();

// // // //     try {
// // // //         const endpoint = busca
// // // //             ? `/sincronizacao/alunos?busca=${encodeURIComponent(busca)}`
// // // //             : '/sincronizacao/alunos';

// // // //         const data = await api.get(endpoint);

// // // //         tbody.innerHTML = '';

// // // //         if (data && data.length > 0) {
// // // //             data.forEach(a => {
// // // //                 let statusClass = 'badge-ok';
// // // //                 if (a.statusMatricula && (a.statusMatricula.includes('Evadido') || a.statusMatricula.includes('Cancelado'))) {
// // // //                     statusClass = 'badge-err';
// // // //                 } else if (a.statusMatricula && a.statusMatricula.includes('Concluinte')) {
// // // //                     statusClass = 'badge-warning';
// // // //                 }

// // // //                 const gratuidadeBadge = a.isTurmaGratuita
// // // //                     ? '<span class="badge badge-ok">SIM</span>'
// // // //                     : '<span class="badge badge-err">NÃO</span>';

// // // //                 const row = `
// // // //                     <tr>
// // // //                         <td>
// // // //                             <strong>${a.nomeCompleto || '-'}</strong>
// // // //                             <br><span style="font-size:0.8rem; color:var(--text-light);">${a.idade ? a.idade + ' anos' : ''}</span>
// // // //                         </td>
// // // //                         <td>${a.codigoTurmaExterno || '-'}</td>
// // // //                         <td style="text-align:center;">
// // // //                             <span class="badge ${statusClass}">${a.statusMatricula || '-'}</span>
// // // //                         </td>
// // // //                         <td style="text-align:center;">
// // // //                             ${gratuidadeBadge}
// // // //                         </td>
// // // //                         <td>
// // // //                             <div style="font-size:0.85rem;">${a.email || '-'}</div>
// // // //                             <div style="font-size:0.85rem; color:var(--text-secondary);">${a.telefone || '-'}</div>
// // // //                         </td>
// // // //                         <td style="text-align:center;">
// // // //                             ${a.dataMatricula ? formatarData(a.dataMatricula) : '-'}
// // // //                         </td>
// // // //                     </tr>
// // // //                 `;
// // // //                 tbody.innerHTML += row;
// // // //             });
// // // //         } else {
// // // //             tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 30px; color:var(--text-light);">Nenhum aluno encontrado.</td></tr>';
// // // //         }
// // // //     } catch (error) {
// // // //         console.error('Erro ao carregar alunos SGS:', error);
// // // //         tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 30px; color:var(--danger);">Erro ao carregar dados.</td></tr>';
// // // //     }
// // // // }

// // // // // ====================================================================
// // // // // INICIALIZAÇÃO
// // // // // ====================================================================
// // // // document.addEventListener('DOMContentLoaded', () => {
// // // //     // Busca com Enter nas turmas
// // // //     const buscaTurma = document.getElementById('busca-turma');
// // // //     if (buscaTurma) {
// // // //         buscaTurma.addEventListener('keypress', (e) => {
// // // //             if (e.key === 'Enter') {
// // // //                 e.preventDefault();
// // // //                 loadTurmasSGS();
// // // //             }
// // // //         });
// // // //     }

// // // //     // Busca com Enter nos alunos
// // // //     const buscaAluno = document.getElementById('busca-aluno');
// // // //     if (buscaAluno) {
// // // //         buscaAluno.addEventListener('keypress', (e) => {
// // // //             if (e.key === 'Enter') {
// // // //                 e.preventDefault();
// // // //                 loadAlunosSGS();
// // // //             }
// // // //         });
// // // //     }

// // // //     // Se a página de consulta SGS estiver visível ao carregar, mostra a aba turmas
// // // //     const paginaSgs = document.getElementById('consulta-sgs');
// // // //     if (paginaSgs && !paginaSgs.classList.contains('hidden')) {
// // // //         mostrarAba('turmas');
// // // //     }
// // // // });










// // // // // // Controle de Abas
// // // // // function mostrarAba(aba) {
// // // // //     document.getElementById('secao-turmas').classList.add('hidden');
// // // // //     document.getElementById('secao-alunos').classList.add('hidden');

// // // // //     document.getElementById('tab-turmas').style.borderBottom = 'none';
// // // // //     document.getElementById('tab-alunos').style.borderBottom = 'none';

// // // // //     if (aba === 'turmas') {
// // // // //         document.getElementById('secao-turmas').classList.remove('hidden');
// // // // //         document.getElementById('tab-turmas').style.borderBottom = '3px solid var(--senai-blue)';
// // // // //         loadTurmasSGS();
// // // // //     } else {
// // // // //         document.getElementById('secao-alunos').classList.remove('hidden');
// // // // //         document.getElementById('tab-alunos').style.borderBottom = '3px solid var(--senai-blue)';
// // // // //         loadAlunosSGS();
// // // // //     }
// // // // // }



// // // // // // Carregar Turmas SGS
// // // // // async function loadTurmasSGS() {
// // // // //     const tbody = document.querySelector('#tbl-turmas-sgs tbody');
// // // // //     tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 30px;"><span class="loading"></span> Carregando...</td></tr>';

// // // // //     const busca = document.getElementById('busca-turma').value;
// // // // //     try {
// // // // //         const endpoint = busca ? `/sincronizacao/turmas?busca=${encodeURIComponent(busca)}` : '/sincronizacao/turmas';
// // // // //         const data = await api.get(endpoint);

// // // // //         tbody.innerHTML = '';
// // // // //         if (data && data.length > 0) {
// // // // //             data.forEach(t => {
// // // // //                 const badgeClass = t.isTurmaGratuita ? 'badge-ok' : 'badge-warning';
// // // // //                 const badgeText = t.isTurmaGratuita ? 'GRATUITA' : 'PAGA';

// // // // //                 tbody.innerHTML += `
// // // // //                     <tr>
// // // // //                         <td><strong>${t.codigoTurmaExterno}</strong></td>
// // // // //                         <td>
// // // // //                             <div style="font-weight:600;">${t.nomeCurso}</div>
// // // // //                             <div style="font-size:0.85rem; color:var(--text-secondary);">${t.nomeTurma}</div>
// // // // //                         </td>
// // // // //                         <td>${t.turno}</td>
// // // // //                         <td>${t.docente || '-'}</td>
// // // // //                         <td style="text-align:center;">
// // // // //                             <div><strong>${t.quantidadeMatriculasTotal}</strong> total</div>
// // // // //                             <div style="font-size:0.8rem; color:var(--success);">${t.quantidadeMatriculasGratuidade} grat.</div>
// // // // //                         </td>
// // // // //                         <td style="text-align:center;"><span class="badge ${badgeClass}">${badgeText}</span></td>
// // // // //                     </tr>
// // // // //                 `;
// // // // //             });
// // // // //         } else {
// // // // //             tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 30px;">Nenhuma turma encontrada.</td></tr>';
// // // // //         }
// // // // //     } catch (error) {
// // // // //         tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 30px; color:var(--danger);">Erro ao carregar dados.</td></tr>';
// // // // //     }
// // // // // }

// // // // // // Carregar Alunos SGS
// // // // // async function loadAlunosSGS() {
// // // // //     const tbody = document.querySelector('#tbl-alunos-sgs tbody');
// // // // //     tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 30px;"><span class="loading"></span> Carregando...</td></tr>';

// // // // //     const busca = document.getElementById('busca-aluno').value;
// // // // //     try {
// // // // //         const endpoint = busca ? `/sincronizacao/alunos?busca=${encodeURIComponent(busca)}` : '/sincronizacao/alunos';
// // // // //         const data = await api.get(endpoint);

// // // // //         tbody.innerHTML = '';
// // // // //         if (data && data.length > 0) {
// // // // //             data.forEach(a => {
// // // // //                 let statusClass = 'badge-ok';
// // // // //                 if (a.statusMatricula.includes('Evadido') || a.statusMatricula.includes('Cancelado')) statusClass = 'badge-err';
// // // // //                 else if (a.statusMatricula.includes('Concluinte')) statusClass = 'badge-warning';

// // // // //                 const gratuidadeBadge = a.isTurmaGratuita
// // // // //                     ? '<span class="badge badge-ok">SIM</span>'
// // // // //                     : '<span class="badge badge-err">NÃO</span>';

// // // // //                 tbody.innerHTML += `
// // // // //                     <tr>
// // // // //                         <td><strong>${a.nomeCompleto}</strong><br><span style="font-size:0.8rem; color:var(--text-light);">${a.idade} anos</span></td>
// // // // //                         <td>${a.codigoTurmaExterno}</td>
// // // // //                         <td style="text-align:center;"><span class="badge ${statusClass}">${a.statusMatricula}</span></td>
// // // // //                         <td style="text-align:center;">${gratuidadeBadge}</td>
// // // // //                         <td>
// // // // //                             <div style="font-size:0.85rem;">${a.email}</div>
// // // // //                             <div style="font-size:0.85rem; color:var(--text-secondary);">${a.telefone}</div>
// // // // //                         </td>
// // // // //                     </tr>
// // // // //                 `;
// // // // //             });
// // // // //         } else {
// // // // //             tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 30px;">Nenhum aluno encontrado.</td></tr>';
// // // // //         }
// // // // //     } catch (error) {
// // // // //         tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 30px; color:var(--danger);">Erro ao carregar dados.</td></tr>';
// // // // //     }
// // // // // }

// // // // // // Inicializar na primeira carga da página
// // // // // document.addEventListener('DOMContentLoaded', () => {
// // // // //     // Se a página de consulta SGS for a ativa, carrega os dados
// // // // //     if (!document.getElementById('consulta-sgs').classList.contains('hidden')) {
// // // // //         mostrarAba('turmas');
// // // // //     }
// // // // // });