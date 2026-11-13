/**
 * ⚠️ OBSOLETO: Esta funcionalidade foi migrada e unificada na tela de "Sincronização SGS".
 * Este arquivo é mantido no projeto apenas como backup histórico.
 * Ele não é mais carregado pelo index.html.
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('[Importacao.js] Carregado, mas inativo (funcionalidade movida para Sincronização SGS).');
    
    /* 
    // Código legado preservado para referência futura, se necessário:
    const btnProcessar = document.getElementById('btn-processar-csv');
    if (btnProcessar) {
        btnProcessar.addEventListener('click', async () => {
            // ... lógica antiga ...
        });
    }
    */


    // const btnProcessar = document.getElementById('btn-processar-csv');
    
    // if (btnProcessar) {
    //     btnProcessar.addEventListener('click', async () => {
    //         const fileInput = document.getElementById('file-csv');
    //         const file = fileInput.files[0];
            
    //         if (!file) {
    //             showToast('Selecione um arquivo CSV', 'error');
    //             return;
    //         }
            
    //         if (!file.name.toLowerCase().endsWith('.csv')) {
    //             showToast('O arquivo deve ser um CSV', 'error');
    //             return;
    //         }
            
    //         const formData = new FormData();
    //         formData.append('file', file);
            
    //         try {
    //             setLoading('btn-processar-csv', true, '<i class="fas fa-upload"></i> Processando...');
    //             showToast('Processando arquivo CSV...', 'info');
                
    //             const resultado = await api.postFormData('/importacao/turmas-csv', formData);
                
    //             const divResultado = document.getElementById('import-result');
    //             divResultado.classList.remove('hidden');
                
    //             const errosHtml = resultado.detalhes && resultado.detalhes.length > 0 
    //                 ? `<br><br><strong>Erros:</strong><ul style="margin: 10px 0; padding-left: 20px;">${resultado.detalhes.map(e => `<li>${e}</li>`).join('')}</ul>`
    //                 : '';
                
    //             divResultado.innerHTML = `
    //                 <h4 style="margin-bottom: 10px; color: var(--senai-blue);"><i class="fas fa-check-circle"></i> Importação Concluída!</h4>
    //                 <div style="display: grid; gap: 10px; margin-top: 15px;">
    //                     <div><strong>Total Lido:</strong> ${resultado.totalLido}</div>
    //                     <div style="color: var(--success);"><strong>Importados:</strong> ${resultado.importados}</div>
    //                     <div style="color: var(--danger);"><strong>Rejeitados:</strong> ${resultado.rejeitados}</div>
    //                 </div>
    //                 ${errosHtml}
    //             `;
                
    //             showToast('Importação concluída com sucesso!', 'success');
    //             fileInput.value = '';
                
    //         } catch (error) {
    //             console.error('Erro na importação:', error);
    //             showToast('Erro na importação: ' + error.message, 'error');
    //         } finally {
    //             setLoading('btn-processar-csv', false, '<i class="fas fa-upload"></i> Processar Arquivo');
    //         }
    //     });
    // }


});











