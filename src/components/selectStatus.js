
import { fetchAllTypeDocument } from '../API/status.js';

export async function createStatusSelector({ id = '', name = '', onChange = null, value = '' } = {}) {
    const select = document.createElement('select');
    if (id) select.id = id;
    if (name) select.name = name;

    select.className = 'form-select status-selector';

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '-- Sélectionner un statut --';
    select.appendChild(defaultOption);

    let statusList = await fetchAllTypeDocument();
    if (statusList && statusList.data) statusList = statusList.data;
    if (Array.isArray(statusList)) {
        statusList.forEach(status => {
            const option = document.createElement('option');
            option.value = status.idStatus || status.id || status.ID || '';
            option.textContent = status.nameStatus || status.nom || status.name || status.label || 'Statut inconnu';
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
