import API_URL from '../config/config.js';
//###### AFFICHAGe
// API pour récupéré tous les Corpus
export async function fetchAllCorpus() {
    	try {
		const response = await fetch(`${API_URL}/backend_nabu/index.php?action=display-corpus-all`);
		if (!response.ok) return null;
		return await response.json();
	} catch (err) {
		return null;
	}
}


// API pour récupéré un Corpus
export async function fetchOneCorpus(id) {
	try {
		if (!id) return null;
		const response = await fetch(`${API_URL}/backend_nabu/index.php?action=display-corpus&id=${encodeURIComponent(id)}`);
		if (!response.ok) return null;
		return await response.json();
	} catch (err) {
		return null;
	}
}


//###### EDITION

// Créer un corpus
export async function createCorpus(data) {
	try {
		const response = await fetch(`${API_URL}/backend_nabu/index.php?action=create-corpus`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		});
		return await response.json();
	} catch (err) {
		return null;
	}
}

// Modifier un corpus
export async function editCorpus(id, data) {
	try {
		const response = await fetch(`${API_URL}/backend_nabu/index.php?action=edit-corpus&id=${id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		});
		return await response.json();
	} catch (err) {
		return null;
	}
}

// Supprimer un corpus
export async function deleteCorpus(id) {
	try {
		const response = await fetch(`${API_URL}/backend_nabu/index.php?action=delete-corpus&id=${id}`, {
			method: 'DELETE',
		});
		return await response.json();
	} catch (err) {
		return null;
	}
}
