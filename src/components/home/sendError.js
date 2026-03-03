
import { fetchAllPaquets } from '../../API/paquet/paquet.js';
import { afficherCardPaquetModal } from './cardPaquet.js';
import { getPaquetStatusId, renderMiniPaquetList } from './miniPaquetList.js';

// Affiche le tableau des paquets en erreur d'envoi
export async function afficherSendErrorPaquet(conteneurId = 'send-error-paquet-conteneur') {
	return renderMiniPaquetList(conteneurId, {
		renderKey: 'sendErrorRenderId',
		fetchPaquets: fetchAllPaquets,
		filtre: (paquet) => String(getPaquetStatusId(paquet)) === '5',
		htmlVide: '<div class="text-muted text-center">Aucun paquet en erreur d\'envoi.</div>',
		classeCarte: 'card shadow-sm paquet-mini-item paquet-mini-item--error w-100 paquet-mini-card px-3 py-2 text-start',
		ouvrirPaquet: (paquet) => afficherCardPaquetModal(paquet),
		parPage: 4
	});
}

window.afficherSendErrorPaquet = afficherSendErrorPaquet;
