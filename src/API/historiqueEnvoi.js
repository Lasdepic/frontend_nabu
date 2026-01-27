import API_URL from './config.js';

export async function fetchAllHistoriqueEnvoi(paquetCote) {
	try {
		const url = `${API_URL}/backend_nabu/index.php?action=display-historiques-envoi&paquet_cote=${encodeURIComponent(paquetCote)}`;
		const response = await fetch(url);
		if (!response.ok) return null;
		return await response.json();
	} catch (err) {
		return null;
	}
}