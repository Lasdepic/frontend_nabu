import { afficherStatus, chargerFeuilleDeStyle, chargerScript } from './helpersUI.js';
import { calculerMD5Local } from './md5.js';
import { envoyerFichier, envoyerFichierAvecRemplacement } from './upload.js';
import { mettreAJourStatutPaquet } from './statutPaquet.js';

chargerFeuilleDeStyle('https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css');
chargerFeuilleDeStyle('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css');
chargerScript('https://cdnjs.cloudflare.com/ajax/libs/spark-md5/3.0.2/spark-md5.min.js')
  .then(initialiserUI);

window.sendding = {
  xhrGlobal: null
};

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
  container.className = 'container d-flex justify-content-center align-items-center sendding-container';

  const card = document.createElement('div');
  card.className = 'card border-0 shadow-lg w-100 sendding-card animate__animated animate__fadeIn';

  card.innerHTML = `
    <div class="card-header bg-gradient bg-primary text-white text-center py-4 rounded-top">
      <h3 class="mb-0 fw-bold">
        <i class="fa-solid fa-file-zipper me-2"></i>
        Envoi d’un paquet ZIP
      </h3>
    </div>

    <div class="card-body p-0">
      <div class="mb-4 p-4">
        <label class="form-label fw-semibold">
          <i class="fa-solid fa-folder-open me-1 text-secondary"></i>
          Fichier ZIP
        </label>
        <div id="dropZone" class="border-2 border-dashed rounded p-4 text-center mb-2">
          <i class="fa-solid fa-cloud-upload-alt fa-3x text-secondary mb-2"></i>
          <p class="mb-2 fw-semibold">Glissez-déposez votre fichier ZIP ici</p>
          <p class="text-muted small mb-2">ou</p>
          <input type="file" id="inputFichier" class="form-control form-control-lg border-2 d-none" accept=".zip" ${!isAdmin ? 'disabled' : ''}>
          <button type="button" id="btnSelectFile" class="btn btn-outline-primary" ${!isAdmin ? 'disabled' : ''}>
            <i class="fa-solid fa-folder-open me-2"></i>Parcourir
          </button>
        </div>
        <div id="selectedFile" class="d-none alert alert-info py-2 px-3 d-flex align-items-center justify-content-between">
          <div>
            <i class="fa-solid fa-file-zipper me-2"></i>
            <span id="fileName" class="fw-semibold"></span>
            <span id="fileSize" class="text-muted small ms-2"></span>
          </div>
          <button type="button" id="btnClearFile" class="btn btn-sm btn-outline-danger" ${!isAdmin ? 'disabled' : ''}>
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
        <div class="form-text">Format accepté : <span class="badge bg-secondary">.zip</span></div>
      </div>

      <div class="px-4">
        <button id="btnEnvoyer"
                class="btn btn-success btn-lg w-100 fw-semibold mb-4 d-flex justify-content-center align-items-center gap-2 shadow-sm"
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
          <div class="mb-3">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <label class="form-label small fw-semibold text-muted mb-0">
                <i class="fa-solid fa-hashtag me-1"></i>
                Calcul MD5 local
              </label>
              <span id="md5Status" class="badge bg-secondary">En attente...</span>
            </div>
            <div class="progress progress-sm">
              <div id="md5ProgressBar"
                   class="progress-bar bg-info"
                   role="progressbar"
                   style="width:0%;"
                   aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
            </div>
          </div>
          
          <div class="mb-3">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <label class="form-label small fw-semibold text-muted mb-0">
                <i class="fa-solid fa-cloud-upload-alt me-1"></i>
                Envoi du fichier
              </label>
              <span id="uploadStatus" class="badge bg-secondary">En attente...</span>
            </div>
            <div class="progress progress-sm">
              <div id="uploadProgressBar"
                   class="progress-bar bg-success"
                   role="progressbar"
                   style="width:0%;"
                   aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
            </div>
          </div>
          
          <div class="d-flex justify-content-between align-items-center mt-3">
            <small id="progressTxt" class="text-muted"></small>
            <button id="btnCancelUpload" class="btn btn-sm btn-outline-danger">
              <i class="fa-solid fa-times me-1"></i>Annuler
            </button>
          </div>
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
    configurerGestionFichier();
    document.getElementById('btnEnvoyer').onclick = gererEnvoi;
  }
}

/* ===============================
   Gestion des fichiers (drag & drop)
================================ */
function configurerGestionFichier() {
  const dropZone = document.getElementById('dropZone');
  const inputFichier = document.getElementById('inputFichier');
  const btnSelectFile = document.getElementById('btnSelectFile');
  const btnClearFile = document.getElementById('btnClearFile');
  const selectedFile = document.getElementById('selectedFile');
  const fileName = document.getElementById('fileName');
  const fileSize = document.getElementById('fileSize');

  // Parcourir les fichiers
  btnSelectFile.onclick = () => inputFichier.click();

  // Sélection de fichier
  inputFichier.onchange = () => {
    if (inputFichier.files[0]) {
      afficherFichierSelectionne(inputFichier.files[0]);
    }
  };

  // Effacer le fichier
  btnClearFile.onclick = () => {
    inputFichier.value = '';
    selectedFile.classList.add('d-none');
    dropZone.classList.remove('d-none');
    document.getElementById('btnEnvoyer').disabled = false;
  };

  // Drag & Drop
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => {
      dropZone.classList.add('drop-zone-hover');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => {
      dropZone.classList.remove('drop-zone-hover');
    });
  });

  dropZone.addEventListener('drop', e => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.zip')) {
        inputFichier.files = files;
        afficherFichierSelectionne(file);
      } else {
        afficherStatus('Veuillez déposer un fichier ZIP.', 'warning');
      }
    }
  });

  function afficherFichierSelectionne(file) {
    fileName.textContent = file.name;
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    fileSize.textContent = `(${sizeMB} MB)`;
    dropZone.classList.add('d-none');
    selectedFile.classList.remove('d-none');
  }
}

/* ===============================
   Envoi
================================ */
let uploadEnCours = false;

async function gererEnvoi() {
  const bouton = document.getElementById('btnEnvoyer');
  const input = document.getElementById('inputFichier');
  const fichier = input.files[0];
  const progressContainer = document.getElementById('progressContainer');

  if (!fichier) {
    afficherStatus('Veuillez sélectionner un fichier ZIP.', 'warning');
    return;
  }

  uploadEnCours = true;
  bouton.disabled = true;
  bouton.innerHTML = `
    <span class="spinner-border spinner-border-sm me-2"></span>
    <span>Traitement en cours…</span>
  `;

  let operationTerminee = false;
  let stopMd5 = false;

  const majSucces = () => {
    if (operationTerminee) {
      uploadEnCours = false;
      afficherStatus(`<i class="fa-solid fa-check-circle me-2"></i>Le fichier <strong>${fichier.name}</strong> a été envoyé avec succès sur le serveur.`, 'success');
      const etat = document.getElementById('etatUpload');
      etat.textContent = '';
      etat.className = 'alert d-none text-center';
      
      // Animation de succès et réinitialisation
      setTimeout(() => {
        if (progressContainer) progressContainer.classList.add('d-none');
        reinitialiserFormulaire();
      }, 2000);
    }
  };

  try {
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
      overlay.className = 'paquet-modal-overlay modal fade show';

      const modal = document.createElement('div');
      modal.className = 'modal-dialog modal-dialog-centered modal-dialog-center';

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
    const md5ProgressBar = document.getElementById('md5ProgressBar');
    const uploadProgressBar = document.getElementById('uploadProgressBar');
    const md5Status = document.getElementById('md5Status');
    const uploadStatus = document.getElementById('uploadStatus');
    const btnCancelUpload = document.getElementById('btnCancelUpload');
    const md5Local = document.getElementById('md5Local');

    let md5Pourcentage = 0;
    let uploadPourcentage = 0;
    let md5Termine = false;
    let uploadTermine = false;
    let erreur = false;

    // Gestion de l'annulation
    btnCancelUpload.onclick = () => {
      if (window.sendding.xhrGlobal) {
        window.sendding.xhrGlobal.abort();
      }
      stopMd5 = true;
      uploadEnCours = false;
      if (progressContainer) progressContainer.classList.add('d-none');
      afficherStatus('Envoi annulé par l\'utilisateur.', 'warning');
      reinitialiserFormulaire();
    };

    function updateProgressBar() {
      md5ProgressBar.style.width = md5Pourcentage + '%';
      md5ProgressBar.setAttribute('aria-valuenow', md5Pourcentage);
      
      uploadProgressBar.style.width = uploadPourcentage + '%';
      uploadProgressBar.setAttribute('aria-valuenow', uploadPourcentage);
      
      // Mise à jour des badges de statut
      if (md5Pourcentage === 100) {
        md5Status.textContent = 'Terminé';
        md5Status.className = 'badge bg-success';
        md5ProgressBar.classList.remove('uploading-animation');
      } else if (md5Pourcentage > 0) {
        md5Status.textContent = md5Pourcentage + '%';
        md5Status.className = 'badge bg-info';
        md5ProgressBar.classList.add('uploading-animation');
      }
      
      if (uploadPourcentage === 100) {
        uploadStatus.textContent = 'Terminé';
        uploadStatus.className = 'badge bg-success';
        uploadProgressBar.classList.remove('uploading-animation');
      } else if (uploadPourcentage > 0) {
        uploadStatus.textContent = uploadPourcentage + '%';
        uploadStatus.className = 'badge bg-primary';
        uploadProgressBar.classList.add('uploading-animation');
      }
    }
    
    const inputFichier = document.getElementById('inputFichier');
    const fichierAEnvoyer = inputFichier.files[0];
    const tailleMorceau = 2 * 1024 * 1024;
    const nombreMorceaux = Math.ceil(fichierAEnvoyer.size / tailleMorceau);
    let morceauActuel = 0;
    const calculateurMD5 = new window.SparkMD5.ArrayBuffer();
    const lecteur = new FileReader();

    // Initialiser les statuts
    md5Status.textContent = 'En cours...';
    md5Status.className = 'badge bg-info';
    uploadStatus.textContent = 'En cours...';
    uploadStatus.className = 'badge bg-primary';

    function calculerMD5EnParallele() {
      if (stopMd5) return;
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
        if (stopMd5) return;
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
    ).catch((e) => {
      erreur = true;
      stopMd5 = true;
      uploadEnCours = false;
      uploadPourcentage = 0;
      updateProgressBar();
      if (progressContainer) progressContainer.classList.add('d-none');
      if (e?.message !== 'Envoi annulé') {
        afficherStatus("<i class='fa-solid fa-exclamation-triangle me-2'></i>Échec de l'envoi.", 'danger');
      }
      reinitialiserFormulaire();
    });

    calculerMD5EnParallele();

  } catch (e) {
    stopMd5 = true;
    uploadEnCours = false;
    afficherStatus('<i class="fa-solid fa-exclamation-triangle me-2"></i>Erreur lors de l\'envoi du fichier.', 'danger');
    if (progressContainer) progressContainer.classList.add('d-none');
    reinitialiserFormulaire();
  } finally {
    if (!uploadEnCours) {
      bouton.disabled = false;
      bouton.innerHTML = `
        <i class="fa-solid fa-cloud-arrow-up"></i>
        <span>Envoyer le fichier</span>
      `;
    }
  }
}

/* ===============================
   Réinitialisation
================================ */
function reinitialiserFormulaire() {
  const bouton = document.getElementById('btnEnvoyer');
  const input = document.getElementById('inputFichier');
  const selectedFile = document.getElementById('selectedFile');
  const dropZone = document.getElementById('dropZone');
  const md5Local = document.getElementById('md5Local');
  const md5ProgressBar = document.getElementById('md5ProgressBar');
  const uploadProgressBar = document.getElementById('uploadProgressBar');
  const md5Status = document.getElementById('md5Status');
  const uploadStatus = document.getElementById('uploadStatus');
  
  bouton.disabled = false;
  bouton.innerHTML = `
    <i class="fa-solid fa-cloud-arrow-up"></i>
    <span>Envoyer le fichier</span>
  `;
  
  if (input) input.value = '';
  if (md5Local) md5Local.value = '';
  if (selectedFile) selectedFile.classList.add('d-none');
  if (dropZone) dropZone.classList.remove('d-none');
  
  if (md5ProgressBar) {
    md5ProgressBar.style.width = '0%';
    md5ProgressBar.setAttribute('aria-valuenow', 0);
  }
  if (uploadProgressBar) {
    uploadProgressBar.style.width = '0%';
    uploadProgressBar.setAttribute('aria-valuenow', 0);
  }
  if (md5Status) {
    md5Status.textContent = 'En attente...';
    md5Status.className = 'badge bg-secondary';
  }
  if (uploadStatus) {
    uploadStatus.textContent = 'En attente...';
    uploadStatus.className = 'badge bg-secondary';
  }
}

