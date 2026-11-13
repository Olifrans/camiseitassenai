/**
 * Módulo de Sincronização SGS
 * Suporta sincronização automática (Plano A) e importação manual CSV (Plano B)
 */

document.addEventListener('DOMContentLoaded', () => {
    // ========================================================================
    // ✅ PLANO A: SINCRONIZAÇÃO AUTOMÁTICA
    // ========================================================================
    const btnSincronizarAuto = document.getElementById('btn-sincronizar-automatico');
    if (btnSincronizarAuto) {
        btnSincronizarAuto.addEventListener('click', async () => {
            if (!confirm('Deseja sincronizar todos os dados (Turmas e Alunos) diretamente do sistema SGS?\n\nIsso pode levar alguns minutos dependendo da quantidade de dados.')) {
                return;
            }

            try {
                setLoading('btn-sincronizar-automatico', true, '<i class="fas fa-spinner fa-spin"></i> Sincronizando...');
                showToast('Iniciando sincronização automática com o SGS...', 'info');

                const resultado = await api.post('/sincronizacao/sincronizar-automatico', {});

                const divResultado = document.getElementById('resultado-sincronizacao');
                divResultado.classList.remove('hidden');
                divResultado.innerHTML = `
                    <div style="padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px; margin-bottom: 20px;">
                        <h3 style="margin: 0 0 15px 0;"><i class="fas fa-check-circle"></i> ${resultado.mensagem}</h3>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 6px;">
                                <div style="font-size: 0.85rem; opacity: 0.9;">Turmas Importadas</div>
                                <div style="font-size: 2rem; font-weight: bold;">${resultado.turmasImportadas}</div>
                            </div>
                            <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 6px;">
                                <div style="font-size: 0.85rem; opacity: 0.9;">Alunos Importados</div>
                                <div style="font-size: 2rem; font-weight: bold;">${resultado.alunosImportados}</div>
                            </div>
                        </div>
                        <div style="margin-top: 15px; font-size: 0.85rem; opacity: 0.9;">
                            <i class="fas fa-clock"></i> ${new Date(resultado.dataSincronizacao).toLocaleString('pt-BR')}
                            <br>
                            <i class="fas fa-microchip"></i> Método: ${resultado.metodo}
                        </div>
                    </div>
                `;
                showToast('Sincronização automática concluída!', 'success');
            } catch (error) {
                console.error('Erro na sincronização automática:', error);
                const divResultado = document.getElementById('resultado-sincronizacao');
                divResultado.classList.remove('hidden');
                divResultado.innerHTML = `
                    <div style="padding: 20px; background: #fee2e2; border: 2px solid #ef4444; border-radius: 8px; margin-bottom: 20px;">
                        <h3 style="margin: 0 0 10px 0; color: #991b1b;"><i class="fas fa-exclamation-triangle"></i> Sincronização Automática Falhou</h3>
                        <p style="margin: 0 0 15px 0; color: #7f1d1d;">${error.message || 'Erro ao conectar com o SGS'}</p>
                        <div style="background: white; padding: 15px; border-radius: 6px;">
                            <strong style="color: #991b1b;"><i class="fas fa-lightbulb"></i> Sugestão:</strong>
                            <p style="margin: 10px 0 0 0; color: #374151;">Utilize a <strong>importação manual via CSV</strong> (Plano B) abaixo enquanto a conexão automática não é restabelecida.</p>
                        </div>
                    </div>
                `;
                showToast('Erro na sincronização automática. Use a importação manual.', 'error');
            } finally {
                setLoading('btn-sincronizar-automatico', false, '<i class="fas fa-sync-alt"></i> Sincronizar Automaticamente');
            }
        });
    }

    // ========================================================================
    // ✅ PLANO B: IMPORTAÇÃO MANUAL VIA CSV
    // ========================================================================
    const btnImportarTurmas = document.getElementById('btn-importar-turmas-sgs');
    if (btnImportarTurmas) {
        btnImportarTurmas.addEventListener('click', async () => {
            const fileInput = document.getElementById('file-turmas-sgs');
            const file = fileInput.files[0];
            if (!file) return showToast('Selecione um arquivo CSV de turmas', 'error');
            if (!file.name.toLowerCase().endsWith('.csv')) return showToast('O arquivo deve ser um CSV', 'error');

            try {
                setLoading('btn-importar-turmas-sgs', true, '<i class="fas fa-spinner fa-spin"></i> Importando...');
                showToast('Importando turmas via CSV...', 'info');
                const formData = new FormData();
                formData.append('file', file);
                const resultado = await api.postFormData('/sincronizacao/importar-turmas-csv', formData);

                const divResultado = document.getElementById('result-turmas-sgs');
                divResultado.classList.remove('hidden');
                divResultado.innerHTML = `<div style="padding: 15px; background: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
                    <h4 style="margin: 0 0 10px 0; color: #166534;"><i class="fas fa-check-circle"></i> ${resultado.mensagem}</h4>
                    <div style="font-size: 1.5rem; font-weight: bold; color: #059669;">${resultado.total} turmas importadas</div>
                </div>`;
                showToast('Turmas importadas com sucesso!', 'success');
                fileInput.value = '';
            } catch (error) {
                showToast('Erro ao importar CSV: ' + error.message, 'error');
            } finally {
                setLoading('btn-importar-turmas-sgs', false, '<i class="fas fa-upload"></i> Importar Turmas');
            }
        });
    }

    const btnImportarAlunos = document.getElementById('btn-importar-alunos-sgs');
    if (btnImportarAlunos) {
        btnImportarAlunos.addEventListener('click', async () => {
            const fileInput = document.getElementById('file-alunos-sgs');
            const file = fileInput.files[0];
            if (!file) return showToast('Selecione um arquivo CSV de alunos', 'error');
            if (!file.name.toLowerCase().endsWith('.csv')) return showToast('O arquivo deve ser um CSV', 'error');

            try {
                setLoading('btn-importar-alunos-sgs', true, '<i class="fas fa-spinner fa-spin"></i> Importando...');
                showToast('Importando alunos via CSV...', 'info');
                const formData = new FormData();
                formData.append('file', file);
                const resultado = await api.postFormData('/sincronizacao/importar-alunos-csv', formData);

                const divResultado = document.getElementById('result-alunos-sgs');
                divResultado.classList.remove('hidden');
                divResultado.innerHTML = `<div style="padding: 15px; background: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
                    <h4 style="margin: 0 0 10px 0; color: #166534;"><i class="fas fa-check-circle"></i> ${resultado.mensagem}</h4>
                    <div style="font-size: 1.5rem; font-weight: bold; color: #059669;">${resultado.total} alunos importados</div>
                </div>`;
                showToast('Alunos importados com sucesso!', 'success');
                fileInput.value = '';
            } catch (error) {
                showToast('Erro ao importar CSV: ' + error.message, 'error');
            } finally {
                setLoading('btn-importar-alunos-sgs', false, '<i class="fas fa-upload"></i> Importar Alunos');
            }
        });
    }

    // ========================================================================
    // ✅ MONITORAMENTO DE STATUS SGS (A cada 5 minutos)
    // ========================================================================
    iniciarMonitoramentoSGS();
});

function iniciarMonitoramentoSGS() {
    setInterval(async () => {
        try {
            const response = await api.get('/sincronizacao/status-sgs');
            const dot = document.getElementById('sgs-dot');
            const text = document.getElementById('sgs-text');
            if (!dot || !text) return;

            if (response.status === 'online') {
                dot.style.color = '#10b981';
                text.textContent = 'SGS Online';
            } else {
                dot.style.color = '#f59e0b';
                text.textContent = `SGS Offline (Cache: ${response.ultimoCache || 'N/A'})`;
            }
        } catch {
            const dot = document.getElementById('sgs-dot');
            const text = document.getElementById('sgs-text');
            if (dot) dot.style.color = '#ef4444';
            if (text) text.textContent = 'SGS Indisponível';
        }
    }, 300000); // 5 minutos
}

function setLoading(buttonId, carregando, textoPadrao) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;
    if (carregando) {
        btn.disabled = true;
        btn.dataset.textoOriginal = btn.innerHTML;
        btn.innerHTML = textoPadrao;
    } else {
        btn.disabled = false;
        btn.innerHTML = btn.dataset.textoOriginal || textoPadrao;
    }
}








// /**
//  * Módulo de Sincronização SGS
//  * Suporta sincronização automática (Plano A) e importação manual CSV (Plano B)
//  */

// document.addEventListener('DOMContentLoaded', () => {
//     // ========================================================================
//     // ✅ PLANO A: SINCRONIZAÇÃO AUTOMÁTICA
//     // ========================================================================
    
//     const btnSincronizarAuto = document.getElementById('btn-sincronizar-automatico');
//     if (btnSincronizarAuto) {
//         btnSincronizarAuto.addEventListener('click', async () => {
//             if (!confirm('Deseja sincronizar todos os dados (Turmas e Alunos) diretamente do sistema SGS?\n\nIsso pode levar alguns minutos dependendo da quantidade de dados.')) {
//                 return;
//             }

//             try {
//                 setLoading('btn-sincronizar-automatico', true, '<i class="fas fa-spinner fa-spin"></i> Sincronizando...');
//                 showToast('Iniciando sincronização automática com o SGS...', 'info');

//                 const resultado = await api.post('/sincronizacao/sincronizar-automatico', {});

//                 const divResultado = document.getElementById('resultado-sincronizacao');
//                 divResultado.classList.remove('hidden');
//                 divResultado.innerHTML = `
//                     <div style="padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px; margin-bottom: 20px;">
//                         <h3 style="margin: 0 0 15px 0;"><i class="fas fa-check-circle"></i> ${resultado.mensagem}</h3>
//                         <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
//                             <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 6px;">
//                                 <div style="font-size: 0.85rem; opacity: 0.9;">Turmas Importadas</div>
//                                 <div style="font-size: 2rem; font-weight: bold;">${resultado.turmasImportadas}</div>
//                             </div>
//                             <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 6px;">
//                                 <div style="font-size: 0.85rem; opacity: 0.9;">Alunos Importados</div>
//                                 <div style="font-size: 2rem; font-weight: bold;">${resultado.alunosImportados}</div>
//                             </div>
//                         </div>
//                         <div style="margin-top: 15px; font-size: 0.85rem; opacity: 0.9;">
//                             <i class="fas fa-clock"></i> ${new Date(resultado.dataSincronizacao).toLocaleString('pt-BR')}
//                             <br>
//                             <i class="fas fa-microchip"></i> Método: ${resultado.metodo}
//                         </div>
//                     </div>
//                 `;

//                 showToast('Sincronização automática concluída!', 'success');
//             } catch (error) {
//                 console.error('Erro na sincronização automática:', error);
                
//                 // Mostrar opção de fallback
//                 const divResultado = document.getElementById('resultado-sincronizacao');
//                 divResultado.classList.remove('hidden');
//                 divResultado.innerHTML = `
//                     <div style="padding: 20px; background: #fee2e2; border: 2px solid #ef4444; border-radius: 8px; margin-bottom: 20px;">
//                         <h3 style="margin: 0 0 10px 0; color: #991b1b;"><i class="fas fa-exclamation-triangle"></i> Sincronização Automática Falhou</h3>
//                         <p style="margin: 0 0 15px 0; color: #7f1d1d;">${error.message || 'Erro ao conectar com o SGS'}</p>
//                         <div style="background: white; padding: 15px; border-radius: 6px;">
//                             <strong style="color: #991b1b;"><i class="fas fa-lightbulb"></i> Sugestão:</strong>
//                             <p style="margin: 10px 0 0 0; color: #374151;">
//                                 Utilize a <strong>importação manual via CSV</strong> (Plano B) abaixo enquanto a conexão automática não é restabelecida.
//                             </p>
//                         </div>
//                     </div>
//                 `;
                
//                 showToast('Erro na sincronização automática. Use a importação manual.', 'error');
//             } finally {
//                 setLoading('btn-sincronizar-automatico', false, '<i class="fas fa-sync-alt"></i> Sincronizar Automaticamente');
//             }
//         });
//     }

//     // ========================================================================
//     // ✅ PLANO B: IMPORTAÇÃO MANUAL VIA CSV
//     // ========================================================================

//     // Importar Turmas CSV
//     const btnImportarTurmas = document.getElementById('btn-importar-turmas-sgs');
//     if (btnImportarTurmas) {
//         btnImportarTurmas.addEventListener('click', async () => {
//             const fileInput = document.getElementById('file-turmas-sgs');
//             const file = fileInput.files[0];
            
//             if (!file) {
//                 showToast('Selecione um arquivo CSV de turmas', 'error');
//                 return;
//             }

//             if (!file.name.toLowerCase().endsWith('.csv')) {
//                 showToast('O arquivo deve ser um CSV', 'error');
//                 return;
//             }

//             try {
//                 setLoading('btn-importar-turmas-sgs', true, '<i class="fas fa-spinner fa-spin"></i> Importando...');
//                 showToast('Importando turmas via CSV...', 'info');

//                 const formData = new FormData();
//                 formData.append('file', file);

//                 const resultado = await api.postFormData('/sincronizacao/importar-turmas-csv', formData);

//                 const divResultado = document.getElementById('result-turmas-sgs');
//                 divResultado.classList.remove('hidden');
//                 divResultado.innerHTML = `
//                     <div style="padding: 15px; background: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
//                         <h4 style="margin: 0 0 10px 0; color: #166534;">
//                             <i class="fas fa-check-circle"></i> ${resultado.mensagem}
//                         </h4>
//                         <div style="font-size: 1.5rem; font-weight: bold; color: #059669;">
//                             ${resultado.total} turmas importadas
//                         </div>
//                         <div style="font-size: 0.85rem; color: #6b7280; margin-top: 5px;">
//                             <i class="fas fa-file-csv"></i> Método: ${resultado.metodo}
//                         </div>
//                     </div>
//                 `;

//                 showToast('Turmas importadas com sucesso!', 'success');
//                 fileInput.value = '';
//             } catch (error) {
//                 console.error('Erro na importação CSV:', error);
//                 showToast('Erro ao importar CSV: ' + error.message, 'error');
//             } finally {
//                 setLoading('btn-importar-turmas-sgs', false, '<i class="fas fa-upload"></i> Importar Turmas');
//             }
//         });
//     }

//     // Importar Alunos CSV
//     const btnImportarAlunos = document.getElementById('btn-importar-alunos-sgs');
//     if (btnImportarAlunos) {
//         btnImportarAlunos.addEventListener('click', async () => {
//             const fileInput = document.getElementById('file-alunos-sgs');
//             const file = fileInput.files[0];
            
//             if (!file) {
//                 showToast('Selecione um arquivo CSV de alunos', 'error');
//                 return;
//             }

//             if (!file.name.toLowerCase().endsWith('.csv')) {
//                 showToast('O arquivo deve ser um CSV', 'error');
//                 return;
//             }

//             try {
//                 setLoading('btn-importar-alunos-sgs', true, '<i class="fas fa-spinner fa-spin"></i> Importando...');
//                 showToast('Importando alunos via CSV...', 'info');

//                 const formData = new FormData();
//                 formData.append('file', file);

//                 const resultado = await api.postFormData('/sincronizacao/importar-alunos-csv', formData);

//                 const divResultado = document.getElementById('result-alunos-sgs');
//                 divResultado.classList.remove('hidden');
//                 divResultado.innerHTML = `
//                     <div style="padding: 15px; background: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
//                         <h4 style="margin: 0 0 10px 0; color: #166534;">
//                             <i class="fas fa-check-circle"></i> ${resultado.mensagem}
//                         </h4>
//                         <div style="font-size: 1.5rem; font-weight: bold; color: #059669;">
//                             ${resultado.total} alunos importados
//                         </div>
//                         <div style="font-size: 0.85rem; color: #6b7280; margin-top: 5px;">
//                             <i class="fas fa-file-csv"></i> Método: ${resultado.metodo}
//                         </div>
//                     </div>
//                 `;

//                 showToast('Alunos importados com sucesso!', 'success');
//                 fileInput.value = '';
//             } catch (error) {
//                 console.error('Erro na importação CSV:', error);
//                 showToast('Erro ao importar CSV: ' + error.message, 'error');
//             } finally {
//                 setLoading('btn-importar-alunos-sgs', false, '<i class="fas fa-upload"></i> Importar Alunos');
//             }
//         });
//     }
// });

// // Helper para loading
// function setLoading(buttonId, carregando, textoPadrao) {
//     const btn = document.getElementById(buttonId);
//     if (!btn) return;
    
//     if (carregando) {
//         btn.disabled = true;
//         btn.dataset.textoOriginal = btn.innerHTML;
//         btn.innerHTML = textoPadrao;
//     } else {
//         btn.disabled = false;
//         btn.innerHTML = btn.dataset.textoOriginal || textoPadrao;
//     }
// }





// // sincronizacao.js
// import { api } from './apijs.js';   // ajuste conforme seu padrão de import

// export function iniciarMonitoramentoSGS() {
//     // Verifica status a cada 5 minutos
//     setInterval(async () => {
//         try {
//             const response = await api.get('/sincronizacao/status-sgs');
//             const dot  = document.getElementById('sgs-dot');
//             const text = document.getElementById('sgs-text');
//             if (!dot || !text) return; // proteção caso os elementos não existam

//             if (response.status === 'online') {
//                 dot.style.color  = '#10b981';
//                 text.textContent = 'SGS Online';
//             } else {
//                 dot.style.color  = '#f59e0b';
//                 text.textContent = `SGS Offline (Cache: ${response.ultimoCache})`;
//             }
//         } catch {
//             const dot  = document.getElementById('sgs-dot');
//             const text = document.getElementById('sgs-text');
//             if (dot)  dot.style.color  = '#ef4444';
//             if (text) text.textContent = 'SGS Indisponível';
//         }
//     }, 300000); // 5 minutos
// }

// // Executa ao carregar
// document.addEventListener('DOMContentLoaded', () => {
//     iniciarMonitoramentoSGS();
// });

















// // // Sincronização Automática direto do SGS
// // document.addEventListener('DOMContentLoaded', () => {
// //     const btnSincronizarAuto = document.getElementById('btn-sincronizar-automatico');
    
// //     if (btnSincronizarAuto) {
// //         btnSincronizarAuto.addEventListener('click', async () => {
// //             if (!confirm('Deseja sincronizar todos os dados (Turmas e Alunos) diretamente do sistema SGS?')) {
// //                 return;
// //             }

// //             try {
// //                 setLoading('btn-sincronizar-automatico', true, '<i class="fas fa-spinner fa-spin"></i> Sincronizando...');
// //                 showToast('Iniciando sincronização com o SGS...', 'info');

// //                 const resultado = await api.post('/sincronizacao/sincronizar-automatico', {});

// //                 const divResultado = document.getElementById('resultado-sincronizacao');
// //                 divResultado.classList.remove('hidden');
// //                 divResultado.innerHTML = `
// //                     <div style="padding: 15px; background: #f0fdf4; border-radius: 4px; color: #166534; border-left: 4px solid #10b981;">
// //                         <h4 style="margin-bottom: 10px;"><i class="fas fa-check-circle"></i> Sincronização Concluída!</h4>
// //                         <div style="display: grid; gap: 8px;">
// //                             <div><strong>Turmas Importadas:</strong> ${resultado.turmasImportadas}</div>
// //                             <div><strong>Alunos Importados:</strong> ${resultado.alunosImportados}</div>
// //                             <div style="font-size: 0.85rem; color: #6b7280;">
// //                                 <i class="fas fa-clock"></i> ${new Date(resultado.dataSincronizacao).toLocaleString('pt-BR')}
// //                             </div>
// //                         </div>
// //                     </div>
// //                 `;

// //                 showToast('Sincronização concluída com sucesso!', 'success');
// //             } catch (error) {
// //                 console.error('Erro na sincronização:', error);
// //                 showToast('Erro ao sincronizar: ' + error.message, 'error');
// //             } finally {
// //                 setLoading('btn-sincronizar-automatico', false, '<i class="fas fa-sync-alt"></i> Sincronizar Automaticamente');
// //             }
// //         });
// //     }
// // });

// // // Helper para loading
// // function setLoading(buttonId, carregando, textoPadrao) {
// //     const btn = document.getElementById(buttonId);
// //     if (!btn) return;
    
// //     if (carregando) {
// //         btn.disabled = true;
// //         btn.dataset.textoOriginal = btn.innerHTML;
// //         btn.innerHTML = '<span class="loading"></span> Processando...';
// //     } else {
// //         btn.disabled = false;
// //         btn.innerHTML = btn.dataset.textoOriginal || textoPadrao;
// //     }
// // }










// // // document.addEventListener('DOMContentLoaded', () => {
// // //     // Importar Turmas SGS
// // //     const btnImportarTurmas = document.getElementById('btn-importar-turmas-sgs');
// // //     if (btnImportarTurmas) {
// // //         btnImportarTurmas.addEventListener('click', async () => {
// // //             const fileInput = document.getElementById('file-turmas-sgs');
// // //             const file = fileInput.files[0];
            
// // //             if (!file) return showToast('Selecione o arquivo CSV de Turmas', 'error');
            
// // //             const formData = new FormData();
// // //             formData.append('file', file);
            
// // //             try {
// // //                 setLoading('btn-importar-turmas-sgs', true, '<i class="fas fa-spinner fa-spin"></i> Processando...');
// // //                 const resultado = await api.postFormData('/sincronizacao/turmas-sgs', formData);
                
// // //                 const divResult = document.getElementById('result-turmas-sgs');
// // //                 divResult.classList.remove('hidden');
// // //                 divResult.innerHTML = `<strong>Sucesso!</strong> ${resultado.total} turmas sincronizadas.`;
// // //                 showToast('Turmas SGS sincronizadas!', 'success');
// // //                 fileInput.value = '';
// // //             } catch (error) {
// // //                 showToast('Erro na sincronização: ' + error.message, 'error');
// // //             } finally {
// // //                 setLoading('btn-importar-turmas-sgs', false, '<i class="fas fa-upload"></i> Sincronizar Turmas');
// // //             }
// // //         });
// // //     }

// // //     // Importar Alunos SGS
// // //     const btnImportarAlunos = document.getElementById('btn-importar-alunos-sgs');
// // //     if (btnImportarAlunos) {
// // //         btnImportarAlunos.addEventListener('click', async () => {
// // //             const fileInput = document.getElementById('file-alunos-sgs');
// // //             const file = fileInput.files[0];
            
// // //             if (!file) return showToast('Selecione o arquivo CSV de Alunos', 'error');
            
// // //             const formData = new FormData();
// // //             formData.append('file', file);
            
// // //             try {
// // //                 setLoading('btn-importar-alunos-sgs', true, '<i class="fas fa-spinner fa-spin"></i> Processando...');
// // //                 const resultado = await api.postFormData('/sincronizacao/alunos-sgs', formData);
                
// // //                 const divResult = document.getElementById('result-alunos-sgs');
// // //                 divResult.classList.remove('hidden');
// // //                 divResult.innerHTML = `<strong>Sucesso!</strong> ${resultado.total} alunos sincronizados.`;
// // //                 showToast('Alunos SGS sincronizados!', 'success');
// // //                 fileInput.value = '';
// // //             } catch (error) {
// // //                 showToast('Erro na sincronização: ' + error.message, 'error');
// // //             } finally {
// // //                 setLoading('btn-importar-alunos-sgs', false, '<i class="fas fa-upload"></i> Sincronizar Alunos');
// // //             }
// // //         });
// // //     }
// // // });