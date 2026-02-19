
function coalesce(...values) {
	for (const value of values) {
		if (value !== null && value !== undefined) return value;
	}
	return null;
}

function normalizeStatusName(value) {
	if (value === null || value === undefined) return null;
	const name = String(value).trim();
	return name.length ? name : null;
}

function escapeHtml(value) {
	const str = value === null || value === undefined ? '' : String(value);
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

const STATUS_BG_BY_NAME = {
	INEXISTANT: 'bg-dark',
	NON_ENVOYE: 'bg-secondary',
	ENVOI_OK: 'bg-success',
	ENVOI_EN_COURS: 'bg-primary',
	ENVOI_EN_ERREUR: 'bg-warning',
	ENVOI_EN_PAUSE: 'bg-warning',
	ENVOI_SCDI_OK: 'bg-info',
    ENVOI_SCDI_ATTENTE: 'bg-info'
};

const STATUS_HELP_BY_NAME = {
	INEXISTANT: "ZIP non créé",
	NON_ENVOYE: "ZIP créé mais pas d'envoi au cines.",
	ENVOI_EN_COURS: "Envoi en cours.",
	ENVOI_OK: "Envoi au cines terminé.",
	ENVOI_EN_ERREUR: "Envoi en erreur (à vérifier / relancer) par le cines.",
	ENVOI_EN_PAUSE: "Envoi mis en pause par le cines.",
	ENVOI_SCDI_OK: "Envoi sur le serveur ok.",
	ENVOI_SCDI_ATTENTE: "Envoi en différé, en attente d'être envoyé au cines."
};

export function normalizeStatus(status) {
	if (!status) return null;
	const name = normalizeStatusName(
		coalesce(status.name_status, status.nameStatus, status.name, status.statut)
	);
	if (!name) return null;
	return { name };
}

export function formatStatusLabel(name, unknownLabel = 'Inconnu') {
	const normalizedName = normalizeStatusName(name);
	if (!normalizedName) return unknownLabel;
	return normalizedName.replaceAll('_', ' ');
}

export function getStatusHelpText(name, unknownLabel = 'Inconnu') {
	const normalizedName = normalizeStatusName(name);
	if (!normalizedName) return unknownLabel;
	const key = normalizedName.toUpperCase();
	return STATUS_HELP_BY_NAME[key] || `Statut : ${formatStatusLabel(normalizedName, unknownLabel)}`;
}

function ensureTooltipZIndex() {
	if (document.getElementById('bootstrap-tooltip-zindex-fix')) return;
	const style = document.createElement('style');
	style.id = 'bootstrap-tooltip-zindex-fix';
	style.textContent = `
		.tooltip { z-index: 6000 !important; }
	`;
	document.head.appendChild(style);
}

export function initBootstrapTooltips(root = document) {
	const bootstrap = window.bootstrap;
	if (!bootstrap || !bootstrap.Tooltip) return false;
	ensureTooltipZIndex();
	const scope = root && root.querySelectorAll ? root : document;
	const nodes = scope.querySelectorAll('[data-bs-toggle="tooltip"]');
	nodes.forEach((el) => {
		try {
			if (bootstrap.Tooltip.getOrCreateInstance) {
				bootstrap.Tooltip.getOrCreateInstance(el, { trigger: 'hover focus', container: 'body' });
			} else {
				new bootstrap.Tooltip(el, { trigger: 'hover focus', container: 'body' });
			}
		} catch (_) {
		}
	});
	return true;
}

export function getStatusBgClass(statusOrIdOrName) {
	if (statusOrIdOrName === null || statusOrIdOrName === undefined) return 'bg-secondary';

	if (typeof statusOrIdOrName === 'number' || typeof statusOrIdOrName === 'string') {
		const asName = normalizeStatusName(statusOrIdOrName);
		if (asName) return STATUS_BG_BY_NAME[asName.toUpperCase()] || 'bg-secondary';
		return 'bg-secondary';
	}

	const meta = normalizeStatus(statusOrIdOrName);
	if (!meta) return 'bg-secondary';
	if (meta.name) return STATUS_BG_BY_NAME[meta.name.toUpperCase()] || 'bg-secondary';
	return 'bg-secondary';
}

export function renderStatusBadge(statusOrIdOrName, { unknownLabel = 'Inconnu', extraClass = '' } = {}) {
	let label = unknownLabel;
	let rawNameForHelp = null;
	if (typeof statusOrIdOrName === 'object' && statusOrIdOrName) {
		const meta = normalizeStatus(statusOrIdOrName);
		rawNameForHelp = meta?.name ?? null;
		label = formatStatusLabel(rawNameForHelp, unknownLabel);
	} else if (typeof statusOrIdOrName === 'string') {
		rawNameForHelp = statusOrIdOrName;
		label = formatStatusLabel(rawNameForHelp, unknownLabel);
	}

	const help = getStatusHelpText(rawNameForHelp, unknownLabel);
	const safeHelp = escapeHtml(help);
	const safeLabel = escapeHtml(label);

	const bgClass = getStatusBgClass(statusOrIdOrName);
	const className = ['badge', bgClass, extraClass].filter(Boolean).join(' ');
	return `<span class="${className}" data-bs-toggle="tooltip" data-bs-placement="top" title="${safeHelp}">${safeLabel}</span>`;
}

