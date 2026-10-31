/**
 * Le mode essai : les niveaux refaits encore en essai (voir niveaux/refontes.ts) se jouent sur cet appareil avant d'être publiés
 * aux joueurs, depuis le menu « Niveaux refaits » (la version d'avant et la version refaite de chacun, voir menus-refontes.ts).
 * Seulement avec `?essai` dans l'adresse (rien n'est retenu : sans lui, le jeu est celui de tout le monde). Un bandeau le rappelle.
 */
const ANCIENNE_CLE = 'dkk-rock.essai'; // un temps, l'appareil retenait le mode essai : on l'oublie

/** Vrai si l'adresse demande le mode essai (`?essai`, ou `?essai=1`). */
export function modeEssai(): boolean {
  try {
    localStorage.removeItem(ANCIENNE_CLE);
  } catch {
    // stockage indisponible : rien à oublier
  }
  const demande = new URLSearchParams(location.search).get('essai');
  return demande !== null && demande !== '0';
}

/** Le bandeau du mode essai, en bas à gauche de l'écran ; il ne capte aucun toucher. */
export function afficheBandeauEssai(): void {
  const b = document.createElement('div');
  b.id = 'bandeau-essai';
  b.textContent = 'ESSAI : niveaux refaits';
  document.body.append(b);
}
