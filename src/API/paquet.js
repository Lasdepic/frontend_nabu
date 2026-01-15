//###### AFFICHAGE
// API pour récupéré tous les paquets
export async function fetchAllPaquets() {
    	try {
		const response = await fetch('http://localhost/stage/backend_nabu/index.php?action=display-paquets');
		if (!response.ok) return null;
		return await response.json();
	} catch (err) {
		return null;
	}
}

// API pour récupéré un paquet
export async function fetchOnePaquet() {
    	try {
		const response = await fetch('http://localhost/stage/backend_nabu/index.php?action=display-paquet');
		if (!response.ok) return null;
		return await response.json();
	} catch (err) {
		return null;
	}
}

//###### Edition paquet

// Créer un paquet
export async function createPaquet(paquetData) {
	try {
		const response = await fetch('http://localhost/stage/backend_nabu/index.php?action=create-paquet', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(paquetData),
		});
		return await response.json();
	} catch (err) {
		return null;
	}
}

// Modifier un paquet
export async function editPaquet(paquetData) {
	try {
		const response = await fetch('http://localhost/stage/backend_nabu/index.php?action=edit-paquet', {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(paquetData),
		});
		return await response.json();
	} catch (err) {
		return null;
	}
}

// Supprimer un paquet
export async function deletePaquet(paquetId) {
	try {
		const response = await fetch('http://localhost/stage/backend_nabu/index.php?action=delete-paquet', {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ id: paquetId }),
		});
		return await response.json();
	} catch (err) {
		return null;
	}
}

