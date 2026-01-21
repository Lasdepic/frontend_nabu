
import { fetchAllPaquets } from '../API/paquet.js';
import { afficherCardPaquetModal } from './cardPaquet.js';

// Affiche le tableau des paquets à faire 
export async function afficherTableauToDoPaquet(conteneurId = 'to-do-paquet-conteneur', filterCorpusId = null) {
	let conteneur = document.getElementById(conteneurId);
	if (!conteneur) {
		conteneur = document.createElement('div');
		conteneur.id = conteneurId;
		document.body.appendChild(conteneur);
	}

	// bloc le tableau pendant le scroll
	conteneur.style.display = 'block';
	conteneur.style.position = 'sticky';
	conteneur.style.top = '80px'; 
	conteneur.style.zIndex = '1000';

	// Titre tableau à faire
	conteneur.innerHTML = `<div class="bg-dark text-white text-center py-2 rounded mb-3" style="font-size:1rem;font-weight:400;">A Faire</div>`;

	// Récupère tous les paquets
	const paquetsResult = await fetchAllPaquets();
	let paquets = paquetsResult && paquetsResult.data ? paquetsResult.data : paquetsResult;
	if (!paquets || !Array.isArray(paquets)) {
		conteneur.innerHTML += '<div class="alert alert-danger">Erreur lors du chargement des paquets.</div>';
		return;
	}
	// Filtre : paquets à faire 
	paquets = paquets.filter(p => p.toDo);
	if (paquets.length === 0) {
		conteneur.innerHTML += '<div class="text-muted text-center">Aucun paquet à faire.</div>';
		return;
	}

	       const row = document.createElement('div');
	       row.className = 'row g-2';
	       paquets.forEach((p, idx) => {
		       const col = document.createElement('div');
		       col.className = 'col-12 col-sm-12 col-md-12';
		       const card = document.createElement('div');
		       card.className = 'card shadow-sm mb-2 border-0';
		       card.style.background = '#66b6ff';
		       card.style.cursor = 'pointer';
		       card.style.transition = 'box-shadow 0.2s, border 0.2s';
		       card.textContent = p.cote || '';
		       card.style.textAlign = 'center';
		       card.style.fontSize = '0.95rem';
		       card.style.fontWeight = '400';
		       card.addEventListener('mouseenter', () => {
			       card.style.boxShadow = '0 0 0 0.2rem #2196f3';
		       });
		       card.addEventListener('mouseleave', () => {
			       card.style.boxShadow = '';
		       });
		       card.addEventListener('click', () => {
			       afficherCardPaquetModal(p);
		       });
		       col.appendChild(card);
		       row.appendChild(col);
	       });
	       conteneur.appendChild(row);
}
