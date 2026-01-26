import API_URL from './config.js';

// Récupère les infos de l'utilisateur connecté (inclut le rôle)
export async function getCurrentUser() {
    try {
        const response = await fetch(`${API_URL}/backend_nabu/index.php?action=check-auth`, { credentials: 'include' });
        if (!response.ok) return null;
        const data = await response.json();
        if (data && data.authenticated && data.user) {
            return data.user;
        }
        return null;
    } catch {
        return null;
    }
}
