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

/**
 * La mesure de fluidité du mode essai, en haut de l'écran : les images par seconde, la plus longue image de la dernière
 * seconde, le nombre d'à-coups (images de plus de 50 ms) des dix dernières secondes, et la finesse d'affichage (`finesse()`,
 * « 3× »). Mesurée sur les images de l'écran (requestAnimationFrame) : un blocage du jeu ou du navigateur s'y voit.
 */
export function afficheMesuresEssai(finesse: () => string): void {
  const m = document.createElement('div');
  m.id = 'mesures-essai';
  document.body.append(m);
  let avant = performance.now();
  let affiche = avant;
  let images = 0;
  let pire = 0;
  const acoups: number[] = [];
  const image = (t: number) => {
    const ecart = t - avant;
    avant = t;
    images++;
    pire = Math.max(pire, ecart);
    // un onglet caché ne dessine plus : son retour n'est pas un à-coup
    if (ecart > 50 && ecart < 2000) acoups.push(t);
    while (acoups.length && acoups[0]! < t - 10000) acoups.shift();
    if (t - affiche >= 500) {
      const ips = Math.round((images * 1000) / (t - affiche));
      m.textContent = `${ips} i/s · pire ${Math.round(pire)} ms · ${acoups.length} à-coups/10 s · ${finesse()}`;
      m.classList.toggle('mauvais', pire > 50);
      affiche = t;
      images = 0;
      pire = 0;
    }
    requestAnimationFrame(image);
  };
  requestAnimationFrame(image);
}
