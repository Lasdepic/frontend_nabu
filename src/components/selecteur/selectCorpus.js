import { fetchAllCorpus } from '../../API/paquet/corpus.js';

let selectedCorpus = null;


export function selectCorpus(onSelect, defaultValue) {
	const container = document.createElement('div');
	const select = document.createElement('select');
	select.className = 'select-small';
	select.id = 'corpus-select';
	select.disabled = true;

	const loadingOption = document.createElement('option');
	loadingOption.value = '';
	loadingOption.textContent = 'Chargement…';
	loadingOption.selected = true;
	loadingOption.disabled = true;
	select.appendChild(loadingOption);

	fetchAllCorpus()
		.then(corpusList => {
			if (!(corpusList && corpusList.success && Array.isArray(corpusList.data))) {
				throw new Error('Réponse API inattendue');
			}

			select.innerHTML = '';

			const allOption = document.createElement('option');
			allOption.value = 'ALL';
			allOption.textContent = 'TOUS';
			allOption.dataset.corpus = JSON.stringify({
				id: 'ALL',
				nom: 'TOUS',
				description: 'Afficher tous les paquets'
			});
			select.appendChild(allOption);

			const sortedCorpus = corpusList.data.slice().sort((a, b) => {
				const nameA = (a.name_corpus || '').toLowerCase();
				const nameB = (b.name_corpus || '').toLowerCase();
				if (nameA < nameB) return -1;
				if (nameA > nameB) return 1;
				return 0;
			});

			sortedCorpus.forEach(corpus => {
				const option = document.createElement('option');
				option.value = corpus.idcorpus;
				option.textContent = corpus.name_corpus;
				option.dataset.corpus = JSON.stringify({
					id: corpus.idcorpus,
					nom: corpus.name_corpus,
					description: corpus.desciption_corpus
				});
				select.appendChild(option);
			});

			select.disabled = false;

			// Sélectionner la valeur par défaut si fournie, sinon ALL
			const initialValue = defaultValue || 'ALL';
			select.value = initialValue;
			select.dispatchEvent(new Event('change'));

			ensureSelect2(select, container);
		})
		.catch(() => {
			select.innerHTML = '';
			const errorOption = document.createElement('option');
			errorOption.value = '';
			errorOption.textContent = 'Impossible de charger les corpus';
			errorOption.selected = true;
			errorOption.disabled = true;
			select.appendChild(errorOption);
			select.disabled = true;
		});

	select.addEventListener('change', (e) => {
		const selectedOption = select.options[select.selectedIndex];
		if (selectedOption && selectedOption.value === 'ALL') {
			selectedCorpus = 'ALL';
			if (typeof onSelect === 'function') {
				onSelect('ALL');
			}
		} else if (selectedOption && selectedOption.dataset.corpus) {
			selectedCorpus = JSON.parse(selectedOption.dataset.corpus);
			if (typeof onSelect === 'function') {
				onSelect(selectedCorpus);
			}
		} else {
			selectedCorpus = null;
			if (typeof onSelect === 'function') {
				onSelect(null);
			}
		}
	});

	container.appendChild(select);
	return container;
}

function ensureSelect2(select, container) {
	const maxWaitMs = 2000;
	const intervalMs = 50;
	const start = Date.now();

	const tryInit = () => {
		if (!(window.$ && window.$.fn && window.$.fn.select2)) {
			if (Date.now() - start < maxWaitMs) {
				setTimeout(tryInit, intervalMs);
			}
			return;
		}

		const $ = window.$;
		// Éviter les doubles initialisations si la page est re-rendue.
		if ($(select).data('select2')) {
			return;
		}

		$(select).select2({
			width: 'resolve',
			templateResult: formatCorpusOption,
			templateSelection: formatCorpusSelection,
			dropdownParent: $(container),
			escapeMarkup: function (markup) { return markup; }
		});

		const style = document.createElement('style');
		style.innerHTML = `
			#corpus-select + .select2 .select2-selection__rendered {
				text-align: center !important;
				width: 100%;
				font-weight: bold;
			}
			.select2-results__option[role="option"][id^="select2-corpus-select-result"][id$="-ALL"] {
				text-align: center !important;
			}
		`;
		container.appendChild(style);
	};

	tryInit();
}

function formatCorpusOption(state) {
	if (!state.id) return state.text;
	const option = state.element;
	if (option && option.dataset && option.dataset.corpus) {
		const corpus = JSON.parse(option.dataset.corpus);
		let html = `<div style='text-align: center;'>`;
		html += `<div class='corpus-nom'><b>${corpus.nom}</b></div>`;
		if (corpus.description) {
			html += `<div class='corpus-desc' style='color: #6C757D;'>${corpus.description}</div>`;
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
		const corpus = JSON.parse(option.dataset.corpus);
		return `<span style='display: inline-block; width: 100%; text-align: center;'><b>${corpus.nom}</b></span>`;
	}
	return state.text;
}

export function getSelectedCorpus() {
	return selectedCorpus;
}
