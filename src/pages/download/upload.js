// Gestion de l'envoi du fichier (upload)
import { afficherStatus } from './helpersUI.js';
import { comparerMD5 } from './md5.js';

export async function envoyerFichier(URL_API, JETON_API, importerCardConfirm, envoyerFichierAvecRemplacement, mettreAJourStatutPaquet, onUploadProgress) {
  const input = document.getElementById('inputFichier');
  const infoReprise = document.getElementById('infoReprise');
  if (!input || !input.files[0]) return;
  const fichier = input.files[0];
  let decalage = 0, statut = "";
  let donnees = {};
  try {
    const reponse = await fetch(URL_API+'index.php?action=envoi', {
      headers: { Authorization: 'Bearer ' + JETON_API, 'X-File-Name': fichier.name }
    });
    if (!reponse.ok) throw new Error('Erreur réseau');
    donnees = await reponse.json();
    decalage = donnees.offset || 0;
    statut = donnees.status || "";
  } catch (e) {
    afficherStatus("Erreur de connexion au serveur", "danger");
    return;
  }

  // Gestion des cas d'existence et MD5
  if (donnees.exist === true) {
    const md5Local = document.getElementById('md5Local')?.value;
    if (donnees.md5 && donnees.md5 !== "") {
      if (md5Local && donnees.md5 !== md5Local) {
        importerCardConfirm().then(({ afficherCardConfirm }) => {
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
          const card = afficherCardConfirm({
            nomFichier: fichier.name,
            onConfirmer: () => {
              modalContainer.remove();
              envoyerFichierAvecRemplacement(fichier, URL_API, JETON_API, mettreAJourStatutPaquet, onUploadProgress);
            },
            onAnnuler: () => {
              modalContainer.remove();
              afficherStatus("Envoi annulé par l'utilisateur.", "warning");
            }
          });
          modalContainer.appendChild(card);
        });
        return;
      } else if (md5Local && donnees.md5 === md5Local) {
        afficherStatus(`Le fichier <strong>${fichier.name}</strong> existe déjà sur le serveur avec un MD5 identique.`, "warning");
        return;
      }
    } else {
      // Si pas de md5 dans la réponse, on récupére via l'API md5
      const input = document.getElementById('inputFichier');
      if (!input || !input.files[0]) {
        afficherStatus("Le paquet existe déjà sur le serveur.", "warning");
        return;
      }
      const fichier = input.files[0];
      let md5Distant = '';
      try {
        const reponse = await fetch(URL_API+'index.php?action=md5', {
          headers: { Authorization: 'Bearer '+JETON_API, 'X-File-Name': fichier.name }
        });
        if (reponse.ok) {
          const donneesMd5 = await reponse.json();
          md5Distant = donneesMd5.md5 || '';
        }
      } catch (e) { md5Distant = ''; }
      const md5Local = document.getElementById('md5Local')?.value;
      if (md5Local && md5Distant && md5Distant !== md5Local) {
        importerCardConfirm().then(({ afficherCardConfirm }) => {
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
          const card = afficherCardConfirm({
            nomFichier: fichier.name,
            onConfirmer: () => {
              modalContainer.remove();
              envoyerFichierAvecRemplacement(fichier, URL_API, JETON_API, mettreAJourStatutPaquet, onUploadProgress);
            },
            onAnnuler: () => {
              modalContainer.remove();
              afficherStatus("Envoi annulé par l'utilisateur.", "warning");
            }
          });
          modalContainer.appendChild(card);
        });
        return;
      } else if (md5Local && md5Distant && md5Distant === md5Local) {
        afficherStatus(`Le fichier <strong>${fichier.name}</strong> existe déjà sur le serveur avec un MD5 identique.`, "warning");
        setTimeout(() => window.location.reload(), 3000);
        return;
      } else {
        afficherStatus("Le paquet existe déjà sur le serveur.", "warning");
        setTimeout(() => window.location.reload(), 3000);
        return;
      }
    }
  }
  if (statut === "error_exist_a_supprimer") {
    afficherStatus("Le paquet existe déjà sur le serveur.", "warning");
    return;
  }
  if (decalage >= fichier.size) {
    await mettreAJourStatutPaquet(fichier.name, 7);
    afficherStatus(`Le paquet <strong>${fichier.name}</strong> envoyé avec succès au serveur.`, "success");
    if (typeof window.calculerMD5Distant === 'function') window.calculerMD5Distant();
    return;
  }
  const xhr = new XMLHttpRequest();
  xhr.open("PUT", URL_API+'index.php?action=envoi');
  xhr.setRequestHeader("Authorization", "Bearer "+JETON_API);
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
    afficherStatus("Erreur d'envoi sur le serveur, veuillez réessayer.", "danger");
  };
  xhr.onload = async () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      if (infoReprise) infoReprise.textContent = "";
      if (typeof onUploadProgress === 'function') onUploadProgress(100);
      await mettreAJourStatutPaquet(fichier.name, 7); 
      if (typeof window.calculerMD5Distant === 'function') window.calculerMD5Distant();
    } else {
      if (infoReprise) infoReprise.textContent = "";
      if (typeof onUploadProgress === 'function') onUploadProgress(0);
      afficherStatus("Erreur d'envoi sur le serveur, veuillez réessayer.", "danger");
    }
  };
  xhr.send(fichier.slice(decalage));
}

// Remplacement complet : suppression, upload, recalcul MD5
export async function envoyerFichierAvecRemplacement(fichier, URL_API, JETON_API, mettreAJourStatutPaquet, onUploadProgress) {
  const infoReprise = document.getElementById('infoReprise');
  let decalage = 0;
  // 1. Supprimer l'ancien fichier sur le serveur (méthode GET, header X-File-Name)
  try {
    const reponseSupp = await fetch(URL_API + 'index.php?action=supprime', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + JETON_API,
        'X-File-Name': fichier.name
      }
    });
    if (!reponseSupp.ok) {
      afficherStatus("Erreur lors de la suppression de l'ancien fichier.", "danger");
      return;
    }
  } catch (e) {
    afficherStatus("Erreur de connexion lors de la suppression.", "danger");
    return;
  }

  // 2. Préparer l'envoi du nouveau fichier
  try {
    const reponse = await fetch(URL_API+'index.php?action=envoi', {
      headers: { Authorization: 'Bearer ' + JETON_API, 'X-File-Name': fichier.name, 'X-Force-Replace': '1' }
    });
    if (!reponse.ok) throw new Error('Erreur réseau');
    const donnees = await reponse.json();
    decalage = donnees.offset || 0;
  } catch (e) {
    afficherStatus("Erreur de connexion au serveur", "danger");
    return;
  }
  const xhr = new XMLHttpRequest();
  xhr.open("PUT", URL_API+'index.php?action=envoi');
  xhr.setRequestHeader("Authorization", "Bearer "+JETON_API);
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
    afficherStatus("Erreur d'envoi sur le serveur, veuillez réessayer.", "danger");
  };
  xhr.onload = async () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      if (infoReprise) infoReprise.textContent = "";
      if (typeof onUploadProgress === 'function') onUploadProgress(100);
      await mettreAJourStatutPaquet(fichier.name, 7); 
      // 3. Calculer le MD5 du nouveau fichier après l'envoi
      if (typeof window.calculerMD5Distant === 'function') window.calculerMD5Distant();
    } else {
      if (infoReprise) infoReprise.textContent = "";
      if (typeof onUploadProgress === 'function') onUploadProgress(0);
      afficherStatus("Erreur d'envoi sur le serveur, veuillez réessayer.", "danger");
    }
  };
  xhr.send(fichier.slice(decalage));
}
