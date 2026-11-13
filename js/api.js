// =====================================================================
// DETECÇÃO INTELIGENTE DE AMBIENTE
// =====================================================================
const API_BASE = (() => {
    // 1. TRUQUE DE DESENVOLVEDOR: Permite forçar a URL via Console do Navegador
    // Ex: localStorage.setItem('API_BASE_URL', 'http://localhost:5055/api');
    const manualOverride = localStorage.getItem('API_BASE_URL');
    if (manualOverride) {
        console.warn(`⚠️ Usando API_BASE_URL forçada: ${manualOverride}`);
        return manualOverride.replace(/\/$/, ''); // Remove barra final se houver
    }

    // 2. Detecta o ambiente atual pelo hostname
    const host = window.location.hostname;

    if (host === 'localhost' || host === '127.0.0.1' || host === '') {
        return 'http://localhost:5055/api'; // Ambiente de Desenvolvimento Local
    }

    if (host.includes('vercel.app')) {
        // ⚠️ IMPORTANTE: SUBSTITUA AQUI PELA URL REAL DO SEU BACKEND EM PRODUÇÃO
        // Exemplos: 'https://camisetas-senai.onrender.com/api' ou 'https://api.seusite.com'
        return 'https://SEU-BACKEND-EM-PRODUCAO.aqui.com/api'; 
    }

    // 3. Fallback (caso esteja rodando no mesmo domínio do backend)
    return '/api';
})();

console.log(`🚀 API configurada para: ${API_BASE}`);

// =====================================================================
// CLIENTE API
// =====================================================================
const api = {
    async get(endpoint) {
        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: 'Erro na requisição' }));
                throw new Error(error.message || error.error || `Erro HTTP ${response.status}`);
                }
            
            return await response.json();
        } catch (error) {
            console.error(`❌ API GET ${endpoint}:`, error);
            throw error;
        }
    },

    async post(endpoint, data) {
        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: 'Erro na requisição' }));
                throw new Error(error.message || error.error || `Erro HTTP ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`❌ API POST ${endpoint}:`, error);
            throw error;
        }
    },

    async postFormData(endpoint, formData) {
        try {
            // ⚠️ Não defina 'Content-Type' manualmente aqui, o fetch define o boundary do multipart automaticamente
            const response = await fetch(`${API_BASE}${endpoint}`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: 'Erro no upload' }));
                throw new Error(error.message || error.error || `Erro HTTP ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`❌ API POST FormData ${endpoint}:`, error);
            throw error;
        }
    }
};



// const API_BASE = 'http://localhost:5055/api';

// const api = {
//     async get(endpoint) {
//         try {
//             const response = await fetch(`${API_BASE}${endpoint}`);
//             if (!response.ok) {
//                 const error = await response.json().catch(() => ({ message: 'Erro na requisição' }));
//                 throw new Error(error.message || `Erro ${response.status}`);
//             }
//             return await response.json();
//         } catch (error) {
//             console.error(`API GET ${endpoint}:`, error);
//             throw error;
//         }
//     },

//     async post(endpoint, data) {
//         try {
//             const response = await fetch(`${API_BASE}${endpoint}`, {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify(data)
//             });
            
//             if (!response.ok) {
//                 const error = await response.json().catch(() => ({ message: 'Erro na requisição' }));
//                 throw new Error(error.message || `Erro ${response.status}`);
//             }
            
//             return await response.json();
//         } catch (error) {
//             console.error(`API POST ${endpoint}:`, error);
//             throw error;
//         }
//     },

//     async postFormData(endpoint, formData) {
//         try {
//             const response = await fetch(`${API_BASE}${endpoint}`, {
//                 method: 'POST',
//                 body: formData
//             });
            
//             if (!response.ok) {
//                 const error = await response.json().catch(() => ({ message: 'Erro no upload' }));
//                 throw new Error(error.message || `Erro ${response.status}`);
//             }
            
//             return await response.json();
//         } catch (error) {
//             console.error(`API POST FormData ${endpoint}:`, error);
//             throw error;
//         }
//     }
// };