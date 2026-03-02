
import { selectCorpus } from '../selecteur/selectCorpus.js';
import { createPaquet } from '../../API/paquet/paquet.js';
import { createTypeDocumentSelector } from '../selecteur/selectTypeDocument.js';
import { createStatusSelector } from '../selecteur/selectStatus.js';
import { openPaquetModal, applySipRule, refreshPaquetTables } from './paquetModalShared.js';

export function afficherCardPaquetAddModal(defaults = {}) {
	openPaquetModal({
		titleText: 'Création d’un paquet',
		values: {
			folderName: defaults.folderName || '',
			cote: defaults.cote || '',
		},
		afterMount: async ({ form }) => {
			const corpusContainer = form.querySelector('#corpus-select-container');
			if (corpusContainer) {
				const corpusSelector = selectCorpus();
				corpusContainer.appendChild(corpusSelector);
			}
			const typeDocContainer = form.querySelector('#type-document-select-container');
			if (typeDocContainer) {
				const typeDocSelectorWrapper = await createTypeDocumentSelector({ name: 'typeDocumentId' });
				typeDocContainer.appendChild(typeDocSelectorWrapper);
			}
			const statusContainer = form.querySelector('#status-select-container');
			if (statusContainer) {
				const statusSelectorWrapper = await createStatusSelector({
					name: 'statusId',
					allowedLabels: ['INEXISTANT', 'NON_ENVOYE'],
				});
				statusContainer.appendChild(statusSelectorWrapper);

				const sipCheckbox = form.querySelector('[name="filedSip"]');
				if (sipCheckbox) {
					sipCheckbox.addEventListener('change', () => applySipRule(form));
				}
				applySipRule(form);
			}
		},
		onSubmit: async (data, { destroy, showPopup }) => {
			const res = await createPaquet(data);
			destroy();
			if (res && (res.success || res.status === 'success')) {
				showPopup('Le paquet a bien été enregistré.', true);
				await refreshPaquetTables();
			} else if (res && res.fields) {
				showPopup('Champs manquants : ' + res.fields.join(', '), false);
			} else if (res && res.message) {
				showPopup(res.message, false);
			} else {
				showPopup("Erreur lors de l'enregistrement du paquet.", false);
			}
		},
	});
}
