import { afficherSpinner, afficherStatus, chargerFeuilleDeStyle, chargerScript } from './helpersUI.js';
import { calculerMD5Local, calculerMD5Distant, comparerMD5 } from './md5.js';
import { envoyerFichier, envoyerFichierAvecRemplacement } from './upload.js';
import { mettreAJourStatutPaquet } from './statutPaquet.js';

const URL_API = 'https://vitam.scdi-montpellier.fr:8443/';
const JETON_API = '800HxwzchfvLh9E8YjXf5UfGDaJ8Iz3UG0v2T7dwDMZByzcsOAfw10uS98rY0RqR';

window.comparerMD5 = comparerMD5;
window.calculerMD5Distant = () => calculerMD5Distant(URL_API, JETON_API);


chargerFeuilleDeStyle('https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css');
chargerFeuilleDeStyle('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css');
chargerScript('https://cdnjs.cloudflare.com/ajax/libs/spark-md5/3.0.2/spark-md5.min.js')
  .then(initialiserUI);


async function initialiserUI() {
  document.body.innerHTML = '';

  const header = document.createElement('header');
  document.body.appendChild(header);

  try {
    const navbar = await import('../../components/navbar.js');
    if (navbar?.initNavbar) await navbar.initNavbar('header');
  } catch {}

  // Vérifier le rôle de l'utilisateur
  let isAdmin = false;
  try {
    const { getCurrentUser } = await import('../../API/users/currentUser.js');
    const currentUser = await getCurrentUser();
    if (currentUser && currentUser.roleId === 1) {
      isAdmin = true;
    }
  } catch (e) {

    isAdmin = false;
  }

  const conteneur = document.createElement('div');
  conteneur.className = 'container min-vh-100 d-flex justify-content-center align-items-center py-5';

  const card = document.createElement('div');
  card.className = 'card shadow-lg w-100';
  card.style.maxWidth = '560px';

  card.innerHTML = `
    <div class="card-header bg-primary text-white text-center py-3">
      <h5 class="mb-0">
        <i class="fa-solid fa-file-zipper me-2"></i>
        Envoi d'un paquet
      </h5>
    </div>

    <div class="card-body">

      <!-- Fichier -->
      <div class="mb-4">
        <label for="inputFichier" class="form-label fw-semibold">
          <i class="fa-solid fa-folder-open me-1 text-secondary"></i>
          Fichier ZIP
        </label>
        <input type="file" id="inputFichier" class="form-control" accept=".zip" ${!isAdmin ? 'disabled' : ''}>
        <div class="form-text">Seuls les fichiers <strong>.zip</strong> sont acceptés.</div>
      </div>

      <!-- Bouton -->
      <button id="btnEnvoyer" class="btn btn-success w-100 fw-semibold mb-4" ${!isAdmin ? 'disabled' : ''}>
        <i class="fa-solid fa-cloud-arrow-up me-2"></i>
        Envoyer le fichier
      </button>

      ${!isAdmin ? `<div class="alert alert-danger text-center">Seuls les administrateurs peuvent envoyer des fichiers.</div>` : ''}

      <!-- MD5 local -->
      <div class="mb-4">
        <h6 class="fw-bold mb-2">
          <i class="fa-solid fa-hashtag text-info me-1"></i>
          Hash MD5 local
        </h6>

        <div class="input-group mb-2">
          <span class="input-group-text">
            <div id="md5LocalSpin" class="spinner-border spinner-border-sm text-info" style="display:none;"></div>
          </span>
          <input id="md5Local" class="form-control font-monospace" readonly>
        </div>

        <div class="progress mb-1" style="height:6px;">
          <div id="md5LocalProgress" class="progress-bar bg-info" style="width:0%"></div>
        </div>

        <small id="md5LocalTxt" class="text-muted"></small>
      </div>

      <!-- Infos reprise -->
      <div id="infoReprise" class="text-warning small mb-2"></div>

      <!-- Statut -->
      <div id="zoneStatus" class="alert alert-secondary text-center py-2">
        <i class="fa-solid fa-hourglass-half me-1"></i>
        En attente d’envoi…
      </div>

      <!-- MD5 distant -->
      <div class="mb-3">
        <h6 class="fw-bold mb-2">
          <i class="fa-solid fa-server text-primary me-1"></i>
          Hash MD5 distant
        </h6>

        <div class="input-group">
          <span class="input-group-text">
            <div id="md5DistantSpin" class="spinner-border spinner-border-sm text-primary" style="display:none;"></div>
          </span>
          <input id="md5Distant" class="form-control font-monospace" readonly>
        </div>

        <small id="md5DistantTxt" class="text-muted"></small>
      </div>

      <!-- Concordance -->
      <div id="concordanceMD5" class="mt-3"></div>

    </div>

    <div class="card-footer text-center text-muted small">
      Vérification d’intégrité par empreinte <strong>MD5</strong>
    </div>
  `;

  conteneur.appendChild(card);
  document.body.appendChild(conteneur);

  if (isAdmin) {
    document.getElementById('btnEnvoyer').onclick = gererEnvoi;
  }
}

/* ===============================
   Gestion de l’envoi
================================ */
import { createPaquet } from '../../API/paquet/paquet.js';

async function gererEnvoi() {
  const bouton = document.getElementById('btnEnvoyer');

  bouton.disabled = true;
  bouton.innerHTML = `
    <span class="spinner-border spinner-border-sm me-2"></span>
    Envoi en cours…
  `;

  [
    'md5DistantSpin',
    'md5DistantTxt',
    'md5Distant',
    'md5LocalSpin',
    'md5LocalTxt',
    'md5Local',
    'concordanceMD5',
    'infoReprise'
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '';
  });

  afficherStatus('Calcul du MD5 local…', 'secondary');

  // Récupérer le nom du fichier sélectionné
  const inputFichier = document.getElementById('inputFichier');
  const fichier = inputFichier && inputFichier.files && inputFichier.files[0];
  if (!fichier) {
    afficherStatus('Veuillez sélectionner un fichier ZIP.', 'danger');
    bouton.disabled = false;
    bouton.innerHTML = `
      <i class="fa-solid fa-cloud-arrow-up me-2"></i>
      Envoyer le fichier
    `;
    return;
  }
  const nomFichier = fichier.name;
  const cote = nomFichier.endsWith('.zip') ? nomFichier.slice(0, -4) : nomFichier;


  // Vérifier si le paquet existe déjà dans la base avec fetchOnePaquet
  let paquetExiste = false;
  try {
    const { fetchOnePaquet } = await import('../../API/paquet/paquet.js');
    const data = await fetchOnePaquet(cote);
    console.log('[DEBUG] fetchOnePaquet(', cote, ') =>', data);
    if (
      data &&
      data.success &&
      data.data &&
      typeof data.data.cote === 'string' &&
      data.data.cote.trim().toLowerCase() === cote.trim().toLowerCase()
    ) {
      paquetExiste = true;
    }
  } catch (e) { console.error('[DEBUG] fetchOnePaquet error', e); }

  if (!paquetExiste) {
    // card de confirmation avant l'envoi
    const cardOverlay = document.createElement('div');
    cardOverlay.style.position = 'fixed';
    cardOverlay.style.top = 0;
    cardOverlay.style.left = 0;
    cardOverlay.style.width = '100vw';
    cardOverlay.style.height = '100vh';
    cardOverlay.style.background = 'rgba(0,0,0,0.5)';
    cardOverlay.style.zIndex = 4000;
    cardOverlay.id = 'card-paquet-confirm-overlay';

    const card = document.createElement('div');
    card.className = 'card shadow-lg';
    card.style.maxWidth = '400px';
    card.style.margin = '10vh auto 0 auto';
    card.style.position = 'relative';
    card.style.top = '10vh';

    card.innerHTML = `
      <div class="card-header bg-warning text-dark text-center">
        <h5 class="mb-0">Paquet introuvable</h5>
      </div>
      <div class="card-body text-center">
        <p>Le paquet <b>${cote}</b> n'existe pas.<br>Voulez-vous le créer avant l'envoi ?</p>
        <div class="d-flex justify-content-center gap-3 mt-4">
          <button id="btn-creer-paquet" class="btn btn-success">Créer paquet</button>
          <button id="btn-annuler-paquet" class="btn btn-secondary">Annuler</button>
        </div>
      </div>
    `;

    cardOverlay.appendChild(card);
    document.body.appendChild(cardOverlay);

    document.getElementById('btn-annuler-paquet').onclick = () => {
      cardOverlay.remove();
      bouton.disabled = false;
      bouton.innerHTML = `
        <i class="fa-solid fa-cloud-arrow-up me-2"></i>
        Envoyer le fichier
      `;
    };
    document.getElementById('btn-creer-paquet').onclick = async () => {
      cardOverlay.remove();
      const { afficherCardPaquetAddModal } = await import('../../components/editPaquet/addPaquet.js');
      afficherCardPaquetAddModal();
      setTimeout(() => {
        const coteInput = document.querySelector('input[name="cote"]');
        if (coteInput) {
          coteInput.value = cote;
          coteInput.readOnly = true;
        }
        const folderInput = document.querySelector('input[name="folderName"]');
        if (folderInput) {
          folderInput.value = cote;
        }
      }, 200);
      bouton.disabled = false;
      bouton.innerHTML = `
        <i class="fa-solid fa-cloud-arrow-up me-2"></i>
        Envoyer le fichier
      `;
    };
    return;
  }

  calculerMD5Local()
    .then(() => {
      const importerCardConfirm = () => import('../../components/download/cardConfirm.js');
      envoyerFichier(
        URL_API,
        JETON_API,
        importerCardConfirm,
        envoyerFichierAvecRemplacement,
        mettreAJourStatutPaquet
      );
    })
    .finally(() => {
      bouton.disabled = false;
      bouton.innerHTML = `
        <i class="fa-solid fa-cloud-arrow-up me-2"></i>
        Envoyer le fichier
      `;
    });
}

window.EnvoiCinesImmediat = () => {
  alert('Envoi immédiat déclenché !');
};

window.EnvoiCinesDiffere = () => {
  alert('Envoi différé déclenché !');
};
