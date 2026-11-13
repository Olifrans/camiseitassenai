// Mapeamento de tamanhos
const TamanhosMap = ['PP', 'P', 'M', 'G', 'GG', 'XGG'];

function formatarTamanho(valor) {
    if (typeof valor === 'number') {
        return TamanhosMap[valor] || valor;
    }
    return valor;
}

function formatarData(dataString) {
    if (!dataString) return '-';
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

function showToast(mensagem, tipo = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = mensagem;
    toast.className = `toast show ${tipo}`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

function toggleModal(modalId, mostrar) {
    const modal = document.getElementById(modalId);
    if (mostrar) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    } else {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
}

function setLoading(buttonId, carregando, textoPadrao) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;
    
    if (carregando) {
        btn.disabled = true;
        btn.dataset.textoOriginal = btn.innerHTML;
        btn.innerHTML = '<span class="loading"></span> Processando...';
    } else {
        btn.disabled = false;
        btn.innerHTML = btn.dataset.textoOriginal || textoPadrao;
    }
}

function limparFormulario(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.reset();
    }
}

// ✅ FUNÇÃO CORRIGIDA
function validarCampo(valor, mensagem) {
    const valorStr = String(valor ?? '').trim();
    
    if (valorStr === '' || valorStr === 'undefined' || valorStr === 'null') {
        showToast(mensagem, 'error');
        return false;
    }
    return true;
}