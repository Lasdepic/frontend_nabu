import { fetchAllPaquets } from '../../API/paquet/paquet.js';
import { fetchAllCorpus } from '../../API/paquet/corpus.js';
import { fetchAllStatus } from '../../API/paquet/status.js';
import { afficherCardPaquetModal } from './cardPaquet.js';
import { afficherCardPaquetAddModal } from '../editPaquet/addPaquet.js';
import { createDateFilter } from './filterDate.js';

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

    if (window.$ && window.$.fn && window.$.fn.DataTable) {
        if ($.fn.DataTable.isDataTable('#tableau-paquet')) {
            $('#tableau-paquet').DataTable().destroy();
        }
    }

    if (!document.getElementById('tableau-paquet-style')) {
        const style = document.createElement('style');
        style.id = 'tableau-paquet-style';
        style.innerHTML = `
            #tableau-paquet { border-collapse: collapse; table-layout: fixed; width: 100%; }
            #tableau-paquet th, #tableau-paquet td { border: none; border-bottom: 1px solid #343A40; text-align: center !important; vertical-align: middle !important; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            #tableau-paquet thead th { border-bottom: 2px solid #343A40; background-color: #212529; color: #fff; }
            #tableau-paquet td.folderName { max-width: 150px; }
            #tableau-paquet td.commentaire { max-width: 250px; }
            #tableau-paquet td { line-height: 1.5em; }
            #tableau-paquet td:hover { cursor: default; }
        `;
        document.head.appendChild(style);
    }

    conteneur.innerHTML = `
    <div id="tableau-paquet-scroll-wrap" style="max-width:1200px; margin-left:10px;">
        <div id="tableau-paquet-controls-row" class="row g-2 align-items-center mb-2">
            <div class="col-auto" id="tableau-paquet-length-col"></div>
            <div class="col-auto" id="tableau-paquet-date-filter-col"></div>
            <div class="col d-flex justify-content-center align-items-center gap-2" id="tableau-paquet-filter-col"></div>
        </div>
        <div id="tableau-paquet-scroll">
            <table id="tableau-paquet" class="table table-striped table-hover align-middle" style="width:100%; min-width:700px;">
                <thead>
                    <tr>
                        <th style="background: rgb(33, 37, 41); color: rgb(255, 255, 255); width: 113px; text-align: center; vertical-align: middle;">Nom de dossier</th>
                        <th style="background: rgb(33, 37, 41); color: rgb(255, 255, 255); width: 113px; text-align: center; vertical-align: middle;">Cote</th>
                        <th style="background: rgb(33, 37, 41); color: rgb(255, 255, 255); width: 113px; text-align: center; vertical-align: middle;">Corpus</th>
                        <th style="background: rgb(33, 37, 41); color: rgb(255, 255, 255); width: 113px; text-align: center; vertical-align: middle;">Commentaire</th>
                        <th style="background: rgb(33, 37, 41); color: rgb(255, 255, 255); width: 113px; text-align: center; vertical-align: middle;">Déposé en SIP</th>
                        <th style="background: rgb(33, 37, 41); color: rgb(255, 255, 255); width: 113px; text-align: center; vertical-align: middle;">Status</th>
                        <th style="background: rgb(33, 37, 41); color: rgb(255, 255, 255); width: 113px; text-align: center; vertical-align: middle;">À faire</th>
                        <th class="d-none" style="background: rgb(33, 37, 41); color: rgb(255, 255, 255); width: 113px; text-align: center; vertical-align: middle;">DateTri</th>
                    </tr>
                </thead>
                <tbody></
            </table>
        </div>
    </div>`;

    const dateFilterCol = conteneur.querySelector('#tableau-paquet-date-filter-col');
    let sortOrder = 'desc';
    if (dateFilterCol) {
        const dateFilter = createDateFilter((order) => {
            sortOrder = order;
            $('#tableau-paquet').DataTable().order([7, sortOrder]).draw();
        });
        dateFilterCol.appendChild(dateFilter);
    }

    const scrollDiv = conteneur.querySelector('#tableau-paquet-scroll');
    const mq = window.matchMedia('(max-width: 991.98px)');
    function setTableScroll(e) { scrollDiv.style.overflowX = e.matches ? 'auto' : 'unset'; }
    setTableScroll(mq);
    mq.addEventListener('change', setTableScroll);

    const [corpusResult, paquetsResult, statusResult] = await Promise.all([
        fetchAllCorpus(),
        fetchAllPaquets(),
        fetchAllStatus()
    ]);
    const corpusList = corpusResult?.data || corpusResult;
    const paquets = paquetsResult?.data || paquetsResult;
    if (!paquets || !Array.isArray(paquets) || !corpusList || !Array.isArray(corpusList) || !statusResult || !Array.isArray(statusResult)) {
        conteneur.innerHTML = '<div class="alert alert-danger">Erreur lors du chargement des paquets, corpus ou statuts.</div>';
        return;
    }
    const corpusDict = {};
    corpusList.forEach(c => { corpusDict[c.idcorpus || c.idCorpus] = c.name_corpus || c.nameCorpus; });

    const statusColors = {
        1: 'bg-dark',         // INEXISTANT
        2: 'bg-secondary',    // NON_ENVOYE
        3: 'bg-success',      // ENVOI_OK
        4: 'bg-primary',      // ENVOI_EN_COURS
        5: 'bg-danger',       // ENVOI_EN_ERREUR
    };
    const statusDict = {};
    statusResult.forEach(s => {
        statusDict[s.idstatus || s.idStatus] = {
            name: s.name_status || s.nameStatus,
            color: statusColors[s.idstatus || s.idStatus] || 'bg-secondary'
        };
    });

    await loadDataTablesOnce();

    const filteredPaquets = filterCorpusId
        ? paquets.filter(p => String(p.corpusId) === String(filterCorpusId))
        : paquets;

    const table = $('#tableau-paquet').DataTable({
        data: filteredPaquets.map(p => ({
            ...p,
            lastmodifDateISO: (p.lastmodifDate || p.date) ? new Date(p.lastmodifDate || p.date).toISOString() : ''
        })),
        columns: [
            { data: 'folderName', className: 'folderName', render: v => `<span title="${v || ''}">${v || '-'}</span>` },
            { data: 'cote', render: v => v || '-' },
            { data: 'corpusId', render: v => corpusDict[v] || '-' },
            { data: 'commentaire', className: 'commentaire', render: v => `<span title="${v || ''}">${v || '-'}</span>` },
            { data: 'filedSip', render: v => v ? '<span class="badge bg-primary">Oui</span>' : '<span class="badge bg-secondary">Non</span>' },
            { data: 'statusId', render: (v) => {
                let s = statusDict[v];
                if (!s) s = statusDict[1]; 
                return `<span class="badge ${s.color}">${s.name}</span>`;
            } },
            { data: 'toDo', render: (v, type, row, meta) =>
                `<input type="checkbox" class="form-check-input toDo-checkbox" data-paquet-idx="${meta.row}" ${v ? 'checked' : ''}>`
            },
            { data: 'lastmodifDateISO', visible: false }
        ],
        // scrollX est géré dynamiquement par le conteneur et le JS responsive
        // scrollX: true,
        lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, "Tous"]],
        order: [[7, 'desc']],
        language: {
            url: 'https://cdn.datatables.net/plug-ins/1.13.6/i18n/fr-FR.json',
            info: `<span class='badge bg-info'><span>nombre de paquet : ${filteredPaquets.length}</span></span>`
        }
    });

    let filterMoved = false;
    function addPaquetAndCustomPagination() {
        const lengthCol = document.getElementById('tableau-paquet-length-col');
        const filterCol = document.getElementById('tableau-paquet-filter-col');
        const dataTablesLength = document.querySelector('.dataTables_length');
        const dataTablesFilter = document.querySelector('.dataTables_filter');
        const dataTablesPaginate = document.querySelector('.dataTables_paginate');
        if (lengthCol && dataTablesLength) { lengthCol.innerHTML = ''; lengthCol.appendChild(dataTablesLength); }
        if (filterCol && dataTablesFilter && !filterMoved) {
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
                btn.addEventListener('click', (e) => { e.preventDefault(); afficherCardPaquetAddModal(); });
                filterCol.appendChild(btn);
            }
            filterMoved = true;
        }
        if (dataTablesPaginate) {
            if (table.page.info().pages > 1) {
                dataTablesPaginate.innerHTML = '';
                const pageInputWrap = document.createElement('div');
                pageInputWrap.style.display = 'flex';
                pageInputWrap.style.alignItems = 'center';
                pageInputWrap.style.gap = '0.2em';
                pageInputWrap.style.fontSize = '0.85em';
                const prevBtn = document.createElement('button');
                prevBtn.type = 'button';
                prevBtn.className = 'btn btn-outline-secondary btn-xs';
                prevBtn.style.padding = '2px 6px';
                prevBtn.style.fontSize = '0.85em';
                prevBtn.innerHTML = '&#8592;';
                prevBtn.title = 'Page précédente';
                prevBtn.onclick = () => {
                    let pageNum = table.page();
                    if (pageNum > 0) table.page(pageNum - 1).draw('page');
                };
                const nextBtn = document.createElement('button');
                nextBtn.type = 'button';
                nextBtn.className = 'btn btn-outline-secondary btn-xs';
                nextBtn.style.padding = '2px 6px';
                nextBtn.style.fontSize = '0.85em';
                nextBtn.innerHTML = '&#8594;';
                nextBtn.title = 'Page suivante';
                nextBtn.onclick = () => {
                    let pageNum = table.page();
                    if (pageNum < table.page.info().pages - 1) table.page(pageNum + 1).draw('page');
                };
                const label = document.createElement('label');
                label.textContent = 'Page :';
                label.style.margin = 0;
                label.style.fontSize = '0.85em';
                const pageInput = document.createElement('input');
                pageInput.type = 'number';
                pageInput.min = 1;
                pageInput.value = table.page() + 1;
                pageInput.style.width = '38px';
                pageInput.style.height = '24px';
                pageInput.style.fontSize = '0.85em';
                pageInput.style.padding = '2px 4px';
                pageInput.className = 'form-control';
                pageInput.style.MozAppearance = 'textfield';
                pageInput.style.WebkitAppearance = 'none';
                pageInput.style.appearance = 'none';
                pageInput.addEventListener('change', () => {
                    let pageNum = parseInt(pageInput.value, 10);
                    if (isNaN(pageNum) || pageNum < 1) pageNum = 1;
                    if (pageNum > table.page.info().pages) pageNum = table.page.info().pages;
                    table.page(pageNum - 1).draw('page');
                });
                const totalPagesSpan = document.createElement('span');
                totalPagesSpan.textContent = `/ ${table.page.info().pages}`;
                totalPagesSpan.style.marginLeft = '0.15em';
                totalPagesSpan.style.fontSize = '0.85em';
                pageInputWrap.appendChild(prevBtn);
                pageInputWrap.appendChild(label);
                pageInputWrap.appendChild(pageInput);
                pageInputWrap.appendChild(totalPagesSpan);
                pageInputWrap.appendChild(nextBtn);
                dataTablesPaginate.appendChild(pageInputWrap);
            } else {
                dataTablesPaginate.innerHTML = '';
            }
        }
    }
    setTimeout(addPaquetAndCustomPagination, 100);
    table.on('draw', function() { setTimeout(addPaquetAndCustomPagination, 0); });

    $('#tableau-paquet tbody').on('click', 'tr', function(e) {
        if (e.target.classList.contains('toDo-checkbox')) return;
        const data = table.row(this).data();
        afficherCardPaquetModal(data);
    });
    $('#tableau-paquet tbody').on('change', '.toDo-checkbox', async function() {
        const idx = $(this).data('paquet-idx');
        const paquet = table.row(idx).data();
        paquet.toDo = this.checked;
        try {
            const { editPaquet } = await import('../../API/paquet/paquet.js');
            await editPaquet({ ...paquet, toDo: this.checked });
            if (window.afficherTableauToDoPaquet) {
                window.afficherTableauToDoPaquet('to-do-paquet-conteneur');
            }
        } catch (err) {
            alert('Erreur lors de la modification du toDo');
        }
    });
}

window.afficherTableauPaquet = afficherTableauPaquet;
