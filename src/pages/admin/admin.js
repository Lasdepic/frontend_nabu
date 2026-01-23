

import { afficherCardUtilisateurs } from '../../components/admin/displayAllProfil.js';

export default async function adminPage() {
	const main = document.querySelector('main') || createMain();
	main.innerHTML = `<div class="container mt-5"><h1>Page Admin</h1></div>`;

	// Affiche la liste des utilisateurs sous le titre
	const container = document.createElement('div');
	container.className = 'container';
	main.appendChild(container);
	await afficherCardUtilisateurs('.container:last-child');
}

function createMain() {
	const main = document.createElement('main');
	document.body.appendChild(main);
	return main;
}
