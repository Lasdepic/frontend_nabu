

import { afficherCardUtilisateurs } from '../../components/admin/displayAllProfil.js';

export default async function adminPage() {
	const main = document.querySelector('main') || createMain();

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
