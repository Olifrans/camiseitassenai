document.addEventListener('DOMContentLoaded', () => {
    const formDist = document.getElementById('form-dist');
    
    if (formDist) {
        formDist.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const matricula = document.getElementById('dist-matricula').value.trim();
            const codigoTurma = document.getElementById('dist-turma').value.trim();
            const tamanho = parseInt(document.getElementById('dist-tamanho').value);
            const ano = parseInt(document.getElementById('dist-ano').value);
            const semestre = parseInt(document.getElementById('dist-semestre').value);
            const responsavel = document.getElementById('dist-resp').value.trim();
            
            // Validações
            if (!validarCampo(matricula, 'Informe a matrícula do aluno')) return;
            if (!validarCampo(codigoTurma, 'Informe o código da turma')) return;
            if (!validarCampo(tamanho, 'Selecione um tamanho')) return;
            if (!validarCampo(responsavel, 'Informe o responsável')) return;
            
            try {
                setLoading('btn-salvar-dist', true, '<i class="fas fa-check"></i> Confirmar Entrega');
                showToast('Buscando aluno e validando dados...', 'info');
                
                // 1. Buscar aluno
                const alunoData = await api.get(`/alunos/buscar?matricula=${encodeURIComponent(matricula)}&codigoTurma=${encodeURIComponent(codigoTurma)}`);
                
                if (!alunoData) {
                    throw new Error('Aluno ou turma não encontrados. Verifique os dados.');
                }
                
                showToast('Verificando disponibilidade em estoque...', 'info');
                
                // 2. Verificar estoque
                const estoqueData = await api.get(`/estoque/verificar?tamanho=${tamanho}`);
                
                if (!estoqueData || estoqueData.saldoDisponivel < 1) {
                    throw new Error(`Estoque insuficiente para tamanho ${formatarTamanho(tamanho)}!`);
                }
                
                showToast('Registrando distribuição...', 'info');
                
                // 3. Registrar distribuição
                const payload = {
                    alunoId: alunoData.id,
                    turmaId: alunoData.turmaId,
                    tamanho: tamanho,
                    quantidade: 1,
                    anoReferencia: ano,
                    semestreReferencia: semestre,
                    responsavel: responsavel
                };
                
                await api.post('/distribuicao', payload);
                
                showToast('✅ Distribuição realizada com sucesso!', 'success');
                limparFormulario('form-dist');
                
            } catch (error) {
                console.error('Erro na distribuição:', error);
                showToast(error.message || 'Erro ao registrar distribuição', 'error');
            } finally {
                setLoading('btn-salvar-dist', false, '<i class="fas fa-check"></i> Confirmar Entrega');
            }
        });
    }
});