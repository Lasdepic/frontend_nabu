

import { afficherSpinner, afficherStatus, chargerFeuilleDeStyle, chargerScript } from './helpersUI.js';
import { calculerMD5Local, calculerMD5Distant, comparerMD5 } from './md5.js';
import { envoyerFichier, envoyerFichierAvecRemplacement } from './upload.js';
import { mettreAJourStatutPaquet } from './statutPaquet.js';

const URL_API = 'https://vitam.scdi-montpellier.fr:8443/';
const JETON_API = '800HxwzchfvLh9E8YjXf5UfGDaJ8Iz3UG0v2T7dwDMZByzcsOAfw10uS98rY0RqR';

window.comparerMD5 = comparerMD5;
window.calculerMD5Distant = () => calculerMD5Distant(URL_API, JETON_API);

chargerFeuilleDeStyle("https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css");
chargerFeuilleDeStyle("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css");
chargerScript("https://cdnjs.cloudflare.com/ajax/libs/spark-md5/3.0.2/spark-md5.min.js").then(initialiserUI);

async function initialiserUI() {
  document.body.innerHTML = '';
  const header = document.createElement('header');
  document.body.appendChild(header);
  try {
    const navbar = await import('../../components/navbar.js');
    if (navbar?.initNavbar) navbar.initNavbar('header');
  } catch {}

  const conteneur = document.createElement("div");
  conteneur.className = "container py-5 d-flex justify-content-center align-items-center min-vh-100";
  const card = document.createElement("div");
  card.className = "card shadow-lg w-100";
  card.style.maxWidth = "520px";
  card.innerHTML = `
    <div class="card-header bg-primary text-white text-center">
      <h4 class='mb-0'><i class="fa-solid fa-upload me-2"></i>Uploader un fichier ZIP</h4>
    </div>
    <div class="card-body">
      <div class="mb-4">
        <label for="inputFichier" class="form-label fw-bold">Sélectionner un fichier ZIP</label>
        <input type="file" id="inputFichier" accept=".zip" class="form-control" />
      </div>
      <button class="btn btn-success w-100 mb-3 fw-bold" id="btnEnvoyer">Envoyer le fichier</button>
      <div>
        <div class="mb-3">
          <label class="form-label fw-bold">Hash MD5 local :</label>
          <div class="input-group align-items-center mb-2">
            <span id="md5LocalSpin" style="display:none; width: 1.5em; height: 1.5em; border: 0.2em solid #ccc; border-top: 0.2em solid #007bff; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 0.5em;" role="status">
              <span class="visually-hidden">Loading...</span>
            </span>
            <input type="text" id="md5Local" class="form-control bg-white" readonly style="font-family:monospace;" />
          </div>
          <div class="progress mb-1" style="height: 8px;">
            <div id="md5LocalProgress" class="progress-bar bg-info" role="progressbar" style="width: 0%; transition: width 0.2s;"></div>
          </div>
          <small id="md5LocalTxt" class="text-muted"></small>
        </div>
        <style>@keyframes spin {0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}</style>
        <div id="infoReprise" class="mb-2 text-warning small"></div>
        <div id="zoneStatus" class="alert alert-secondary text-center mb-3">En attente d'envoi au CINES...</div>
        <div class="mb-3">
          <label class="form-label fw-bold">Hash MD5 distant :</label>
          <div class="input-group align-items-center">
            <div id="md5DistantSpin" class="spinner-border spinner-border-sm text-primary me-2" role="status" style="display:none;"></div>
            <input type="text" id="md5Distant" class="form-control bg-white" readonly style="font-family:monospace;" />
          </div>
          <small id="md5DistantTxt" class="text-muted"></small>
        </div>
        <div id="concordanceMD5"></div>
      </div>
    </div>`;
  conteneur.appendChild(card);
  document.body.appendChild(conteneur);
  document.getElementById('btnEnvoyer').onclick = gererEnvoi;
}

function gererEnvoi() {
  const bouton = document.getElementById('btnEnvoyer');
  bouton.disabled = true;
  [
    'md5DistantSpin','md5DistantTxt','md5Distant',
    'md5LocalSpin','md5LocalTxt','md5Local',
    'concordanceMD5','infoReprise'
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = "";
  });
  afficherStatus("En attente d'envoi...", "secondary");
  calculerMD5Local().then(() => {
    const importerCardConfirm = () => import('../../components/download/cardConfirm.js');
    envoyerFichier(
      URL_API,
      JETON_API,
      importerCardConfirm,
      envoyerFichierAvecRemplacement,
      mettreAJourStatutPaquet
    );
  }).finally(() => { bouton.disabled = false; });
}

window.EnvoiCinesImmediat = function() { alert("Envoi immédiat déclenché !"); };
window.EnvoiCinesDiffere = function() { alert("Envoi différé déclenché !"); };
