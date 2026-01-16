

import { createNavbar } from '../../components/navbar.js';
import { selectCorpus, getSelectedCorpus } from '../../components/selectCorpus.js';
import { searchBarre } from '../../components/searchBarre.js';
import { selectSIP } from '../../components/selectSIP.js';
import { selectStatus } from '../../components/selectStatus.js';
import { tableauPaquet } from '../../components/tableauPaquet.js';
import { sendError } from '../../components/sendError.js';
import { toDo } from '../../components/toDo.js';

export default function accueilPage() {
	let main = document.querySelector('main');
	if (!main) {
		main = document.createElement('main');
		document.body.appendChild(main);
	}
	main.innerHTML = '';
	// Création du bloc centré pour le sélecteur corpus uniquement
	const centerDiv = document.createElement('div');
	centerDiv.className = 'centered-selects mb-3';
	const selectCorpusDiv = document.createElement('div');
	selectCorpusDiv.className = 'mb-2 small-centered-select';
	selectCorpusDiv.appendChild(selectCorpus());
	centerDiv.appendChild(selectCorpusDiv);
	main.appendChild(centerDiv);
}
