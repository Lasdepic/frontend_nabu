
const VITAM_PROXY_URL = '/stage/backend_nabu/index.php?vitam-proxy=1';

export async function callVitamAPI(action, options = {}) {
  const url = `${VITAM_PROXY_URL}&action=${encodeURIComponent(action)}`;
  const response = await fetch(url, options);
  if (!response.ok) throw new Error('Erreur API Vitam');
  return response.json();
}

