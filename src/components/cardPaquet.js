import { fetchOnePaquet, deletePaquet } from '../API/paquet.js';
import { fetchAllStatus } from '../API/status.js';

/* ==========================================================
   MAPPING COULEURS DES STATUTS
========================================================== */
const STATUS_COLORS = {
	INEXISTANT: 'secondary',
	NON_ENVOYE: 'secondary',
	ENVOI_OK: 'success',
	ENVOI_EN_COURS: 'primary',
	ENVOI_EN_ERREUR: 'warning'
};

/* ==========================================================
   CACHE & HELPERS
========================================================== */
let STATUS_CACHE = null;

// Récupère le statut à partir de son ID (avec cache)
async function getStatusById(statusId) {
	if (!statusId) return null;

	if (!STATUS_CACHE) {
		const result = await fetchAllStatus();
		STATUS_CACHE = Array.isArray(result) ? result : [];
	}

	return STATUS_CACHE.find(s => s.idStatus == statusId) || null;
}

// Crée un badge Bootstrap avec la couleur adaptée
function createStatusBadge(status) {
	if (!status) {
		return `<span class="badge bg-secondary">Inconnu</span>`;
	}

	const color = STATUS_COLORS[status.nameStatus] || 'secondary';

	return `<span class="badge bg-${color}">${status.nameStatus.replaceAll('_', ' ')}</span>`;
}

const formatDate = date =>
	date
		? new Date(date).toLocaleDateString('fr-FR', {
				day: 'numeric',
				month: 'long',
				year: 'numeric'
		  })
		: '';

const copyToClipboard = text => {
	navigator.clipboard.writeText(text || '');
	showToast('Copié dans le presse-papier');
};

/* ==========================================================
   TOAST
========================================================== */
function showToast(message, success = true) {
	const toast = document.createElement('div');
	toast.className = `
		toast align-items-center text-white 
		${success ? 'bg-success' : 'bg-danger'} 
		border-0 position-fixed top-0 start-50 translate-middle-x mt-4
	`;
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

/* ==========================================================
   MODALE INFO PAQUET
========================================================== */
export async function afficherCardPaquetModal(paquet) {
	const oldModal = document.getElementById('paquet-modal-overlay');
	if (oldModal) oldModal.remove();

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
			<h5 class="modal-title fw-bold w-100 text-center">Information du paquet</h5>
			<button class="btn-close"></button>
		</div>
		<div class="modal-body"></div>
	`;

	content.querySelector('.btn-close')
		.addEventListener('click', () => overlay.remove());

	content.querySelector('.modal-body')
		.appendChild(await createCardPaquet(paquet));

	dialog.appendChild(content);
	overlay.appendChild(dialog);
	document.body.appendChild(overlay);

	overlay.addEventListener('click', e => {
		if (e.target === overlay) overlay.remove();
	});
}

/* ==========================================================
   CARTE PAQUET
========================================================== */
export async function createCardPaquet(paquet) {
	const status = await getStatusById(paquet.statusId);

	const card = document.createElement('div');
	card.className = 'card shadow border-0';

	card.innerHTML = `
		<div class="card-body">
			<ul class="list-group list-group-flush mb-3">

				   <li class="list-group-item">
					   <strong>Dossier :</strong> ${paquet.folderName ?? ''}
				   </li>

				   <li class="list-group-item">
					   <strong>Cote :</strong> ${paquet.cote ?? ''}
				   </li>

				<li class="list-group-item"><strong>Corpus :</strong> ${paquet.corpus ?? ''}</li>
				<li class="list-group-item"><strong>Microfilms :</strong> ${paquet.microFilmImage ?? ''}</li>
				<li class="list-group-item"><strong>Images couleurs :</strong> ${paquet.imageColor ?? ''}</li>
				<li class="list-group-item"><strong>Recherche archivage :</strong> ${paquet.searchArchiving ?? ''}</li>

				<li class="list-group-item">
					<strong>Status :</strong> ${createStatusBadge(status)}
				</li>

				<li class="list-group-item">
					<strong>Dernière modification :</strong> ${formatDate(paquet.lastmodifDate)}
				</li>
			</ul>

			<div class="row mb-3 text-center">
				<div class="col">
					<input type="checkbox" disabled ${paquet.toDo ? 'checked' : ''}> À faire
				</div>
				<div class="col">
					<input type="checkbox" disabled ${paquet.facileTest ? 'checked' : ''}> Multi-volume
				</div>
				<div class="col">
					<input type="checkbox" disabled ${paquet.filedSip ? 'checked' : ''}> SIP
				</div>
			</div>

			<div class="mb-3">
				<strong>Commentaire</strong>
				<div class="border rounded p-2 bg-light">${paquet.commentaire ?? ''}</div>
			</div>

			<div class="d-flex justify-content-center gap-3">
				<button class="btn btn-primary px-4" id="edit">
					<i class="bi bi-pencil"></i> Modifier
				</button>
				<button class="btn btn-danger px-4" id="delete">
					<i class="bi bi-trash"></i> Supprimer
				</button>
			</div>
		</div>
	`;

	   // ...existing code...

	card.querySelector('#edit').addEventListener('click', async () => {
		document.getElementById('paquet-modal-overlay')?.remove();
		const { afficherCardPaquetEditModal } = await import('./editPaquet/editPaquet.js');
		afficherCardPaquetEditModal(paquet);
	});

	card.querySelector('#delete').addEventListener('click', () =>
		showDeleteConfirmation(paquet)
	);

	return card;
}

/* ==========================================================
   SUPPRESSION
========================================================== */
async function showDeleteConfirmation(paquet) {
	if (!confirm(`Supprimer définitivement le paquet ${paquet.cote} ?`)) return;

	const result = await deletePaquet(paquet.cote);

	if (result?.success) {
		showToast('Paquet supprimé');
		setTimeout(() => location.reload(), 1000);
	} else {
		showToast('Erreur lors de la suppression', false);
	}
}

/* ==========================================================
   AFFICHAGE SIMPLE
========================================================== */
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
		document.querySelector(containerSelector).innerHTML =
			'<div class="alert alert-danger">Erreur de chargement</div>';
		return;
	}

	await afficherCardPaquet(paquet, containerSelector);
}
