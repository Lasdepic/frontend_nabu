
export default function adminPage() {
	const main = document.querySelector('main') || createMain();
	main.innerHTML = `<div class="container mt-5"><h1>Page Admin</h1></div>`;
}

function createMain() {
	const main = document.createElement('main');
	document.body.appendChild(main);
	return main;
}
