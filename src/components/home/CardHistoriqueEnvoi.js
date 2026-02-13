

import { fetchAllHistoriqueEnvoi } from '../../API/paquet/historiqueEnvoi.js';
import { callVitamAPI } from '../../API/vitam/vitamAPI.js';

const CINES_VALID_ICON_PATH = 'm424-296 282-282-56-56-226 226-114-114-56 56 170 170Zm56 216q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54-54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z';
const CINES_INVALID_ICON_PATH = 'm336-280 144-144 144 144 56-56-144-144 144-144-56-56-144 144-144-144-56 56 144 144-144 144 56 56ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54-54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z';

function createStatusIconSvg({ className, pathD }) {
    return `\
<svg xmlns="http://www.w3.org/2000/svg" height="24" width="24" viewBox="0 -960 960 960" class="${className}" fill="currentColor"><path d="${pathD}"/></svg>`;
}

const CINES_VALID_ICON_SVG = createStatusIconSvg({ className: 'text-success', pathD: CINES_VALID_ICON_PATH });
const CINES_INVALID_ICON_SVG = createStatusIconSvg({ className: 'text-danger', pathD: CINES_INVALID_ICON_PATH });

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

        const validated = data?.status === 'success' && data?.info?.ReplyCode === 'OK';
        CINES_VALIDATION_CACHE.set(cacheKey, validated);
        return validated;
    } catch {
        showToast("Erreur lors de la vérification CINES", false);
        CINES_VALIDATION_CACHE.set(cacheKey, false);
        return false;
    }
}

async function updateCinesValidationIcons(rootEl) {
    if (!rootEl) return;
    const targets = Array.from(rootEl.querySelectorAll('[data-cines-item-id]'));
    await Promise.all(targets.map(async (el) => {
        const itemId = el?.dataset?.cinesItemId;
        if (!itemId || itemId === '-') {
            el.textContent = '-';
            return;
        }

        el.innerHTML = '<span class="spinner-border spinner-border-sm text-secondary" role="status" aria-hidden="true"></span>';
        const validated = await isItemValidatedByCines(itemId);
        el.innerHTML = validated ? CINES_VALID_ICON_SVG : CINES_INVALID_ICON_SVG;
        el.setAttribute('title', validated ? 'Validé CINES' : 'Non validé CINES');
    }));
}

function showToast(message, success = true) {
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white ${success ? 'bg-success' : 'bg-danger'} border-0 position-fixed top-0 start-50 translate-middle-x mt-4`;
    toast.style.zIndex = 4000;
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button class="btn-close btn-close-white me-2 m-auto" aria-label="Fermer"></button>
        </div>
    `;
    document.body.appendChild(toast);
    toast.querySelector('button')?.addEventListener('click', () => toast.remove());
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => toast.remove(), 2500);
}

function makeTextTd(text) {
    const td = document.createElement('td');
    td.className = 'text-center';
    td.textContent = text;
    return td;
}

function toLocaleDateTimeOrDash(value) {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleString('fr-FR');
}

export async function afficherCardHistoriqueEnvoi(paquetCote) {
    document.getElementById('historique-modal-overlay')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'historique-modal-overlay';
    overlay.className = 'modal fade show';
    overlay.style.display = 'block';
    overlay.style.background = 'rgba(0,0,0,0.5)';
    overlay.style.zIndex = 2500;

    const dialog = document.createElement('div');
    dialog.className = 'modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable';

    const content = document.createElement('div');
    content.className = 'modal-content';
    content.innerHTML = `
        <div class="modal-header">
            <h5 class="modal-title fw-bold w-100 text-center">Historique d'envoi</h5>
            <button class="btn-close" aria-label="Fermer"></button>
        </div>
        <div class="modal-body"></div>
    `;

    const close = () => overlay.remove();
    content.querySelector('.btn-close')?.addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close();
    });

    const body = content.querySelector('.modal-body');
    body.innerHTML = `
        <div class="text-center mb-3">
            <span class="text-muted">Paquet :</span>
            <span class="fw-semibold text-primary"></span>
        </div>
        <div class="text-center text-muted small" data-loading>
            <div class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></div>
            Chargement...
        </div>
    `;
    const paquetLabel = body.querySelector('.fw-semibold');
    if (paquetLabel) paquetLabel.textContent = String(paquetCote ?? '');

    dialog.appendChild(content);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    const result = await fetchAllHistoriqueEnvoi(paquetCote);
    const historiques = result?.data ?? result;
    const list = Array.isArray(historiques) ? historiques : [];
    body.querySelector('[data-loading]')?.remove();

    if (!Array.isArray(historiques) && historiques !== null) {
        showToast("Erreur lors du chargement des historiques", false);
    }

    const tableWrapper = document.createElement('div');
    tableWrapper.className = 'table-responsive';

    const table = document.createElement('table');
    table.className = 'table table-sm table-striped table-hover align-middle mb-0';

    const thead = document.createElement('thead');
    thead.className = 'table-dark';
    thead.innerHTML = `
        <tr>
            <th class="text-center">items_id</th>
            <th class="text-center">paquet_cote</th>
            <th class="text-center">date_envoi</th>
            <th class="text-center">validation CINES</th>
        </tr>
    `;

    const tbody = document.createElement('tbody');
    if (list.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.className = 'text-center py-3';
        td.colSpan = 4;
        td.textContent = 'Aucun historique trouvé.';
        tr.appendChild(td);
        tbody.appendChild(tr);
    } else {
        for (const h of list) {
            const itemsId = h?.items_id ?? h?.itemsId ?? '-';
            const paquetCoteValue = h?.paquet_cote ?? h?.paquetCote ?? '-';
            const dateEnvoiValue = toLocaleDateTimeOrDash(h?.date_envoi ?? h?.dateEnvoi);

            const tr = document.createElement('tr');
            tr.appendChild(makeTextTd(String(itemsId)));
            tr.appendChild(makeTextTd(String(paquetCoteValue)));
            tr.appendChild(makeTextTd(String(dateEnvoiValue)));

            const validationTd = document.createElement('td');
            validationTd.className = 'text-center';
            if (itemsId && itemsId !== '-') {
                validationTd.dataset.cinesItemId = String(itemsId);
                validationTd.textContent = '…';
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
    body.appendChild(tableWrapper);

    await updateCinesValidationIcons(content);
}

window.afficherCardHistoriqueEnvoi = afficherCardHistoriqueEnvoi;
