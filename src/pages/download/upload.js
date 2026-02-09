// Gestion de l'envoi du fichier (upload)
import { afficherStatus } from './helpersUI.js';
import { callVitamAPI, getVitamProxyUrl } from '../../API/vitam/vitamAPI.js';

function getMd5LocalValue() {
  const md5LocalInput = document.getElementById('md5Local');
  const value = md5LocalInput?.value;
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : '';
}

function attendreMD5Local({ timeoutMs = 60000, fileName } = {}) {
  const existing = getMd5LocalValue();
  if (existing) return Promise.resolve(existing);

  return new Promise((resolve, reject) => {
    let timeoutId;

    const cleanup = () => {
      window.removeEventListener('md5local:ready', onReady);
      if (timeoutId) clearTimeout(timeoutId);
    };

    const onReady = (event) => {
      const md5 = event?.detail?.md5;
      const eventFileName = event?.detail?.fileName;
      if (fileName && eventFileName && eventFileName !== fileName) return;
      if (typeof md5 !== 'string' || md5.trim() === '') return;
      cleanup();
      resolve(md5.trim());
    };

    window.addEventListener('md5local:ready', onReady);

    timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error('Timeout MD5 local'));
    }, timeoutMs);
  });
}

function uploaderViaXhr({ fichier, decalage, extraHeaders = {}, onUploadProgress }) {
  const infoReprise = document.getElementById('infoReprise');
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    if (window.sendding) {
      window.sendding.xhrGlobal = xhr;
    }

    xhr.open('PUT', getVitamProxyUrl('envoi'));
    xhr.withCredentials = true;
    xhr.setRequestHeader('X-File-Name', fichier.name);
    xhr.setRequestHeader('Content-Range', `bytes ${decalage}-${fichier.size - 1}/${fichier.size}`);
    for (const [key, value] of Object.entries(extraHeaders)) {
      xhr.setRequestHeader(key, value);
    }

    xhr.upload.onprogress = (e) => {
      const pourcentage = Math.round(((decalage + e.loaded) / fichier.size) * 100);
      if (decalage > 0 && infoReprise) infoReprise.textContent = `Reprise à ${pourcentage}%`;
      if (typeof onUploadProgress === 'function') onUploadProgress(pourcentage);
    };

    const resetUi = () => {
      if (infoReprise) infoReprise.textContent = '';
    };

    xhr.onerror = () => {
      resetUi();
      if (typeof onUploadProgress === 'function') onUploadProgress(0);
      afficherStatus("<i class='fa-solid fa-exclamation-triangle me-2'></i>Erreur d'envoi sur le serveur, veuillez réessayer.", 'danger');
      reject(new Error("Erreur d'envoi"));
    };

    xhr.onabort = () => {
      resetUi();
      if (typeof onUploadProgress === 'function') onUploadProgress(0);
      reject(new Error('Envoi annulé'));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resetUi();
        if (typeof onUploadProgress === 'function') onUploadProgress(100);
        resolve();
        return;
      }

      resetUi();
      if (typeof onUploadProgress === 'function') onUploadProgress(0);
      if (xhr.status === 413) {
        afficherStatus("<i class='fa-solid fa-exclamation-triangle me-2'></i>Fichier trop volumineux (413). La limite serveur doit être augmentée.", 'danger');
        reject(new Error('413 Request Entity Too Large'));
        return;
      }
      afficherStatus("<i class='fa-solid fa-exclamation-triangle me-2'></i>Erreur d'envoi sur le serveur, veuillez réessayer.", 'danger');
      reject(new Error(`Erreur HTTP ${xhr.status}`));
    };

    xhr.send(fichier.slice(decalage));
  });
}

export async function envoyerFichier(importerCardConfirm, envoyerFichierAvecRemplacement, mettreAJourStatutPaquet, onUploadProgress) {
  const input = document.getElementById('inputFichier');
  if (!input || !input.files[0]) return;
  const fichier = input.files[0];
  let decalage = 0, statut = "";
  let donnees = {};
  try {
    donnees = await callVitamAPI('envoi', {
      headers: { 'X-File-Name': fichier.name }
    });
    decalage = donnees.offset || 0;
    statut = donnees.status || "";
  } catch (e) {
    afficherStatus("<i class='fa-solid fa-wifi me-2'></i>Erreur de connexion au serveur", "danger");
    throw e;
  }

  // Gestion des cas d'existence et MD5
  if (donnees.exist === true) {
    const afficherModalConfirmation = (card) => {
      let modalContainer = document.getElementById('modalCardConfirm');
      if (!modalContainer) {
        modalContainer = document.createElement('div');
        modalContainer.id = 'modalCardConfirm';
        modalContainer.style.position = 'fixed';
        modalContainer.style.top = '0';
        modalContainer.style.left = '0';
        modalContainer.style.width = '100vw';
        modalContainer.style.height = '100vh';
        modalContainer.style.background = 'rgba(0,0,0,0.3)';
        modalContainer.style.display = 'flex';
        modalContainer.style.alignItems = 'center';
        modalContainer.style.justifyContent = 'center';
        modalContainer.style.zIndex = '9999';
        modalContainer.addEventListener('click', (e) => {
          if (e.target === modalContainer) {
            modalContainer.remove();
            afficherStatus("Envoi annulé par l'utilisateur.", 'warning');
          }
        });
        document.body.appendChild(modalContainer);
      }
      modalContainer.innerHTML = '';
      modalContainer.appendChild(card);
    };

    let md5Local = '';
    try {
      md5Local = await attendreMD5Local({ timeoutMs: 60000, fileName: fichier.name });
    } catch {
      md5Local = getMd5LocalValue();
    }
    let md5Distant = '';

    if (donnees.md5 && donnees.md5 !== "") {
      md5Distant = donnees.md5;
    } else {
      try {
        const donneesMd5 = await callVitamAPI('md5', {
          headers: { 'X-File-Name': fichier.name }
        });
        md5Distant = donneesMd5?.md5 || '';
      } catch (e) { md5Distant = ''; }
    }

    if (md5Local && md5Distant && md5Distant === md5Local) {
      afficherStatus(`<i class='fa-solid fa-info-circle me-2'></i>Le fichier <strong>${fichier.name}</strong> existe déjà sur le serveur avec un MD5 identique.`, "info");
      if (typeof onUploadProgress === 'function') onUploadProgress(100);
      return;
    } else if (md5Distant) {
      return new Promise((resolve, reject) => {
        importerCardConfirm()
          .then(({ afficherCardConfirm }) => {
            const card = afficherCardConfirm({
              nomFichier: fichier.name,
              onConfirmer: async () => {
                document.getElementById('modalCardConfirm')?.remove();
                try {
                  await envoyerFichierAvecRemplacement(fichier, mettreAJourStatutPaquet, onUploadProgress);
                  resolve();
                } catch (e) {
                  reject(e);
                }
              },
              onAnnuler: () => {
                document.getElementById('modalCardConfirm')?.remove();
                afficherStatus("Envoi annulé par l'utilisateur.", "warning");
                reject(new Error('Envoi annulé'));
              }
            });
            afficherModalConfirmation(card);
          })
          .catch(reject);
      });
    }
  }
  if (statut === "error_exist_a_supprimer") {
    afficherStatus("<i class='fa-solid fa-exclamation-triangle me-2'></i>Le paquet existe déjà sur le serveur.", "warning");
    if (typeof onUploadProgress === 'function') onUploadProgress(0);
    return;
  }
  if (decalage >= fichier.size) {
    await mettreAJourStatutPaquet(fichier.name, 7, true);
    afficherStatus(`<i class='fa-solid fa-check-circle me-2'></i>Le paquet <strong>${fichier.name}</strong> envoyé avec succès au serveur.`, "success");
    if (typeof onUploadProgress === 'function') onUploadProgress(100);
    if (typeof window.calculerMD5Distant === 'function') window.calculerMD5Distant();
    return;
  }
  
  await uploaderViaXhr({ fichier, decalage, onUploadProgress });
  await mettreAJourStatutPaquet(fichier.name, 7, true);
  if (typeof window.calculerMD5Distant === 'function') window.calculerMD5Distant();
}

// Remplacement complet : suppression, upload, recalcul MD5
export async function envoyerFichierAvecRemplacement(fichier, mettreAJourStatutPaquet, onUploadProgress) {
  const infoReprise = document.getElementById('infoReprise');
  let decalage = 0;
  // 1. Supprimer l'ancien fichier sur le serveur (méthode GET, header X-File-Name)
  try {
    await callVitamAPI('supprime', {
      method: 'GET',
      headers: {
        'X-File-Name': fichier.name
      }
    });
  } catch (e) {
    afficherStatus("<i class='fa-solid fa-wifi me-2'></i>Erreur de connexion lors de la suppression.", "danger");
    throw e;
  }

  // 2. Préparer l'envoi du nouveau fichier
  try {
    const donnees = await callVitamAPI('envoi', {
      headers: { 'X-File-Name': fichier.name, 'X-Force-Replace': '1' }
    });
    decalage = donnees.offset || 0;
  } catch (e) {
    afficherStatus("<i class='fa-solid fa-wifi me-2'></i>Erreur de connexion au serveur", "danger");
    throw e;
  }

  await uploaderViaXhr({
    fichier,
    decalage,
    extraHeaders: { 'X-Force-Replace': '1' },
    onUploadProgress
  });
  await mettreAJourStatutPaquet(fichier.name, 7, true);
  if (typeof window.calculerMD5Distant === 'function') window.calculerMD5Distant();
}
