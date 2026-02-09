// Gestion de l'envoi du fichier (upload)
import { afficherStatus } from './helpersUI.js';
import { comparerMD5 } from './md5.js';

const VITAM_PROXY_URL = '/stage/backend_nabu/index.php?vitam-proxy=1';

export async function envoyerFichier(importerCardConfirm, envoyerFichierAvecRemplacement, mettreAJourStatutPaquet, onUploadProgress) {
  const input = document.getElementById('inputFichier');
  const infoReprise = document.getElementById('infoReprise');
  if (!input || !input.files[0]) return;
  const fichier = input.files[0];
  let decalage = 0, statut = "";
  let donnees = {};
  try {
    const reponse = await fetch(`${VITAM_PROXY_URL}&action=envoi`, {
      headers: { 'X-File-Name': fichier.name },
      credentials: 'include'
    });
    if (!reponse.ok) throw new Error('Erreur réseau');
    donnees = await reponse.json();
    decalage = donnees.offset || 0;
    statut = donnees.status || "";
  } catch (e) {
    afficherStatus("<i class='fa-solid fa-wifi me-2'></i>Erreur de connexion au serveur", "danger");
    throw e;
  }

  // Gestion des cas d'existence et MD5
  if (donnees.exist === true) {
    const attendreMD5Local = () => {
      return new Promise(resolve => {
        const md5LocalInput = document.getElementById('md5Local');
        const checkMD5 = () => {
          if (md5LocalInput && md5LocalInput.value && md5LocalInput.value !== '') {
            resolve(md5LocalInput.value);
          } else {
            setTimeout(checkMD5, 100);
          }
        };
        checkMD5();
      });
    };

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
        document.body.appendChild(modalContainer);
      }
      modalContainer.innerHTML = '';
      modalContainer.appendChild(card);
    };

    const md5Local = await attendreMD5Local();
    let md5Distant = '';

    if (donnees.md5 && donnees.md5 !== "") {
      md5Distant = donnees.md5;
    } else {
      try {
        const reponse = await fetch(`${VITAM_PROXY_URL}&action=md5`, {
          headers: { 'X-File-Name': fichier.name },
          credentials: 'include'
        });
        if (reponse.ok) {
          const donneesMd5 = await reponse.json();
          md5Distant = donneesMd5.md5 || '';
        }
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
  
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    if (window.sendding) {
      window.sendding.xhrGlobal = xhr;
    }
    
    xhr.open("PUT", `${VITAM_PROXY_URL}&action=envoi`);
    xhr.withCredentials = true;
    xhr.setRequestHeader("X-File-Name", fichier.name);
    xhr.setRequestHeader("Content-Range", `bytes ${decalage}-${fichier.size-1}/${fichier.size}`);
    
    xhr.upload.onprogress = e => {
      const pourcentage = Math.round(((decalage+e.loaded)/fichier.size)*100);
      if (decalage > 0 && infoReprise) infoReprise.textContent = `Reprise à ${pourcentage}%`;
      if (typeof onUploadProgress === 'function') onUploadProgress(pourcentage);
    };
    
    xhr.onerror = () => {
      if (infoReprise) infoReprise.textContent = "";
      if (typeof onUploadProgress === 'function') onUploadProgress(0);
      afficherStatus("<i class='fa-solid fa-exclamation-triangle me-2'></i>Erreur d'envoi sur le serveur, veuillez réessayer.", "danger");
      reject(new Error('Erreur d\'envoi'));
    };
    
    xhr.onabort = () => {
      if (infoReprise) infoReprise.textContent = "";
      if (typeof onUploadProgress === 'function') onUploadProgress(0);
      reject(new Error('Envoi annulé'));
    };
    
    xhr.onload = async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        if (infoReprise) infoReprise.textContent = "";
        if (typeof onUploadProgress === 'function') onUploadProgress(100);
        await mettreAJourStatutPaquet(fichier.name, 7, true); 
        if (typeof window.calculerMD5Distant === 'function') window.calculerMD5Distant();
        resolve();
      } else {
        if (infoReprise) infoReprise.textContent = "";
        if (typeof onUploadProgress === 'function') onUploadProgress(0);
        if (xhr.status === 413) {
          afficherStatus("<i class='fa-solid fa-exclamation-triangle me-2'></i>Fichier trop volumineux (413). La limite serveur doit être augmentée.", 'danger');
          reject(new Error('413 Request Entity Too Large'));
          return;
        }
        afficherStatus("<i class='fa-solid fa-exclamation-triangle me-2'></i>Erreur d'envoi sur le serveur, veuillez réessayer.", "danger");
        reject(new Error(`Erreur HTTP ${xhr.status}`));
      }
    };
    
    xhr.send(fichier.slice(decalage));
  });
}

// Remplacement complet : suppression, upload, recalcul MD5
export async function envoyerFichierAvecRemplacement(fichier, mettreAJourStatutPaquet, onUploadProgress) {
  const infoReprise = document.getElementById('infoReprise');
  let decalage = 0;
  // 1. Supprimer l'ancien fichier sur le serveur (méthode GET, header X-File-Name)
  try {
    const reponseSupp = await fetch(`${VITAM_PROXY_URL}&action=supprime`, {
      method: 'GET',
      headers: {
        'X-File-Name': fichier.name
      },
      credentials: 'include'
    });
    if (!reponseSupp.ok) {
      afficherStatus("<i class='fa-solid fa-exclamation-triangle me-2'></i>Erreur lors de la suppression de l'ancien fichier.", "danger");
      throw new Error('Erreur suppression');
    }
  } catch (e) {
    afficherStatus("<i class='fa-solid fa-wifi me-2'></i>Erreur de connexion lors de la suppression.", "danger");
    throw e;
  }

  // 2. Préparer l'envoi du nouveau fichier
  try {
    const reponse = await fetch(`${VITAM_PROXY_URL}&action=envoi`, {
      headers: { 'X-File-Name': fichier.name, 'X-Force-Replace': '1' },
      credentials: 'include'
    });
    if (!reponse.ok) throw new Error('Erreur réseau');
    const donnees = await reponse.json();
    decalage = donnees.offset || 0;
  } catch (e) {
    afficherStatus("<i class='fa-solid fa-wifi me-2'></i>Erreur de connexion au serveur", "danger");
    throw e;
  }
  
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    // Stocker xhr globalement pour permettre l'annulation
    if (window.sendding) {
      window.sendding.xhrGlobal = xhr;
    }
    
    xhr.open("PUT", `${VITAM_PROXY_URL}&action=envoi`);
    xhr.withCredentials = true;
    xhr.setRequestHeader("X-File-Name", fichier.name);
    xhr.setRequestHeader("X-Force-Replace", "1");
    xhr.setRequestHeader("Content-Range", `bytes ${decalage}-${fichier.size-1}/${fichier.size}`);
    
    xhr.upload.onprogress = e => {
      const pourcentage = Math.round(((decalage+e.loaded)/fichier.size)*100);
      if (decalage > 0 && infoReprise) infoReprise.textContent = `Reprise à ${pourcentage}%`;
      if (typeof onUploadProgress === 'function') onUploadProgress(pourcentage);
    };
    
    xhr.onerror = () => {
      if (infoReprise) infoReprise.textContent = "";
      if (typeof onUploadProgress === 'function') onUploadProgress(0);
      afficherStatus("<i class='fa-solid fa-exclamation-triangle me-2'></i>Erreur d'envoi sur le serveur, veuillez réessayer.", "danger");
      reject(new Error('Erreur d\'envoi'));
    };
    
    xhr.onabort = () => {
      if (infoReprise) infoReprise.textContent = "";
      if (typeof onUploadProgress === 'function') onUploadProgress(0);
      reject(new Error('Envoi annulé'));
    };
    
    xhr.onload = async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        if (infoReprise) infoReprise.textContent = "";
        if (typeof onUploadProgress === 'function') onUploadProgress(100);
        await mettreAJourStatutPaquet(fichier.name, 7, true); 
        // 3. Calculer le MD5 du nouveau fichier après l'envoi
        if (typeof window.calculerMD5Distant === 'function') window.calculerMD5Distant();
        resolve();
      } else {
        if (infoReprise) infoReprise.textContent = "";
        if (typeof onUploadProgress === 'function') onUploadProgress(0);
        afficherStatus("<i class='fa-solid fa-exclamation-triangle me-2'></i>Erreur d'envoi sur le serveur, veuillez réessayer.", "danger");
        reject(new Error('Erreur HTTP'));
      }
    };
    
    xhr.send(fichier.slice(decalage));
  });
}
