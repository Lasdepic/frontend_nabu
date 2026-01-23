import API_URL from './config.js';
//###### AFFICHAGE
// API pour récupéré tous les users
export async function fetchAllusers() {
    	try {
		const response = await fetch(`${API_URL}/backend_nabu/index.php?action=get-users`);
		if (!response.ok) return null;
		return await response.json();
	} catch (err) {
		return null;
	}
}

// API pour récupéré un user
export async function fetchOneUser() {
    	try {
		const response = await fetch(`${API_URL}/backend_nabu/index.php?action=get-user`);
		if (!response.ok) return null;
		return await response.json();
	} catch (err) {
		return null;
	}
}

//###### EDITION
// Modifier un utilisateur
export async function updateUser(id, nom, prenom, email, roleId) {
	try {
		const response = await fetch(`${API_URL}/backend_nabu/index.php?action=update-user`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ id, nom, prenom, email, roleId })
		});
		return await response.json();
	} catch (err) {
		return null;
	}
}

// Supprimer un utilisateur
export async function deleteUser(id) {
	try {
		const response = await fetch(`${API_URL}/backend_nabu/index.php?action=delete-user`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ id })
		});
		return await response.json();
	} catch (err) {
		return null;
	}
}

// Modifier le mot de passe d'un utilisateur
export async function updateUserPassword(id, password) {
	try {
		const response = await fetch(`${API_URL}/backend_nabu/index.php?action=update-user-password`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ id, password })
		});
		return await response.json();
	} catch (err) {
		return null;
	}
}

