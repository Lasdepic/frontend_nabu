import { fetchAllCorpus } from '../API/corpus.js';

// Permet de stocker le dernier corpus sélectionné
let selectedCorpus = null;

export function selectCorpus(onSelect) {
	// Crée un conteneur principal
	const container = document.createElement('div');
	container.className = 'select-corpus-container';

	// Crée le select natif
	const select = document.createElement('select');
	select.className = 'form-select select-small';
	select.id = 'corpus-select';

	// Ajoute un placeholder
	const placeholder = document.createElement('option');
	placeholder.value = '';
	placeholder.textContent = 'Choix du corpus';
	placeholder.disabled = true;
	placeholder.selected = true;
	select.appendChild(placeholder);

	// Remplit le select avec les corpus depuis l'API
	fetchAllCorpus().then(corpusList => {
		if (corpusList && corpusList.success && Array.isArray(corpusList.data)) {
			corpusList.data.forEach(corpus => {
				const option = document.createElement('option');
				option.value = corpus.idcorpus;
				// Utilise data-html pour Select2
				option.innerHTML = corpus.desciption_corpus
				  ? `<span class='corpus-nom'>${corpus.name_corpus}</span><br><span class='corpus-desc'>${corpus.desciption_corpus}</span>`
				  : `<span class='corpus-nom'>${corpus.name_corpus}</span>`;
				option.textContent = corpus.name_corpus; // fallback pour accessibilité
				option.dataset.corpus = JSON.stringify({
					id: corpus.idcorpus,
					nom: corpus.name_corpus,
					description: corpus.desciption_corpus
				});
				select.appendChild(option);
			});
			// Initialise Select2 après le remplissage
			setTimeout(() => {
				if (window.$ && window.$.fn && window.$.fn.select2) {
					window.$(select).select2({
						width: 'resolve',
						templateResult: formatCorpusOption,
						templateSelection: formatCorpusSelection,
						dropdownParent: window.$(container)
					});
				}
			}, 0);
		}
	});

	// Sélection
	select.addEventListener('change', (e) => {
		const selectedOption = select.options[select.selectedIndex];
		if (selectedOption && selectedOption.dataset.corpus) {
			selectedCorpus = JSON.parse(selectedOption.dataset.corpus);
			if (typeof onSelect === 'function') {
				onSelect(selectedCorpus);
			}
		}
	});

	container.appendChild(select);
	return container;
}

function formatCorpusOption(state) {
	if (!state.id) return state.text;
	const option = state.element;
	if (option && option.dataset && option.dataset.corpus) {
		const corpus = JSON.parse(option.dataset.corpus);
		let html = `<div class='corpus-nom'>${corpus.nom}</div>`;
		if (corpus.description) {
			html += `<div class='corpus-desc'>${corpus.description}</div>`;
		}
		return window.$('<span>').html(html);
	}
	return state.text;
}

function formatCorpusSelection(state) {
	if (!state.id) return state.text;
	const option = state.element;
	if (option && option.dataset && option.dataset.corpus) {
		const corpus = JSON.parse(option.dataset.corpus);
		return corpus.nom;
	}
	return state.text;
}

export function getSelectedCorpus() {
	return selectedCorpus;
}
