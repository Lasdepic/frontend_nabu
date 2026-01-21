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
			   method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(paquetData),
		});
		   let text = await response.text();
		   let result = null;
		   try {
			   result = JSON.parse(text);
		   } catch (jsonErr) {
			   console.error('Réponse non JSON du backend:', text);
			   return null;
		   }
		   if (!response.ok) {
			   console.error('Erreur backend:', result);
		   }
		   return result;
	} catch (err) {
		console.error('Erreur JS/fetch:', err);
		return null;
	}
}

// Supprimer un paquet
export async function deletePaquet(cote) {
	try {
		const url = `http://localhost/stage/backend_nabu/index.php?action=delete-paquet&cote=${encodeURIComponent(cote)}`;
		const response = await fetch(url, {
			method: 'DELETE',
		});
		return await response.json();
	} catch (err) {
		return null;
	}
}

