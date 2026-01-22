import { selectCorpus } from '../../components/selecteur/selectCorpus.js';
import { afficherTableauPaquet } from '../../components/tableauPaquet.js';
import { afficherTableauToDoPaquet } from '../../components/toDo.js';
import { afficherSendErrorPaquet } from '../../components/sendError.js';
import API_URL from '../../API/config.js';

export default function accueilPage() {

    // Vérification utilisateur connecté
    fetch(`${API_URL}/backend_nabu/index.php?action=check-auth`, {
        credentials: 'include'
    })
        .then(r => r.json())
        .then(data => {
            if (data?.authenticated && data?.user?.id) {
                localStorage.setItem('userId', data.user.id);
            } else {
                localStorage.removeItem('userId');
            }
        });

    let main = document.querySelector('main');
    if (!main) {
        main = document.createElement('main');
        document.body.appendChild(main);
    }

    main.className = 'bg-light min-vh-100 py-4';
    main.innerHTML = '';

    /* =======================
       CONTAINER PRINCIPAL
    ======================= */
    const container = document.createElement('div');
    container.className = 'container';

    /* =======================
       SELECT CORPUS
    ======================= */
    const selectRow = document.createElement('div');
    selectRow.className = 'row justify-content-center mb-4';

    const selectCol = document.createElement('div');
    selectCol.className = 'col-12 col-md-6 col-lg-4';

    const selectElement = selectCorpus(onCorpusSelect);
    selectCol.appendChild(selectElement);
    selectRow.appendChild(selectCol);
    container.appendChild(selectRow);

    /* =======================
       CONTENU PRINCIPAL
    ======================= */
    const contentRow = document.createElement('div');
    contentRow.className = 'row g-4';

    /* ===== Tableau principal ===== */
    const tableauCol = document.createElement('div');
    tableauCol.className = 'col-12 col-lg-9';

    const tableauCard = document.createElement('div');
    tableauCard.className = 'card shadow-sm h-100';

    const tableauBody = document.createElement('div');
    tableauBody.className = 'card-body';
    tableauBody.id = 'tableau-paquet-conteneur';

    tableauCard.appendChild(tableauBody);
    tableauCol.appendChild(tableauCard);

    /* ===== Colonne droite ===== */
    const sideColWrapper = document.createElement('div');
    sideColWrapper.className = 'col-12 col-lg-3';

    // Colonne sticky
    const sideCol = document.createElement('div');
    sideCol.className = 'side-fixed';

    /* ToDo */
    const todoCard = document.createElement('div');
    todoCard.className = 'card shadow-sm mb-4';

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

    /* Assemblage */
    contentRow.appendChild(tableauCol);
    contentRow.appendChild(sideColWrapper);
    container.appendChild(contentRow);
    main.appendChild(container);

    /* =======================
       RENDUS
    ======================= */
    afficherTableauPaquet('tableau-paquet-conteneur');
    afficherTableauToDoPaquet('to-do-paquet-conteneur');
    afficherSendErrorPaquet('send-error-paquet-conteneur');
    // Expose la fonction ToDo sur window pour le rafraîchissement global
    window.afficherTableauToDoPaquet = afficherTableauToDoPaquet;

    function onCorpusSelect(selectedCorpus) {
        const id = selectedCorpus ? selectedCorpus.id : null;
        afficherTableauPaquet('tableau-paquet-conteneur', id);
        afficherTableauToDoPaquet('to-do-paquet-conteneur', id);
        afficherSendErrorPaquet('send-error-paquet-conteneur', id);
    }
}
