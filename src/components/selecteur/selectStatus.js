
import { fetchAllStatus } from '../../API/paquet/status.js';

function normalizeStatusLabel(label) {

    let text = label == null ? '' : String(label);

    text = text.trim().toUpperCase();

    text = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    text = text.replace(/[^A-Z0-9]+/g, '_');

    text = text.replace(/^_+|_+$/g, '');

    return text;
}

function getStatusLabel(status) {
    return (
        status?.nameStatus ||
        status?.nom ||
        status?.name ||
        status?.label ||
        'Statut inconnu'
    );
}

function getStatusId(status) {
    return status?.idStatus || status?.id || status?.ID || '';
}

export async function createStatusSelector({
    id = '',
    name = '',
    onChange = null,
    value = '',
    allowedLabels = null,
} = {}) {
    const select = document.createElement('select');
    if (id) select.id = id;
    if (name) select.name = name;

    select.className = 'form-select status-selector';

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '-- Sélectionner un statut --';
    select.appendChild(defaultOption);

    let statusList = await fetchAllStatus();
    if (statusList && statusList.data) {
        statusList = statusList.data;
    }

    // allowedLabels = liste optionnelle de labels autorisés
    let allowedSet = null;
    if (Array.isArray(allowedLabels) && allowedLabels.length > 0) {
        allowedSet = new Set();
        for (const allowedLabel of allowedLabels) {
            allowedSet.add(normalizeStatusLabel(allowedLabel));
        }
    }

    if (Array.isArray(statusList)) {
        for (const status of statusList) {
            const label = getStatusLabel(status);
            const normalizedLabel = normalizeStatusLabel(label);

            // Si on a une liste autorisée, on filtre
            if (allowedSet && !allowedSet.has(normalizedLabel)) {
                continue;
            }

            const option = document.createElement('option');
            option.value = getStatusId(status);
            option.textContent = label;
            option.dataset.normalizedLabel = normalizedLabel;

            if (value && option.value == value) {
                option.selected = true;
            }

            select.appendChild(option);
        }
    }

    if (typeof onChange === 'function') {
        select.addEventListener('change', onChange);
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'mb-3';
    wrapper.appendChild(select);
    return wrapper;
}

