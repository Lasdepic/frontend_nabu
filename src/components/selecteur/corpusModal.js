import { createCorpus, editCorpus } from '../../API/paquet/corpus.js';

export function showCorpusModal(options = {}) {
	const mode = options?.mode === 'edit' ? 'edit' : 'create';
	const corpus = options?.corpus ?? null;
	const onSuccess = options?.onSuccess;

	if (mode === 'edit' && !corpus?.id) return;

	const existing = document.getElementById('corpus-modal-overlay');
	if (existing) existing.remove();

	const overlay = document.createElement('div');
	overlay.id = 'corpus-modal-overlay';
	overlay.className = 'modal fade show';
	overlay.style.display = 'block';
	overlay.style.background = 'rgba(0,0,0,0.5)';
	overlay.style.position = 'fixed';
	overlay.style.top = 0;
	overlay.style.left = 0;
	overlay.style.width = '100vw';
	overlay.style.height = '100vh';
	overlay.style.zIndex = 3000;

	const modal = document.createElement('div');
	modal.className = 'modal-dialog modal-dialog-centered';
	modal.style.maxWidth = '500px';
	modal.style.width = '100%';

	const modalContent = document.createElement('div');
	modalContent.className = 'modal-content shadow-lg';

	const modalHeader = document.createElement('div');
	modalHeader.className = 'modal-header';
	const title = document.createElement('h5');
	title.className = 'modal-title fw-bold text-center w-100';
	title.textContent = mode === 'edit' ? 'Modifier le corpus' : 'Créer un nouveau corpus';
	const closeBtn = document.createElement('button');
	closeBtn.type = 'button';
	closeBtn.className = 'btn-close';
	closeBtn.setAttribute('aria-label', 'Fermer');
	closeBtn.onclick = () => overlay.remove();
	modalHeader.appendChild(title);
	modalHeader.appendChild(closeBtn);

	const form = document.createElement('form');
	form.className = 'modal-body';
	form.innerHTML = `
		<div class="mb-3">
			<label class="form-label">Nom du corpus <span class="text-danger">*</span> :</label>
			<input type="text" class="form-control" name="nameCorpus" required value="${mode === 'edit' ? escapeAttr(corpus?.nom ?? '') : ''}">
		</div>
		<div class="mb-3">
			<label class="form-label">Description :</label>
			<textarea class="form-control" name="descriptionCorpus" rows="3">${mode === 'edit' ? escapeHtml(corpus?.description ?? '') : ''}</textarea>
		</div>
		<div class="d-flex justify-content-center mt-3">
			<button type="submit" class="btn ${mode === 'edit' ? 'btn-primary' : 'btn-success'} px-4">${mode === 'edit' ? 'Enregistrer' : 'Créer'}</button>
		</div>
	`;

	form.onsubmit = async function (e) {
		e.preventDefault();
		const formData = new FormData(form);
		const data = Object.fromEntries(formData.entries());
		data.nameCorpus = (data.nameCorpus ?? '').toString().trim();
		data.descriptionCorpus = (data.descriptionCorpus ?? '').toString();

		if (!data.nameCorpus) {
			showPopup('Le nom du corpus est requis.', false);
			return;
		}

		let res = null;
		if (mode === 'edit') {
			res = await editCorpus(String(corpus.id), data);
		} else {
			res = await createCorpus(data);
		}

		if (res && (res.success || res.status === 'success')) {
			showPopup(mode === 'edit' ? 'Corpus modifié avec succès.' : 'Corpus créé avec succès.', true);
			overlay.remove();
			if (typeof onSuccess === 'function') {
				if (mode === 'edit') onSuccess({ id: String(corpus.id), ...data }, res);
				else onSuccess(res);
			}
			return;
		}

		if (res && res.message) {
			showPopup(res.message, false);
		} else {
			showPopup(mode === 'edit' ? 'Erreur lors de la modification du corpus.' : 'Erreur lors de la création du corpus.', false);
		}
	};

	modalContent.appendChild(modalHeader);
	modalContent.appendChild(form);
	modal.appendChild(modalContent);
	overlay.appendChild(modal);
	document.body.appendChild(overlay);

	function showPopup(message, success = true) {
		const popup = document.createElement('div');
		popup.className = `alert ${success ? 'alert-success' : 'alert-danger'} position-fixed top-0 start-50 translate-middle-x mt-3 shadow`;
		popup.style.zIndex = 4000;
		popup.style.minWidth = '300px';
		popup.style.maxWidth = '90vw';
		popup.textContent = message;
		document.body.appendChild(popup);
		setTimeout(() => popup.remove(), 2500);
	}
}

function escapeHtml(value) {
	return String(value)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

function escapeAttr(value) {
	return escapeHtml(value);
}
