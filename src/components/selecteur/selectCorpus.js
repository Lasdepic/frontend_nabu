import { fetchAllCorpus } from '../../API/paquet/corpus.js';

let selectedCorpus = null;


export function selectCorpus(onSelect, defaultValue) {
	const container = document.createElement('div');
	const select = document.createElement('select');
	select.className = 'form-select select-small';
	select.id = 'corpus-select';
	select.setAttribute('aria-label', 'Sélection du corpus');
	select.disabled = true;

	const loadingOption = document.createElement('option');
	loadingOption.value = '';
	loadingOption.textContent = 'Chargement des corpus…';
	loadingOption.selected = true;
	loadingOption.disabled = true;
	select.appendChild(loadingOption);

	const notifySelection = (value) => {
		selectedCorpus = value;
		if (typeof onSelect === 'function') onSelect(value);
	};

	const getCorpusDescription = (corpus) => {
		return (
			corpus?.desciption_corpus ??
			corpus?.description_corpus ??
			corpus?.description ??
			''
		);
	};

	const buildCorpusDataset = (corpus) => {
		return {
			id: corpus.idcorpus,
			nom: corpus.name_corpus,
			description: getCorpusDescription(corpus)
		};
	};

	const handleChange = () => {
		const selectedOption = select.options[select.selectedIndex];
		if (!selectedOption) return notifySelection(null);
		if (selectedOption.value === 'ALL') return notifySelection('ALL');
		if (!selectedOption.dataset?.corpus) return notifySelection(null);
		try {
			return notifySelection(JSON.parse(selectedOption.dataset.corpus));
		} catch {
			return notifySelection(null);
		}
	};
	select.addEventListener('change', handleChange);

	fetchAllCorpus()
		.then((corpusList) => {
			// Reset options (remove loading)
			select.innerHTML = '';

			if (!corpusList || !corpusList.success || !Array.isArray(corpusList.data)) {
				const errorOption = document.createElement('option');
				errorOption.value = '';
				errorOption.textContent = 'Impossible de charger les corpus';
				errorOption.selected = true;
				errorOption.disabled = true;
				select.appendChild(errorOption);
				select.disabled = true;
				notifySelection(null);
				return;
			}

			const allOption = document.createElement('option');
			allOption.value = 'ALL';
			allOption.textContent = 'TOUS';
			allOption.dataset.corpus = JSON.stringify({
				id: 'ALL',
				nom: 'TOUS',
				description: 'Afficher tous les paquets'
			});
			select.appendChild(allOption);

			const sortedCorpus = corpusList.data
				.slice()
				.filter((corpus) => corpus && corpus.idcorpus != null)
				.sort((a, b) => {
					const nameA = (a.name_corpus || '').toLowerCase();
					const nameB = (b.name_corpus || '').toLowerCase();
					return nameA.localeCompare(nameB);
				});

			sortedCorpus.forEach((corpus) => {
				const option = document.createElement('option');
				option.value = String(corpus.idcorpus);
				option.textContent = corpus.name_corpus || 'Corpus';
				option.dataset.corpus = JSON.stringify(buildCorpusDataset(corpus));
				select.appendChild(option);
			});

			select.disabled = false;

			// Valeur par défaut
			if (defaultValue != null && defaultValue !== '') {
				select.value = String(defaultValue);
			} else {
				select.value = 'ALL';
			}

			// Init Select2 si dispo
			if (window.$ && window.$.fn && window.$.fn.select2) {
				window.$(select).select2({
					width: 'resolve',
					templateResult: formatCorpusOption,
					templateSelection: formatCorpusSelection,
					dropdownParent: window.$(container),
					escapeMarkup: (markup) => markup
				});
				window.$(select).val(select.value).trigger('change');

				const style = document.createElement('style');
				style.innerHTML = `
					#corpus-select + .select2 .select2-selection__rendered {
						text-align: center !important;
						width: 100%;
						font-weight: 600;
					}
					.select2-results__option[role="option"][id^="select2-corpus-select-result"][id$="-ALL"] {
						text-align: center !important;
					}
					.select2-results__option .corpus-desc {
						color: var(--bs-secondary-color, #6c757d);
						font-size: 0.875em;
						margin-top: 2px;
					}
				`;
				container.appendChild(style);
			} else {
				// Sans Select2 : déclencher la sélection initiale
				handleChange();
			}
		})
		.catch(() => {
			select.innerHTML = '';
			const errorOption = document.createElement('option');
			errorOption.value = '';
			errorOption.textContent = 'Erreur lors du chargement des corpus';
			errorOption.selected = true;
			errorOption.disabled = true;
			select.appendChild(errorOption);
			select.disabled = true;
			notifySelection(null);
		});

	container.appendChild(select);
	return container;
}

function formatCorpusOption(state) {
	if (!state.id) return state.text;
	const option = state.element;
	if (option && option.dataset && option.dataset.corpus) {
		let corpus;
		try {
			corpus = JSON.parse(option.dataset.corpus);
		} catch {
			return state.text;
		}
		let html = `<div style='text-align: center;'>`;
		html += `<div class='corpus-nom'><b>${corpus.nom ?? ''}</b></div>`;
		if (corpus.description) {
			html += `<div class='corpus-desc'>${corpus.description}</div>`;
		}
		html += `</div>`;
		return window.$('<span>').html(html);
	}
	return state.text;
}

function formatCorpusSelection(state) {
	if (!state.id) return state.text;
	const option = state.element;
	if (option && option.dataset && option.dataset.corpus) {
		let corpus;
		try {
			corpus = JSON.parse(option.dataset.corpus);
		} catch {
			return state.text;
		}
		return `<span style='display: inline-block; width: 100%; text-align: center;'><b>${corpus.nom ?? ''}</b></span>`;
	}
	return state.text;
}

export function getSelectedCorpus() {
	return selectedCorpus;
}
