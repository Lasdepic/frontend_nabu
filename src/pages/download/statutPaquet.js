// Mise à jour du statut du paquet
export async function mettreAJourStatutPaquet(nomFichier, statut) {
  let cote = nomFichier.endsWith('.zip') ? nomFichier.slice(0, -4) : nomFichier;
  // Retirer le préfixe SIP_ si présent
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
      console.error(`[mettreAJourStatutPaquet] Paquet non trouvé pour cote: '${cote}'`, result);
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
