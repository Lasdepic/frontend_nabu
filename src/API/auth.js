import API_URL from './config.js';
// Récupère l'id utilisateur connecté et le stocke dans le localStorage
export async function storeConnectedUserId() {
	try {
		const response = await fetch(`${API_URL}stage/backend_nabu/index.php?action=check-auth`, { credentials: 'include' });
		const data = await response.json();
		if (data && data.authenticated && data.user && data.user.id) {
			localStorage.setItem('userId', data.user.id);
		} else {
			localStorage.removeItem('userId');
		}
	} catch {
		localStorage.removeItem('userId');
	}
}
// Vérifie l'authentification via une requête à l'API
export async function isAuthenticated() {
	try {
		const response = await fetch(`${API_URL}stage/backend_nabu/index.php?action=check-auth`, { credentials: 'include' });
		if (!response.ok) return false;
		const data = await response.json();
		return data && data.authenticated === true;
	} catch {
		return false;
	}
}
// API Login
export async function login (email, password){
    try {
		const res = await fetch(`${API_URL}stage/backend_nabu/index.php?action=login`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            credentials: "include",
            body: JSON.stringify({email, password}),
        })

        if (!res.ok) {
            throw new Error(`Echec de connexion, statut ${res.status}`)
        }

        return res.json()
    } catch (error) {
        console.error('Erreur lors de la requete de connexion :', error)
        throw error
    }
}

// API Déconnexion
export async function logout() {
	try {
		const res = await fetch(`${API_URL}stage/backend_nabu/index.php?action=logout`, {
			method: "GET",
			credentials: "include",
		});
		if (!res.ok) {
			console.error("Erreur lors de la déconnexion");
		}
		return true;
	} catch (error) {
		console.error("Erreur lors de la déconnexion:", error);
		return false;
	}
}

// Register
export async function register(userData) {
	try {
		const res = await fetch(`${API_URL}stage/backend_nabu/index.php?action=register`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			credentials: "include",
			body: JSON.stringify(userData),
		});
		if (!res.ok) {
			throw new Error(`Echec de l'inscription, statut ${res.status}`);
		}
		return await res.json();
	} catch (error) {
		console.error("Erreur lors de la requête d'inscription:", error);
		throw error;
	}
}
