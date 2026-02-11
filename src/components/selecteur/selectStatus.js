
import { fetchAllStatus } from '../../API/paquet/status.js';

function normalizeStatusLabel(label) {
    return String(label || '')
        .trim()
        .toUpperCase()
        .replace(/\s+/g, '_');
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
    if (statusList && statusList.data) statusList = statusList.data;
    if (Array.isArray(statusList)) {
        const allowedSet = Array.isArray(allowedLabels) && allowedLabels.length
            ? new Set(allowedLabels.map(normalizeStatusLabel))
            : null;

        statusList.forEach(status => {
            const label = status.nameStatus || status.nom || status.name || status.label || 'Statut inconnu';
            if (allowedSet && !allowedSet.has(normalizeStatusLabel(label))) {
                return;
            }
            const option = document.createElement('option');
            option.value = status.idStatus || status.id || status.ID || '';
            option.textContent = label;
            if (value && option.value == value) option.selected = true;
            select.appendChild(option);
        });
    }

    if (typeof onChange === 'function') {
        select.addEventListener('change', onChange);
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'mb-3';
    wrapper.appendChild(select);
    return wrapper;
}

