import { fetchAllPaquets } from '../API/paquet.js';

export async function afficherTableauPaquet(conteneurId = 'tableau-paquet-conteneur') {
    let conteneur = document.getElementById(conteneurId);
    if (!conteneur) {
        conteneur = document.createElement('div');
        conteneur.id = conteneurId;
        document.body.appendChild(conteneur);
    }


    if (!document.getElementById('tableau-paquet-bottom-border-style')) {
        const style = document.createElement('style');
        style.id = 'tableau-paquet-bottom-border-style';
        style.innerHTML = `
            #tableau-paquet {
                border-collapse: collapse;
            }
            #tableau-paquet th, #tableau-paquet td {
                border: none;
                border-bottom: 1px solid #343A40;
            }
            #tableau-paquet thead th {
                border-bottom: 2px solid #343A40;
                background-color: #212529;
                color: #fff;
            }
        `;
        document.head.appendChild(style);
    }
    conteneur.innerHTML = `
    <div style="max-width:1200px; margin-left:10px;">
        <div id="tableau-paquet-controls-row" class="row g-2 align-items-center mb-2">
            <div class="col-auto" id="tableau-paquet-length-col"></div>
            <div class="col d-flex justify-content-center align-items-center gap-2" id="tableau-paquet-filter-col"></div>
        </div>
        <table id="tableau-paquet" class="table table-striped table-hover align-middle" style="width:100%;">
            <thead>
                <tr>
                    <th class="text-center" scope="col" style="max-width:150px; width:150px;">Nom de dossier</th>
                    <th class="text-center" scope="col" style="max-width:120px; width:120px;">Cote</th>
                    <th class="text-center" scope="col" style="max-width:150px; width:150px;">Corpus</th>
                    <th class="text-center" scope="col" style="max-width:200px; width:200px;">Commentaire</th>
                    <th class="text-center" scope="col" style="max-width:150px; width:150px;">Déposé en SIP</th>
                    <th class="text-center" scope="col" style="max-width:120px; width:120px;">Envoyé</th>
                    <th class="text-center" scope="col" style="max-width:120px; width:120px;">À faire</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    </div>`;

    // Charge les paquets
    const result = await fetchAllPaquets();
    const paquets = result && result.data ? result.data : result;
    if (!paquets || !Array.isArray(paquets)) {
        conteneur.innerHTML = '<div class="alert alert-danger">Erreur lors du chargement des paquets.</div>';
        return;
    }
    const tbody = conteneur.querySelector('tbody');
    tbody.innerHTML = paquets.map(p => `
        <tr>
            <td class="text-truncate text-center" style="max-width:150px; width:150px;">${p.folderName || ''}</td>
            <td class="text-truncate text-center" style="max-width:120px; width:120px;">${p.cote || ''}</td>
            <td class="text-truncate text-center" style="max-width:150px; width:150px;">${p.corpus || ''}</td>
            <td class="text-truncate text-center" style="max-width:200px; width:200px;">${p.commentaire || ''}</td>
            <td class="text-center" style="max-width:150px; width:150px;">${p.deposeSIP ? '<span class="badge bg-success">Oui</span>' : '<span class="badge bg-secondary">Non</span>'}</td>
            <td class="text-center" style="max-width:120px; width:120px;">
                <input class="form-check-input" type="checkbox" ${p.envoye ? 'checked' : ''} disabled>
            </td>
            <td class="text-center" style="max-width:120px; width:120px;">
                <input class="form-check-input" type="checkbox" ${p.aFaire ? 'checked' : ''} disabled>
            </td>
        </tr>
    `).join('');

    function addPaquet() {
        const lengthCol = document.getElementById('tableau-paquet-length-col');
        const filterCol = document.getElementById('tableau-paquet-filter-col');
        const dataTablesLength = document.querySelector('.dataTables_length');
        const dataTablesFilter = document.querySelector('.dataTables_filter');
        if (lengthCol && dataTablesLength) {
            lengthCol.innerHTML = '';
            lengthCol.appendChild(dataTablesLength);
        }
        if (filterCol && dataTablesFilter) {
            filterCol.innerHTML = '';
            filterCol.appendChild(dataTablesFilter);
            dataTablesFilter.style.width = '100%';
            dataTablesFilter.style.display = 'flex';
            dataTablesFilter.style.justifyContent = 'center';
            if (!document.getElementById('tableau-paquet-search-label-style')) {
                const style = document.createElement('style');
                style.id = 'tableau-paquet-search-label-style';
                style.innerHTML = '#tableau-paquet_filter label { display: flex; align-items: center; gap: 10px; }';
                document.head.appendChild(style);
            }
            if (!document.getElementById('btn-ajouter-paquet')) {
                const btn = document.createElement('button');
                btn.id = 'btn-ajouter-paquet';
                btn.className = 'btn btn-primary ms-2';
                btn.innerHTML = '<i class="bi bi-plus"></i> Ajouter';
                filterCol.appendChild(btn);
            }
        }
    }
    if (!window.jQuery || !window.jQuery.fn.DataTable) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdn.datatables.net/1.13.6/css/jquery.dataTables.min.css';
        document.head.appendChild(link);
        const script = document.createElement('script');
        script.src = 'https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js';
        script.onload = () => {
            $('#tableau-paquet').DataTable({
                lengthMenu: [[25, 50, 75, 100, -1], [25, 50, 75, 100, "Tous"]],
                language: {
                    url: 'https://cdn.datatables.net/plug-ins/1.13.6/i18n/fr-FR.json'
                }
            });
            setTimeout(addPaquet, 100); 
        };
        document.body.appendChild(script);
    } else {
        $('#tableau-paquet').DataTable({
            lengthMenu: [[25, 50, 75, 100, -1], [25, 50, 75, 100, "Tous"]],
            language: {
                url: 'https://cdn.datatables.net/plug-ins/1.13.6/i18n/fr-FR.json'
            }
        });
        setTimeout(addPaquet, 100);
    }
}
