import { selectCorpus } from '../../components/selecteur/selectCorpus.js';
import { afficherTableauPaquet } from '../../components/home/tableauPaquet.js';
import { afficherTableauToDoPaquet } from '../../components/home/toDo.js';
import { afficherSendErrorPaquet } from '../../components/home/sendError.js';
import { storeConnectedUser } from '../../API/auth/auth.js';

export default function accueilPage() {

    /* =======================
       AUTH CHECK
    ======================= */
    storeConnectedUser();

    /* =======================
       MAIN
    ======================= */
    let main = document.querySelector('main');
    if (!main) {
        main = document.createElement('main');
        document.body.appendChild(main);
    }

    main.className = 'bg-white py-4';
    main.innerHTML = '';

    const container = document.createElement('div');
    container.className = 'container';

    /* =======================
       SELECT CORPUS
    ======================= */
    const selectRow = document.createElement('div');
    selectRow.className = 'row justify-content-center mb-4';

    const selectCol = document.createElement('div');
    selectCol.className = 'col-12 col-md-6 col-lg-4';

    selectCol.appendChild(selectCorpus(onCorpusSelect));
    selectRow.appendChild(selectCol);
    container.appendChild(selectRow);

    /* =======================
       CONTENT
    ======================= */
    const contentRow = document.createElement('div');
    contentRow.className = 'row g-4';

    /* ===== TABLEAU ===== */
    const tableauCol = document.createElement('div');
    tableauCol.className = 'col-12 col-lg-9 order-1';

    const tableauCard = document.createElement('div');
    tableauCard.className = 'card shadow-sm h-100';

    const tableauBody = document.createElement('div');
    tableauBody.className = 'card-body table-responsive';
    tableauBody.id = 'tableau-paquet-conteneur';

    tableauCard.appendChild(tableauBody);
    tableauCol.appendChild(tableauCard);

    /* ===== SIDEBAR ===== */
    const sideColWrapper = document.createElement('div');
    sideColWrapper.className = 'col-12 col-lg-3 order-2';

    const sideCol = document.createElement('div');
    sideCol.className = 'd-flex flex-column gap-4 sticky-lg';

    /* ToDo */
    const todoCard = document.createElement('div');
    todoCard.className = 'card shadow-sm';

    const todoBody = document.createElement('div');
    todoBody.className = 'card-body';
    todoBody.id = 'to-do-paquet-conteneur';

    todoCard.appendChild(todoBody);

    /* Send Error */
    const errorCard = document.createElement('div');
    errorCard.className = 'card shadow-sm';

    const errorBody = document.createElement('div');
    errorBody.className = 'card-body';
    errorBody.id = 'send-error-paquet-conteneur';

    errorCard.appendChild(errorBody);

    sideCol.appendChild(todoCard);
    sideCol.appendChild(errorCard);
    sideColWrapper.appendChild(sideCol);

    /* ASSEMBLAGE */
    contentRow.appendChild(tableauCol);
    contentRow.appendChild(sideColWrapper);
    container.appendChild(contentRow);
    main.appendChild(container);

    /* =======================
       RENDER
    ======================= */
    window.afficherTableauToDoPaquet = afficherTableauToDoPaquet;
    window.afficherSendErrorPaquet = afficherSendErrorPaquet;

    function onCorpusSelect(selectedCorpus) {
        const id = selectedCorpus ? selectedCorpus.id : null;

        document.getElementById('tableau-paquet-conteneur').innerHTML = '';

        afficherTableauPaquet('tableau-paquet-conteneur', id);
        afficherTableauToDoPaquet('to-do-paquet-conteneur', id);
        afficherSendErrorPaquet('send-error-paquet-conteneur', id);
    }

    onCorpusSelect(null);
}
