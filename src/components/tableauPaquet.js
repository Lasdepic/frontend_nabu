import { fetchAllPaquets } from '../API/paquet.js';
import { fetchAllCorpus } from '../API/corpus.js';
import { afficherCardPaquetModal } from './cardPaquet.js';
import { afficherCardPaquetAddModal } from './editPaquet/addPaquet.js';
import { createDateFilter } from './filterDate.js';

// Promesse globale pour charger DataTables une seule fois
let dataTablesLoader = null;

function loadDataTablesOnce() {
    if (window.jQuery && window.jQuery.fn && window.jQuery.fn.DataTable) {
        return Promise.resolve();
    }
    if (!dataTablesLoader) {
        dataTablesLoader = new Promise((resolve) => {
            if (!document.querySelector('link[href*="jquery.dataTables.min.css"]')) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = 'https://cdn.datatables.net/1.13.6/css/jquery.dataTables.min.css';
                document.head.appendChild(link);
            }
            const script = document.createElement('script');
            script.src = 'https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js';
            script.onload = () => resolve();
            document.body.appendChild(script);
        });
    }
    return dataTablesLoader;
}

export async function afficherTableauPaquet(conteneurId = 'tableau-paquet-conteneur', filterCorpusId = null) {
    let conteneur = document.getElementById(conteneurId);
    if (!conteneur) {
        conteneur = document.createElement('div');
        conteneur.id = conteneurId;
        document.body.appendChild(conteneur);
    }

    // Détruit l'instance DataTable précédente si elle existe
    if (window.$ && window.$.fn && window.$.fn.DataTable) {
        const oldTable = window.$('#tableau-paquet');
        if (oldTable.length && oldTable.hasClass('dataTable')) {
            oldTable.DataTable().destroy();
        }
    }

    // Style pour le tableau
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
                text-align: center !important;
                vertical-align: middle !important;
            }
            #tableau-paquet thead th {
                border-bottom: 2px solid #343A40;
                background-color: #212529;
                color: #fff;
            }
        `;
        document.head.appendChild(style);
    }

    // HTML du tableau
    conteneur.innerHTML = `
    <div id="tableau-paquet-scroll-wrap" style="max-width:1200px; margin-left:10px;">
        <div id="tableau-paquet-controls-row" class="row g-2 align-items-center mb-2">
            <div class="col-auto" id="tableau-paquet-length-col"></div>
            <div class="col-auto" id="tableau-paquet-date-filter-col"></div>
            <div class="col d-flex justify-content-center align-items-center gap-2" id="tableau-paquet-filter-col"></div>
        </div>
        <div id="tableau-paquet-scroll" style="overflow-x:auto;">
            <table id="tableau-paquet" class="table table-striped table-hover align-middle" style="width:100%; min-width:700px;">
                <thead>
                    <tr>
                        <th>Nom de dossier</th>
                        <th>Cote</th>
                        <th>Corpus</th>
                        <th>Commentaire</th>
                        <th>Déposé en SIP</th>
                        <th>Envoyé</th>
                        <th>À faire</th>
                        <th class="d-none">DateTri</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
    </div>`;

    // Chargement du filtre par date
    const dateFilterCol = conteneur.querySelector('#tableau-paquet-date-filter-col');
    let sortOrder = 'desc';
    if (dateFilterCol) {
        const dateFilter = createDateFilter((order) => {
            sortOrder = order;
            $('#tableau-paquet').DataTable().order([7, sortOrder]).draw();
        });
        dateFilterCol.appendChild(dateFilter);
    }

    // Scroll responsive
    const scrollDiv = conteneur.querySelector('#tableau-paquet-scroll');
    const mq = window.matchMedia('(max-width: 991.98px)');
    function setTableScroll(e) {
        scrollDiv.style.overflowX = e.matches ? 'auto' : 'unset';
    }
    setTableScroll(mq);
    mq.addEventListener('change', setTableScroll);

    // Charger paquets et corpus
    const [corpusResult, paquetsResult] = await Promise.all([fetchAllCorpus(), fetchAllPaquets()]);
    const corpusList = corpusResult?.data || corpusResult;
    const paquets = paquetsResult?.data || paquetsResult;

    if (!paquets || !Array.isArray(paquets) || !corpusList || !Array.isArray(corpusList)) {
        conteneur.innerHTML = '<div class="alert alert-danger">Erreur lors du chargement des paquets ou des corpus.</div>';
        return;
    }

    const corpusDict = {};
    corpusList.forEach(c => {
        corpusDict[c.idcorpus || c.idCorpus] = c.name_corpus || c.nameCorpus;
    });

    // Attendre DataTables
    await loadDataTablesOnce();

    // Initialiser DataTables directement avec les données filtrées
    const filteredPaquets = filterCorpusId
        ? paquets.filter(p => String(p.corpusId) === String(filterCorpusId))
        : paquets;

    const table = $('#tableau-paquet').DataTable({
        data: filteredPaquets.map(p => ({
            ...p,
            lastmodifDateISO: (p.lastmodifDate || p.date) ? new Date(p.lastmodifDate || p.date).toISOString() : ''
        })),
        columns: [
            { data: 'folderName', render: v => v || '-' },
            { data: 'cote', render: v => v || '-' },
            { data: 'corpusId', render: v => corpusDict[v] || '-' },
            { data: 'commentaire', render: v => v || '-' },
            { data: 'filedSip', render: v => v ? '<span class="badge bg-success">Oui</span>' : '<span class="badge bg-secondary">Non</span>' },
            { data: 'envoye', render: v => `<input type="checkbox" class="form-check-input" ${v ? 'checked' : ''} disabled>` },
            { data: 'toDo', render: (v, type, row, meta) =>
                `<input type="checkbox" class="form-check-input toDo-checkbox" data-paquet-idx="${meta.row}" ${v ? 'checked' : ''}>`
            },
            { data: 'lastmodifDateISO', visible: false } // Colonne cachée pour tri
        ],
        lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, "Tous"]],
        order: [[7, 'desc']],
        language: { url: 'https://cdn.datatables.net/plug-ins/1.13.6/i18n/fr-FR.json' }
    });

    // Déplacer les contrôles DataTables
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
            if (!document.getElementById('btn-ajouter-paquet')) {
                const btn = document.createElement('button');
                btn.id = 'btn-ajouter-paquet';
                btn.className = 'btn btn-primary ms-2';
                btn.innerHTML = '<i class="bi bi-plus"></i> Ajouter';
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    afficherCardPaquetAddModal();
                });
                filterCol.appendChild(btn);
            }
        }
    }
    setTimeout(addPaquet, 100);

    // Gestion click ligne pour modal
    $('#tableau-paquet tbody').on('click', 'tr', function(e) {
        if (e.target.classList.contains('toDo-checkbox')) return;
        const data = table.row(this).data();
        afficherCardPaquetModal(data);
    });

    // Gestion checkbox ToDo
    $('#tableau-paquet tbody').on('change', '.toDo-checkbox', async function() {
        const idx = $(this).data('paquet-idx');
        const paquet = table.row(idx).data();
        paquet.toDo = this.checked;
        try {
            const { editPaquet } = await import('../API/paquet.js');
            await editPaquet({ ...paquet, toDo: this.checked });
            if (window.afficherTableauToDoPaquet) {
                window.afficherTableauToDoPaquet('to-do-paquet-conteneur');
            }
        } catch (err) {
            alert('Erreur lors de la modification du toDo');
        }
    });
}
