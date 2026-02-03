// Fonctions utilitaires pour l'UI
export function afficherSpinner(id, afficher = true) {
  const el = document.getElementById(id);
  if (el) el.style.display = afficher ? "inline-block" : "none";
}

export function afficherStatus(message, type = "secondary") {
  const zone = document.getElementById('zoneStatus');
  if (zone) {
    zone.className = `alert alert-${type} text-center mb-3`;
    zone.innerHTML = `<i class='fa-solid fa-info-circle me-2'></i>${message}`;
    zone.style.display = '';
    zone.removeAttribute('hidden');
  }
}

export const chargerFeuilleDeStyle = url => {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = url;
  document.head.appendChild(link);
};

export const chargerScript = url => new Promise(resolve => {
  const script = document.createElement("script");
  script.src = url;
  script.onload = resolve;
  document.head.appendChild(script);
});
