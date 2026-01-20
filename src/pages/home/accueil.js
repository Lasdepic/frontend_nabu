
import { createNavbar } from '../../components/navbar.js';
import { selectCorpus, getSelectedCorpus } from '../../components/selectCorpus.js';
import { afficherTableauPaquet } from '../../components/tableauPaquet.js';
import { isAuthenticated } from '../../API/auth.js';


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
       main.innerHTML = '';

       const centerDiv = document.createElement('div');
       centerDiv.className = 'container my-4 d-flex justify-content-center';
       // Ajoute le selectCorpus avec callback pour filtrer
       const selectElement = selectCorpus(onCorpusSelect);
       centerDiv.appendChild(selectElement);
       main.appendChild(centerDiv);

       // Affiche le tableau a gauche de l'écran
       const tableauDiv = document.createElement('div');
       tableauDiv.className = 'mt-4 d-flex justify-content-start';
       tableauDiv.id = 'tableau-paquet-conteneur';
       tableauDiv.style.marginLeft = '10px';
       main.appendChild(tableauDiv);
       afficherTableauPaquet('tableau-paquet-conteneur');

       // Callback pour filtrer les paquets selon le corpus sélectionné
       function onCorpusSelect(selectedCorpus) {
              afficherTableauPaquet('tableau-paquet-conteneur', selectedCorpus ? selectedCorpus.id : null);
       }
}
