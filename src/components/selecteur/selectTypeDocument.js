
import { fetchAllTypeDocument } from '../../API/typeDocument.js';

export async function createTypeDocumentSelector({ id = '', name = '', onChange = null, value = '' } = {}) {
	const select = document.createElement('select');
	if (id) select.id = id;
	if (name) select.name = name;
	select.className = 'form-select type-document-selector';

	// Option par défaut
	const defaultOption = document.createElement('option');
	defaultOption.value = '';
	defaultOption.textContent = '-- Sélectionner un type de document --';
	select.appendChild(defaultOption);

	let typeDocuments = await fetchAllTypeDocument();
	if (typeDocuments && typeDocuments.data) typeDocuments = typeDocuments.data;
	if (Array.isArray(typeDocuments)) {
		typeDocuments.forEach(typeDoc => {
			const option = document.createElement('option');
			option.value = typeDoc.idType_Document || typeDoc.id || typeDoc.ID || '';
			option.textContent = typeDoc.name_Document || typeDoc.nom || typeDoc.name || typeDoc.label || 'Type inconnu';
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
