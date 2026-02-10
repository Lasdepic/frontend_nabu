
import API_URL from '../config/config.js';

const API_BASE_URL = API_URL.replace(/\/$/, '');
const VITAM_PROXY_BASE_URL = `${API_BASE_URL}/backend_nabu/index.php`;

export function getVitamProxyUrl(action) {
  const url = new URL(VITAM_PROXY_BASE_URL);
  url.searchParams.set('vitam-proxy', '1');
  url.searchParams.set('action', action);
  return url.toString();
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

