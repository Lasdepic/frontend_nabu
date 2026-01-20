import { selectCorpus } from '../selectCorpus.js';

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
	setTimeout(() => {
		const corpusContainer = form.querySelector('#corpus-select-container');
		if (corpusContainer) {
			const corpusSelector = selectCorpus();
			// Préselectionne la valeur actuelle si possible
			corpusSelector.addEventListener('DOMContentLoaded', () => {
				if (paquet.corpusId) {
					const select = corpusSelector.querySelector('select');
					if (select) select.value = paquet.corpusId;
				}
			});
			corpusContainer.appendChild(corpusSelector);
		}
	}, 0);

	// Ajout du submit (à compléter avec l'appel API si besoin)
	form.addEventListener('submit', function(e) {
		e.preventDefault();
		// Ici, vous pouvez récupérer les valeurs du formulaire et appeler l'API d'édition
		// ...
		overlay.remove();
	});

	modal.appendChild(closeBtn);
	modal.appendChild(form);
	overlay.appendChild(modal);

	overlay.addEventListener('click', e => {
		if (e.target === overlay) overlay.remove();
	});

	document.body.appendChild(overlay);
}
