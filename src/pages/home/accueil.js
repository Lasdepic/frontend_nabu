import { createNavbar } from '../../components/navbar.js';
import { selectCorpus, getSelectedCorpus } from '../../components/selectCorpus.js';
import { afficherTableauPaquet } from '../../components/tableauPaquet.js';


export default function accueilPage() {
	let main = document.querySelector('main');
	if (!main) {
		main = document.createElement('main');
		document.body.appendChild(main);
	}
	main.innerHTML = '';

	const centerDiv = document.createElement('div');
	centerDiv.className = 'centered-selects mb-3';

	const selectCorpusDiv = document.createElement('div');
	selectCorpusDiv.className = 'mb-2 small-centered-select';
	selectCorpusDiv.appendChild(selectCorpus());
	centerDiv.appendChild(selectCorpusDiv);


	main.appendChild(centerDiv);

	// Affiche le tableau a gauche de l'écran
	const tableauDiv = document.createElement('div');
	tableauDiv.className = 'mt-4 d-flex justify-content-start';
	tableauDiv.id = 'tableau-paquet-conteneur';
	tableauDiv.style.marginLeft = '10px';
	main.appendChild(tableauDiv);
	afficherTableauPaquet('tableau-paquet-conteneur');
}
