

import { fetchAllPaquets } from '../API/paquet.js';

export async function tableauPaquet(corpusId = null) {
	const paquetData = await fetchAllPaquets();
	let paquets = [];
	if (paquetData && paquetData.success && Array.isArray(paquetData.data)) {
		paquets = paquetData.data;
	}
	// Filtrage par corpusId si précisé
	if (corpusId) {
		paquets = paquets.filter(p => String(p.corpusId) === String(corpusId));
	}

	let rows = '';
	if (paquets.length === 0) {
		rows = `<tr><td colspan='7' class='bg-warning text-dark'>Aucun paquet trouvé</td></tr>`;
	} else {
		rows = paquets.map((p, idx) => `
			<tr class="bg-success bg-opacity-50 align-middle" style="border-bottom: 2px solid #fff;">
				<td class="fw-bold" style="width: 12ch; max-width: 120px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.folderName || ''}</td>
				<td style="width: 10ch; max-width: 90px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.cote || ''}</td>
				<td style="width: 13ch; max-width: 110px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.searchArchiving || ''}</td>
				<td style="width: 18ch; max-width: 160px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.commentaire || ''}</td>
				<td style="width: 8ch; max-width: 60px; text-align:center;">${p.filedSip ? 'Ok' : ''}</td>
				<td style="width: 8ch; max-width: 60px; text-align:center;">${p.facileTest ? 'Ok' : ''}</td>
				<td class="text-center" style="width: 6ch; max-width: 40px;">
					<input type="checkbox" class="form-check-input" ${p.toDo ? 'checked' : ''} disabled style="transform:scale(1.3);cursor:not-allowed;" />
				</td>
			</tr>
		`).join('');
	}

	return `
	<div class="d-flex justify-content-between align-items-center mb-2">
		<div>
			<label for="nbElement" class="form-label me-2 mb-0">Nombre d'élément :</label>
			<select id="nbElement" class="form-select d-inline-block w-auto" disabled>
				<option selected>10</option>
			</select>
			<span class="ms-2">/250</span>
		</div>
		<button class="btn btn-primary">Ajouter</button>
	</div>
	<div class="table-responsive">
	<table class="table table-bordered mb-0" style="table-layout:fixed; width:100%;">
		<thead class="table-dark align-middle">
			<tr>
				<th class="text-nowrap" style="width: 12ch; max-width: 120px;">Nom Dossier <span style="font-size:0.8em;">&#8597;</span></th>
				<th class="text-nowrap" style="width: 10ch; max-width: 90px;">Cote <span style="font-size:0.8em;">&#8597;</span></th>
				<th class="text-nowrap" style="width: 13ch; max-width: 110px;">Corpus <span style="font-size:0.8em;">&#8597;</span></th>
				<th style="width: 18ch; max-width: 160px;">Commentaire</th>
				<th class="text-center" style="width: 8ch; max-width: 60px;">Déposé dans SIP en attente prod num</th>
				<th class="text-center" style="width: 8ch; max-width: 60px;">Envoyé</th>
				<th class="text-center" style="width: 6ch; max-width: 40px;">A faire</th>
			</tr>
		</thead>
		<tbody>${rows}</tbody>
	</table>
	</div>
	<div class="d-flex justify-content-center align-items-center mt-2">
		<nav>
			<ul class="pagination pagination-sm mb-0">
				<li class="page-item disabled"><a class="page-link">&lt; Précédent</a></li>
				<li class="page-item active"><a class="page-link">1</a></li>
				<li class="page-item"><a class="page-link">/25</a></li>
				<li class="page-item"><a class="page-link">Suivant &gt;</a></li>
			</ul>
		</nav>
	</div>
	`;
}
