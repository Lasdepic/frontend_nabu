// Fonctions utilitaires pour l'UI
export function afficherStatus(message, type = "secondary") {
  const zone = document.getElementById('zoneStatus');
  if (zone) {
    zone.className = `alert alert-${type} text-center mb-3`;
    zone.innerHTML = message;
    zone.classList.remove('d-none');
    zone.removeAttribute('hidden');
    
    zone.style.animation = 'fadeIn 0.3s ease-in';
    
    if (type === 'success') {
      setTimeout(() => {
        zone.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
          zone.classList.add('d-none');
        }, 300);
      }, 5000);
    }
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
