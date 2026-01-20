import { fetchAllCorpus } from '../API/corpus.js';

let selectedCorpus = null;

export function selectCorpus(onSelect) {

	const container = document.createElement('div');

	const select = document.createElement('select');
	select.className = 'select-small';
	select.id = 'corpus-select';

		fetchAllCorpus().then(corpusList => {
			if (corpusList && corpusList.success && Array.isArray(corpusList.data)) {
				const allOption = document.createElement('option');
				allOption.value = 'ALL';
				allOption.textContent = 'TOUS';
				allOption.dataset.corpus = '';
				allOption.selected = true;
				select.appendChild(allOption);

				corpusList.data.forEach(corpus => {
					const option = document.createElement('option');
					option.value = corpus.idcorpus;
					option.innerHTML = corpus.desciption_corpus
					  ? `<span class='corpus-nom'>${corpus.name_corpus}</span><br><span class='corpus-desc'>${corpus.desciption_corpus}</span>`
					  : `<span class='corpus-nom'>${corpus.name_corpus}</span>`;
					option.textContent = corpus.name_corpus; 
					option.dataset.corpus = JSON.stringify({
						id: corpus.idcorpus,
						nom: corpus.name_corpus,
						description: corpus.desciption_corpus
					});
					select.appendChild(option);
				});
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

	setTimeout(() => {
		if (window.$ && window.$.fn && window.$.fn.select2) {
			window.$(select).on('change', function (e) {
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
