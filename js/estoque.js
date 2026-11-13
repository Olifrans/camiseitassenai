/**
 * Módulo de Controle de Estoque
 * Gerencia a exibição da tabela e o registro de novas entradas.
 */

async function loadEstoque() {
    try {
        const tbody = document.querySelector('#tbl-estoque-full tbody');
        
        // Estado de carregamento
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 40px;"><span class="loading"></span> Carregando estoque...</td></tr>';

        const estoques = await api.get('/estoque');
        tbody.innerHTML = ''; // Limpa o loading

        if (estoques && estoques.length > 0) {
            // 1. Mapeamento de segurança (caso o backend envie o número do enum em vez do texto)
            const tamanhosMap = { 
                '0': 'PP', '1': 'P', '2': 'M', '3': 'G', '4': 'GG', '5': 'XGG',
                'PP': 'PP', 'P': 'P', 'M': 'M', 'G': 'G', 'GG': 'GG', 'XGG': 'XGG'
            };
            
            const ordemTamanhos = ['PP', 'P', 'M', 'G', 'GG', 'XGG'];
            const estoqueAgrupado = {};

            // 2. Agrupamento e Soma (Failsafe contra duplicatas no banco)
            estoques.forEach(e => {
                const tamanhoTexto = tamanhosMap[String(e.tamanho)] || e.tamanho;

                if (!estoqueAgrupado[tamanhoTexto]) {
                    estoqueAgrupado[tamanhoTexto] = {
                        tamanho: tamanhoTexto,
                        quantidadeInicial: 0,
                        saldoDisponivel: 0,
                        estoqueMinimo: 0,
                        dataAtualizacao: null
                    };
                }

                // Soma os valores
                estoqueAgrupado[tamanhoTexto].quantidadeInicial += parseInt(e.quantidadeInicial) || 0;
                estoqueAgrupado[tamanhoTexto].saldoDisponivel += parseInt(e.saldoDisponivel) || 0;
                
                // Pega o maior estoque mínimo como referência de segurança
                estoqueAgrupado[tamanhoTexto].estoqueMinimo = Math.max(
                    estoqueAgrupado[tamanhoTexto].estoqueMinimo, 
                    parseInt(e.estoqueMinimo) || 0
                );

                // Pega a data de atualização mais recente
                const dataAtual = new Date(e.dataAtualizacao);
                if (!estoqueAgrupado[tamanhoTexto].dataAtualizacao || 
                    dataAtual > new Date(estoqueAgrupado[tamanhoTexto].dataAtualizacao)) {
                    estoqueAgrupado[tamanhoTexto].dataAtualizacao = e.dataAtualizacao;
                }
            });

            // 3. Ordenação correta (PP -> XGG)
            const estoqueOrdenado = Object.values(estoqueAgrupado).sort((a, b) => {
                return ordemTamanhos.indexOf(a.tamanho) - ordemTamanhos.indexOf(b.tamanho);
            });

            // 4. Renderização da tabela
            estoqueOrdenado.forEach(e => {
                const row = `
                    <tr>
                        <td><strong>${e.tamanho}</strong></td>
                        <td class="text-center">${e.quantidadeInicial}</td>
                        <td class="text-center"><strong>${e.saldoDisponivel}</strong></td>
                        <td class="text-center">${e.estoqueMinimo}</td>
                        <td class="text-center">${formatarData(e.dataAtualizacao)}</td>
                    </tr>
                `;
                tbody.innerHTML += row;
            });

        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center; padding: 40px; color: var(--text-light);">
                        <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 10px; display: block;"></i>
                        Nenhum registro de estoque encontrado
                    </td>
                </tr>`;
        }
    } catch (error) {
        console.error('Erro ao carregar estoque:', error);
        const tbody = document.querySelector('#tbl-estoque-full tbody');
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 40px; color: var(--danger);">Erro ao carregar dados. Tente novamente.</td></tr>';
        showToast('Erro ao carregar estoque: ' + error.message, 'error');
    }
}

// ========================================================================
// EVENT LISTENER: Registro de Entrada de Estoque
// ========================================================================
document.addEventListener('DOMContentLoaded', () => {
    const formEntrada = document.getElementById('form-entrada');
    
    if (formEntrada) {
        formEntrada.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const payload = {
                tamanho: parseInt(document.getElementById('ent-tamanho').value),
                quantidade: parseInt(document.getElementById('ent-qtd').value),
                responsavel: document.getElementById('ent-resp').value.trim(),
                observacao: document.getElementById('ent-obs').value.trim() || 'Entrada manual via sistema'
            };
            
            // Validações
            if (!validarCampo(payload.tamanho, 'Selecione um tamanho')) return;
            if (!validarCampo(payload.quantidade, 'Informe a quantidade')) return;
            if (!validarCampo(payload.responsavel, 'Informe o responsável')) return;
            
            if (payload.quantidade <= 0) {
                showToast('A quantidade deve ser maior que zero', 'error');
                return;
            }
            
            try {
                setLoading('btn-salvar-entrada', true, '<i class="fas fa-save"></i> Salvar Entrada');
                
                await api.post('/estoque/entrada', payload);
                
                showToast('Entrada registrada com sucesso!', 'success');
                
                // Limpa e fecha
                toggleModal('modal-entrada', false);
                limparFormulario('form-entrada');
                
                // Atualiza as visualizações
                loadEstoque();
                
                // Se o dashboard estiver visível em segundo plano, atualiza ele também
                if (!document.getElementById('dashboard').classList.contains('hidden')) {
                    loadDashboard();
                }
                
            } catch (error) {
                console.error('Erro na entrada:', error);
                showToast('Erro ao registrar entrada: ' + error.message, 'error');
            } finally {
                setLoading('btn-salvar-entrada', false, '<i class="fas fa-save"></i> Salvar Entrada');
            }
        });
    }
});