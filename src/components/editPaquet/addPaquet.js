
import { selectCorpus } from '../selecteur/selectCorpus.js';
import { createPaquet } from '../../API/paquet/paquet.js';
import { createTypeDocumentSelector } from '../selecteur/selectTypeDocument.js';
import { createStatusSelector } from '../selecteur/selectStatus.js';

export function afficherCardPaquetAddModal(defaults = {}) {
	function escapeHtml(value) {
		return String(value ?? '')
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}

	function normalizeStatusLabel(label) {
		const raw = String(label || '')
			.trim()
			.toUpperCase();
		const noDiacritics = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
		return noDiacritics
			.replace(/[^A-Z0-9]+/g, '_')
			.replace(/^_+|_+$/g, '');
	}

	function getNonEnvoyeStatusValue(statusSelectEl) {
		if (!statusSelectEl) return '';
		const options = Array.from(statusSelectEl.options || []);
		const opt = options.find(o => (o?.dataset?.normalizedLabel || normalizeStatusLabel(o.textContent)) === 'NON_ENVOYE');
		return opt ? opt.value : '';
	}

	function applySipRule(formEl) {
		const sipCheckbox = formEl?.querySelector('[name="filedSip"]');
		const statusSelectEl = formEl?.querySelector('#status-select-container select');
		if (!sipCheckbox || !statusSelectEl) return;

		const nonEnvoyeValue = getNonEnvoyeStatusValue(statusSelectEl);
		if (!nonEnvoyeValue) return;

		if (sipCheckbox.checked) {
			if (!statusSelectEl.dataset.prevValue) {
				statusSelectEl.dataset.prevValue = statusSelectEl.value || '';
			}
			statusSelectEl.value = nonEnvoyeValue;
			statusSelectEl.disabled = true;
		} else {
			statusSelectEl.disabled = false;
			if (statusSelectEl.dataset.prevValue !== undefined) {
				statusSelectEl.value = statusSelectEl.dataset.prevValue;
				delete statusSelectEl.dataset.prevValue;
			}
		}
	}

	const oldModal = document.getElementById('paquet-modal-overlay');
	if (oldModal) oldModal.remove();

	const overlay = document.createElement('div');
	overlay.id = 'paquet-modal-overlay';
	overlay.className = 'paquet-modal-overlay modal fade show';
	overlay.style.display = 'block';

	const modal = document.createElement('div');
	modal.className = 'modal-dialog modal-dialog-centered paquet-modal-dialog';

	const modalContent = document.createElement('div');
	modalContent.className = 'modal-content shadow-lg paquet-modal-content';

	const modalHeader = document.createElement('div');
	modalHeader.className = 'modal-header paquet-modal-header';
	const title = document.createElement('h5');
	title.className = 'modal-title fw-bold text-center w-100';
	title.textContent = 'Création d’un paquet';

	const closeBtn = document.createElement('button');
	closeBtn.type = 'button';
	closeBtn.className = 'btn-close';
	closeBtn.setAttribute('aria-label', 'Fermer');
	closeBtn.addEventListener('click', () => overlay.remove());

	modalHeader.appendChild(title);
	modalHeader.appendChild(closeBtn);

	const form = document.createElement('form');
	form.className = 'modal-body paquet-modal-body';
	const connectedUserId = localStorage.getItem('userId') || '';
	form.innerHTML = `
		<div class="container-fluid">
			<div class="row g-3">
				<div class="col-md-6">
					<label class="form-label">Nom dossier <span class="text-danger">*</span> :</label>
					<input type="text" class="form-control" name="folderName" required value="${escapeHtml(defaults.folderName)}">
				</div>
				<div class="col-md-6">
					<label class="form-label">Répertoire des images autre :</label>
					<input type="text" class="form-control" name="microFilmImage">
				</div>
				<div class="col-md-6">
					<label class="form-label">Cote <span class="text-danger">*</span> :</label>
					<input type="text" class="form-control" name="cote" required value="${escapeHtml(defaults.cote)}">
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
				<div class="col-md-12 paquet-modal-flags d-flex align-items-center gap-4 mt-2 mb-2 justify-content-center flex-wrap">
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
			<div class="d-flex justify-content-center mt-4 paquet-modal-actions">
				<button type="submit" class="btn btn-primary px-5">Enregistrer</button>
			</div>
		</div>
		<input type="hidden" name="usersId" value="${connectedUserId}">
		<input type="hidden" name="lastmodifDate" value="${new Date().toISOString().slice(0, 19).replace('T', ' ')}">
	`;

	// Assemble modal
	modalContent.appendChild(modalHeader);
	modalContent.appendChild(form);
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

			// Ajout du bouton "Créer un corpus"
			const createCorpusBtn = document.createElement('button');
			createCorpusBtn.type = 'button';
			createCorpusBtn.className = 'btn btn-outline-primary btn-sm ms-2';
			createCorpusBtn.textContent = 'Créer un corpus';
			createCorpusBtn.style.marginTop = '8px';
			corpusContainer.appendChild(createCorpusBtn);

			createCorpusBtn.onclick = async () => {
				const { showCreateCorpusModal } = await import('../selecteur/createCorpusModal.js');
				showCreateCorpusModal(async () => {
					// Après création, rafraîchir le selecteur de corpus
					corpusContainer.innerHTML = '';
					const newSelector = selectCorpus();
					corpusContainer.appendChild(newSelector);
					corpusContainer.appendChild(createCorpusBtn);
				});
			};
		}
		const typeDocContainer = form.querySelector('#type-document-select-container');
		if (typeDocContainer) {
			const typeDocSelectorWrapper = await createTypeDocumentSelector({ name: 'typeDocumentId' });
			typeDocContainer.appendChild(typeDocSelectorWrapper);
		}
		const statusContainer = form.querySelector('#status-select-container');
		if (statusContainer) {
			const statusSelectorWrapper = await createStatusSelector({
				name: 'statusId',
				allowedLabels: ['INEXISTANT', 'NON_ENVOYE'],
			});
			statusContainer.appendChild(statusSelectorWrapper);

			const sipCheckbox = form.querySelector('[name="filedSip"]');
			if (sipCheckbox) {
				sipCheckbox.addEventListener('change', () => applySipRule(form));
			}
			applySipRule(form);
		}
	})();

	form.addEventListener('submit', async function(e) {
		e.preventDefault();
		const formData = new FormData(form);
		const data = Object.fromEntries(formData.entries());
		data.toDo = !!form.querySelector('[name="toDo"]').checked;
		data.facileTest = !!form.querySelector('[name="facileTest"]').checked;
		data.filedSip = !!form.querySelector('[name="filedSip"]').checked;
		const selectCorpusEl = form.querySelector('#corpus-select-container select');
		if (selectCorpusEl && selectCorpusEl.value) {
			data.corpusId = selectCorpusEl.value;
		} else {
			delete data.corpusId;
		}
		const selectTypeDocEl = form.querySelector('#type-document-select-container select');
		if (selectTypeDocEl && selectTypeDocEl.value) {
			data.typeDocumentId = selectTypeDocEl.value;
		} else {
			data.typeDocumentId = null;
		}
		const selectStatusEl = form.querySelector('#status-select-container select');
		if (data.filedSip) {
			const nonEnvoyeValue = getNonEnvoyeStatusValue(selectStatusEl);
			if (!nonEnvoyeValue) {
				showPopup('Impossible de trouver le statut NON_ENVOYE. Veuillez contacter un administrateur.', false);
				return;
			}
			data.statusId = nonEnvoyeValue;
		} else if (selectStatusEl && selectStatusEl.value) {
			data.statusId = selectStatusEl.value;
		} else {
			delete data.statusId;
		}
		if (!data.folderName || !data.cote) {
			showPopup('Veuillez remplir tous les champs obligatoires (Nom dossier et Cote).', false);
			return;
		}
		const res = await createPaquet(data);
		overlay.remove();
		if (res && (res.success || res.status === 'success')) {
			showPopup('Le paquet a bien été enregistré.', true);
			   const refreshTableaux = async () => {
				   if (window.afficherTableauPaquet) {
					   window.afficherTableauPaquet('tableau-paquet-conteneur');
				   } else {
					   try {
						   const module = await import('../home/tableauPaquet.js');
						   if (module && typeof module.afficherTableauPaquet === 'function') {
							   module.afficherTableauPaquet('tableau-paquet-conteneur');
						   } else if (window.reloadTableauPaquet) {
							   window.reloadTableauPaquet();
						   }
					   } catch (e) {}
				   }
				   try {
					   let toDoFn = window.afficherTableauToDoPaquet;
					   if (!toDoFn) {
						   const toDoModule = await import('../home/toDo.js');
						   toDoFn = toDoModule.afficherTableauToDoPaquet;
					   }
					   if (typeof toDoFn === 'function') {
						   toDoFn('to-do-paquet-conteneur');
					   }
				   } catch (e) {}
				   try {
					   let sendErrorFn = window.afficherSendErrorPaquet;
					   if (!sendErrorFn) {
						   const sendErrorModule = await import('../home/sendError.js');
						   sendErrorFn = sendErrorModule.afficherSendErrorPaquet;
					   }
					   if (typeof sendErrorFn === 'function') {
						   sendErrorFn('send-error-paquet-conteneur');
					   }
				   } catch (e) {}
			   };
			   refreshTableaux();
		} else if (res && res.fields) {
			showPopup('Champs manquants : ' + res.fields.join(', '), false);
		} else if (res && res.message) {
			showPopup(res.message, false);
		} else {
			showPopup("Erreur lors de l'enregistrement du paquet.", false);
		}
	});

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
