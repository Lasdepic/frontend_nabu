export function afficherCardConfirm({ nomFichier = '', onConfirmer, onAnnuler }) {
	// Création de la carte
	const card = document.createElement('div');
	card.className = 'card border-warning shadow-sm';
	card.style.maxWidth = '350px';
	card.innerHTML = `
		<div class="card-header bg-warning text-dark text-center fw-bold">
			<i class="fa-solid fa-triangle-exclamation me-2"></i>Attention !
		</div>
		<div class="card-body text-center">
			<p class="mb-3">Le fichier <span class="fw-bold">${nomFichier}</span> existe déjà sur le serveur, mais le hash MD5 ne correspond pas.</p>
			<p class="mb-3">Voulez-vous remplacer le paquet existant&nbsp;?</p>
			<div class="d-flex justify-content-center gap-2">
				<button class="btn btn-danger px-3 fw-bold" id="btnConfirmerRemplacement">Remplacer</button>
				<button class="btn btn-outline-secondary px-3 fw-bold" id="btnAnnulerRemplacement">Annuler</button>
			</div>
		</div>
	`;
	// Gestion des boutons
	card.querySelector('#btnConfirmerRemplacement').onclick = () => {
		if (typeof onConfirmer === 'function') onConfirmer();
		card.remove();
	};
	card.querySelector('#btnAnnulerRemplacement').onclick = () => {
		if (typeof onAnnuler === 'function') onAnnuler();
		card.remove();
	};
	return card;
}
