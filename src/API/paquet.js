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
