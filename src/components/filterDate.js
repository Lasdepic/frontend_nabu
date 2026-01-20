// Composant tri uniquement
export function createDateFilter(onSortChange) {
	const wrapper = document.createElement('div');
	wrapper.className = 'input-group align-items-center';
	wrapper.style.minWidth = '180px';
	wrapper.style.marginLeft = '20px';

	const label = document.createElement('label');
	label.className = 'input-group-text';
	label.htmlFor = 'date-sort-select';
	label.textContent = 'Tri par date';

	const select = document.createElement('select');
	select.className = 'form-select';
	select.id = 'date-sort-select';
	select.style.maxWidth = '150px';

	const optionDesc = document.createElement('option');
	optionDesc.value = 'desc';
	optionDesc.textContent = 'Décroissant';

	const optionAsc = document.createElement('option');
	optionAsc.value = 'asc';
	optionAsc.textContent = 'Croissant';

	select.appendChild(optionDesc);
	select.appendChild(optionAsc);

	select.addEventListener('change', (e) => {
		if (onSortChange) onSortChange(e.target.value);
	});

	wrapper.appendChild(label);
	wrapper.appendChild(select);

	return wrapper;
}
