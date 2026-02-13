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

      main.className = 'bg-body py-3 py-lg-4';
    main.innerHTML = '';

    const container = document.createElement('div');
      container.className = 'container-xxl';

    /* =======================
       SELECT CORPUS
    ======================= */
   const selectRow = document.createElement('div');
   selectRow.className = 'row justify-content-center mb-3 mb-lg-4';

    const selectCol = document.createElement('div');
   selectCol.className = 'col-12 col-md-7 col-lg-5';

   const selectCard = document.createElement('div');
   selectCard.className = 'card shadow-sm';

   const selectCardBody = document.createElement('div');
   selectCardBody.className = 'card-body';
   selectCardBody.innerHTML = `
      <div class="fw-semibold mb-2 text-center">Corpus</div>
   `;

   selectCardBody.appendChild(selectCorpus(onCorpusSelect));
   selectCard.appendChild(selectCardBody);
   selectCol.appendChild(selectCard);
    selectRow.appendChild(selectCol);
    container.appendChild(selectRow);

    /* =======================
       CONTENT
    ======================= */
    const contentRow = document.createElement('div');
   contentRow.className = 'row g-3 g-lg-4 align-items-start';

    /* ===== TABLEAU ===== */
    const tableauCol = document.createElement('div');
    tableauCol.className = 'col-12 col-lg-9 order-1';

    const tableauCard = document.createElement('div');
    tableauCard.className = 'card shadow-sm h-100';

   const tableauHeader = document.createElement('div');
   tableauHeader.className = 'card-header bg-body-tertiary d-flex justify-content-between align-items-center';
   tableauHeader.innerHTML = `
      <span class="fw-semibold">Paquets</span>
      <span class="badge text-bg-light" data-count-for="tableau-paquet-conteneur" aria-label="Nombre de paquets">…</span>
   `;

   const tableauBody = document.createElement('div');
   tableauBody.className = 'card-body p-2 p-md-3 table-responsive';
    tableauBody.id = 'tableau-paquet-conteneur';

   tableauCard.appendChild(tableauHeader);
    tableauCard.appendChild(tableauBody);
    tableauCol.appendChild(tableauCard);

    /* ===== SIDEBAR ===== */
    const sideColWrapper = document.createElement('div');
    sideColWrapper.className = 'col-12 col-lg-3 order-2';

    const sideCol = document.createElement('div');
   sideCol.className = 'row g-3 g-lg-4 sticky-lg';

    /* ToDo */
    const todoCard = document.createElement('div');
    todoCard.className = 'card shadow-sm';

   const todoHeader = document.createElement('div');
   todoHeader.className = 'card-header bg-body-tertiary d-flex justify-content-between align-items-center';
   todoHeader.innerHTML = `
      <span class="fw-semibold">À faire</span>
      <span class="badge text-bg-light" data-count-for="to-do-paquet-conteneur" aria-label="Nombre de paquets">…</span>
   `;

    const todoBody = document.createElement('div');
    todoBody.className = 'card-body';
   todoBody.id = 'to-do-paquet-conteneur';

   todoCard.appendChild(todoHeader);
   todoCard.appendChild(todoBody);

    /* Send Error */
    const errorCard = document.createElement('div');
    errorCard.className = 'card shadow-sm';

   const errorHeader = document.createElement('div');
   errorHeader.className = 'card-header bg-body-tertiary d-flex justify-content-between align-items-center';
   errorHeader.innerHTML = `
      <span class="fw-semibold">Envoi en erreur</span>
      <span class="badge text-bg-light" data-count-for="send-error-paquet-conteneur" aria-label="Nombre de paquets">…</span>
   `;

    const errorBody = document.createElement('div');
    errorBody.className = 'card-body';
    errorBody.id = 'send-error-paquet-conteneur';

   errorCard.appendChild(errorHeader);
   errorCard.appendChild(errorBody);

   const todoCol = document.createElement('div');
   todoCol.className = 'col-12 col-md-6 col-lg-12';
   todoCol.appendChild(todoCard);

   const errorCol = document.createElement('div');
   errorCol.className = 'col-12 col-md-6 col-lg-12';
   errorCol.appendChild(errorCard);

   sideCol.appendChild(todoCol);
   sideCol.appendChild(errorCol);
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
      let id = null;
      if (selectedCorpus && typeof selectedCorpus === 'object' && selectedCorpus.id !== undefined && selectedCorpus.id !== null && selectedCorpus.id !== '') {
         id = selectedCorpus.id;
      }

        document.getElementById('tableau-paquet-conteneur').innerHTML = '';

        afficherTableauPaquet('tableau-paquet-conteneur', id);
      // Les mini-tableaux ne doivent pas être filtrés par corpus.
      afficherTableauToDoPaquet('to-do-paquet-conteneur');
      afficherSendErrorPaquet('send-error-paquet-conteneur');
    }

    onCorpusSelect(null);
}
