export function afficherCardPaquetModal(paquet) {
	// Supprime toute modale existante
	const oldModal = document.getElementById('paquet-modal-overlay');
	if (oldModal) oldModal.remove();

	// Overlay Bootstrap
	const overlay = document.createElement('div');
	overlay.id = 'paquet-modal-overlay';
	overlay.className = 'modal fade show';
	overlay.tabIndex = -1;
	overlay.style.display = 'block';
	overlay.style.background = 'rgba(0,0,0,0.5)';
	overlay.style.zIndex = 2000;

	// Modale Bootstrap
	const modalDialog = document.createElement('div');
	modalDialog.className = 'modal-dialog modal-lg modal-dialog-centered';

	const modalContent = document.createElement('div');
	modalContent.className = 'modal-content';

	// Header
	const modalHeader = document.createElement('div');
	modalHeader.className = 'modal-header';

	const modalTitle = document.createElement('h5');
	modalTitle.className = 'modal-title fw-bold text-center w-100';
	modalTitle.textContent = 'Information du paquet';

	const closeBtn = document.createElement('button');
	closeBtn.type = 'button';
	closeBtn.className = 'btn-close';
	closeBtn.setAttribute('aria-label', 'Fermer');
	closeBtn.addEventListener('click', () => overlay.remove());

	modalHeader.appendChild(modalTitle);
	modalHeader.appendChild(closeBtn);

	// Body
	const modalBody = document.createElement('div');
	modalBody.className = 'modal-body';
	modalBody.appendChild(createCardPaquet(paquet));

	modalContent.appendChild(modalHeader);
	modalContent.appendChild(modalBody);

	modalDialog.appendChild(modalContent);
	overlay.appendChild(modalDialog);

	overlay.addEventListener('click', e => {
		if (e.target === overlay) overlay.remove();
	});

	document.body.appendChild(overlay);
}
import { fetchOnePaquet } from '../API/paquet.js';
import { selectCorpus } from './selecteur/selectCorpus.js';


export function createCardPaquet(paquet) {
	const card = document.createElement('div');
	card.className = 'card shadow-sm border-0';

	card.innerHTML = `
		<div class="card-body">
			<ul class="list-group list-group-flush mb-3">
				<li class="list-group-item"><strong>Nom dossier :</strong> ${paquet.folderName || ''}</li>
				<li class="list-group-item"><strong>Cote :</strong> ${paquet.cote || ''}</li>
				<li class="list-group-item"><strong>Corpus :</strong> ${paquet.corpus || ''}</li>
				<li class="list-group-item"><strong>Répertoire des images microfilms :</strong> ${paquet.microFilmImage || ''}</li>
				<li class="list-group-item"><strong>Répertoire des images couleurs :</strong> ${paquet.imageColor || ''}</li>
				<li class="list-group-item"><strong>Recherche Archivage :</strong> ${paquet.searchArchiving || ''}</li>
				<li class="list-group-item"><strong>Status :</strong> ${paquet.name_status || ''}</li>
				<li class="list-group-item"><strong>Date de la dernière modification :</strong> ${paquet.lastmodifDate || ''}</li>
			</ul>

			<div class="row mb-3">
				<div class="col">
					<div class="form-check form-switch">
						<input class="form-check-input" type="checkbox" disabled ${paquet.toDo ? 'checked' : ''} id="todoCheck">
						<label class="form-check-label" for="todoCheck">A faire</label>
					</div>
				</div>
				<div class="col">
					<div class="form-check form-switch">
						<input class="form-check-input" type="checkbox" disabled ${paquet.facileTest ? 'checked' : ''} id="multiVolumeCheck">
						<label class="form-check-label" for="multiVolumeCheck">Multi volume</label>
					</div>
				</div>
				<div class="col">
					<div class="form-check form-switch">
						<input class="form-check-input" type="checkbox" disabled ${paquet.filedSip ? 'checked' : ''} id="sipCheck">
						<label class="form-check-label" for="sipCheck">Déposé dans SIP en prod num</label>
					</div>
				</div>
			</div>

			<div class="mb-3">
				<strong>Commentaire :</strong>
				<div class="border rounded p-2 bg-light" style="white-space: pre-line;">${paquet.commentaire || ''}</div>
			</div>

			<div class="d-flex justify-content-center gap-3 mt-4">
				<button type="button" id="btn-edit-paquet" class="btn btn-primary px-4">Modifier</button>
				<button type="button" id="btn-delete-paquet" class="btn btn-danger px-4">Supprimer</button>
			</div>
		</div>
	`;

	// Ajout du listener pour le bouton Modifier
	const editBtn = card.querySelector('#btn-edit-paquet');
	if (editBtn) {
		editBtn.addEventListener('click', async () => {
			const overlay = document.getElementById('paquet-modal-overlay');
			if (overlay) overlay.remove();
			const { afficherCardPaquetEditModal } = await import('./editPaquet/editPaquet.js');
			afficherCardPaquetEditModal(paquet);
		});
	}

	// Affiche un toast Bootstrap
	function showPopup(message, isSuccess = true) {
		const toast = document.createElement('div');
		toast.className = `toast align-items-center text-white ${isSuccess ? 'bg-success' : 'bg-danger'} border-0 position-fixed top-0 start-50 translate-middle-x mt-4`;
		toast.setAttribute('role', 'alert');
		toast.setAttribute('aria-live', 'assertive');
		toast.setAttribute('aria-atomic', 'true');
		toast.style.zIndex = 3000;
		toast.innerHTML = `
			<div class="d-flex">
				<div class="toast-body">${message}</div>
				<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
			</div>
		`;
		document.body.appendChild(toast);
		setTimeout(() => { toast.classList.add('show'); }, 10);
		setTimeout(() => {
			toast.classList.remove('show');
			setTimeout(() => toast.remove(), 300);
		}, 2200);
	}

	const deleteBtn = card.querySelector('#btn-delete-paquet');
	if (deleteBtn) {
		deleteBtn.addEventListener('click', () => {
			showDeleteConfirmation(paquet);
		});
	}

	function showDeleteConfirmation(paquet) {
		const oldModal = document.getElementById('delete-confirm-modal-overlay');
		if (oldModal) oldModal.remove();

		const overlay = document.createElement('div');
		overlay.id = 'delete-confirm-modal-overlay';
		overlay.className = 'modal fade show';
		overlay.tabIndex = -1;
		overlay.style.display = 'block';
		overlay.style.background = 'rgba(0,0,0,0.5)';
		overlay.style.zIndex = 2100;

		const modalDialog = document.createElement('div');
		modalDialog.className = 'modal-dialog modal-dialog-centered';

		const modalContent = document.createElement('div');
		modalContent.className = 'modal-content';

		const modalHeader = document.createElement('div');
		modalHeader.className = 'modal-header';

		const modalTitle = document.createElement('h5');
		modalTitle.className = 'modal-title fw-bold text-center w-100';
		modalTitle.textContent = 'Confirmer la suppression';

		const closeBtn = document.createElement('button');
		closeBtn.type = 'button';
		closeBtn.className = 'btn-close';
		closeBtn.setAttribute('aria-label', 'Fermer');
		closeBtn.addEventListener('click', () => overlay.remove());

		modalHeader.appendChild(modalTitle);
		modalHeader.appendChild(closeBtn);

		const modalBody = document.createElement('div');
		modalBody.className = 'modal-body text-center';
		modalBody.innerHTML = `
			<p class="mb-3">Êtes-vous sûr de vouloir supprimer le paquet <strong>${paquet.cote}</strong> ?<br><span class="text-danger">Cette action est irréversible.</span></p>
		`;

		const modalFooter = document.createElement('div');
		modalFooter.className = 'modal-footer d-flex justify-content-center gap-3';

		const cancelBtn = document.createElement('button');
		cancelBtn.type = 'button';
		cancelBtn.className = 'btn btn-secondary px-4';
		cancelBtn.textContent = 'Annuler';
		cancelBtn.addEventListener('click', () => overlay.remove());

		const confirmBtn = document.createElement('button');
		confirmBtn.type = 'button';
		confirmBtn.className = 'btn btn-danger px-4';
		confirmBtn.textContent = 'Confirmer la suppression';
		confirmBtn.addEventListener('click', async () => {
			const { deletePaquet } = await import('../API/paquet.js');
			const result = await deletePaquet(paquet.cote);
			overlay.remove();
			if (result && result.success) {
				showPopup('Paquet supprimé avec succès.', true);
				setTimeout(() => window.location.reload(), 1200);
			} else {
				showPopup('Erreur lors de la suppression du paquet.', false);
			}
		});

		modalFooter.appendChild(cancelBtn);
		modalFooter.appendChild(confirmBtn);

		modalContent.appendChild(modalHeader);
		modalContent.appendChild(modalBody);
		modalContent.appendChild(modalFooter);

		modalDialog.appendChild(modalContent);
		overlay.appendChild(modalDialog);

		overlay.addEventListener('click', e => {
			if (e.target === overlay) overlay.remove();
		});

		document.body.appendChild(overlay);
	}

	return card;
}


export function afficherCardPaquet(paquet, containerSelector = 'main') {
	const container = document.querySelector(containerSelector);
	if (!container) return;
	container.innerHTML = '';
	container.appendChild(createCardPaquet(paquet));
}


export async function afficherCardPaquetDepuisAPI(containerSelector = 'main') {
	const data = await fetchOnePaquet();
	if (data && (data.data || data)) {
		const paquet = data.data || data;
		afficherCardPaquet(paquet, containerSelector);
	} else {
		const container = document.querySelector(containerSelector);
		if (container) container.innerHTML = '<div class="alert alert-danger">Erreur lors du chargement du paquet.</div>';
	}
}
