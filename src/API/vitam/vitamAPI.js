
const VITAM_PROXY_URL = 'backend_nabu/index.php?vitam-proxy=1';

export function getVitamProxyUrl(action) {
  return `${VITAM_PROXY_URL}&action=${encodeURIComponent(action)}`;
}

export async function callVitamAPI(action, options = {}) {
  const url = getVitamProxyUrl(action);
  const credentials = options.credentials ?? 'include';
  const fetchOptions = {
    ...options,
    credentials
  };

  const response = await fetch(url, fetchOptions);
  if (!response.ok) throw new Error(`Erreur API Vitam (HTTP ${response.status})`);
  return response.json();
}

