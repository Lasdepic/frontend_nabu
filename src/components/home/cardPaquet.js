import { fetchOnePaquet, deletePaquet } from '../../API/paquet/paquet.js';
import { fetchAllStatus } from '../../API/paquet/status.js';
import { fetchAllCorpus } from '../../API/paquet/corpus.js';

import { normalizeStatus, renderStatusBadge } from '../status/badgeStatus.js';

let STATUS_CACHE = null;
let CORPUS_CACHE = null;

async function getStatusById(statusId) {
	if (!statusId) return null;
	if (!STATUS_CACHE) {
		const result = await fetchAllStatus();
		const list = result?.data || result;
		STATUS_CACHE = Array.isArray(list) ? list : [];
	}
	return STATUS_CACHE.find(s => (s.idstatus ?? s.idStatus ?? s.id) == statusId) || null;
}

async function getCorpusNameById(corpusId) {
	if (!corpusId) return null;
	if (!CORPUS_CACHE) {
		const result = await fetchAllCorpus();
		const list = result?.data || result;
		CORPUS_CACHE = Array.isArray(list) ? list : [];
	}
	const corpus = CORPUS_CACHE.find(c => (c.idcorpus ?? c.idCorpus) == corpusId) || null;
	return (corpus?.name_corpus ?? corpus?.nameCorpus) || null;
}

const formatDate = date =>
	date ? new Date(date).toLocaleDateString('fr-FR', {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	}) : '';

const copyToClipboard = text => {
	navigator.clipboard.writeText(text || '');
	showToast('Copié dans le presse-papier');
};

function showToast(message, success = true) {
	const toast = document.createElement('div');
	toast.className = `toast align-items-center text-white ${success ? 'bg-success' : 'bg-danger'} border-0 position-fixed top-0 start-50 translate-middle-x mt-4`;
	toast.style.zIndex = 3000;
	toast.innerHTML = `
		<div class="d-flex">
			<div class="toast-body">${message}</div>
			<button class="btn-close btn-close-white me-2 m-auto"></button>
		</div>
	`;
	document.body.appendChild(toast);
	setTimeout(() => toast.classList.add('show'), 10);
	setTimeout(() => toast.remove(), 2500);
}

export async function afficherCardPaquetModal(paquet) {
	document.getElementById('paquet-modal-overlay')?.remove();
	const overlay = document.createElement('div');
	overlay.id = 'paquet-modal-overlay';
	overlay.className = 'modal fade show';
	overlay.style.display = 'block';
	overlay.style.background = 'rgba(0,0,0,0.5)';
	overlay.style.zIndex = 2000;
	const dialog = document.createElement('div');
	dialog.className = 'modal-dialog modal-lg modal-dialog-centered';
	const content = document.createElement('div');
	content.className = 'modal-content';
	content.innerHTML = `
		<div class="modal-header">
			<h5 class="modal-title fw-bold w-100 text-center">Informations du paquet</h5>
			<button class="btn-close"></button>
		</div>
		<div class="modal-body"></div>
	`;
	content.querySelector('.btn-close').addEventListener('click', () => overlay.remove());
	content.querySelector('.modal-body').appendChild(await createCardPaquet(paquet));
	dialog.appendChild(content);
	overlay.appendChild(dialog);
	document.body.appendChild(overlay);
	overlay.addEventListener('click', e => {
		if (e.target === overlay) overlay.remove();
	});
}

export async function createCardPaquet(paquet) {
		const status = await getStatusById(paquet.statusId);
		const statusMeta = normalizeStatus(status);
		const corpusName =
			(paquet?.corpusName ?? paquet?.name_corpus) ||
			(await getCorpusNameById(paquet?.corpusId)) ||
			'';
		const card = document.createElement('div');
		card.className = 'card shadow border-0';
		const userRole = localStorage.getItem('userRole');
		// Le bouton supprimer n'est visible que pour l'admin et si le status n'est pas ENVOI_OK
		const isDeleteVisible = userRole === 'admin' && statusMeta?.name !== 'ENVOI_OK';
		// Le bouton historique est toujours visible
		card.innerHTML = `
		       <div class="card-body">
			       <ul class="list-group list-group-flush mb-3">
				       <li class="list-group-item"><strong>Dossier :</strong> ${paquet.folderName ?? ''}</li>
				       <li class="list-group-item"><strong>Cote :</strong> ${paquet.cote ?? ''}</li>
				       <li class="list-group-item"><strong>Corpus :</strong> ${corpusName}</li>
				       <li class="list-group-item"><strong>Répertoire des images autre :</strong> ${paquet.microFilmImage ?? ''}</li>
				       <li class="list-group-item"><strong>Répertoire des images couleurs :</strong> ${paquet.imageColor ?? ''}</li>
				       <li class="list-group-item"><strong>Recherche archivage :</strong> ${paquet.searchArchiving ?? ''}</li>
				       <li class="list-group-item"><strong>Status :</strong> ${renderStatusBadge(status)}</li>
				       <li class="list-group-item"><strong>Dernière modification :</strong> ${formatDate(paquet.lastmodifDate)}</li>
			       </ul>
					       <div class="row mb-3 text-center">
						       <div class="col d-flex flex-column align-items-center">
							       <span>À faire</span>
							       <span class="badge bg-${paquet.toDo ? 'success' : 'secondary'} mt-1">${paquet.toDo ? 'Oui' : 'Non'}</span>
						       </div>
						       <div class="col d-flex flex-column align-items-center">
							       <span>Multi-volume</span>
							       <span class="badge bg-${paquet.facileTest ? 'success' : 'secondary'} mt-1">${paquet.facileTest ? 'Oui' : 'Non'}</span>
						       </div>
						       <div class="col d-flex flex-column align-items-center">
							       <span>SIP</span>
							       <span class="badge bg-${paquet.filedSip ? 'success' : 'secondary'} mt-1">${paquet.filedSip ? 'Oui' : 'Non'}</span>
						       </div>
					       </div>
			       <div class="mb-3">
				       <strong>Commentaire</strong>
				       <div class="border rounded p-2 bg-light">${paquet.commentaire ?? ''}</div>
			       </div>
				  <div class="d-flex justify-content-center gap-3 flex-wrap">
				   <button class="btn btn-primary px-4" id="edit"><i class="bi bi-pencil"></i> Modifier</button>
				   ${isDeleteVisible ? `<button class="btn btn-danger px-4" id="delete"><i class="bi bi-trash"></i> Supprimer</button>` : ''}
				   <button class="btn btn-success px-4" id="historique"><i class="bi bi-clock-history"></i> Historique d'envoi</button>
				  </div>
		       </div>
	       `;
	       card.querySelector('#edit').addEventListener('click', async () => {
		       document.getElementById('paquet-modal-overlay')?.remove();
		       const { afficherCardPaquetEditModal } = await import('../editPaquet/editPaquet.js');
		       afficherCardPaquetEditModal(paquet);
	       });
	       if (isDeleteVisible) {
		       card.querySelector('#delete').addEventListener('click', () => showDeleteConfirmation(paquet));
	       }
			       if (card.querySelector('#historique')) {
				       card.querySelector('#historique').addEventListener('click', async () => {
					       const { afficherCardHistoriqueEnvoi } = await import('./CardHistoriqueEnvoi.js');
					       afficherCardHistoriqueEnvoi(paquet.cote);
				       });
			       }
	       return card;
}

async function showDeleteConfirmation(paquet) {
	document.getElementById('delete-modal-overlay')?.remove();
	const overlay = document.createElement('div');
	overlay.id = 'delete-modal-overlay';
	overlay.className = 'modal fade show';
	overlay.style.display = 'block';
	overlay.style.background = 'rgba(0,0,0,0.5)';
	overlay.style.zIndex = 3000;
	const dialog = document.createElement('div');
	dialog.className = 'modal-dialog modal-dialog-centered';
	const content = document.createElement('div');
	content.className = 'modal-content';
	content.innerHTML = `
		<div class="modal-header">
			<h5 class="modal-title w-100 text-center">Confirmer la suppression</h5>
			<button class="btn-close"></button>
		</div>
		<div class="modal-body text-center">
			<p>Voulez-vous vraiment supprimer définitivement le paquet <strong>${paquet.cote}</strong> ?</p>
		</div>
		<div class="modal-footer justify-content-center">
			<button class="btn btn-secondary" id="cancel-delete">Annuler</button>
			<button class="btn btn-danger" id="confirm-delete">Supprimer</button>
		</div>
	`;
	content.querySelector('.btn-close').onclick = () => overlay.remove();
	content.querySelector('#cancel-delete').onclick = () => overlay.remove();
	content.querySelector('#confirm-delete').onclick = async () => {
		const result = await deletePaquet(paquet.cote);
		overlay.remove();
		if (result?.success) {
			showToast('Paquet supprimé');
			setTimeout(() => location.reload(), 1000);
		} else {
			showToast('Erreur lors de la suppression', false);
		}
	};
	dialog.appendChild(content);
	overlay.appendChild(dialog);
	document.body.appendChild(overlay);
	overlay.addEventListener('click', e => {
		if (e.target === overlay) overlay.remove();
	});
}

export async function afficherCardPaquet(paquet, containerSelector = 'main') {
	const container = document.querySelector(containerSelector);
	if (!container) return;
	container.innerHTML = '';
	container.appendChild(await createCardPaquet(paquet));
}

export async function afficherCardPaquetDepuisAPI(id, containerSelector = 'main') {
	const data = await fetchOnePaquet(id);
	const paquet = data?.data || data;
	if (!paquet) {
		document.querySelector(containerSelector).innerHTML = '<div class="alert alert-danger">Erreur de chargement</div>';
		return;
	}
	await afficherCardPaquet(paquet, containerSelector);
}
