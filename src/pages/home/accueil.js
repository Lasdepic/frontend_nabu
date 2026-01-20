

import { selectCorpus } from '../../components/selectCorpus.js';
import { afficherTableauPaquet } from '../../components/tableauPaquet.js';
import { afficherTableauToDoPaquet } from '../../components/toDo.js';


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

       // Tableau responsive
       const toDoDiv = document.createElement('div');
       toDoDiv.className = 'col-12 col-lg-4 mt-4';
       toDoDiv.style.maxWidth = '340px';
       toDoDiv.style.marginLeft = 'auto';
       toDoDiv.style.marginRight = '80px';
       toDoDiv.id = 'to-do-paquet-conteneur';
       toDoDiv.style.background = '#f8f9fa';
       toDoDiv.style.borderRadius = '10px';
       toDoDiv.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)';
       toDoDiv.style.padding = '18px 10px 10px 10px';
       toDoDiv.style.height = 'fit-content';
       rowDiv.appendChild(toDoDiv);

       main.appendChild(rowDiv);

       afficherTableauPaquet('tableau-paquet-conteneur');
       afficherTableauToDoPaquet('to-do-paquet-conteneur');

       // Selecteur pour filtrer
       function onCorpusSelect(selectedCorpus) {
              afficherTableauPaquet('tableau-paquet-conteneur', selectedCorpus ? selectedCorpus.id : null);
              afficherTableauToDoPaquet('to-do-paquet-conteneur', selectedCorpus ? selectedCorpus.id : null);
       }

}
