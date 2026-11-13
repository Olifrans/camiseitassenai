class SistemaNotificacoes {
    constructor() {
        this.badge = document.getElementById('notification-badge');
        this.bell = document.getElementById('notification-bell');
        this.dropdown = document.getElementById('notification-dropdown');
        this.notificationList = document.getElementById('notification-list');
        this.audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGS57OihUBELTKXh8bllHAU2j9XuznkpBSh+zPDajzsKElyz6OyrWBUIQ5zd8sFuJAUuhM/z24k2CBhku+zooVARC0yl4fG5ZRwFNo/V7s55KQUofsz');
        this.audio.volume = 0.3;
        this.notificacoesLidas = this.getNotificacoesLidas();
        this.popupMostrado = false;
        this.init();
    }

    init() {
        this.bell.addEventListener('click', (e) => { e.stopPropagation(); this.toggleDropdown(); });
        document.addEventListener('click', (e) => { if (!this.bell.contains(e.target)) this.dropdown.style.display = 'none'; });
        document.getElementById('btn-marcar-todos-lidos').addEventListener('click', () => this.marcarTodasComoLidas());
        this.carregarNotificacoes();
        setInterval(() => this.carregarNotificacoes(), 30000);
    }

    async carregarNotificacoes() {
        try {
            const alertas = await api.get('/dashboard/alertas-estoque');
            if (!alertas || alertas.length === 0) { this.badge.style.display = 'none'; return; }

            const alertasNaoLidos = alertas.filter(a => !this.notificacoesLidas.includes(`estoque_${a.tamanho}`));
            
            if (alertasNaoLidos.length > 0) {
                this.badge.textContent = alertasNaoLidos.length;
                this.badge.style.display = 'flex';
                this.bell.querySelector('i').style.color = '#dc3545';
                this.bell.querySelector('i').classList.add('fa-shake');
                this.atualizarListaNotificacoes(alertas);
                
                if (alertas.some(a => a.saldo === 0) && !this.notificacoesLidas.includes('som_tocado_hoje')) {
                    this.tocarAlertaSonoro();
                    this.notificacoesLidas.push('som_tocado_hoje');
                    this.saveNotificacoesLidas();
                }
                
                if (!this.popupMostrado) { this.mostrarPopupAutomatico(alertas); this.popupMostrado = true; }
            } else {
                this.badge.style.display = 'none';
                this.bell.querySelector('i').style.color = '#495057';
                this.bell.querySelector('i').classList.remove('fa-shake');
            }
        } catch (error) { console.error('Erro notificações:', error); }
    }

    atualizarListaNotificacoes(alertas) {
        this.notificationList.innerHTML = '';
        alertas.slice(0, 10).forEach(alerta => {
            const isCritico = alerta.saldo === 0;
            const cor = isCritico ? '#dc3545' : '#fd7e14';
            const icone = isCritico ? 'fa-exclamation-circle' : 'fa-exclamation-triangle';
            const lido = this.notificacoesLidas.includes(`estoque_${alerta.tamanho}`);
            
            const item = document.createElement('div');
            item.style.cssText = `padding: 12px 15px; border-bottom: 1px solid #f1f3f5; cursor: pointer; transition: background 0.2s; opacity: ${lido ? 0.6 : 1};`;
            item.onmouseover = () => item.style.background = '#f8f9fa';
            item.onmouseout = () => item.style.background = 'white';
            item.onclick = () => { this.marcarComoLida(`estoque_${alerta.tamanho}`); showPage('dashboard'); this.dropdown.style.display = 'none'; };
            
            item.innerHTML = `
                <div style="display: flex; gap: 12px; align-items: flex-start;">
                    <i class="fas ${icone}" style="color: ${cor}; font-size: 1.2rem; margin-top: 2px;"></i>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: #212529; font-size: 0.9rem;">Estoque ${alerta.tamanho} - ${isCritico ? 'CRÍTICO' : 'BAIXO'}</div>
                        <div style="color: #6c757d; font-size: 0.8rem; margin-top: 3px;">Saldo: ${alerta.saldo} / Mínimo: ${alerta.minimo}</div>
                        <div style="color: ${cor}; font-size: 0.75rem; margin-top: 3px; font-weight: 600;"><i class="fas fa-arrow-down"></i> Faltam ${alerta.diferenca}</div>
                    </div>
                </div>`;
            this.notificationList.appendChild(item);
        });
    }

    toggleDropdown() {
        const isVisible = this.dropdown.style.display === 'block';
        this.dropdown.style.display = isVisible ? 'none' : 'block';
        if (!isVisible) this.marcarTodasComoLidas();
    }

    marcarComoLida(id) { if (!this.notificacoesLidas.includes(id)) { this.notificacoesLidas.push(id); this.saveNotificacoesLidas(); } }
    
    marcarTodasComoLidas() {
        this.notificationList.querySelectorAll('div[style*="padding: 12px"]').forEach((_, i) => this.notificacoesLidas.push(`estoque_${i+1}`));
        this.saveNotificacoesLidas();
        this.badge.style.display = 'none';
        this.bell.querySelector('i').style.color = '#495057';
        this.bell.querySelector('i').classList.remove('fa-shake');
    }

    tocarAlertaSonoro() { try { this.audio.play(); } catch (e) {} }

    mostrarPopupAutomatico(alertas) {
        const criticos = alertas.filter(a => a.saldo === 0);
        const baixos = alertas.filter(a => a.saldo > 0);
        if (criticos.length === 0 && baixos.length === 0) return;
        
        const popup = document.createElement('div');
        popup.style.cssText = `position: fixed; top: 20px; right: 20px; background: white; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.2); padding: 20px; max-width: 400px; z-index: 9999; animation: slideIn 0.5s ease;`;
        
        let html = `<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <div style="display: flex; align-items: center; gap: 10px;"><i class="fas fa-bell" style="color: #dc3545; font-size: 1.5rem;"></i><strong style="color: #212529; font-size: 1.1rem;">Alertas de Estoque</strong></div>
            <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #6c757d;">&times;</button></div>`;
        
        if (criticos.length > 0) html += `<div style="background: #f8d7da; border-left: 4px solid #dc3545; padding: 12px; border-radius: 6px; margin-bottom: 10px;"><div style="font-weight: bold; color: #dc3545; margin-bottom: 5px;"><i class="fas fa-exclamation-circle"></i> ${criticos.length} tamanho(s) CRÍTICO(S)</div><div style="font-size: 0.85rem; color: #721c24;">${criticos.map(a => `Tamanho ${a.tamanho}`).join(', ')}</div></div>`;
        if (baixos.length > 0) html += `<div style="background: #fff3cd; border-left: 4px solid #fd7e14; padding: 12px; border-radius: 6px;"><div style="font-weight: bold; color: #856404; margin-bottom: 5px;"><i class="fas fa-exclamation-triangle"></i> ${baixos.length} tamanho(s) em BAIXA</div><div style="font-size: 0.85rem; color: #856404;">${baixos.map(a => `Tamanho ${a.tamanho}`).join(', ')}</div></div>`;
        
        html += `<button onclick="showPage('dashboard'); this.parentElement.parentElement.remove()" style="width: 100%; margin-top: 15px; padding: 10px; background: #0055A4; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Ver Dashboard</button>`;
        
        popup.innerHTML = html;
        document.body.appendChild(popup);
        setTimeout(() => { if (popup.parentElement) { popup.style.animation = 'slideOut 0.5s ease'; setTimeout(() => popup.remove(), 500); } }, 10000);
    }

    getNotificacoesLidas() { try { return JSON.parse(localStorage.getItem('notificacoesLidas') || '[]'); } catch { return []; } }
    saveNotificacoesLidas() { localStorage.setItem('notificacoesLidas', JSON.stringify(this.notificacoesLidas)); }
}

const style = document.createElement('style');
style.textContent = `@keyframes slideIn { from { transform: translateX(400px); opacity: 0; } to { transform: translateX(0); opacity: 1; } } @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(400px); opacity: 0; } } .fa-shake { animation: shake 0.5s ease-in-out; } @keyframes shake { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-15deg); } 75% { transform: rotate(15deg); } }`;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', () => { new SistemaNotificacoes(); });






// /**
//  * Sistema de Notificações Inteligentes
//  * - Badge no header com contador
//  * - Alerta sonoro
//  * - Popup automático ao entrar
//  */

// class SistemaNotificacoes {
//     constructor() {
//         this.badge = document.getElementById('notification-badge');
//         this.bell = document.getElementById('notification-bell');
//         this.dropdown = document.getElementById('notification-dropdown');
//         this.notificationList = document.getElementById('notification-list');
//         this.audio = null;
//         this.notificacoesLidas = this.getNotificacoesLidas();
        
//         this.init();
//     }

//     init() {
//         // Criar áudio de alerta (som discreto)
//         this.audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGS57OihUBELTKXh8bllHAU2j9XuznkpBSh+zPDajzsKElyz6OyrWBUIQ5zd8sFuJAUuhM/z24k2CBhku+zooVARC0yl4fG5ZRwFNo/V7s55KQUofsz');
//         this.audio.volume = 0.3;

//         // Evento de clique no sino
//         this.bell.addEventListener('click', (e) => {
//             e.stopPropagation();
//             this.toggleDropdown();
//         });

//         // Fechar dropdown ao clicar fora
//         document.addEventListener('click', (e) => {
//             if (!this.bell.contains(e.target)) {
//                 this.dropdown.style.display = 'none';
//             }
//         });

//         // Botão marcar todas como lidas
//         document.getElementById('btn-marcar-todos-lidos').addEventListener('click', () => {
//             this.marcarTodasComoLidas();
//         });

//         // Carregar notificações iniciais
//         this.carregarNotificacoes();
        
//         // Atualizar a cada 30 segundos
//         setInterval(() => this.carregarNotificacoes(), 30000);
//     }

//     async carregarNotificacoes() {
//         try {
//             const alertas = await api.get('/dashboard/alertas-estoque');
            
//             if (!alertas || alertas.length === 0) {
//                 this.badge.style.display = 'none';
//                 return;
//             }

//             // Filtrar apenas alertas não lidos
//             const alertasNaoLidos = alertas.filter(a => !this.notificacoesLidas.includes(`estoque_${a.tamanho}`));
            
//             if (alertasNaoLidos.length > 0) {
//                 // Atualizar badge
//                 this.badge.textContent = alertasNaoLidos.length;
//                 this.badge.style.display = 'flex';
                
//                 // Animar sino
//                 this.bell.querySelector('i').style.color = '#dc3545';
//                 this.bell.querySelector('i').classList.add('fa-shake');
                
//                 // Atualizar lista no dropdown
//                 this.atualizarListaNotificacoes(alertas);
                
//                 // Tocar som apenas se houver alertas CRÍTICOS
//                 const temCritico = alertas.some(a => a.saldo === 0);
//                 if (temCritico && !this.notificacoesLidas.includes('som_tocado_hoje')) {
//                     this.tocarAlertaSonoro();
//                     this.notificacoesLidas.push('som_tocado_hoje');
//                     this.saveNotificacoesLidas();
//                 }
                
//                 // Mostrar popup automático ao carregar a página
//                 if (!this.popupMostrado) {
//                     this.mostrarPopupAutomatico(alertas);
//                     this.popupMostrado = true;
//                 }
//             } else {
//                 this.badge.style.display = 'none';
//                 this.bell.querySelector('i').style.color = '#495057';
//                 this.bell.querySelector('i').classList.remove('fa-shake');
//             }
//         } catch (error) {
//             console.error('Erro ao carregar notificações:', error);
//         }
//     }

//     atualizarListaNotificacoes(alertas) {
//         this.notificationList.innerHTML = '';
        
//         alertas.slice(0, 10).forEach(alerta => {
//             const isCritico = alerta.saldo === 0;
//             const cor = isCritico ? '#dc3545' : '#fd7e14';
//             const icone = isCritico ? 'fa-exclamation-circle' : 'fa-exclamation-triangle';
//             const status = isCritico ? 'CRÍTICO' : 'BAIXO';
//             const lido = this.notificacoesLidas.includes(`estoque_${alerta.tamanho}`);
            
//             const item = document.createElement('div');
//             item.style.cssText = `
//                 padding: 12px 15px;
//                 border-bottom: 1px solid #f1f3f5;
//                 cursor: pointer;
//                 transition: background 0.2s;
//                 opacity: ${lido ? 0.6 : 1};
//             `;
//             item.onmouseover = () => item.style.background = '#f8f9fa';
//             item.onmouseout = () => item.style.background = 'white';
//             item.onclick = () => {
//                 this.marcarComoLida(`estoque_${alerta.tamanho}`);
//                 showPage('dashboard');
//                 this.dropdown.style.display = 'none';
//             };
            
//             item.innerHTML = `
//                 <div style="display: flex; gap: 12px; align-items: flex-start;">
//                     <i class="fas ${icone}" style="color: ${cor}; font-size: 1.2rem; margin-top: 2px;"></i>
//                     <div style="flex: 1;">
//                         <div style="font-weight: 600; color: #212529; font-size: 0.9rem;">
//                             Estoque ${alerta.tamanho} - ${status}
//                         </div>
//                         <div style="color: #6c757d; font-size: 0.8rem; margin-top: 3px;">
//                             Saldo: ${alerta.saldo} / Mínimo: ${alerta.minimo}
//                         </div>
//                         <div style="color: ${cor}; font-size: 0.75rem; margin-top: 3px; font-weight: 600;">
//                             Faltam ${alerta.diferenca} unidades
//                         </div>
//                     </div>
//                 </div>
//             `;
            
//             this.notificationList.appendChild(item);
//         });
//     }

//     toggleDropdown() {
//         const isVisible = this.dropdown.style.display === 'block';
//         this.dropdown.style.display = isVisible ? 'none' : 'block';
        
//         if (!isVisible) {
//             // Marcar todas como lidas ao abrir
//             this.marcarTodasComoLidas();
//         }
//     }

//     marcarComoLida(id) {
//         if (!this.notificacoesLidas.includes(id)) {
//             this.notificacoesLidas.push(id);
//             this.saveNotificacoesLidas();
//         }
//     }

//     marcarTodasComoLidas() {
//         const alertas = this.notificationList.querySelectorAll('div[style*="padding: 12px"]');
//         alertas.forEach((item, index) => {
//             const tamanho = index + 1; // Simplificação
//             this.notificacoesLidas.push(`estoque_${tamanho}`);
//         });
//         this.saveNotificacoesLidas();
//         this.badge.style.display = 'none';
//         this.bell.querySelector('i').style.color = '#495057';
//         this.bell.querySelector('i').classList.remove('fa-shake');
//         showToast('Todas notificações marcadas como lidas', 'success');
//     }

//     tocarAlertaSonoro() {
//         try {
//             this.audio.play();
//         } catch (error) {
//             console.log('Áudio bloqueado pelo navegador:', error);
//         }
//     }

//     mostrarPopupAutomatico(alertas) {
//         const criticos = alertas.filter(a => a.saldo === 0);
//         const baixos = alertas.filter(a => a.saldo > 0);
        
//         if (criticos.length === 0 && baixos.length === 0) return;
        
//         // Criar popup modal
//         const popup = document.createElement('div');
//         popup.style.cssText = `
//             position: fixed;
//             top: 20px;
//             right: 20px;
//             background: white;
//             border-radius: 12px;
//             box-shadow: 0 8px 32px rgba(0,0,0,0.2);
//             padding: 20px;
//             max-width: 400px;
//             z-index: 9999;
//             animation: slideIn 0.5s ease;
//         `;
        
//         let html = `
//             <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
//                 <div style="display: flex; align-items: center; gap: 10px;">
//                     <i class="fas fa-bell" style="color: #dc3545; font-size: 1.5rem;"></i>
//                     <strong style="color: #212529; font-size: 1.1rem;">Alertas de Estoque</strong>
//                 </div>
//                 <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #6c757d;">&times;</button>
//             </div>
//         `;
        
//         if (criticos.length > 0) {
//             html += `
//                 <div style="background: #f8d7da; border-left: 4px solid #dc3545; padding: 12px; border-radius: 6px; margin-bottom: 10px;">
//                     <div style="font-weight: bold; color: #dc3545; margin-bottom: 5px;">
//                         <i class="fas fa-exclamation-circle"></i> ${criticos.length} tamanho(s) CRÍTICO(S)
//                     </div>
//                     <div style="font-size: 0.85rem; color: #721c24;">
//                         ${criticos.map(a => `Tamanho ${a.tamanho}`).join(', ')}
//                     </div>
//                 </div>
//             `;
//         }
        
//         if (baixos.length > 0) {
//             html += `
//                 <div style="background: #fff3cd; border-left: 4px solid #fd7e14; padding: 12px; border-radius: 6px;">
//                     <div style="font-weight: bold; color: #856404; margin-bottom: 5px;">
//                         <i class="fas fa-exclamation-triangle"></i> ${baixos.length} tamanho(s) em BAIXA
//                     </div>
//                     <div style="font-size: 0.85rem; color: #856404;">
//                         ${baixos.map(a => `Tamanho ${a.tamanho}`).join(', ')}
//                     </div>
//                 </div>
//             `;
//         }
        
//         html += `
//             <button onclick="showPage('dashboard'); this.parentElement.parentElement.remove()" 
//                     style="width: 100%; margin-top: 15px; padding: 10px; background: #0055A4; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
//                 Ver Dashboard
//             </button>
//         `;
        
//         popup.innerHTML = html;
//         document.body.appendChild(popup);
        
//         // Auto-fechar após 10 segundos
//         setTimeout(() => {
//             if (popup.parentElement) {
//                 popup.style.animation = 'slideOut 0.5s ease';
//                 setTimeout(() => popup.remove(), 500);
//             }
//         }, 10000);
//     }

//     getNotificacoesLidas() {
//         try {
//             return JSON.parse(localStorage.getItem('notificacoesLidas') || '[]');
//         } catch {
//             return [];
//         }
//     }

//     saveNotificacoesLidas() {
//         localStorage.setItem('notificacoesLidas', JSON.stringify(this.notificacoesLidas));
//     }
// }

// // Adicionar animações CSS
// const style = document.createElement('style');
// style.textContent = `
//     @keyframes slideIn {
//         from { transform: translateX(400px); opacity: 0; }
//         to { transform: translateX(0); opacity: 1; }
//     }
//     @keyframes slideOut {
//         from { transform: translateX(0); opacity: 1; }
//         to { transform: translateX(400px); opacity: 0; }
//     }
//     .fa-shake {
//         animation: shake 0.5s ease-in-out;
//     }
//     @keyframes shake {
//         0%, 100% { transform: rotate(0deg); }
//         25% { transform: rotate(-15deg); }
//         75% { transform: rotate(15deg); }
//     }
// `;
// document.head.appendChild(style);

// // Inicializar quando o DOM estiver pronto
// document.addEventListener('DOMContentLoaded', () => {
//     new SistemaNotificacoes();
// });