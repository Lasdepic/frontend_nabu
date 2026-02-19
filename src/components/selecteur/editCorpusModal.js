import { showCorpusModal } from './corpusModal.js';

export function showEditCorpusModal(corpus, onSuccess) {
	showCorpusModal({ mode: 'edit', corpus, onSuccess });
}
