
import { fetchAllPaquets } from '../../API/paquet/paquet.js';
import { afficherCardPaquetModal } from './cardPaquet.js';

// Affiche le tableau des paquets en erreur d'envoi
export async function afficherSendErrorPaquet(conteneurId = 'send-error-paquet-conteneur', filterCorpusId = null) {
    let conteneur = document.getElementById(conteneurId);
    if (!conteneur) {
        conteneur = document.createElement('div');
        conteneur.id = conteneurId;
        document.body.appendChild(conteneur);
    }

    // bloc le tableau pendant le scroll (supprimé sticky, géré par le parent)
    conteneur.style.display = 'block';
    conteneur.style.zIndex = '1000';

    // Titre + état de chargement
    conteneur.innerHTML = `
        <div class="bg-dark text-white d-flex justify-content-between align-items-center py-2 px-2 mb-3 rounded-1" style="font-size:1rem;font-weight:400;">
            <span>Envoi en erreur</span>
            <span class="badge bg-light text-dark" aria-label="Nombre de paquets">...</span>
        </div>
        <div class="text-center text-muted small" data-mini-table-loading>
            <div class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></div>
            Chargement...
        </div>
    `;

    // Récupère tous les paquets
    const paquetsResult = await fetchAllPaquets();
    let paquets = paquetsResult && paquetsResult.data ? paquetsResult.data : paquetsResult;
    if (!paquets || !Array.isArray(paquets)) {
        conteneur.innerHTML += '<div class="alert alert-danger">Erreur lors du chargement des paquets.</div>';
        return;
    }
  
    paquets = paquets.filter(p => String(p.statusId) === '5');

    if (filterCorpusId !== null && filterCorpusId !== undefined && filterCorpusId !== '') {
        paquets = paquets.filter(p => String(p.corpusId) === String(filterCorpusId));
    }

    // Tri stable (si date dispo) : plus récent d'abord
    paquets.sort((a, b) => {
        const da = a?.lastmodifDate || a?.date || null;
        const db = b?.lastmodifDate || b?.date || null;
        const ta = da ? new Date(da).getTime() : 0;
        const tb = db ? new Date(db).getTime() : 0;
        return tb - ta;
    });

    const badgeCount = conteneur.querySelector('.badge.bg-light.text-dark');
    if (badgeCount) badgeCount.textContent = String(paquets.length);
    const loading = conteneur.querySelector('[data-mini-table-loading]');
    if (loading) loading.remove();
    if (paquets.length === 0) {
        conteneur.innerHTML += '<div class="text-muted text-center">Aucun paquet en erreur d\'envoi.</div>';
        return;
    }

    // Pagination
    const PAQUETS_PAR_PAGE = 4;
    let currentPage = 1;
    const totalPages = Math.ceil(paquets.length / PAQUETS_PAR_PAGE);

    function buildPageModel(page, pagesTotal) {
        if (pagesTotal <= 7) {
            return Array.from({ length: pagesTotal }, (_, i) => i + 1);
        }
        const model = [1];
        const start = Math.max(2, page - 1);
        const end = Math.min(pagesTotal - 1, page + 1);
        if (start > 2) model.push('...');
        for (let p = start; p <= end; p++) model.push(p);
        if (end < pagesTotal - 1) model.push('...');
        model.push(pagesTotal);
        return model;
    }

    function renderPagination(page) {
        if (totalPages <= 1) return;
        const nav = document.createElement('nav');
        nav.className = 'pagination-paquet d-flex justify-content-center mt-2';
        nav.setAttribute('aria-label', 'Pagination');
        const ul = document.createElement('ul');
        ul.className = 'pagination pagination-sm mb-0';

        const makeBtn = (label, onClick, { disabled = false, active = false, ariaLabel = null } = {}) => {
            const li = document.createElement('li');
            li.className = `page-item${disabled ? ' disabled' : ''}${active ? ' active' : ''}`;
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'page-link';
            btn.textContent = String(label);
            if (ariaLabel) btn.setAttribute('aria-label', ariaLabel);
            if (disabled) btn.disabled = true;
            if (active) btn.setAttribute('aria-current', 'page');
            btn.addEventListener('click', onClick);
            li.appendChild(btn);
            return li;
        };

        ul.appendChild(makeBtn('‹', () => {
            if (currentPage > 1) {
                currentPage--;
                renderPage(currentPage);
            }
        }, { disabled: page === 1, ariaLabel: 'Page précédente' }));

        const model = buildPageModel(page, totalPages);
        for (const item of model) {
            if (item === '...') {
                const li = document.createElement('li');
                li.className = 'page-item disabled';
                const span = document.createElement('span');
                span.className = 'page-link';
                span.textContent = '…';
                li.appendChild(span);
                ul.appendChild(li);
                continue;
            }
            ul.appendChild(makeBtn(item, () => {
                currentPage = item;
                renderPage(currentPage);
            }, { active: item === page }));
        }

        ul.appendChild(makeBtn('›', () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderPage(currentPage);
            }
        }, { disabled: page === totalPages, ariaLabel: 'Page suivante' }));

        nav.appendChild(ul);
        conteneur.appendChild(nav);
    }

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
            card.className = 'card shadow-sm mb-2 paquet-mini-item paquet-mini-item--error';
            card.setAttribute('role', 'button');
            card.setAttribute('tabindex', '0');
            card.textContent = p.cote || '';
            card.style.textAlign = 'center';
            card.style.fontSize = '0.95rem';
            card.style.fontWeight = '400';
            const open = () => afficherCardPaquetModal(p);
            card.addEventListener('click', open);
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    open();
                }
            });
            col.appendChild(card);
            row.appendChild(col);
        });
        conteneur.appendChild(row);

        renderPagination(page);
    }

    renderPage(currentPage);
}

window.afficherSendErrorPaquet = afficherSendErrorPaquet;
