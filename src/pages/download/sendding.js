import { afficherStatus, chargerFeuilleDeStyle, chargerScript } from './helpersUI.js';
import { calculerMD5Local } from './md5.js';
import { envoyerFichier, envoyerFichierAvecRemplacement } from './upload.js';
import { mettreAJourStatutPaquet } from './statutPaquet.js';

const URL_API = 'https://vitam.scdi-montpellier.fr:8443/';
const JETON_API = '800HxwzchfvLh9E8YjXf5UfGDaJ8Iz3UG0v2T7dwDMZByzcsOAfw10uS98rY0RqR';

chargerFeuilleDeStyle('https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css');
chargerFeuilleDeStyle('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css');
chargerScript('https://cdnjs.cloudflare.com/ajax/libs/spark-md5/3.0.2/spark-md5.min.js')
  .then(initialiserUI);

/* ===============================
   UI
================================ */
async function initialiserUI() {
  document.body.innerHTML = '';
  document.body.classList.add('page-sendding');

  const header = document.createElement('header');
  document.body.appendChild(header);

  try {
    const navbar = await import('../../components/navbar.js');
    await navbar.initNavbar('header');
  } catch {}

  let isAdmin = false;
  try {
    const { getCurrentUser } = await import('../../API/users/currentUser.js');
    const user = await getCurrentUser();
    isAdmin = user?.roleId === 1;
  } catch {}


  const container = document.createElement('div');
  container.className = 'container d-flex justify-content-center align-items-center';
  container.style.height = '100vh';
  container.style.overflowY = 'hidden';

  const card = document.createElement('div');
  card.className = 'card border-0 shadow-lg w-100 animate__animated animate__fadeIn';
  card.style.maxWidth = '600px';
  card.style.background = 'linear-gradient(135deg, #f8fafc 0%, #e9ecef 100%)';

  card.innerHTML = `
    <div class="card-header bg-gradient bg-primary text-white text-center py-4 rounded-top">
      <h3 class="mb-0 fw-bold">
        <i class="fa-solid fa-file-zipper me-2"></i>
        Envoi d’un paquet ZIP
      </h3>
    </div>

    <div class="card-body p-0">
      <div class="mb-4" style="padding: 1.5rem;">
        <label class="form-label fw-semibold">
          <i class="fa-solid fa-folder-open me-1 text-secondary"></i>
          Fichier ZIP
        </label>
        <input type="file" id="inputFichier" class="form-control form-control-lg border-2" accept=".zip" ${!isAdmin ? 'disabled' : ''}>
        <div class="form-text">Format accepté : <span class="badge bg-secondary">.zip</span></div>
      </div>

      <div style="padding: 0 1.5rem;">
        <button id="btnEnvoyer"
                class="btn btn-success btn-lg w-100 fw-semibold mb-4 d-flex justify-content-center align-items-center gap-2 shadow-sm"
                style="letter-spacing:0.5px;"
                ${!isAdmin ? 'disabled' : ''}>
          <i class="fa-solid fa-cloud-arrow-up"></i>
          <span>Envoyer le fichier</span>
        </button>

        <div id="zoneStatus" class="alert d-none text-center mb-3"></div>
        <div id="etatUpload" class="alert d-none text-center" role="alert"></div>

        ${!isAdmin ? `
          <div class="alert alert-danger text-center small rounded-pill px-3 py-2">
            <i class="fa-solid fa-triangle-exclamation me-1"></i>
            Accès réservé aux administrateurs
          </div>` : ''}

        <div id="progressContainer" class="mb-4 d-none">
          <label class="form-label small fw-semibold text-muted">Envoi du paquet...</label>
          <div class="progress">
            <div id="progressBar"
                 class="progress-bar"
                 role="progressbar"
                 style="width:0%;"
                 aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">0%</div>
          </div>
          <small id="progressTxt" class="text-muted d-block mt-1"></small>
          <input id="md5Local" type="hidden">
        </div>
      </div>
    </div>

    <div class="card-footer text-center text-muted small rounded-bottom bg-light border-top">
      <i class="fa-solid fa-shield-halved me-1"></i>
      Vérification d’intégrité MD5
    </div>
  `;

  container.appendChild(card);
  document.body.appendChild(container);

  if (isAdmin) {
    document.getElementById('btnEnvoyer').onclick = gererEnvoi;
  }
}

/* ===============================
   Envoi
================================ */
async function gererEnvoi() {
  const bouton = document.getElementById('btnEnvoyer');
  const input = document.getElementById('inputFichier');
  const fichier = input.files[0];

  if (!fichier) {
    afficherStatus('Veuillez sélectionner un fichier ZIP.', 'danger');
    return;
  }

  bouton.disabled = true;
  bouton.innerHTML = `
    <span class="spinner-border spinner-border-sm"></span>
    <span>Envoi en cours…</span>
  `;

  let operationTerminee = false;

  const majSucces = () => {
    if (operationTerminee) {
      afficherStatus(`Le fichier <strong>${fichier.name}</strong> a été envoyé avec succès sur le serveur.`, 'success');
      const etat = document.getElementById('etatUpload');
      etat.textContent = '';
      etat.className = 'alert d-none text-center';
    }
  };

  try {
    const progressContainer = document.getElementById('progressContainer');
    if (progressContainer) progressContainer.classList.remove('d-none');
    const cote = fichier.name.endsWith('.zip') ? fichier.name.slice(0, -4) : fichier.name;
    let coteSansPrefix = cote.toUpperCase().startsWith('SIP_') ? cote.slice(4) : cote;
    const modulePaquet = await import('../../API/paquet/paquet.js');
    if (!modulePaquet?.fetchOnePaquet) {
      afficherStatus('Erreur interne : fetchOnePaquet non disponible.', 'danger');
      bouton.disabled = false;
      bouton.innerHTML = `
        <i class="fa-solid fa-cloud-arrow-up"></i>
        <span>Envoyer le fichier</span>
      `;
      return;
    }
    const result = await modulePaquet.fetchOnePaquet(coteSansPrefix);
    if (!result || !result.success || !result.data) {
      const { afficherCardPaquetAddModal } = await import('../../components/editPaquet/addPaquet.js');
      const overlay = document.createElement('div');
      overlay.id = 'paquet-modal-overlay-upload';
      overlay.className = 'modal fade show';
      overlay.style.display = 'block';
      overlay.style.background = 'rgba(0,0,0,0.5)';
      overlay.style.position = 'fixed';
      overlay.style.top = 0;
      overlay.style.left = 0;
      overlay.style.width = '100vw';
      overlay.style.height = '100vh';
      overlay.style.zIndex = 3000;

      const modal = document.createElement('div');
      modal.className = 'modal-dialog modal-dialog-centered';
      modal.style.maxWidth = '500px';
      modal.style.width = '100%';

      const modalContent = document.createElement('div');
      modalContent.className = 'modal-content shadow-lg';

      const modalHeader = document.createElement('div');
      modalHeader.className = 'modal-header';
      const title = document.createElement('h5');
      title.className = 'modal-title fw-bold text-center w-100';
      title.textContent = 'Créer le paquet ?';
      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'btn-close';
      closeBtn.setAttribute('aria-label', 'Fermer');
      closeBtn.onclick = () => overlay.remove();
      modalHeader.appendChild(title);
      modalHeader.appendChild(closeBtn);

      const modalBody = document.createElement('div');
      modalBody.className = 'modal-body text-center';
      modalBody.innerHTML = `<p>Le paquet <strong>${coteSansPrefix}</strong> n'existe pas.<br>Voulez-vous le créer maintenant ?</p>`;

      const modalFooter = document.createElement('div');
      modalFooter.className = 'modal-footer d-flex justify-content-center gap-3';
      const btnCreer = document.createElement('button');
      btnCreer.className = 'btn btn-success';
      btnCreer.textContent = 'Créer le paquet';
      btnCreer.onclick = () => {
        overlay.remove();
        const defaultName = coteSansPrefix;
        afficherCardPaquetAddModal({
          folderName: defaultName,
          cote: defaultName
        });
      };
      const btnAnnuler = document.createElement('button');
      btnAnnuler.className = 'btn btn-outline-secondary';
      btnAnnuler.textContent = 'Annuler';
      btnAnnuler.onclick = () => {
        overlay.remove();
        afficherStatus('Envoi annulé. Le paquet doit être créé avant l’envoi.', 'warning');
      };
      modalFooter.appendChild(btnCreer);
      modalFooter.appendChild(btnAnnuler);

      modalContent.appendChild(modalHeader);
      modalContent.appendChild(modalBody);
      modalContent.appendChild(modalFooter);
      modal.appendChild(modalContent);
      overlay.appendChild(modal);
      overlay.addEventListener('click', e => {
        if (e.target === overlay) overlay.remove();
      });
      document.body.appendChild(overlay);
      bouton.disabled = false;
      bouton.innerHTML = `
        <i class="fa-solid fa-cloud-arrow-up"></i>
        <span>Envoyer le fichier</span>
      `;
      return;
    }
    const progressBar = document.getElementById('progressBar');
    const md5Local = document.getElementById('md5Local');

    let md5Pourcentage = 0;
    let uploadPourcentage = 0;
    let md5Termine = false;
    let uploadTermine = false;
    let erreur = false;

    function updateProgressBar() {
      let totalPct = Math.round((md5Pourcentage + uploadPourcentage) / 2);
      progressBar.style.width = totalPct + '%';
      progressBar.setAttribute('aria-valuenow', totalPct);
      progressBar.textContent = totalPct + '%';
    }
    
    const inputFichier = document.getElementById('inputFichier');
    const fichierAEnvoyer = inputFichier.files[0];
    const tailleMorceau = 2 * 1024 * 1024;
    const nombreMorceaux = Math.ceil(fichierAEnvoyer.size / tailleMorceau);
    let morceauActuel = 0;
    const calculateurMD5 = new window.SparkMD5.ArrayBuffer();
    const lecteur = new FileReader();

    function calculerMD5EnParallele() {
      if (morceauActuel >= nombreMorceaux) {
        md5Termine = true;
        md5Pourcentage = 100;
        if (md5Local) md5Local.value = calculateurMD5.end();
        updateProgressBar();
        if (uploadTermine) {
          operationTerminee = true;
          progressContainer.classList.add('d-none');
          majSucces();
        }
        return;
      }
      const debut = morceauActuel * tailleMorceau;
      const fin = Math.min(debut + tailleMorceau, fichierAEnvoyer.size);
      lecteur.onload = e => {
        calculateurMD5.append(e.target.result);
        morceauActuel++;
        md5Pourcentage = Math.ceil(morceauActuel * 100 / nombreMorceaux);
        updateProgressBar();
        calculerMD5EnParallele();
      };
      lecteur.readAsArrayBuffer(fichierAEnvoyer.slice(debut, fin));
    }

    // Upload en parallèle du calcul MD5
    const importerCardConfirm = () => import('../../components/download/cardConfirm.js');
    envoyerFichier(
      URL_API,
      JETON_API,
      importerCardConfirm,
      envoyerFichierAvecRemplacement,
      mettreAJourStatutPaquet,
      (pct) => {
        uploadPourcentage = pct;
        if (pct === 100) {
          uploadTermine = true;
          if (md5Termine) {
            operationTerminee = true;
            progressContainer.classList.add('d-none');
            majSucces();
          }
        }
        updateProgressBar();
      }
    ).catch(() => {
      erreur = true;
    });

    calculerMD5EnParallele();

  } catch (e) {
    afficherStatus('Erreur lors de l’envoi du fichier.', 'danger');
  } finally {
    bouton.disabled = false;
    bouton.innerHTML = `
      <i class="fa-solid fa-cloud-arrow-up"></i>
      <span>Envoyer le fichier</span>
    `;
  }
}

