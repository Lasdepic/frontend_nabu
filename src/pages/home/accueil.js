
export default function accueilPage() {
	const main = document.querySelector('main') || createMain();
	main.innerHTML = `<div class="container mt-5"><h1>Bienvenue sur la page d'accueil</h1></div>`;
}

function createMain() {
	const main = document.createElement('main');
	document.body.appendChild(main);
	return main;
}
