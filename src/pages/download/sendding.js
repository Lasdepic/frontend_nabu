import { afficherStatus, chargerFeuilleDeStyle, chargerScript } from './helpersUI.js';
import { envoyerFichier, envoyerFichierAvecRemplacement } from './upload.js';
import { mettreAJourStatutPaquet } from './statutPaquet.js';
import { callVitamAPI } from '../../API/vitam/vitamAPI.js';

// === Dépendances UI externes ===
chargerFeuilleDeStyle('https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css');
chargerFeuilleDeStyle('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css');
chargerScript('https://cdnjs.cloudflare.com/ajax/libs/spark-md5/3.0.2/spark-md5.min.js')
  .then(initialiserUI);

// === État global ===
window.sendding = {
  xhrGlobal: null
};

// === UI ===
async function initialiserUI() {
  document.body.classList.add('page-sendding');

  let header = document.querySelector('header');
  if (!header) {
    header = document.createElement('header');
    document.body.prepend(header);
  }

  let main = document.querySelector('main');
  if (!main) {
    main = document.createElement('main');
    document.body.appendChild(main);
  }
  main.innerHTML = '';

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
  card.className = 'card border-0 shadow-lg w-100 sendding-card';

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
  main.appendChild(container);

  if (isAdmin) {
    configurerGestionFichier();
    document.getElementById('btnEnvoyer').onclick = gererEnvoi;
  }
}

// === Gestion des fichiers (drag & drop) ===
function configurerGestionFichier() {
  const dropZone = document.getElementById('dropZone');
  const inputFichier = document.getElementById('inputFichier');
  const btnSelectFile = document.getElementById('btnSelectFile');
  const btnClearFile = document.getElementById('btnClearFile');
  const selectedFile = document.getElementById('selectedFile');
  const fileName = document.getElementById('fileName');
  const fileSize = document.getElementById('fileSize');

  btnSelectFile.onclick = () => inputFichier.click();

  inputFichier.onchange = () => {
    if (inputFichier.files[0]) {
      afficherFichierSelectionne(inputFichier.files[0]);
    }
  };

  btnClearFile.onclick = () => {
    inputFichier.value = '';
    selectedFile.classList.add('d-none');
    dropZone.classList.remove('d-none');
    document.getElementById('btnEnvoyer').disabled = false;
  };

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

// === Envoi (upload + CINES) ===
let uploadEnCours = false;

async function envoyerAuCinesImmediat(nomFichier) {
  const etat = document.getElementById('etatUpload');
  if (etat) {
    etat.className = 'alert alert-info text-center';
    etat.innerHTML = "<i class='fa-solid fa-cog fa-spin me-2'></i>Envoi au CINES...";
  }

  return callVitamAPI('envoi-immediat', {
    method: 'GET',
    headers: {
      'X-File-Name': nomFichier
    }
  });
}

async function programmerEnvoiCinesDiffere(nomFichier) {
  const etat = document.getElementById('etatUpload');
  if (etat) {
    etat.className = 'alert alert-info text-center';
    etat.innerHTML = "<i class='fa-solid fa-cog fa-spin me-2'></i>Mise en place de l’envoi différé...";
  }

  return callVitamAPI('programmation-differe', {
    method: 'GET',
    headers: {
      'X-File-Name': nomFichier
    }
  });
}

async function verifierStatutCines(
  itemid,
  {
    intervalMs = 5000,
    maxTries = 60,
    onTick = null,
    shouldStop = null
  } = {}
) {

  let lastData = null;
  for (let i = 0; i < maxTries; i++) {
    if (shouldStop?.()) {
      return { status: 'VERIFICATION_ARRETEE', message: "Vérification arrêtée." };
    }

    let data = null;
    try {
      data = await callVitamAPI('envoi-statut', {
        method: 'GET',
        headers: {
          'X-Item-Id': itemid
        }
      });
    } catch (e) {
      data = { status: 'STATUT_NON_DISPONIBLE', message: "Impossible de récupérer le statut." };
    }

    lastData = data;
    if (typeof onTick === 'function') {
      try {
        onTick(data, { attempt: i + 1, maxTries });
      } catch {}
    }

    // Arrêt dès que l'état n'est plus "ENVOI_EN_COURS"
    if (data?.status && data.status !== 'ENVOI_EN_COURS') {
      return data;
    }

    await new Promise(r => setTimeout(r, intervalMs));
  }

  return {
    status: 'STATUT_NON_DISPONIBLE',
    message: "Délai dépassé pour la vérification d'état.",
    lastStatus: lastData?.status
  };
}

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
      if (etat) {
        etat.className = 'alert alert-light text-center';
        etat.innerHTML = `
          <div class='fw-semibold mb-2'>Envoyer le paquet au CINES ?</div>
          <div id='cines' class='d-flex gap-2 justify-content-center flex-wrap'>
            <button type='button' id='btnCinesImmediat' class='btn btn-success btn-sm px-4 fw-bold'>Immédiat</button>
            <button type='button' id='btnCinesDiffere' class='btn btn-outline-secondary btn-sm px-4 fw-bold'>Différé</button>
          </div>
          <div id='cines_status' class='small text-muted mt-2'></div>
        `;
      }

      const btnImmediat = document.getElementById('btnCinesImmediat');
      const btnDiffere = document.getElementById('btnCinesDiffere');
      const cinesStatus = document.getElementById('cines_status');

      const verrouillerChoix = (locked) => {
        if (btnImmediat) btnImmediat.disabled = locked;
        if (btnDiffere) btnDiffere.disabled = locked;
      };

      const nettoyerEtReset = () => {
        setTimeout(() => {
          const etat = document.getElementById('etatUpload');
          if (etat) {
            etat.textContent = '';
            etat.className = 'alert d-none text-center';
          }
          if (progressContainer) progressContainer.classList.add('d-none');
          reinitialiserFormulaire();
        }, 2000);
      };

      if (btnImmediat) {
        btnImmediat.onclick = async () => {
          verrouillerChoix(true);
          const cinesPollToken = { stopped: false };
          window.sendding.cinesPollToken = cinesPollToken;

          const getUiStatus = (status) => {
            switch (status) {
              case 'ENVOI_OK':
                return { label: 'ENVOI OK', badgeClass: 'text-bg-success', iconHtml: "<i class='fa-solid fa-circle-check me-1'></i>" };
              case 'ENVOI_EN_ERREUR':
                return { label: 'EN ERREUR', badgeClass: 'text-bg-danger', iconHtml: "<i class='fa-solid fa-triangle-exclamation me-1'></i>" };
              case 'ENVOI_EN_COURS':
                return { label: 'EN COURS', badgeClass: 'text-bg-info', iconHtml: "<i class='fa-solid fa-spinner fa-spin me-1'></i>" };
              case 'STATUT_NON_DISPONIBLE':
                return { label: 'STATUT INDISPONIBLE', badgeClass: 'text-bg-warning', iconHtml: "<i class='fa-solid fa-triangle-exclamation me-1'></i>" };
              default:
                return { label: status ? String(status) : 'INCONNU', badgeClass: 'text-bg-secondary', iconHtml: "<i class='fa-solid fa-circle-info me-1'></i>" };
            }
          };

          try {
            await mettreAJourStatutPaquet(fichier.name, 4);
            const resultat = await envoyerAuCinesImmediat(fichier.name);
            if (resultat?.status === 'success' && resultat?.itemid) {
              try {
                const { createHistoriqueEnvoi } = await import('../../API/paquet/historiqueEnvoi.js');
                const cote = fichier.name.endsWith('.zip') ? fichier.name.slice(0, -4) : fichier.name;
                const paquetCote = cote.toUpperCase().startsWith('SIP_') ? cote.slice(4) : cote;
                await createHistoriqueEnvoi({ itemsId: resultat.itemid, paquetCote });
              } catch (e) {
                console.warn("Impossible d'enregistrer l'historique d'envoi", e);
              }

              const etat = document.getElementById('etatUpload');
              if (etat) {
                const ui = getUiStatus('ENVOI_EN_COURS');
                etat.className = 'alert alert-info text-center';
                etat.innerHTML = `
                  <div class='d-flex align-items-center justify-content-between flex-wrap gap-2'>
                    <div class='fw-semibold text-start'>
                      <i class='fa-solid fa-paper-plane me-2'></i>
                      Envoi au CINES
                    </div>
                    <span id='cines_status_badge' class='badge ${ui.badgeClass}'>${ui.iconHtml}${ui.label}</span>
                  </div>

                  ${resultat?.message ? `<div class='small mt-2 text-start'><span class='text-muted'>Message :</span> ${resultat.message}</div>` : ''}

                  <div class='small mt-2 text-start'>
                    <div><span class='text-muted'>ItemId :</span> <code>${resultat.itemid}</code></div>
                    <div class='d-flex flex-wrap gap-3 mt-1'>
                      <span><i class='fa-solid fa-clock me-1'></i><span class='text-muted'>Dernière vérification :</span> <span id='cines_last_check'>—</span></span>
                      <span><i class='fa-solid fa-rotate me-1'></i><span class='text-muted'>Vérification :</span> <span id='cines_attempt'>0</span>/<span id='cines_max'>60</span> <span class='text-muted'>(toutes les 5s)</span></span>
                    </div>
                    <div id='cines_polling_message' class='text-muted mt-1'></div>
                  </div>
                `;
              }

              const statut = await verifierStatutCines(resultat.itemid, {
                intervalMs: 5000,
                maxTries: 60,
                shouldStop: () => {
                  const etatEl = document.getElementById('etatUpload');
                  return cinesPollToken.stopped || !etatEl;
                },
                onTick: (data, meta) => {
                  const badgeEl = document.getElementById('cines_status_badge');
                  const lastCheckEl = document.getElementById('cines_last_check');
                  const attemptEl = document.getElementById('cines_attempt');
                  const maxEl = document.getElementById('cines_max');
                  const msgEl = document.getElementById('cines_polling_message');

                  if (attemptEl) attemptEl.textContent = String(meta.attempt);
                  if (maxEl) maxEl.textContent = String(meta.maxTries);
                  if (lastCheckEl) lastCheckEl.textContent = new Date().toLocaleTimeString();

                  const ui = getUiStatus(data?.status);
                  if (badgeEl) {
                    badgeEl.className = `badge ${ui.badgeClass}`;
                    badgeEl.innerHTML = `${ui.iconHtml}${ui.label}`;
                  }

                  if (msgEl) {
                    msgEl.textContent = data?.message ? String(data.message) : '';
                  }
                }
              });
              const etatFinal = document.getElementById('etatUpload');
              if (etatFinal) {
                if (statut?.status === 'ENVOI_OK') {
                  // Règle demandée : si non validé CINES => ERREUR, sinon ENVOI_OK.
                  // La validation est vérifiée via le bordereau (ReplyCode === 'OK').
                  let validatedByCines = false;
                  try {
                    const bordereau = await callVitamAPI('bordereau', {
                      method: 'GET',
                      headers: {
                        'X-Item-Id': resultat.itemid
                      }
                    });
                    validatedByCines = bordereau?.status === 'success' && bordereau?.info?.ReplyCode === 'OK';
                  } catch {
                    validatedByCines = false;
                  }

                  if (validatedByCines) {
                    await mettreAJourStatutPaquet(fichier.name, 3);
                    etatFinal.className = 'alert alert-success text-center';
                    etatFinal.innerHTML = "<i class='fa-solid fa-circle-check me-2'></i>Paquet validé par le CINES (OK).";
                  } else {
                    await mettreAJourStatutPaquet(fichier.name, 5);
                    etatFinal.className = 'alert alert-danger text-center';
                    etatFinal.innerHTML = "<i class='fa-solid fa-triangle-exclamation me-2'></i>Paquet non validé par le CINES : statut mis en erreur.";
                  }
                } else if (statut?.status === 'STATUT_NON_DISPONIBLE') {
                  etatFinal.className = 'alert alert-warning text-center';
                  etatFinal.innerHTML = `<i class='fa-solid fa-triangle-exclamation me-2'></i>Statut CINES : ${statut?.status ?? 'inconnu'}${statut?.message ? ` (${statut.message})` : ''}`;
                } else if (statut?.status === 'ENVOI_EN_ERREUR') {
                  await mettreAJourStatutPaquet(fichier.name, 5);
                  etatFinal.className = 'alert alert-danger text-center';
                  etatFinal.innerHTML = `<i class='fa-solid fa-triangle-exclamation me-2'></i>Envoi CINES en erreur${statut?.message ? ` (${statut.message})` : ''}.`;
                } else if (statut?.status === 'VERIFICATION_ARRETEE') {
                  etatFinal.className = 'alert alert-warning text-center';
                  etatFinal.innerHTML = `<i class='fa-solid fa-triangle-exclamation me-2'></i>${statut?.message ?? 'Vérification arrêtée.'}`;
                } else {
                  await mettreAJourStatutPaquet(fichier.name, 5);
                  etatFinal.className = 'alert alert-warning text-center';
                  etatFinal.innerHTML = `<i class='fa-solid fa-triangle-exclamation me-2'></i>Statut CINES : ${statut?.status ?? 'inconnu'}${statut?.message ? ` (${statut.message})` : ''}`;
                }
              }
            } else {
              await mettreAJourStatutPaquet(fichier.name, 5);
              const etat = document.getElementById('etatUpload');
              if (etat) {
                etat.className = 'alert alert-danger text-center';
                etat.innerHTML = `${resultat?.message ?? "Erreur lors de l'envoi au CINES."}${resultat?.output ? `<br/>${resultat.output}` : ''}`;
              }
            }
          } catch (e) {
            await mettreAJourStatutPaquet(fichier.name, 5);
            const etat = document.getElementById('etatUpload');
            if (etat) {
              etat.className = 'alert alert-danger text-center';
              etat.innerHTML = "<i class='fa-solid fa-triangle-exclamation me-2'></i>Erreur lors de l'envoi immédiat au CINES.";
            }
          } finally {
            if (window.sendding?.cinesPollToken) {
              window.sendding.cinesPollToken.stopped = true;
            }
            nettoyerEtReset();
          }
        };
      }

      if (btnDiffere) {
        btnDiffere.onclick = async () => {
          verrouillerChoix(true);
          if (cinesStatus) cinesStatus.innerHTML = "<i class='fa-solid fa-cog fa-spin me-2'></i>Programmation du différé...";
          try {
            await mettreAJourStatutPaquet(fichier.name, 8);
            const resultat = await programmerEnvoiCinesDiffere(fichier.name);
            const etat = document.getElementById('etatUpload');
            if (resultat?.status === 'success') {
              if (resultat?.itemid) {
                try {
                  const { createHistoriqueEnvoi } = await import('../../API/paquet/historiqueEnvoi.js');
                  const cote = fichier.name.endsWith('.zip') ? fichier.name.slice(0, -4) : fichier.name;
                  const paquetCote = cote.toUpperCase().startsWith('SIP_') ? cote.slice(4) : cote;
                  await createHistoriqueEnvoi({ itemsId: resultat.itemid, paquetCote });
                } catch (e) {
                  console.warn("Impossible d'enregistrer l'historique d'envoi", e);
                }
              }

              if (etat) {
                etat.className = 'alert alert-success text-center';
                etat.innerHTML = "<i class='fa-solid fa-check me-2'></i>Mise en place de l'envoi différé OK";
              }
            } else {
              await mettreAJourStatutPaquet(fichier.name, 5);
              if (etat) {
                etat.className = 'alert alert-warning text-center';
                etat.innerHTML = "<i class='fa-solid fa-triangle-exclamation me-2'></i>Impossible de mettre en place l'envoi différé";
                if (resultat?.error) {
                  etat.innerHTML += `<br/>${resultat.error}`;
                }
              }
            }
          } catch (e) {
            await mettreAJourStatutPaquet(fichier.name, 5);
            const etat = document.getElementById('etatUpload');
            if (etat) {
              etat.className = 'alert alert-danger text-center';
              etat.innerHTML = "<i class='fa-solid fa-triangle-exclamation me-2'></i>Erreur lors de la programmation du différé.";
            }
          } finally {
            nettoyerEtReset();
          }
        };
      }
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
      document.getElementById('paquet-modal-overlay-upload')?.remove();
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

    md5Status.textContent = 'En cours...';
    md5Status.className = 'badge bg-info';
    uploadStatus.textContent = 'En cours...';
    uploadStatus.className = 'badge bg-primary';

    function calculerMD5EnParallele() {
      if (stopMd5) return;
      if (morceauActuel >= nombreMorceaux) {
        md5Termine = true;
        md5Pourcentage = 100;
        const hash = calculateurMD5.end();
        if (md5Local) md5Local.value = hash;
        try {
          window.dispatchEvent(new CustomEvent('md5local:ready', {
            detail: { md5: hash, fileName: fichierAEnvoyer?.name }
          }));
        } catch {}
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

// === Réinitialisation ===
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

