import { showCorpusModal } from './corpusModal.js';

export function showCreateCorpusModal(onSuccess) {
	showCorpusModal({ mode: 'create', onSuccess });
}
