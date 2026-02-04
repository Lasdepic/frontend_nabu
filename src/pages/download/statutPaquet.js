// Mise à jour du statut du paquet
export async function mettreAJourStatutPaquet(nomFichier, statut) {
  let cote = nomFichier.endsWith('.zip') ? nomFichier.slice(0, -4) : nomFichier;
  if (cote.toUpperCase().startsWith('SIP_')) {
    cote = cote.slice(4);
  }
  try {
    const modulePaquet = await import('../../API/paquet/paquet.js');
    if (!modulePaquet?.fetchOnePaquet) {
      console.error('[mettreAJourStatutPaquet] fetchOnePaquet non trouvé');
      return;
    }
    const result = await modulePaquet.fetchOnePaquet(cote);
    if (!result || !result.success || !result.data) {
      // Paquet non trouvé, demander à l'utilisateur s'il veut le créer
      // Afficher une card de confirmation
      const { afficherCardPaquetAddModal } = await import('../../components/editPaquet/addPaquet.js');
      // On crée une card personnalisée pour ce cas
      const overlay = document.createElement('div');
      overlay.id = 'paquet-modal-overlay-upload';
      overlay.className = 'modal fade show';
      overlay.style.display = 'block';
      overlay.style.background = 'rgba(0,0,0,0.5)';
      overlay.style.position = 'fixed';
      overlay.style.top = 0;
      overlay.style.left = 0;
      overlay.style.width = '100vw';
      overlay.style.height = '100vh';
      overlay.style.zIndex = 3000;

      const modal = document.createElement('div');
      modal.className = 'modal-dialog modal-dialog-centered';
      modal.style.maxWidth = '500px';
      modal.style.width = '100%';

      const modalContent = document.createElement('div');
      modalContent.className = 'modal-content shadow-lg';

      const modalHeader = document.createElement('div');
      modalHeader.className = 'modal-header';
      const title = document.createElement('h5');
      title.className = 'modal-title fw-bold text-center w-100';
      title.textContent = 'Créer le paquet ?';
      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'btn-close';
      closeBtn.setAttribute('aria-label', 'Fermer');
      closeBtn.onclick = () => overlay.remove();
      modalHeader.appendChild(title);
      modalHeader.appendChild(closeBtn);

      const modalBody = document.createElement('div');
      modalBody.className = 'modal-body text-center';
      modalBody.innerHTML = `<p>Le paquet <strong>${cote}</strong> n'existe pas.<br>Voulez-vous le créer maintenant ?</p>`;

      const modalFooter = document.createElement('div');
      modalFooter.className = 'modal-footer d-flex justify-content-center gap-3';
      const btnCreer = document.createElement('button');
      btnCreer.className = 'btn btn-success';
      btnCreer.textContent = 'Créer le paquet';
      btnCreer.onclick = () => {
        overlay.remove();
        afficherCardPaquetAddModal();
      };
      const btnAnnuler = document.createElement('button');
      btnAnnuler.className = 'btn btn-outline-secondary';
      btnAnnuler.textContent = 'Annuler';
      btnAnnuler.onclick = () => {
        overlay.remove();
        // Afficher un message d'annulation
        const { afficherStatus } = require('./helpersUI.js');
        afficherStatus('Envoi annulé. Le paquet doit être créé avant l’envoi.', 'warning');
      };
      modalFooter.appendChild(btnCreer);
      modalFooter.appendChild(btnAnnuler);

      modalContent.appendChild(modalHeader);
      modalContent.appendChild(modalBody);
      modalContent.appendChild(modalFooter);
      modal.appendChild(modalContent);
      overlay.appendChild(modal);
      overlay.addEventListener('click', e => {
        if (e.target === overlay) overlay.remove();
      });
      document.body.appendChild(overlay);
      return;
    }
    const paquet = result.data;
    paquet.statusId = statut;
    paquet.statut = statut;
    if (modulePaquet?.editPaquet) {
      const resEdit = await modulePaquet.editPaquet(paquet);
      if (!resEdit || !resEdit.success) {
        console.error('[mettreAJourStatutPaquet] Echec de la mise à jour du statut', resEdit);
      } else {
        console.log('[mettreAJourStatutPaquet] Statut mis à jour avec succès', resEdit);
      }
    } else {
      console.error('[mettreAJourStatutPaquet] editPaquet non trouvé');
    }
  } catch (e) {
    console.error('[mettreAJourStatutPaquet] Exception', e);
  }
}
