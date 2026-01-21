
import { selectCorpus } from '../selecteur/selectCorpus.js';
import { createPaquet } from '../../API/paquet.js';
import { createTypeDocumentSelector } from '../selecteur/selectTypeDocument.js';
import { createStatusSelector } from '../selecteur/selectStatus.js';

export function afficherCardPaquetAddModal() {

	const oldModal = document.getElementById('paquet-modal-overlay');
	if (oldModal) oldModal.remove();

	// Overlay Bootstrap style
	const overlay = document.createElement('div');
	overlay.id = 'paquet-modal-overlay';
	overlay.className = 'modal fade show';
	overlay.style.display = 'block';
	overlay.style.background = 'rgba(0,0,0,0.5)';
	overlay.style.position = 'fixed';
	overlay.style.top = 0;
	overlay.style.left = 0;
	overlay.style.width = '100vw';
	overlay.style.height = '100vh';
	overlay.style.zIndex = 2000;

	// Modal dialog
	const modal = document.createElement('div');
	modal.className = 'modal-dialog modal-dialog-centered';
	modal.style.maxWidth = '700px';
	modal.style.width = '100%';

	// Modal content
	const modalContent = document.createElement('div');
	modalContent.className = 'modal-content shadow-lg';

	// Modal header
	const modalHeader = document.createElement('div');
	modalHeader.className = 'modal-header';
	const title = document.createElement('h5');
	title.className = 'modal-title fw-bold';
	title.textContent = 'Création d’un paquet';

	const closeBtn = document.createElement('button');
	closeBtn.type = 'button';
	closeBtn.className = 'btn-close';
	closeBtn.setAttribute('aria-label', 'Fermer');
	closeBtn.addEventListener('click', () => overlay.remove());

	modalHeader.appendChild(title);
	modalHeader.appendChild(closeBtn);

	// Modal body (form)
	const form = document.createElement('form');
	form.className = 'modal-body';
	const connectedUserId = localStorage.getItem('userId') || '';
	form.innerHTML = `
		<div class="container-fluid">
			<div class="row g-3">
				<div class="col-md-6">
					<label class="form-label">Nom dossier <span class="text-danger">*</span> :</label>
					<input type="text" class="form-control" name="folderName" required>
				</div>
				<div class="col-md-6">
					<label class="form-label">Répertoire des images autre :</label>
					<input type="text" class="form-control" name="microFilmImage">
				</div>
				<div class="col-md-6">
					<label class="form-label">Cote <span class="text-danger">*</span> :</label>
					<input type="text" class="form-control" name="cote" required>
				</div>
				<div class="col-md-6">
					<label class="form-label">Répertoire des images couleurs :</label>
					<input type="text" class="form-control" name="imageColor">
				</div>
				<div class="col-md-6">
					<label class="form-label">Corpus :</label>
					<div id="corpus-select-container"></div>
				</div>
				<div class="col-md-6">
					<label class="form-label">Type de document :</label>
					<div id="type-document-select-container"></div>
				</div>
				<div class="col-md-6">
					<label class="form-label">Statut :</label>
					<div id="status-select-container"></div>
				</div>
				<div class="col-md-6">
					<label class="form-label">Recherche Archivage :</label>
					<input type="text" class="form-control" name="searchArchiving">
				</div>
				<div class="col-md-12 d-flex align-items-center gap-4 mt-2 mb-2 justify-content-center flex-wrap">
					<div class="form-check">
						<input class="form-check-input" type="checkbox" name="toDo" id="addToDo">
						<label class="form-check-label" for="addToDo">A faire :</label>
					</div>
					<div class="form-check">
						<input class="form-check-input" type="checkbox" name="facileTest" id="addFacileTest">
						<label class="form-check-label" for="addFacileTest">Multi volume :</label>
					</div>
					<div class="form-check">
						<input class="form-check-input" type="checkbox" name="filedSip" id="addFiledSip">
						<label class="form-check-label" for="addFiledSip">Déposé dans SIP en prod num :</label>
					</div>
				</div>
				<div class="col-md-12">
					<label class="form-label">Commentaire :</label>
					<textarea class="form-control" name="comment" rows="4"></textarea>
				</div>
			</div>
			<div class="d-flex justify-content-center mt-4">
				<button type="submit" class="btn btn-success px-5">Créer</button>
			</div>
		</div>
		<input type="hidden" name="usersId" value="${connectedUserId}">
		<input type="hidden" name="lastmodifDate" value="${new Date().toISOString().slice(0, 19).replace('T', ' ')}">
	`;

	// Modal footer (empty, but could be used)
	// const modalFooter = document.createElement('div');
	// modalFooter.className = 'modal-footer';

	// Assemble modal
	modalContent.appendChild(modalHeader);
	modalContent.appendChild(form);
	// modalContent.appendChild(modalFooter);
	modal.appendChild(modalContent);
	overlay.appendChild(modal);

	overlay.addEventListener('click', e => {
		if (e.target === overlay) overlay.remove();
	});

	document.body.appendChild(overlay);

	(async () => {
		const corpusContainer = form.querySelector('#corpus-select-container');
		if (corpusContainer) {
			const corpusSelector = selectCorpus();
			corpusContainer.appendChild(corpusSelector);
		}

		const typeDocContainer = form.querySelector('#type-document-select-container');
		if (typeDocContainer) {
			const typeDocSelectorWrapper = await createTypeDocumentSelector({ name: 'typeDocumentId' });
			typeDocContainer.appendChild(typeDocSelectorWrapper);
		}

		const statusContainer = form.querySelector('#status-select-container');
		if (statusContainer) {
			const statusSelectorWrapper = await createStatusSelector({ name: 'statusId' });
			statusContainer.appendChild(statusSelectorWrapper);
		}
	})();

	form.addEventListener('submit', async function(e) {
		e.preventDefault();
		const formData = new FormData(form);
		const data = Object.fromEntries(formData.entries());
		// Gestion des booléens
		data.toDo = !!form.querySelector('[name="toDo"]').checked;
		data.facileTest = !!form.querySelector('[name="facileTest"]').checked;
		data.filedSip = !!form.querySelector('[name="filedSip"]').checked;
		// CorpusId
		const selectCorpusEl = form.querySelector('#corpus-select-container select');
		if (selectCorpusEl && selectCorpusEl.value) {
			data.corpusId = selectCorpusEl.value;
		} else {
			delete data.corpusId;
		}
		// TypeDocumentId
		const selectTypeDocEl = form.querySelector('#type-document-select-container select');
		if (selectTypeDocEl && selectTypeDocEl.value) {
			data.typeDocumentId = selectTypeDocEl.value;
		} else {
			delete data.typeDocumentId;
		}
		// StatusId
		const selectStatusEl = form.querySelector('#status-select-container select');
		if (selectStatusEl && selectStatusEl.value) {
			data.statusId = selectStatusEl.value;
		} else {
			delete data.statusId;
		}
		// Commentaire
		data.commentaire = data.comment;
		delete data.comment;
		// Vérification des champs obligatoires
		if (!data.folderName || !data.cote) {
			showPopup('Veuillez remplir tous les champs obligatoires (Nom dossier et Cote).', false);
			return;
		}
		// Appel API
		const res = await createPaquet(data);
		// Fermer la modale
		overlay.remove();
		// Afficher une popup de succès ou d'erreur
		if (res && (res.success || res.status === 'success')) {
			showPopup('Le paquet a bien été enregistré.', true);
			if (window.afficherTableauPaquet) {
				window.afficherTableauPaquet('tableau-paquet-conteneur');
			}
		} else if (res && res.fields) {
			showPopup('Champs manquants : ' + res.fields.join(', '), false);
		} else if (res && res.message) {
			showPopup(res.message, false);
		} else {
			showPopup("Erreur lors de l'enregistrement du paquet.", false);
		}
	});

	// Fonction pour afficher une popup Bootstrap
	function showPopup(message, success = true) {
		const popup = document.createElement('div');
		popup.className = `alert ${success ? 'alert-success' : 'alert-danger'} position-fixed top-0 start-50 translate-middle-x mt-3 shadow`;
		popup.style.zIndex = 3000;
		popup.style.minWidth = '300px';
		popup.style.maxWidth = '90vw';
		popup.textContent = message;
		document.body.appendChild(popup);
		setTimeout(() => {
			popup.remove();
		}, 2500);
	}
}
