
import { fetchAllusers } from '../../API/users/users.js';
import { afficherProfilUtilisateur } from './displayProfilUser.js';
import { afficherCardProfilConnecte } from './InformationProfil.js';
import { afficherModalAjoutProfil } from './editProfil/addProfil.js';


export async function afficherCardUtilisateurs(containerSelector = 'main') {
	const container = document.querySelector(containerSelector);
	if (!container) return;

	// Structure row Bootstrap pour affichage côte à côte
	container.innerHTML = `
		<div class="row g-4">
			<div class="col-lg-8 col-12" id="users-table-col"></div>
			<div class="col-lg-4 col-12" id="profil-connecte-col"></div>
		</div>
	`;

	const tableCol = container.querySelector('#users-table-col');
	const profilCol = container.querySelector('#profil-connecte-col');

	// Spinner dans la colonne du tableau
	tableCol.innerHTML = `
		<div class="d-flex justify-content-center my-5">
			<div class="spinner-border text-dark" role="status"></div>
		</div>
	`;

	// Spinner dans la colonne du profil
	profilCol.innerHTML = `
		<div class="d-flex justify-content-center my-5">
			<div class="spinner-border text-dark" role="status"></div>
		</div>
	`;

	try {

		const result = await fetchAllusers();
		const users = result?.data ?? result;

		if (!Array.isArray(users) || users.length === 0) {
			tableCol.innerHTML = `
				<div class="alert alert-warning text-center my-4">
					Aucun utilisateur trouvé
				</div>
			`;
		} else {
			const card = document.createElement('div');
			card.className = 'card shadow-sm my-4';
			card.innerHTML = `
				<div class="card-header d-flex justify-content-between align-items-center text-dark fw-semibold fs-5">
					<div class="d-flex align-items-center gap-2">
						<span class="badge bg-info">Nombre d'utilisateur : ${users.length}</span>
					</div>
					<span class="flex-fill text-center">Liste des utilisateurs</span>
					<div class="d-flex align-items-center gap-2">
						<button id="btn-ajouter-profil" type="button" class="btn btn-primary btn-sm ms-2">Création de profil</button>
					</div>
				</div>
				<div class="card-body p-0">
					<div class="table-responsive">
						<table class="table table-hover align-middle mb-0 border-0" id="table-users">
							<thead class="table-dark text-center">
								<tr>
									<th>Nom</th>
									<th>Prénom</th>
									<th>Email</th>
									<th>Rôle</th>
								</tr>
							</thead>
							<tbody class="text-center">
								${users.map((user, idx) => `
									<tr data-user-idx="${idx}" style="cursor:pointer;">
										<td>${user.nom ?? ''}</td>
										<td>${user.prenom ?? ''}</td>
										<td>${user.email ?? ''}</td>
										<td>
											<span class="badge ${
												user.roleId === 1
													? 'bg-success'
													: user.roleId === 2
													? 'bg-primary'
													: 'bg-dark'
											}">
												${user.roleId === 1 ? 'Admin' : user.roleId === 2 ? 'Utilisateur' : 'Inconnu'}
											</span>
										</td>
									</tr>
								`).join('')}
							</tbody>
						</table>
					</div>
				</div>
			`;
			tableCol.innerHTML = '';
			tableCol.appendChild(card);

			// Ajout de l'écouteur sur chaque ligne du tableau
			const table = card.querySelector('#table-users');
			if (table) {
				table.querySelectorAll('tbody tr').forEach(tr => {
					tr.addEventListener('click', function() {
						const idx = this.getAttribute('data-user-idx');
						if (users[idx]) {
							afficherProfilUtilisateur(users[idx], containerSelector);
						}
					});
				});
			}

			// Ajout de l'écouteur sur le bouton Ajouter
			const btnAjouterProfil = card.querySelector('#btn-ajouter-profil');
			if (btnAjouterProfil) {
				btnAjouterProfil.addEventListener('click', () => {
					afficherModalAjoutProfil();
				});
			}
		}

		// Affichage du profil connecté à droite
		await afficherCardProfilConnecte('#profil-connecte-col');

	} catch (error) {
		tableCol.innerHTML = `
			<div class="alert alert-danger text-center my-4">
				Erreur lors du chargement des utilisateurs
			</div>
		`;
		profilCol.innerHTML = '';
		console.error(error);
	}
}
