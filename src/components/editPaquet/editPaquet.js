import { selectCorpus } from '../selectCorpus.js';
import { createTypeDocumentSelector } from '../selecteur/selectTypeDocument.js';
import { createStatusSelector } from '../selectStatus.js';
import { editPaquet } from '../../API/paquet.js';

// Affiche une modale avec un formulaire pour modifier le paquet
export function afficherCardPaquetEditModal(paquet) {
	// Supprime toute modale existante
	const oldModal = document.getElementById('paquet-modal-overlay');
	if (oldModal) oldModal.remove();

	// Overlay
	const overlay = document.createElement('div');
	overlay.id = 'paquet-modal-overlay';
	overlay.style.position = 'fixed';
	overlay.style.top = 0;
	overlay.style.left = 0;
	overlay.style.width = '100vw';
	overlay.style.height = '100vh';
	overlay.style.background = 'rgba(0,0,0,0.5)';
	overlay.style.display = 'flex';
	overlay.style.alignItems = 'center';
	overlay.style.justifyContent = 'center';
	overlay.style.zIndex = 2000;

	// Modale
	const modal = document.createElement('div');
	modal.style.position = 'relative';
	modal.style.background = '#fff';
	modal.style.borderRadius = '10px';
	modal.style.boxShadow = '0 4px 32px rgba(0,0,0,0.25)';
	modal.style.padding = '24px 16px 16px 16px';
	modal.style.maxWidth = '650px';
	modal.style.width = '100%';
	modal.style.maxHeight = '90vh';
	modal.style.overflowY = 'auto';

	// Bouton de fermeture
	const closeBtn = document.createElement('button');
	closeBtn.innerHTML = 'X';
	closeBtn.setAttribute('aria-label', 'Fermer');
	closeBtn.style.position = 'absolute';
	closeBtn.style.top = '8px';
	closeBtn.style.right = '16px';
	closeBtn.style.left = 'auto';
	closeBtn.style.transform = 'none';
	closeBtn.style.width = '44px';
	closeBtn.style.height = '44px';
	closeBtn.style.display = 'flex';
	closeBtn.style.alignItems = 'center';
	closeBtn.style.justifyContent = 'center';
	closeBtn.style.fontSize = '1.5rem';
	closeBtn.style.background = '#dc3545';
	closeBtn.style.border = 'none';
	closeBtn.style.borderRadius = '50%';
	closeBtn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
	closeBtn.style.cursor = 'pointer';
	closeBtn.style.color = '#fff';
	closeBtn.style.zIndex = 10;
	closeBtn.style.transition = 'background 0.2s, color 0.2s';
	closeBtn.addEventListener('mouseenter', () => {
		closeBtn.style.background = '#bb2d3b';
	});
	closeBtn.addEventListener('mouseleave', () => {
		closeBtn.style.background = '#dc3545';
	});
	closeBtn.addEventListener('click', () => overlay.remove());

	// Formulaire d'édition
	const form = document.createElement('form');
	const connectedUserId = localStorage.getItem('userId') || '';
	form.innerHTML = `
		<div class="fw-bold fs-3 text-center mb-4">Modification d’un paquet</div>
		<div class="container-fluid">
			<div class="row g-3">
				<div class="col-md-6">
					<label class="form-label">Nom dossier :</label>
					<input type="text" class="form-control" name="folderName" value="${paquet.folderName || ''}">
				</div>
				<div class="col-md-6">
					<label class="form-label">Répertoire des images autre :</label>
					<input type="text" class="form-control" name="microFilmImage" value="${paquet.microFilmImage || ''}">
				</div>
				<div class="col-md-6">
					<label class="form-label">Cote :</label>
					<input type="text" class="form-control" name="cote" value="${paquet.cote || ''}">
				</div>
				<div class="col-md-6">
					<label class="form-label">Répertoire des images couleurs :</label>
					<input type="text" class="form-control" name="imageColor" value="${paquet.imageColor || ''}">
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
					<input type="text" class="form-control" name="searchArchiving" value="${paquet.searchArchiving || ''}">
				</div>
				<div class="col-md-12 d-flex align-items-center gap-4 mt-2 mb-2 justify-content-center">
					<div class="form-check">
						<input class="form-check-input" type="checkbox" name="toDo" id="editToDo" ${paquet.toDo ? 'checked' : ''}>
						<label class="form-check-label" for="editToDo">A faire :</label>
					</div>
					<div class="form-check">
						<input class="form-check-input" type="checkbox" name="facileTest" id="editFacileTest" ${paquet.facileTest ? 'checked' : ''}>
						<label class="form-check-label" for="editFacileTest">Multi volume :</label>
					</div>
					<div class="form-check">
						<input class="form-check-input" type="checkbox" name="filedSip" id="editFiledSip" ${paquet.filedSip ? 'checked' : ''}>
						<label class="form-check-label" for="editFiledSip">Déposé dans SIP en prod num :</label>
					</div>
				</div>
				<div class="col-md-12">
					<label class="form-label">Commentaire :</label>
					<textarea class="form-control" name="comment" rows="4">${paquet.commentaire || ''}</textarea>
				</div>
			</div>
			<div class="d-flex justify-content-center mt-4">
				<button type="submit" class="btn btn-primary px-5">Enregistrer</button>
			</div>
		</div>
		<input type="hidden" name="usersId" value="${connectedUserId}">
		<input type="hidden" name="lastmodifDate" value="${new Date().toISOString().slice(0, 19).replace('T', ' ')}">
	`;

	// Ajout du sélecteur de corpus à la place de l'input Corpus ID

	(async () => {
		// Corpus
		const corpusContainer = form.querySelector('#corpus-select-container');
		if (corpusContainer) {
			const corpusSelector = selectCorpus();
			corpusContainer.appendChild(corpusSelector);
			// Préselection
			setTimeout(() => {
				if (paquet.corpusId) {
					const select = corpusSelector.querySelector('select');
					if (select) select.value = paquet.corpusId;
				}
			}, 0);
		}
		// Type de document
		const typeDocContainer = form.querySelector('#type-document-select-container');
		if (typeDocContainer) {
			const typeDocSelectorWrapper = await createTypeDocumentSelector({ name: 'typeDocumentId', value: paquet.typeDocumentId || paquet.typeDocument_id || '' });
			typeDocContainer.appendChild(typeDocSelectorWrapper);
		}
		// Statut
		const statusContainer = form.querySelector('#status-select-container');
		if (statusContainer) {
			const statusSelectorWrapper = await createStatusSelector({ name: 'statusId', value: paquet.statusId || paquet.status_id || '' });
			statusContainer.appendChild(statusSelectorWrapper);
		}
	})();

	// Ajout du submit (à compléter avec l'appel API si besoin)

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
		if (selectCorpusEl) data.corpusId = selectCorpusEl.value;
		// TypeDocumentId
		const selectTypeDocEl = form.querySelector('#type-document-select-container select');
		if (selectTypeDocEl) data.typeDocumentId = selectTypeDocEl.value;
		// StatusId
		const selectStatusEl = form.querySelector('#status-select-container select');
		if (selectStatusEl) data.statusId = selectStatusEl.value;
		// Commentaire
		data.commentaire = data.comment;
		delete data.comment;
		// Vérification des champs obligatoires
		if (!data.folderName || !data.cote || !data.usersId || isNaN(Number(data.usersId))) {
			showPopup('Veuillez remplir tous les champs obligatoires (Nom dossier, Cote, utilisateur connecté).', false);
			return;
		}
		let res = null;
		try {
			res = await editPaquet(data);
		} catch (e) {
			res = null;
		}
		overlay.remove();
		// Afficher une popup de succès ou d'erreur
		if (res && (res.success || res.status === 'success')) {
			showPopup('Le paquet a bien été modifié.', true);
		} else if (res && res.fields) {
			showPopup('Champs manquants : ' + res.fields.join(', '), false);
		} else if (res && res.message) {
			showPopup(res.message, false);
		} else {
			showPopup("Erreur lors de la modification du paquet.", false);
		}
	});

	// Fonction utilitaire pour afficher une popup
	function showPopup(message, success = true) {
		const popup = document.createElement('div');
		popup.textContent = message;
		popup.style.position = 'fixed';
		popup.style.top = '30px';
		popup.style.left = '50%';
		popup.style.transform = 'translateX(-50%)';
		popup.style.background = success ? '#28a745' : '#dc3545';
		popup.style.color = '#fff';
		popup.style.padding = '16px 32px';
		popup.style.borderRadius = '8px';
		popup.style.boxShadow = '0 2px 16px rgba(0,0,0,0.15)';
		popup.style.zIndex = 3000;
		popup.style.fontSize = '1.1rem';
		document.body.appendChild(popup);
		setTimeout(() => {
			popup.remove();
		}, 2500);
	}

	modal.appendChild(closeBtn);
	modal.appendChild(form);
	overlay.appendChild(modal);

	overlay.addEventListener('click', e => {
		if (e.target === overlay) overlay.remove();
	});

	document.body.appendChild(overlay);
}
