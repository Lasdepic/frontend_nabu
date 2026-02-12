// CardHistoriqueEnvoi.js
// Affiche la liste des historiques d'envoi pour un paquet donné


import { fetchAllHistoriqueEnvoi } from '../../API/paquet/historiqueEnvoi.js';
import { callVitamAPI } from '../../API/vitam/vitamAPI.js';

const CINES_VALID_ICON_PATH = 'm424-296 282-282-56-56-226 226-114-114-56 56 170 170Zm56 216q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54-54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z';
const CINES_INVALID_ICON_PATH = 'm336-280 144-144 144 144 56-56-144-144 144-144-56-56-144 144-144-144-56 56 144 144-144 144 56 56ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54-54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z';

function createStatusIconSvg({ fill, pathD }) {
    return `\
<svg xmlns="http://www.w3.org/2000/svg" height="24" width="24" viewBox="0 -960 960 960" fill="${fill}"><path d="${pathD}"/></svg>`;
}

const CINES_VALID_ICON_SVG = createStatusIconSvg({ fill: '#75FB4C', pathD: CINES_VALID_ICON_PATH });
const CINES_INVALID_ICON_SVG = createStatusIconSvg({ fill: '#EA3323', pathD: CINES_INVALID_ICON_PATH });

const CINES_VALIDATION_CACHE = new Map();
const PAQUET_STATUS_SYNC_CACHE = new Map();

async function isItemValidatedByCines(itemId) {
    if (!itemId || itemId === '-') return false;
    const cacheKey = String(itemId);
    if (CINES_VALIDATION_CACHE.has(cacheKey)) return CINES_VALIDATION_CACHE.get(cacheKey);

    try {
        const data = await callVitamAPI('bordereau', {
            method: 'GET',
            headers: {
                'X-Item-Id': cacheKey
            }
        });
        // Contrat aligné sur l'outil de référence :
        // - status === 'success' => paquet existant côté CINES
        // - info.ReplyCode === 'OK' => paquet validé
        const validated = data?.status === 'success' && data?.info?.ReplyCode === 'OK';
        CINES_VALIDATION_CACHE.set(cacheKey, validated);
        return validated;
    } catch {
        // En cas d'erreur (réseau / API), on considère "non validé" pour rester conforme à la demande.
        CINES_VALIDATION_CACHE.set(cacheKey, false);
        return false;
    }
}

function getMostRecentItemId(historiques) {
    if (!Array.isArray(historiques) || historiques.length === 0) return null;
    // Le backend trie par dateEnvoi DESC : on prend le 1er itemsId non vide.
    for (const h of historiques) {
        const itemsId = h?.items_id ?? h?.itemsId;
        const normalized = itemsId === undefined || itemsId === null ? '' : String(itemsId).trim();
        if (normalized && normalized !== '-') return normalized;
    }
    return null;
}

async function syncPaquetStatusWithCinesValidation({ paquetCote, itemId, validated }) {
    if (!paquetCote || !itemId) return;
    const cacheKey = `${String(paquetCote)}::${String(itemId)}`;
    const cached = PAQUET_STATUS_SYNC_CACHE.get(cacheKey);
    if (cached === validated) return;

    // Règle demandée : non validé => ERREUR, validé => ENVOI_OK
    // Convention existante dans sendding.js : 3 = ENVOI_OK, 5 = ENVOI_EN_ERREUR
    const statusId = validated ? 3 : 5;

    try {
        const { mettreAJourStatutPaquet } = await import('../../pages/download/statutPaquet.js');
        if (typeof mettreAJourStatutPaquet !== 'function') return;
        await mettreAJourStatutPaquet(String(paquetCote), statusId, false);
        PAQUET_STATUS_SYNC_CACHE.set(cacheKey, validated);
    } catch {
        // Silencieux : ne doit pas casser l'affichage de l'historique.
    }
}

async function updateCinesValidationIcons(overlay) {
    const cells = Array.from(overlay.querySelectorAll('[data-cines-item-id]'));
    let didShowErrorToast = false;

    for (const cell of cells) {
        const itemId = cell.dataset.cinesItemId;
        if (!itemId || itemId === '-') {
            cell.textContent = '-';
            continue;
        }

        try {
            const validated = await isItemValidatedByCines(itemId);
            cell.innerHTML = validated ? CINES_VALID_ICON_SVG : CINES_INVALID_ICON_SVG;
            cell.title = validated ? 'Validé CINES' : 'Non validé CINES';
        } catch {
            cell.innerHTML = CINES_INVALID_ICON_SVG;
            cell.title = 'Non validé CINES';
            if (!didShowErrorToast) {
                didShowErrorToast = true;
                showToast('Impossible de vérifier la validation CINES', false);
            }
        }
    }
}

export async function afficherCardHistoriqueEnvoi(paquetCote) {
    const result = await fetchAllHistoriqueEnvoi(paquetCote);
    if (!result || result.success === false) {
        showToast('Erreur lors du chargement des historiques', false);
        return;
    }
    const historiques = result.data || [];

    // Création de la modale overlay simplifiée
    const overlay = document.createElement('div');
    overlay.id = 'historique-modal-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.background = 'rgba(0,0,0,0.5)';
    overlay.style.zIndex = 3000;
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';

    const card = document.createElement('div');
    card.style.background = '#fff';
    card.style.borderRadius = '12px';
    card.style.boxShadow = '0 2px 16px rgba(0,0,0,0.2)';
    card.style.maxWidth = '700px';
    card.style.width = '95%';
    card.style.padding = '24px 16px 16px 16px';
    card.style.position = 'relative';

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.title = 'Fermer';
    closeButton.textContent = '×';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '12px';
    closeButton.style.right = '12px';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.fontSize = '1.5rem';
    closeButton.style.cursor = 'pointer';

    const title = document.createElement('h3');
    title.style.textAlign = 'center';
    title.style.marginBottom = '24px';
    title.appendChild(document.createTextNode("Historique d'envoi du paquet "));
    const paquetSpan = document.createElement('span');
    paquetSpan.style.color = '#0d6efd';
    paquetSpan.textContent = String(paquetCote ?? '');
    title.appendChild(paquetSpan);

    const tableWrapper = document.createElement('div');
    tableWrapper.style.overflowX = 'auto';

    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';

    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    headRow.style.background = '#212529';
    headRow.style.color = '#fff';

    const makeTh = (text) => {
        const th = document.createElement('th');
        th.style.padding = '8px 4px';
        th.style.textAlign = 'center';
        th.textContent = text;
        return th;
    };
    headRow.appendChild(makeTh('items_id'));
    headRow.appendChild(makeTh('paquet_cote'));
    headRow.appendChild(makeTh('date_envoi'));
    headRow.appendChild(makeTh('validation CINES'));
    thead.appendChild(headRow);

    const tbody = document.createElement('tbody');
    if (historiques.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 4;
        td.style.textAlign = 'center';
        td.style.padding = '16px';
        td.textContent = 'Aucun historique trouvé.';
        tr.appendChild(td);
        tbody.appendChild(tr);
    } else {
        const makeTd = (text) => {
            const td = document.createElement('td');
            td.style.padding = '6px 4px';
            td.style.textAlign = 'center';
            td.textContent = text;
            return td;
        };

        for (const h of historiques) {
            const itemsId = h.items_id || h.itemsId || '-';
            const paquetCoteValue = h.paquet_cote || h.paquetCote || '-';
            const dateEnvoiValue = (h.date_envoi || h.dateEnvoi)
                ? new Date(h.date_envoi || h.dateEnvoi).toLocaleString('fr-FR')
                : '-';

            const tr = document.createElement('tr');
            tr.appendChild(makeTd(String(itemsId)));
            tr.appendChild(makeTd(String(paquetCoteValue)));
            tr.appendChild(makeTd(String(dateEnvoiValue)));

            const validationTd = document.createElement('td');
            validationTd.style.padding = '6px 4px';
            validationTd.style.textAlign = 'center';
            validationTd.style.verticalAlign = 'middle';
            if (itemsId && itemsId !== '-') {
                validationTd.dataset.cinesItemId = String(itemsId);
                validationTd.textContent = '...';
            } else {
                validationTd.dataset.cinesItemId = '-';
                validationTd.textContent = '-';
            }
            tr.appendChild(validationTd);
            tbody.appendChild(tr);
        }
    }

    table.appendChild(thead);
    table.appendChild(tbody);
    tableWrapper.appendChild(table);

    card.replaceChildren(closeButton, title, tableWrapper);

    // Fermeture par bouton ou clic sur overlay
    closeButton.onclick = () => overlay.remove();
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    // Remplacement des placeholders par les icônes de validation CINES
    updateCinesValidationIcons(overlay);

    // Synchronisation du statut du paquet sur la validation CINES (basée sur le dernier envoi connu).
    // Si le dernier itemId n'est pas validé, le paquet passe en ERREUR ; sinon ENVOI_OK.
    const mostRecentItemId = getMostRecentItemId(historiques);
    if (mostRecentItemId) {
        try {
            const validated = await isItemValidatedByCines(mostRecentItemId);
            await syncPaquetStatusWithCinesValidation({
                paquetCote,
                itemId: mostRecentItemId,
                validated
            });
        } catch {
            // En cas d'erreur (réseau/API), isItemValidatedByCines renvoie déjà false.
            await syncPaquetStatusWithCinesValidation({
                paquetCote,
                itemId: mostRecentItemId,
                validated: false
            });
        }
    }
}

function showToast(message, success = true) {
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white ${success ? 'bg-success' : 'bg-danger'} border-0 position-fixed top-0 start-50 translate-middle-x mt-4`;
    toast.style.zIndex = 4000;
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
        </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => toast.remove(), 2500);
}
