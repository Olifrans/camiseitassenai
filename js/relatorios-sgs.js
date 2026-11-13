/**
 * Módulo de Relatórios SGS - Dados Cruzados
 */

function mostrarAbaRelatorioSGS(aba) {
    document.getElementById('secao-distribuicoes-sgs').classList.add('hidden');
    document.getElementById('secao-resumo-turma').classList.add('hidden');
    document.getElementById('secao-resumo-curso').classList.add('hidden');

    ['tab-dist-sgs', 'tab-resumo-turma', 'tab-resumo-curso'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.borderBottom = 'none';
    });

    if (aba === 'distribuicoes') {
        document.getElementById('secao-distribuicoes-sgs').classList.remove('hidden');
        document.getElementById('tab-dist-sgs').style.borderBottom = '3px solid var(--senai-blue)';
        loadDistribuicoesSGS();
    } else if (aba === 'resumo-turma') {
        document.getElementById('secao-resumo-turma').classList.remove('hidden');
        document.getElementById('tab-resumo-turma').style.borderBottom = '3px solid var(--senai-blue)';
        loadResumoPorTurma();
    } else if (aba === 'resumo-curso') {
        document.getElementById('secao-resumo-curso').classList.remove('hidden');
        document.getElementById('tab-resumo-curso').style.borderBottom = '3px solid var(--senai-blue)';
        loadResumoPorCurso();
    }
}

async function loadDistribuicoesSGS() {
    const tbody = document.querySelector('#tbl-distribuicoes-sgs tbody');
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 30px;"><span class="loading"></span> Carregando...</td></tr>';

    const codigoTurma = document.getElementById('filtro-turma-sgs').value.trim();
    const matricula = document.getElementById('filtro-matricula-sgs').value.trim();

    try {
        const params = new URLSearchParams();
        if (codigoTurma) params.append('codigoTurma', codigoTurma);
        if (matricula) params.append('matriculaAluno', matricula);

        const data = await api.get(`/relatorios-sgs/distribuicoes?${params.toString()}`);
        tbody.innerHTML = '';

        if (data.dados && data.dados.length > 0) {
            data.dados.forEach(d => {
                tbody.innerHTML += `
                    <tr>
                        <td>${formatarData(d.dataDistribuicao)}</td>
                        <td><strong>${d.alunoNome}</strong></td>
                        <td style="font-family:monospace;">${d.alunoMatricula}</td>
                        <td><strong>${d.turmaCodigo}</strong></td>
                        <td>${d.turmaCurso}</td>
                        <td><span class="badge badge-ok">${d.tamanho}</span></td>
                        <td style="text-align:center;">${d.quantidade}</td>
                        <td>${d.responsavel}</td>
                    </tr>`;
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 30px;">Nenhuma distribuição encontrada</td></tr>';
        }
    } catch (error) {
        console.error('Erro:', error);
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 30px; color:var(--danger);">Erro ao carregar dados</td></tr>';
    }
}

async function loadResumoPorTurma() {
    const tbody = document.querySelector('#tbl-resumo-turma tbody');
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 30px;"><span class="loading"></span> Carregando...</td></tr>';

    try {
        const data = await api.get('/relatorios-sgs/resumo-por-turma');
        tbody.innerHTML = '';

        data.forEach(r => {
            const percentualClass = r.percentualAtendimento >= 80 ? 'badge-ok' : (r.percentualAtendimento >= 50 ? 'badge-warning' : 'badge-err');
            tbody.innerHTML += `
                <tr>
                    <td><strong>${r.turmaCodigo}</strong></td>
                    <td>${r.turmaCurso}</td>
                    <td>${r.turmaTurno}</td>
                    <td>${r.turmaDocente}</td>
                    <td style="text-align:center;">${r.totalAlunosTurma}</td>
                    <td style="text-align:center;"><strong>${r.totalDistribuidos}</strong></td>
                    <td style="text-align:center;">${r.pendentes}</td>
                    <td style="text-align:center;"><span class="badge ${percentualClass}">${r.percentualAtendimento}%</span></td>
                </tr>`;
        });
    } catch (error) {
        console.error('Erro:', error);
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 30px; color:var(--danger);">Erro</td></tr>';
    }
}

async function loadResumoPorCurso() {
    const container = document.getElementById('cards-resumo-curso');
    container.innerHTML = '<div style="text-align:center; padding: 40px;"><span class="loading"></span></div>';

    try {
        const data = await api.get('/relatorios-sgs/resumo-por-curso');
        container.innerHTML = '';

        data.forEach(r => {
            container.innerHTML += `
                <div class="stat-card">
                    <div class="stat-info">
                        <span class="stat-label">${r.curso}</span>
                        <span class="stat-value" style="font-size:1.8rem;">${r.totalDistribuidos}</span>
                        <span class="stat-subtitle">distribuídos de ${r.totalAlunos} alunos</span>
                        <span style="font-size:0.85rem; color:var(--text-secondary);">${r.totalTurmas} turmas</span>
                    </div>
                </div>`;
        });
    } catch (error) {
        console.error('Erro:', error);
        container.innerHTML = '<div style="text-align:center; padding: 40px; color:var(--danger);">Erro ao carregar</div>';
    }
}

async function exportarDistribuicoesSGS() {
    try {
        showToast('Gerando CSV...', 'info');
        const codigoTurma = document.getElementById('filtro-turma-sgs').value.trim();
        const matricula = document.getElementById('filtro-matricula-sgs').value.trim();
        
        const params = new URLSearchParams();
        if (codigoTurma) params.append('codigoTurma', codigoTurma);
        if (matricula) params.append('matriculaAluno', matricula);

        const response = await fetch(`http://localhost:5055/api/relatorios-sgs/distribuicoes/exportar?${params.toString()}`);
        if (!response.ok) throw new Error('Erro na requisição');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `distribuicoes_sgs_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showToast('CSV exportado com sucesso!', 'success');
    } catch (error) {
        showToast('Erro ao exportar: ' + error.message, 'error');
    }
}