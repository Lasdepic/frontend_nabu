// Mise à jour du statut du paquet
export async function mettreAJourStatutPaquet(nomFichier, statut) {
  const cote = nomFichier.endsWith('.zip') ? nomFichier.slice(0, -4) : nomFichier;
  try {
    const modulePaquet = await import('../../API/paquet/paquet.js');
    if (!modulePaquet?.fetchOnePaquet) return;
    const result = await modulePaquet.fetchOnePaquet(cote);
    const paquet = (result && result.success && result.data) ? result.data : (result && result.cote === cote ? result : null);
    if (!paquet) return;
    paquet.statusId = statut;
    paquet.statut = statut;
    if (modulePaquet?.editPaquet) await modulePaquet.editPaquet(paquet);
  } catch {}
}
