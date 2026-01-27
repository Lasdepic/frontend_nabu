// CardHistoriqueEnvoi.js
// Affiche la liste des historiques d'envoi pour un paquet donné


import { fetchAllHistoriqueEnvoi } from '../API/historiqueEnvoi.js';

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

    card.innerHTML = `
        <button style="position:absolute;top:12px;right:12px;background:none;border:none;font-size:1.5rem;cursor:pointer;" title="Fermer">&times;</button>
        <h3 style="text-align:center;margin-bottom:24px;">Historique d'envoi du paquet <span style='color:#0d6efd;'>${paquetCote}</span></h3>
        <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;">
                <thead>
                    <tr style="background:#212529;color:#fff;">
                        <th style="padding:8px 4px;text-align:center;">items_id</th>
                        <th style="padding:8px 4px;text-align:center;">paquet_cote</th>
                        <th style="padding:8px 4px;text-align:center;">date_envoi</th>
                    </tr>
                </thead>
                <tbody>
                    ${
                        historiques.length === 0
                        ? `<tr><td colspan='3' style='text-align:center;padding:16px;'>Aucun historique trouvé.</td></tr>`
                        : historiques.map(h => {
                            const items_id = h.items_id || h.itemsId || '-';
                            const paquet_cote = h.paquet_cote || h.paquetCote || '-';
                            const date_envoi = h.date_envoi || h.dateEnvoi ? new Date(h.date_envoi || h.dateEnvoi).toLocaleString('fr-FR') : '-';
                            return `<tr><td style='padding:6px 4px;text-align:center;'>${items_id}</td><td style='padding:6px 4px;text-align:center;'>${paquet_cote}</td><td style='padding:6px 4px;text-align:center;'>${date_envoi}</td></tr>`;
                        }).join('')
                    }
                </tbody>
            </table>
        </div>
    `;
    // Fermeture par bouton ou clic sur overlay
    card.querySelector('button').onclick = () => overlay.remove();
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    overlay.appendChild(card);
    document.body.appendChild(overlay);
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
