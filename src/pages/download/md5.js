// Fonctions liées au calcul et à la comparaison des MD5

export async function calculerMD5Local() {
  const input = document.getElementById('inputFichier');
  const md5LocalTxt = document.getElementById('md5LocalTxt');
  const md5LocalProgress = document.getElementById('md5LocalProgress');
  if (!input || !input.files[0]) return;
  const fichier = input.files[0];
  if (md5LocalTxt) md5LocalTxt.textContent = "Calcul du hash en cours...";
  if (md5LocalProgress) md5LocalProgress.style.width = '0%';
  // Récupérer le champ caché pour stocker le hash
  const md5Local = document.getElementById('md5Local');
  const tailleMorceau = 2 * 1024 * 1024;
  const nombreMorceaux = Math.ceil(fichier.size / tailleMorceau);
  let morceauActuel = 0;
  const calculateurMD5 = new SparkMD5.ArrayBuffer();
  const lecteur = new FileReader();
  return new Promise(resolve => {
    lecteur.onload = e => {
      calculateurMD5.append(e.target.result);
      morceauActuel++;
      const pourcentage = Math.ceil(morceauActuel*100/nombreMorceaux);
      if (md5LocalProgress) md5LocalProgress.style.width = pourcentage + '%';
      if (morceauActuel < nombreMorceaux) {
        chargerMorceauSuivant();
        if (md5LocalTxt) md5LocalTxt.textContent = `Calcul du hash en cours... ${pourcentage}%`;
      } else {
        const hash = calculateurMD5.end();
        if (md5LocalTxt) md5LocalTxt.textContent = "";
        // hash calculé, stocké dans le champ caché (input hidden)
        if (md5Local) md5Local.value = hash;
        try {
          window.dispatchEvent(new CustomEvent('md5local:ready', {
            detail: { md5: hash, fileName: fichier.name }
          }));
        } catch {}
        if (md5LocalProgress) md5LocalProgress.style.width = '100%';
        if (typeof window.comparerMD5 === 'function') window.comparerMD5();
        resolve();
      }
    };
    function chargerMorceauSuivant() {
      const debut = morceauActuel * tailleMorceau;
      const fin = Math.min(debut + tailleMorceau, fichier.size);
      lecteur.readAsArrayBuffer(fichier.slice(debut, fin));
    }
    chargerMorceauSuivant();
  });
}

export async function calculerMD5Distant(URL_API, JETON_API) {
  const input = document.getElementById('inputFichier');
  const md5DistantSpin = document.getElementById('md5DistantSpin');
  const md5DistantTxt = document.getElementById('md5DistantTxt');
  const md5Distant = document.getElementById('md5Distant');
  if (!input || !input.files[0]) return;
  const fichier = input.files[0];
  if (md5DistantSpin) md5DistantSpin.style.display = 'inline-block';
  if (md5DistantTxt) md5DistantTxt.textContent = "Demande en cours...";
  if (md5Distant) md5Distant.value = '';
  try {
    const reponse = await fetch(URL_API+'index.php?action=md5', {
      headers: { Authorization: 'Bearer '+JETON_API, 'X-File-Name': fichier.name }
    });
    if (!reponse.ok) throw new Error('Erreur réseau');
    const donnees = await reponse.json();
    if (md5DistantSpin) md5DistantSpin.style.display = 'none';
    if (md5DistantTxt) md5DistantTxt.textContent = "";
    if (md5Distant) md5Distant.value = donnees.md5 || "";
    if (typeof window.comparerMD5 === 'function') window.comparerMD5();
  } catch (e) {
    if (md5DistantSpin) md5DistantSpin.style.display = 'none';
    if (md5DistantTxt) md5DistantTxt.textContent = "Erreur serveur";
    if (md5Distant) md5Distant.value = '';
  }
}

export function comparerMD5() {
  const md5Local = document.getElementById('md5Local');
  const md5Distant = document.getElementById('md5Distant');
  const concordanceMD5 = document.getElementById('concordanceMD5');
  if (!md5Local || !md5Distant || !concordanceMD5) return;
  const valeurLocal = md5Local.value;
  const valeurDistant = md5Distant.value;
  if (!valeurLocal || !valeurDistant) return;
  if (valeurLocal === valeurDistant) {
    concordanceMD5.innerHTML = `
      <div class="alert alert-success mb-2 py-2 fw-bold"><i class='fa-solid fa-circle-check me-2'></i>Comparaison OK</div>
      <div id="cines" class="d-flex gap-2 justify-content-center">
        <button class="btn btn-success btn-sm px-4 fw-bold" onclick="EnvoiCinesImmediat()">Immédiat</button>
        <button class="btn btn-outline-secondary btn-sm px-4 fw-bold" onclick="EnvoiCinesDiffere()">Différé</button>
      </div>`;
  } else {
    concordanceMD5.innerHTML = `<div class="alert alert-danger py-2 fw-bold"><i class='fa-solid fa-circle-xmark me-2'></i>Comparaison KO</div>`;
  }
}
