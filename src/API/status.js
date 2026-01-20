//###### AFFICHAGE
// API pour récupéré tous les statuts
export async function fetchAllTypeDocument() {
    	try {
		const response = await fetch('http://localhost/stage/backend_nabu/index.php?action=get-status-all');
		if (!response.ok) return null;
		return await response.json();
	} catch (err) {
		return null;
	}
}

// API pour récupérer un statut par son id
export async function fetchOneTypeDocument(id) {
	try {
		const response = await fetch(`http://localhost/stage/backend_nabu/index.php?action=get-status&id=${id}`);
		if (!response.ok) return null;
		return await response.json();
	} catch (err) {
		return null;
	}
}