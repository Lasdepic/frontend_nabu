import { fetchAllPaquets } from '../../API/paquet/paquet.js';
import { fetchAllCorpus } from '../../API/paquet/corpus.js';
import { fetchAllStatus } from '../../API/paquet/status.js';
import { afficherCardPaquetModal } from './cardPaquet.js';
import { afficherCardPaquetAddModal } from '../editPaquet/addPaquet.js';
import { createDateFilter } from './filterDate.js';
import { renderStatusBadge } from '../status/badgeStatus.js';

let dataTablesLoader = null;
let editPaquetLoader = null;

function escapeHtml(value) {
    const str = value === null || value === undefined ? '' : String(value);
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function safeTitleAttr(value) {
    return escapeHtml(value);
}

function ensureJQueryAvailable() {
    if (!window.jQuery && !window.$) {
        throw new Error('jQuery n\'est pas chargé. DataTables nécessite jQuery.');
    }
    if (!window.jQuery && window.$) {
        window.jQuery = window.$;
    }
}

function getEditPaquetOnce() {
    if (!editPaquetLoader) {
        editPaquetLoader = import('../../API/paquet/paquet.js');
    }
    return editPaquetLoader;
}

function loadDataTablesOnce() {
    if (window.jQuery && window.jQuery.fn && window.jQuery.fn.DataTable) {
        return Promise.resolve();
    }
    if (!dataTablesLoader) {
        dataTablesLoader = new Promise((resolve, reject) => {
            try {
                ensureJQueryAvailable();
            } catch (err) {
                reject(err);
                return;
            }

            if (!document.querySelector('link[href*="jquery.dataTables.min.css"]')) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = 'https://cdn.datatables.net/1.13.6/css/jquery.dataTables.min.css';
                document.head.appendChild(link);
            }
            const script = document.createElement('script');
            script.src = 'https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Impossible de charger DataTables depuis le CDN.'));
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
            #tableau-paquet { border-collapse: separate; border-spacing: 0; table-layout: fixed; width: 100%; }
            #tableau-paquet th, #tableau-paquet td { border: none; border-bottom: 1px solid #343A40; text-align: center !important; vertical-align: middle !important; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            #tableau-paquet thead th { border-bottom: 2px solid #343A40; background-color: #212529; color: #fff; }
            #tableau-paquet td.folderName { max-width: 150px; }
            #tableau-paquet td.commentaire { max-width: 250px; }
            #tableau-paquet td { line-height: 1.5em; }
            #tableau-paquet tbody tr { cursor: pointer; }
            #tableau-paquet tbody tr:hover { background-color: #f5f5f5; }
            #tableau-paquet td .toDo-checkbox { cursor: pointer; }

            @media (min-width: 992px) {
                #tableau-paquet thead th {
                    position: sticky;
                    top: 0;
                    z-index: 5;
                }
            }
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
                        <th style="background: rgb(33, 37, 41); color: rgb(255, 255, 255); width: 113px; text-align: center; vertical-align: middle;">Dossier</th>
                        <th style="background: rgb(33, 37, 41); color: rgb(255, 255, 255); width: 113px; text-align: center; vertical-align: middle;">Cote</th>
                        <th style="background: rgb(33, 37, 41); color: rgb(255, 255, 255); width: 113px; text-align: center; vertical-align: middle;">Corpus</th>
                        <th style="background: rgb(33, 37, 41); color: rgb(255, 255, 255); width: 113px; text-align: center; vertical-align: middle;">Commentaire</th>
                        <th style="background: rgb(33, 37, 41); color: rgb(255, 255, 255); width: 113px; text-align: center; vertical-align: middle;">SIP</th>
                        <th style="background: rgb(33, 37, 41); color: rgb(255, 255, 255); width: 113px; text-align: center; vertical-align: middle;">Statut</th>
                        <th style="background: rgb(33, 37, 41); color: rgb(255, 255, 255); width: 113px; text-align: center; vertical-align: middle;">À faire</th>
                        <th class="d-none" style="background: rgb(33, 37, 41); color: rgb(255, 255, 255); width: 113px; text-align: center; vertical-align: middle;">DateTri</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
    </div>`;

    const dateFilterCol = conteneur.querySelector('#tableau-paquet-date-filter-col');
    let sortOrder = 'desc';
    if (dateFilterCol) {
        const dateFilter = createDateFilter((order) => {
            sortOrder = order;
            if (window.$ && window.$.fn && window.$.fn.DataTable && $.fn.DataTable.isDataTable('#tableau-paquet')) {
                $('#tableau-paquet').DataTable().order([7, sortOrder]).draw();
            }
        });
        dateFilterCol.appendChild(dateFilter);
    }

    const scrollDiv = conteneur.querySelector('#tableau-paquet-scroll');
    const mq = window.matchMedia('(max-width: 991.98px)');
    function setTableScroll(e) { scrollDiv.style.overflowX = e.matches ? 'auto' : 'unset'; }
    setTableScroll(mq);
    mq.onchange = setTableScroll;

    let corpusResult;
    let paquetsResult;
    let statusResult;
    try {
        [corpusResult, paquetsResult, statusResult] = await Promise.all([
            fetchAllCorpus(),
            fetchAllPaquets(),
            fetchAllStatus()
        ]);
    } catch (err) {
        conteneur.innerHTML = '<div class="alert alert-danger">Erreur lors du chargement des données.</div>';
        return;
    }
    const corpusList = corpusResult?.data || corpusResult;
    const paquets = paquetsResult?.data || paquetsResult;
    const statusList = statusResult?.data || statusResult;
    if (!paquets || !Array.isArray(paquets) || !corpusList || !Array.isArray(corpusList) || !statusList || !Array.isArray(statusList)) {
        conteneur.innerHTML = '<div class="alert alert-danger">Erreur lors du chargement des paquets, corpus ou statuts.</div>';
        return;
    }
    const corpusDict = {};
    corpusList.forEach(c => { corpusDict[c.idcorpus || c.idCorpus] = c.name_corpus || c.nameCorpus; });

    const statusById = new Map();
    statusList.forEach(s => {
        const id = s?.idstatus ?? s?.idStatus ?? s?.id;
        if (id !== null && id !== undefined && id !== '') {
            statusById.set(String(id), s);
        }
    });

    try {
        await loadDataTablesOnce();
    } catch (err) {
        conteneur.innerHTML = '<div class="alert alert-danger">Erreur lors du chargement du composant de tableau.</div>';
        return;
    }

    const filteredPaquets = filterCorpusId
        ? paquets.filter(p => String(p.corpusId) === String(filterCorpusId))
        : paquets;

    const table = $('#tableau-paquet').DataTable({
        data: filteredPaquets.map(p => ({
            ...p,
            lastmodifDateISO: (p.lastmodifDate || p.date) ? new Date(p.lastmodifDate || p.date).toISOString() : ''
        })),
        columns: [
            { data: 'folderName', className: 'folderName', render: v => {
                const safe = escapeHtml(v || '-');
                const title = safeTitleAttr(v || '');
                return `<span title="${title}">${safe}</span>`;
            } },
            { data: 'cote', render: v => v || '-' },
            { data: 'corpusId', render: v => corpusDict[v] || '-' },
            { data: 'commentaire', className: 'commentaire', render: v => {
                const safe = escapeHtml(v || '-');
                const title = safeTitleAttr(v || '');
                return `<span title="${title}">${safe}</span>`;
            } },
            { data: 'filedSip', render: v => v ? '<span class="badge bg-primary">Oui</span>' : '<span class="badge bg-secondary">Non</span>' },
            { data: 'statusId', render: (v) => {
                const status = statusById.get(String(v)) ?? statusById.get('1') ?? null;
                return renderStatusBadge(status);
            } },
            { data: 'toDo', render: (v) =>
                `<input type="checkbox" class="form-check-input toDo-checkbox" ${v ? 'checked' : ''}>`
            },
            { data: 'lastmodifDateISO', visible: false }
        ],

        deferRender: true,

        lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, "Tous"]],
        order: [[7, 'desc']],
        language: {
            url: 'https://cdn.datatables.net/plug-ins/1.13.6/i18n/fr-FR.json',
            info: `<span class='badge bg-info'><span>nombre de paquet : <span id='nb-paquet-affiche'>${filteredPaquets.length}</span></span></span>`
        }
    });

    table.on('draw.dt', function() {
        const info = table.page.info();
        const nbTotal = info.recordsDisplay;
        const span = document.getElementById('nb-paquet-affiche');
        if (span) {
            span.textContent = nbTotal;
        }
    });

    let filterMoved = false;
    function addPaquetAndCustomPagination() {
        const lengthCol = conteneur.querySelector('#tableau-paquet-length-col');
        const filterCol = conteneur.querySelector('#tableau-paquet-filter-col');
        const dataTablesLength = conteneur.querySelector('.dataTables_length');
        const dataTablesFilter = conteneur.querySelector('.dataTables_filter');
        const dataTablesPaginate = conteneur.querySelector('.dataTables_paginate');
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
            const info = table.page.info();
            if (info.pages > 1) {
                dataTablesPaginate.innerHTML = '';

                const wrap = document.createElement('div');
                wrap.className = 'd-flex justify-content-end align-items-center gap-2 flex-wrap';

                const prevBtn = document.createElement('button');
                prevBtn.type = 'button';
                prevBtn.className = 'btn btn-outline-secondary btn-sm';
                prevBtn.innerHTML = 'Préc.';
                prevBtn.title = 'Page précédente';
                prevBtn.disabled = info.page <= 0;
                prevBtn.addEventListener('click', () => {
                    const pageNum = table.page();
                    if (pageNum > 0) table.page(pageNum - 1).draw('page');
                });

                const nextBtn = document.createElement('button');
                nextBtn.type = 'button';
                nextBtn.className = 'btn btn-outline-secondary btn-sm';
                nextBtn.innerHTML = 'Suiv.';
                nextBtn.title = 'Page suivante';
                nextBtn.disabled = info.page >= info.pages - 1;
                nextBtn.addEventListener('click', () => {
                    const pageNum = table.page();
                    if (pageNum < table.page.info().pages - 1) table.page(pageNum + 1).draw('page');
                });

                const inputGroup = document.createElement('div');
                inputGroup.className = 'input-group input-group-sm';
                inputGroup.style.width = '180px';

                const labelSpan = document.createElement('span');
                labelSpan.className = 'input-group-text';
                labelSpan.textContent = 'Page';

                const pageInput = document.createElement('input');
                pageInput.type = 'number';
                pageInput.className = 'form-control';
                pageInput.min = 1;
                pageInput.max = info.pages;
                pageInput.value = info.page + 1;
                pageInput.setAttribute('aria-label', 'Numéro de page');

                const totalSpan = document.createElement('span');
                totalSpan.className = 'input-group-text';
                totalSpan.textContent = `/ ${info.pages}`;

                const goToPage = () => {
                    let pageNum = parseInt(pageInput.value, 10);
                    if (isNaN(pageNum) || pageNum < 1) pageNum = 1;
                    if (pageNum > table.page.info().pages) pageNum = table.page.info().pages;
                    table.page(pageNum - 1).draw('page');
                };
                pageInput.addEventListener('change', goToPage);
                pageInput.addEventListener('keydown', (evt) => {
                    if (evt.key === 'Enter') {
                        evt.preventDefault();
                        goToPage();
                    }
                });

                inputGroup.appendChild(labelSpan);
                inputGroup.appendChild(pageInput);
                inputGroup.appendChild(totalSpan);

                wrap.appendChild(prevBtn);
                wrap.appendChild(inputGroup);
                wrap.appendChild(nextBtn);
                dataTablesPaginate.appendChild(wrap);
            } else {
                dataTablesPaginate.innerHTML = '';
            }
        }
    }
    setTimeout(addPaquetAndCustomPagination, 100);
    table.on('draw.dt', function() { setTimeout(addPaquetAndCustomPagination, 0); });

    $('#tableau-paquet tbody').on('click', 'tr', function(e) {
        if (e.target.classList && e.target.classList.contains('toDo-checkbox')) return;
        const data = table.row(this).data();
        afficherCardPaquetModal(data);
    });
    $('#tableau-paquet tbody').on('change', '.toDo-checkbox', async function() {
        const rowEl = $(this).closest('tr');
        const paquet = table.row(rowEl).data();
        if (!paquet) return;
        paquet.toDo = this.checked;
        try {
            const { editPaquet } = await getEditPaquetOnce();
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
