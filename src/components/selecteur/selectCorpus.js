import { fetchAllCorpus } from '../../API/paquet/corpus.js';

let selectedCorpus = null;

let corpusSelectInstanceCounter = 0;


export function selectCorpus(onSelect, defaultValue, options = {}) {
	const container = document.createElement('div');
	const select = document.createElement('select');
	select.className = 'select-small corpus-select';
	const instanceId = options?.id || `corpus-select-${++corpusSelectInstanceCounter}`;
	select.id = instanceId;

	const hasSelect2 = () => !!(window.$ && window.$.fn && window.$.fn.select2);
	const tryDestroySelect2 = () => {
		if (!hasSelect2()) return;
		try {
			const $el = window.$(select);
			if ($el && $el.data && $el.data('select2')) {
				$el.select2('destroy');
			}
		} catch (_) {
		}
	};

	fetchAllCorpus().then(corpusList => {
		if (corpusList && corpusList.success && Array.isArray(corpusList.data)) {
			const allOption = document.createElement('option');
			allOption.value = 'ALL';
			allOption.textContent = 'TOUS';
			allOption.dataset.corpus = JSON.stringify({
				id: 'ALL',
				nom: 'TOUS',
				description: 'Afficher tous les paquets'
			});
			allOption.selected = true;
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

			setTimeout(() => {
				if (defaultValue) {
					select.value = defaultValue;
					if (hasSelect2()) {
						window.$(select).val(defaultValue).trigger('change');
					} else {
						select.dispatchEvent(new Event('change'));
					}
				}
				if (hasSelect2()) {
					tryDestroySelect2();
					window.$(select).select2({
						width: 'resolve',
						templateResult: formatCorpusOption,
						templateSelection: formatCorpusSelection,
						dropdownParent: window.$(container),
						escapeMarkup: function (markup) { return markup; }
					});
					const style = document.createElement('style');
					style.innerHTML = `
						#${instanceId} + .select2 .select2-selection__rendered {
							text-align: center !important;
							width: 100%;
							font-weight: bold;
						}
						.select2-results__option[role="option"][id^="select2-${instanceId}-result"][id$="-ALL"] {
							text-align: center !important;
						}
					`;
					container.appendChild(style);
				}
			}, 0);
		}
	});

	const handleSelectionChange = () => {
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
	};

	select.addEventListener('change', handleSelectionChange);
	setTimeout(() => {
		if (hasSelect2()) {
			window.$(select).on('change.selectCorpus', (e) => {
				if (e && e.originalEvent) return;
				handleSelectionChange();
			});
		}
	}, 0);

	container.appendChild(select);
	return container;
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
