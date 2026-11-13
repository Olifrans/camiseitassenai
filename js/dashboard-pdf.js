/**
 * Exportação do Dashboard Completo para PDF
 * Versão Corrigida - Paginação Funcional
 */
async function exportarDashboardPDF() {
    try {
        if (typeof showToast === 'function') {
            showToast('Gerando PDF profissional, aguarde...', 'info');
        }

        console.log('=== INÍCIO DA EXPORTAÇÃO PDF ===');
        
        const { jsPDF } = window.jspdf;
        const dashboard = document.getElementById('dashboard');
        
        if (!dashboard) throw new Error('Dashboard não encontrado');

        const btnAtualizar = document.getElementById('btn-atualizar-dash');
        const btnExportar = document.getElementById('btn-exportar-dashboard-header');
        if (btnAtualizar) btnAtualizar.style.visibility = 'hidden';
        if (btnExportar) btnExportar.style.visibility = 'hidden';

        await new Promise(resolve => setTimeout(resolve, 1000));

        // Cria PDF em modo retrato
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const margem = 10;
        const larguraUtil = pdfWidth - (margem * 2);
        const alturaUtilPagina = pdfHeight - 40; // Espaço para cabeçalho e rodapé

        let paginaAtual = 1;
        let posicaoYAtual = 0;

        // ========================================================================
        // FUNÇÃO: Adiciona cabeçalho profissional (apenas página 1)
        // ========================================================================
        function adicionarCabecalhoPrimeiraPagina() {
            const logoCanvas = document.createElement('canvas');
            logoCanvas.width = 200;
            logoCanvas.height = 60;
            const logoCtx = logoCanvas.getContext('2d');
            logoCtx.fillStyle = '#FFFFFF';
            logoCtx.fillRect(0, 0, 200, 60);
            logoCtx.fillStyle = '#E30613';
            logoCtx.font = 'bold 36px Arial';
            logoCtx.fillText('SENAI', 10, 40);
            
            pdf.addImage(logoCanvas.toDataURL('image/png'), 'PNG', margem, 8, 40, 12);
            
            pdf.setFontSize(8);
            pdf.setTextColor(50, 50, 50);
            pdf.text('Escola Senai "Luis Eulálio de Bueno Vidigal Filho"', 55, 10);
            pdf.text('CFP 124 - Gestão de Camisetas', 55, 14);
            pdf.text('Relatório Gerencial de Estoque', 55, 18);

            pdf.setDrawColor(227, 6, 19);
            pdf.setLineWidth(0.5);
            pdf.line(margem, 22, pdfWidth - margem, 22);

            pdf.setFontSize(11);
            pdf.setTextColor(26, 58, 107);
            pdf.setFont(undefined, 'bold');
            pdf.text('RELATÓRIO GERENCIAL - GESTÃO DE CAMISETAS', margem, 30);

            pdf.setFontSize(8);
            pdf.setTextColor(100, 100, 100);
            const dataAtual = new Date().toLocaleString('pt-BR');
            pdf.text(`Gerado em: ${dataAtual}`, margem, 35);
            pdf.text(`Usuário: ADMINISTRADOR | Unidade: CFP 124`, margem, 39);

            pdf.setDrawColor(200, 200, 200);
            pdf.line(margem, 42, pdfWidth - margem, 42);

            posicaoYAtual = 46;
        }

        // ========================================================================
        // FUNÇÃO: Adiciona cabeçalho simplificado (páginas 2+)
        // ========================================================================
        function adicionarNovaPagina(tituloSecao) {
            pdf.addPage();
            paginaAtual++;
            posicaoYAtual = 15;
            
            pdf.setFontSize(9);
            pdf.setTextColor(26, 58, 107);
            pdf.setFont(undefined, 'bold');
            pdf.text(`${tituloSecao} - Página ${paginaAtual}`, margem, 12);
            
            pdf.setDrawColor(200, 200, 200);
            pdf.line(margem, 15, pdfWidth - margem, 15);
            
            posicaoYAtual = 20;
            
            console.log(`📄 Nova página criada (${paginaAtual}) para: ${tituloSecao}`);
        }

        // ========================================================================
        // FUNÇÃO: Adiciona seção com paginação inteligente
        // ========================================================================
        async function adicionarSecaoComPaginacao(elemento, nomeSecao) {
            if (!elemento) {
                console.warn(`❌ ${nomeSecao}: Elemento não encontrado`);
                return;
            }

            console.log(`📸 Capturando: ${nomeSecao}`);
            
            const canvas = await html2canvas(elemento, {
                scale: 1.8,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                scrollX: 0,
                scrollY: 0,
                windowWidth: elemento.scrollWidth,
                windowHeight: elemento.scrollHeight,
                logging: false
            });

            const imgData = canvas.toDataURL('image/png');
            const imgProps = pdf.getImageProperties(imgData);
            const imgHeightPDF = (imgProps.height * larguraUtil) / imgProps.width;

            console.log(`   - Altura: ${imgHeightPDF.toFixed(2)}mm`);
            console.log(`   - Espaço restante: ${(alturaUtilPagina - posicaoYAtual).toFixed(2)}mm`);

            // Verifica se precisa de nova página
            if (posicaoYAtual + imgHeightPDF > alturaUtilPagina) {
                console.log(`   → Criando nova página`);
                adicionarNovaPagina(nomeSecao);
            }

            // Adiciona imagem
            pdf.addImage(imgData, 'PNG', margem, posicaoYAtual, larguraUtil, imgHeightPDF);
            posicaoYAtual += imgHeightPDF + 5;
            
            console.log(`✅ ${nomeSecao} adicionado na página ${paginaAtual}`);
        }

        // ========================================================================
        // INÍCIO DA GERAÇÃO
        // ========================================================================
        console.log('=== DIAGNÓSTICO ===');
        console.log('Stats grids:', dashboard.querySelectorAll('.stats-grid').length);
        console.log('Alertas hidden:', document.getElementById('alertas-container')?.classList.contains('hidden'));

        // Página 1 - Cabeçalho
        adicionarCabecalhoPrimeiraPagina();

        // Seção 1: Cards
        const statsGrids = dashboard.querySelectorAll('.stats-grid');
        if (statsGrids.length > 0) {
            await adicionarSecaoComPaginacao(statsGrids[0], 'Indicadores');
        }

        // Seção 2: Alertas
        const alertasContainer = document.getElementById('alertas-container');
        if (alertasContainer && !alertasContainer.classList.contains('hidden')) {
            await adicionarSecaoComPaginacao(alertasContainer, 'Alertas');
        }

        // Seção 3: Gráficos de Distribuição
        if (statsGrids.length > 1) {
            await adicionarSecaoComPaginacao(statsGrids[1], 'Gráficos');
        }

        // Seção 4: Evolução
        const chartEvolucao = document.getElementById('chartEvolucaoEstoque');
        if (chartEvolucao) {
            const evolucaoPanel = chartEvolucao.closest('.content-panel');
            if (evolucaoPanel) {
                await adicionarSecaoComPaginacao(evolucaoPanel, 'Evolução');
            }
        }

        // Seção 5: Tabela
        const tblEstoque = document.getElementById('tbl-estoque-dash');
        if (tblEstoque) {
            const tabelaPanel = tblEstoque.closest('.content-panel');
            if (tabelaPanel) {
                await adicionarSecaoComPaginacao(tabelaPanel, 'Tabela');
            }
        }

        // ========================================================================
        // RODAPÉ EM TODAS AS PÁGINAS
        // ========================================================================
        const totalPages = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            pdf.setFontSize(7);
            pdf.setTextColor(150, 150, 150);
            pdf.text(`Página ${i} de ${totalPages}`, pdfWidth - 35, pdfHeight - 8);
        }

        // Restaura botões
        if (btnAtualizar) btnAtualizar.style.visibility = 'visible';
        if (btnExportar) btnExportar.style.visibility = 'visible';

        // Salva
        const dataFormatada = new Date().toISOString().split('T')[0];
        pdf.save(`Relatorio_Gerencial_SENAI_${dataFormatada}.pdf`);
        
        console.log(`✅ PDF GERADO: ${totalPages} páginas`);
        
        if (typeof showToast === 'function') {
            showToast(`PDF exportado com sucesso! (${totalPages} páginas)`, 'success');
        }

    } catch (error) {
        console.error('❌ ERRO:', error);
        if (typeof showToast === 'function') {
            showToast('Erro ao gerar PDF: ' + error.message, 'error');
        }
    }
}