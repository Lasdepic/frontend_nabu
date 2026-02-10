
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
	if (typeof statusOrIdOrName === 'object' && statusOrIdOrName) {
		const meta = normalizeStatus(statusOrIdOrName);
		label = formatStatusLabel(meta?.name, unknownLabel);
	} else if (typeof statusOrIdOrName === 'string') {
		label = formatStatusLabel(statusOrIdOrName, unknownLabel);
	}

	const bgClass = getStatusBgClass(statusOrIdOrName);
	const className = ['badge', bgClass, extraClass].filter(Boolean).join(' ');
	return `<span class="${className}">${label}</span>`;
}

