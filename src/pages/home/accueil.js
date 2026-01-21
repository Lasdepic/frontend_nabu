

import { selectCorpus } from '../../components/selecteur/selectCorpus.js';
import { afficherTableauPaquet } from '../../components/tableauPaquet.js';
import { afficherTableauToDoPaquet } from '../../components/toDo.js';
import { afficherSendErrorPaquet } from '../../components/sendError.js';


export default function accueilPage() {
       // Récupère l'id utilisateur connecté et le stocke dans le localStorage
       fetch('http://localhost/stage/backend_nabu/index.php?action=check-auth', { credentials: 'include' })
              .then(r => r.json())
              .then(data => {
                     if (data && data.authenticated && data.user && data.user.id) {
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
       main.style.backgroundColor = '#EEEEEE';
       main.style.minHeight = '100vh';
       main.innerHTML = '';

       const centerDiv = document.createElement('div');
       centerDiv.className = 'container my-4 d-flex justify-content-center';
       // Ajoute le selectCorpus avec callback pour filtrer
       const selectElement = selectCorpus(onCorpusSelect);
       centerDiv.appendChild(selectElement);
       main.appendChild(centerDiv);



       // Conteneur responsive
       const rowDiv = document.createElement('div');
       rowDiv.className = 'row';

       // Tableau principal 
       const tableauDiv = document.createElement('div');
       tableauDiv.className = 'col-12 col-lg-8 mt-4';
       tableauDiv.id = 'tableau-paquet-conteneur';
       rowDiv.appendChild(tableauDiv);


       // Colonne droite pour ToDo et SendError
       const rightColDiv = document.createElement('div');
       rightColDiv.className = 'col-12 col-lg-4 mt-4 d-flex flex-column align-items-end';
       rightColDiv.style.maxWidth = '340px';
       rightColDiv.style.marginLeft = 'auto';
       rightColDiv.style.marginRight = '80px';
       rightColDiv.style.padding = '0';
       rightColDiv.style.background = 'none';
       rightColDiv.style.border = 'none';

       // ToDo conteneur
       const toDoDiv = document.createElement('div');
       toDoDiv.id = 'to-do-paquet-conteneur';
       toDoDiv.style.background = '#f8f9fa';
       toDoDiv.style.borderRadius = '10px';
       toDoDiv.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)';
       toDoDiv.style.padding = '18px 10px 10px 10px';
       toDoDiv.style.width = '100%';
       toDoDiv.style.marginBottom = '18px';
       toDoDiv.style.height = 'fit-content';
       rightColDiv.appendChild(toDoDiv);

       // SendError conteneur
       const sendErrorDiv = document.createElement('div');
       sendErrorDiv.id = 'send-error-paquet-conteneur';
       sendErrorDiv.style.background = '#f8f9fa';
       sendErrorDiv.style.borderRadius = '10px';
       sendErrorDiv.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)';
       sendErrorDiv.style.padding = '18px 10px 10px 10px';
       sendErrorDiv.style.width = '100%';
       sendErrorDiv.style.height = 'fit-content';
       rightColDiv.appendChild(sendErrorDiv);

       rowDiv.appendChild(rightColDiv);
       main.appendChild(rowDiv);

       afficherTableauPaquet('tableau-paquet-conteneur');
       afficherTableauToDoPaquet('to-do-paquet-conteneur');
       afficherSendErrorPaquet('send-error-paquet-conteneur');

       // Selecteur pour filtrer
       function onCorpusSelect(selectedCorpus) {
              afficherTableauPaquet('tableau-paquet-conteneur', selectedCorpus ? selectedCorpus.id : null);
              afficherTableauToDoPaquet('to-do-paquet-conteneur', selectedCorpus ? selectedCorpus.id : null);
              afficherSendErrorPaquet('send-error-paquet-conteneur', selectedCorpus ? selectedCorpus.id : null);
       }

}
