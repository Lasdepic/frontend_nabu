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
  container.className = 'container min-vh-100 d-flex justify-content-center align-items-center';

  const card = document.createElement('div');
  card.className = 'card shadow-lg w-100';
  card.style.maxWidth = '560px';

  card.innerHTML = `
    <div id="zoneStatus" class="alert d-none text-center mb-3"></div>
    <div class="card-header bg-primary text-white text-center py-3">
      <h4 class="mb-0 fw-semibold">
        <i class="fa-solid fa-file-zipper me-2"></i>
        Envoi d’un paquet ZIP
      </h4>
    </div>

    <div class="card-body">

      <div id="etatUpload" class="alert d-none text-center" role="alert"></div>

      <div class="mb-4">
        <label class="form-label fw-semibold">
          <i class="fa-solid fa-folder-open me-1 text-secondary"></i>
          Fichier ZIP
        </label>
        <input type="file" id="inputFichier" class="form-control" accept=".zip" ${!isAdmin ? 'disabled' : ''}>
        <div class="form-text">Format accepté : <strong>.zip</strong></div>
      </div>

      <button id="btnEnvoyer"
              class="btn btn-success w-100 fw-semibold mb-4 d-flex justify-content-center align-items-center gap-2"
              ${!isAdmin ? 'disabled' : ''}>
        <i class="fa-solid fa-cloud-arrow-up"></i>
        <span>Envoyer le fichier</span>
      </button>

      ${!isAdmin ? `
        <div class="alert alert-danger text-center small">
          <i class="fa-solid fa-triangle-exclamation me-1"></i>
          Accès réservé aux administrateurs
        </div>` : ''}

      <div class="mb-4">
        <label class="form-label small fw-semibold text-muted">Empreinte MD5 (local)</label>
        <div class="progress" style="height:10px;">
          <div id="md5LocalProgress"
               class="progress-bar progress-bar-striped progress-bar-animated bg-info"
               style="width:0%"
               aria-valuemin="0"
               aria-valuemax="100"></div>
        </div>
        <small id="md5LocalTxt" class="text-muted d-block mt-1"></small>
        <input id="md5Local" type="hidden">
      </div>

      <div class="mb-3">
        <label class="form-label small fw-semibold text-muted">Envoi vers le serveur</label>
        <div class="progress" style="height:10px;">
          <div id="uploadProgress"
               class="progress-bar progress-bar-striped progress-bar-animated bg-success"
               style="width:0%"
               aria-valuemin="0"
               aria-valuemax="100"></div>
        </div>
        <small id="uploadProgressTxt" class="text-muted d-block mt-1"></small>
      </div>

    </div>

    <div class="card-footer text-center text-muted small">
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

  let md5Ok = false;
  let uploadOk = false;

  const majSucces = () => {
    if (md5Ok && uploadOk) {
      afficherStatus(`Le fichier <strong>${fichier.name}</strong> a été envoyé avec succès sur le serveur.`, 'success');
      const etat = document.getElementById('etatUpload');
      etat.textContent = '';
      etat.className = 'alert d-none text-center';
    }
  };

  try {
    // Vérifier si le paquet existe avant de continuer
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
      // Afficher la card de création paquet et stopper l'envoi
      const { afficherCardPaquetAddModal } = await import('../../components/editPaquet/addPaquet.js');
      // On crée une card personnalisée pour ce cas
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
        // Préremplir le nom de dossier et la cote avec le nom du fichier (sans .zip et sans SIP_)
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

    // MD5
    document.getElementById('md5LocalTxt').textContent = 'Calcul MD5 en cours…';
    await calculerMD5Local();

    const md5Bar = document.getElementById('md5LocalProgress');
    const observer = new MutationObserver(() => {
      const pct = parseInt(md5Bar.style.width);
      if (!isNaN(pct)) {
        md5Bar.setAttribute('aria-valuenow', pct);
        document.getElementById('md5LocalTxt').textContent = `MD5 : ${pct}%`;
      }
      if (pct === 100) {
        md5Ok = true;
        document.getElementById('md5LocalTxt').textContent = 'MD5 calculé.';
        observer.disconnect();
        majSucces();
      }
    });
    observer.observe(md5Bar, { attributes: true });

    // Upload
    const onUploadProgress = (pct) => {
      const bar = document.getElementById('uploadProgress');
      const txt = document.getElementById('uploadProgressTxt');
      bar.style.width = pct + '%';
      bar.setAttribute('aria-valuenow', pct);
      txt.textContent = pct < 100 ? `Upload : ${pct}%` : 'Upload terminé';
      if (pct === 100) {
        uploadOk = true;
        majSucces();
      }
    };

    const importerCardConfirm = () => import('../../components/download/cardConfirm.js');

    await envoyerFichier(
      URL_API,
      JETON_API,
      importerCardConfirm,
      envoyerFichierAvecRemplacement,
      mettreAJourStatutPaquet,
      onUploadProgress
    );

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
