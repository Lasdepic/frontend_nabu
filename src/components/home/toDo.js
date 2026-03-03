
import { fetchAllPaquets } from '../../API/paquet/paquet.js';
import { afficherCardPaquetModal } from './cardPaquet.js';
import { isFlagTruthy, renderMiniPaquetList } from './miniPaquetList.js';

// Affiche le tableau des paquets à faire 
export async function afficherTableauToDoPaquet(conteneurId = 'to-do-paquet-conteneur') {
	return renderMiniPaquetList(conteneurId, {
		renderKey: 'toDoRenderId',
		fetchPaquets: fetchAllPaquets,
		filtre: (paquet) => isFlagTruthy(paquet?.toDo),
		htmlVide: '<div class="text-muted text-center">Aucun paquet à faire.</div>',
		classeCarte: 'card shadow-sm paquet-mini-item paquet-mini-item--todo w-100 paquet-mini-card px-3 py-2 text-start',
		ouvrirPaquet: (paquet) => afficherCardPaquetModal(paquet),
		parPage: 4
	});
}

window.afficherTableauToDoPaquet = afficherTableauToDoPaquet;
