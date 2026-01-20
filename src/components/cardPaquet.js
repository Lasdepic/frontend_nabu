export function afficherCardPaquetModal(paquet) {
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

	
	modal.appendChild(closeBtn);
	modal.appendChild(createCardPaquet(paquet));
	overlay.appendChild(modal);

	overlay.addEventListener('click', e => {
		if (e.target === overlay) overlay.remove();
	});

	document.body.appendChild(overlay);
}
import { fetchOnePaquet } from '../API/paquet.js';
import { selectCorpus } from './selectCorpus.js';


export function createCardPaquet(paquet) {
	const card = document.createElement('div');
	card.style.background = '#fff';
	card.style.borderRadius = '12px';
	card.style.boxShadow = '0 4px 32px rgba(0,0,0,0.15)';
	card.style.padding = '32px 32px 24px 32px';
	card.style.maxWidth = '650px';
	card.style.margin = '0 auto';
	card.style.fontFamily = 'inherit';
	card.style.color = '#111';
	card.style.position = 'relative';

	card.innerHTML = `
		<div style="font-weight: bold; font-size: 1.25rem; text-align: center; margin-bottom: 18px;">Information du paquet</div>
		<div style="margin-bottom: 18px;">
			<span style="font-weight: bold;">Nom dossier :</span> ${paquet.folderName || ''}
		</div>
		<div style="margin-bottom: 8px;"><span style="font-weight: bold;">Cote :</span> ${paquet.cote || ''}</div>
		<div style="margin-bottom: 8px;"><span style="font-weight: bold;">Corpus :</span> ${paquet.corpus || ''}</div>
		<div style="margin-bottom: 8px;"><span style="font-weight: bold;">Répertoire des images microfilms :</span> ${paquet.microFilmImage || ''}</div>
		<div style="margin-bottom: 8px;"><span style="font-weight: bold;">Répertoire des images couleurs :</span> ${paquet.imageColor || ''}</div>
		<div style="margin-bottom: 8px;"><span style="font-weight: bold;">Recherche Archivage :</span> ${paquet.searchArchiving || ''}</div>
		<div style="margin-bottom: 8px;"><span style="font-weight: bold;">Date de la dernière modification :</span> ${paquet.lastmodifDate || ''}</div>

		<div style="display: flex; align-items: center; gap: 24px; margin: 18px 0 8px 0;">
			<span>A faire : <input type="checkbox" disabled ${paquet.toDo ? 'checked' : ''} style="width: 18px; height: 18px; vertical-align: middle;"></span>
			<span>Multi volume : <input type="checkbox" disabled ${paquet.facileTest ? 'checked' : ''} style="width: 18px; height: 18px; vertical-align: middle;"></span>
			<span>Déposé dans SIP en prod num : <input type="checkbox" disabled ${paquet.filedSip ? 'checked' : ''} style="width: 18px; height: 18px; vertical-align: middle;"></span>
		</div>

		<div style="margin-top: 18px; font-weight: bold;">Commentaire :</div>
		<div style="margin-bottom: 24px; white-space: pre-line;">${paquet.commentaire || ''}</div>

		<div style="display: flex; justify-content: center; gap: 32px; margin-top: 32px;">
			<button type="button" id="btn-edit-paquet" style="background: #007bff; color: #fff; border: none; border-radius: 8px; padding: 8px 20px; font-size: 0.95rem; font-weight: 500; cursor: pointer; transition: background 0.2s;">Modifier</button>
			<button type="button" id="btn-delete-paquet" style="background: #dc3545; color: #fff; border: none; border-radius: 8px; padding: 8px 20px; font-size: 0.95rem; font-weight: 500; cursor: pointer; transition: background 0.2s;">Supprimer</button>
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

	// Ajout du listener pour le bouton Supprimer (à adapter selon la logique de suppression)
	const deleteBtn = card.querySelector('#btn-delete-paquet');
	if (deleteBtn) {
		deleteBtn.addEventListener('click', () => {
			if (confirm('Voulez-vous vraiment supprimer ce paquet ?')) {
				// TODO: Ajouter la logique de suppression ici (API, etc.)
				const overlay = document.getElementById('paquet-modal-overlay');
				if (overlay) overlay.remove();
				// Afficher un message ou rafraîchir la liste, etc.
			}
		});
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
