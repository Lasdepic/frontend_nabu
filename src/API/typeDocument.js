import API_URL from './config.js';
//###### AFFICHAGE
// API pour récupéré tous type Documents
export async function fetchAllTypeDocument() {
    	try {
		const response = await fetch(`${API_URL}stage/backend_nabu/index.php?action=display-type-documents`);
		if (!response.ok) return null;
		return await response.json();
	} catch (err) {
		return null;
	}
}

// API pour récupérer un type Document par son id
export async function fetchOneTypeDocument(id) {
	try {
		const response = await fetch(`${API_URL}stage/backend_nabu/index.php?action=display-type-document&id=${id}`);
		if (!response.ok) return null;
		return await response.json();
	} catch (err) {
		return null;
	}
}