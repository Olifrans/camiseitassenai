const API_BASE = 'http://localhost:5055/api';

const api = {
    async get(endpoint) {
        try {
            const response = await fetch(`${API_BASE}${endpoint}`);
            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: 'Erro na requisição' }));
                throw new Error(error.message || `Erro ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`API GET ${endpoint}:`, error);
            throw error;
        }
    },

    async post(endpoint, data) {
        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: 'Erro na requisição' }));
                throw new Error(error.message || `Erro ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`API POST ${endpoint}:`, error);
            throw error;
        }
    },

    async postFormData(endpoint, formData) {
        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: 'Erro no upload' }));
                throw new Error(error.message || `Erro ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`API POST FormData ${endpoint}:`, error);
            throw error;
        }
    }
};