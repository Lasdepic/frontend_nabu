
import { fetchAllPaquets } from '../../API/paquet/paquet.js';
import { afficherCardPaquetModal } from './cardPaquet.js';

// Affiche le tableau des paquets à faire 
export async function afficherSendErrorPaquet(conteneurId = 'to-do-paquet-conteneur', filterCorpusId = null) {
    let conteneur = document.getElementById(conteneurId);
    if (!conteneur) {
        conteneur = document.createElement('div');
        conteneur.id = conteneurId;
        document.body.appendChild(conteneur);
    }

    // bloc le tableau pendant le scroll (supprimé sticky, géré par le parent)
    conteneur.style.display = 'block';
    conteneur.style.zIndex = '1000';

    // Titre tableau erreurs d'envoi
    conteneur.innerHTML = `<div class="text-center py-2 mb-3" style="background-color:#212529;color:#fff;font-size:1rem;font-weight:400;">Envoi en erreur</div>`;

    // Récupère tous les paquets
    const paquetsResult = await fetchAllPaquets();
    let paquets = paquetsResult && paquetsResult.data ? paquetsResult.data : paquetsResult;
    if (!paquets || !Array.isArray(paquets)) {
        conteneur.innerHTML += '<div class="alert alert-danger">Erreur lors du chargement des paquets.</div>';
        return;
    }
  
    paquets = paquets.filter(p => p.statusId === 5);
    if (paquets.length === 0) {
        conteneur.innerHTML += '<div class="text-muted text-center">Aucun paquet en erreur d\'envoi.</div>';
        return;
    }

    // Pagination
    const PAQUETS_PAR_PAGE = 4;
    let currentPage = 1;
    const totalPages = Math.ceil(paquets.length / PAQUETS_PAR_PAGE);

    function renderPage(page) {
        conteneur.querySelectorAll('.row.g-2, .pagination-paquet').forEach(e => e.remove());
        const startIdx = (page - 1) * PAQUETS_PAR_PAGE;
        const endIdx = startIdx + PAQUETS_PAR_PAGE;
        const pagePaquets = paquets.slice(startIdx, endIdx);

        const row = document.createElement('div');
        row.className = 'row g-2';
        pagePaquets.forEach((p) => {
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

        // Pagination controls
        if (totalPages > 1) {
            const pagination = document.createElement('div');
            pagination.className = 'pagination-paquet d-flex justify-content-center align-items-center mt-2';
            const prevBtn = document.createElement('button');
            prevBtn.className = 'btn btn-sm btn-outline-secondary mx-1';
            prevBtn.textContent = '<';
            prevBtn.disabled = page === 1;
            prevBtn.style.padding = '0.15rem 0.4rem';
            prevBtn.style.fontSize = '0.75rem';
            prevBtn.style.height = '1.5rem';
            prevBtn.style.minWidth = '1.5rem';
            prevBtn.onclick = () => {
                if (currentPage > 1) {
                    currentPage--;
                    renderPage(currentPage);
                }
            };

            const pageInfo = document.createElement('span');
            pageInfo.className = 'mx-2';
            pageInfo.textContent = `Page ${page} / ${totalPages}`;

            const nextBtn = document.createElement('button');
            nextBtn.className = 'btn btn-sm btn-outline-secondary mx-1';
            nextBtn.textContent = '>';
            nextBtn.disabled = page === totalPages;
            nextBtn.style.padding = '0.15rem 0.4rem';
            nextBtn.style.fontSize = '0.75rem';
            nextBtn.style.height = '1.5rem';
            nextBtn.style.minWidth = '1.5rem';
            nextBtn.onclick = () => {
                if (currentPage < totalPages) {
                    currentPage++;
                    renderPage(currentPage);
                }
            };

            pagination.appendChild(prevBtn);
            pagination.appendChild(pageInfo);
            pagination.appendChild(nextBtn);
            conteneur.appendChild(pagination);
        }
    }

    renderPage(currentPage);
}
