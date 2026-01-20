
import { fetchAllPaquets } from '../API/paquet.js';
import { afficherCardPaquetModal } from './cardPaquet.js';

// Affiche le tableau des paquets à faire 
export async function afficherSendErrorPaquet(conteneurId = 'to-do-paquet-conteneur', filterCorpusId = null) {
    let conteneur = document.getElementById(conteneurId);
    if (!conteneur) {
        conteneur = document.createElement('div');
        conteneur.id = conteneurId;
        document.body.appendChild(conteneur);
    }

    // bloc le tableau pendant le scroll
    conteneur.style.display = 'block';
    conteneur.style.position = 'sticky';
    conteneur.style.top = '215px'; 
    conteneur.style.zIndex = '1000';

    // Titre tableau erreurs d'envoi
    conteneur.innerHTML = `<div class="text-center py-2 rounded mb-3" style="background-color:#212529;color:#fff;font-size:1rem;font-weight:400;">Envoi en erreur</div>`;

    // Récupère tous les paquets
    const paquetsResult = await fetchAllPaquets();
    let paquets = paquetsResult && paquetsResult.data ? paquetsResult.data : paquetsResult;
    if (!paquets || !Array.isArray(paquets)) {
        conteneur.innerHTML += '<div class="alert alert-danger">Erreur lors du chargement des paquets.</div>';
        return;
    }
  
    paquets = paquets.filter(p => p.status === 'ENVOI_EN_ERREUR');
    if (paquets.length === 0) {
        conteneur.innerHTML += '<div class="text-muted text-center">Aucun paquet en erreur d\'envoi.</div>';
        return;
    }

    const row = document.createElement('div');
    row.className = 'row g-2';
    paquets.forEach((p) => {
        const col = document.createElement('div');
        col.className = 'col-12 col-sm-12 col-md-12';
        const card = document.createElement('div');
        card.className = 'card shadow-sm mb-2 border-0';
        card.style.background = '#ffb24d';
        card.style.cursor = 'pointer';
        card.style.transition = 'box-shadow 0.2s, border 0.2s';
        card.textContent = p.cote || '';
        card.style.textAlign = 'center';
        card.style.fontSize = '0.95rem';
        card.style.fontWeight = '400';
        card.addEventListener('mouseenter', () => {
            card.style.boxShadow = '0 0 0 0.2rem #ff9800';
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
