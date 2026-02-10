import API_URL from '../config/config.js';

export async function fetchAllHistoriqueEnvoi(paquetCote) {
	try {
		const url = `${API_URL}/backend_nabu/index.php?action=display-historiques-envoi&paquet_cote=${encodeURIComponent(paquetCote)}`;
		const response = await fetch(url, { credentials: 'include' });
		if (!response.ok) return null;
		return await response.json();
	} catch (err) {
		return null;
	}
}

export async function createHistoriqueEnvoi({ itemsId, paquetCote }) {
	try {
		const url = `${API_URL}/backend_nabu/index.php?action=create-historique-envoi`;
		const response = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify({ itemsId, paquetCote })
		});
		if (!response.ok) return null;
		return await response.json();
	} catch {
		return null;
	}
}