/**
 * Le mode essai : les niveaux refaits encore en essai (voir niveaux/refontes.ts) se jouent sur cet appareil avant d'être publiés
 * aux joueurs, depuis le menu « Niveaux refaits » (la version d'avant et la version refaite de chacun, voir menus-refontes.ts).
 * Seulement avec `?essai` dans l'adresse (rien n'est retenu : sans lui, le jeu est celui de tout le monde). Un bandeau le rappelle.
 */
import { chrono, COUPABLES, type Partie } from '../rendu/chrono';

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

/** Le nom de chaque partie du dessin, tel qu'il s'affiche. */
const NOMS: Record<Partie, string> = {
  fond: 'fond',
  tuiles: 'tuiles',
  decor: 'décor',
  personnages: 'persos',
  halos: 'halos et flashs',
  effets: 'effets',
  simulation: 'simu',
  optimisations: 'optimisations',
};

const ms = (v: number): string => v.toFixed(1).replace('.', ',');

/**
 * La mesure de fluidité du mode essai, en haut de l'écran. Première ligne : les images par seconde, la plus longue image de la
 * dernière demi-seconde, le nombre d'à-coups (images de plus de 50 ms) des dix dernières secondes, et la finesse d'affichage
 * (`finesse()`, « 3× »). Deuxième ligne : le temps moyen du processeur, par image, pour chaque partie du dessin (et pour la
 * simulation, par pas). Troisième : la partie coupée ; un toucher sur le compteur passe à la suivante (voir rendu/chrono.ts).
 */
export function afficheMesuresEssai(finesse: () => string): void {
  chrono.actif = true;
  const m = document.createElement('div');
  m.id = 'mesures-essai';
  document.body.append(m);
  const coupe = () => {
    const i = chrono.coupee ? COUPABLES.indexOf(chrono.coupee) : -1;
    chrono.coupee = COUPABLES[i + 1] ?? null;
  };
  m.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    coupe();
  });
  let avant = performance.now();
  let affiche = avant;
  let images = 0;
  let pire = 0;
  const acoups: number[] = [];
  const image = (t: number) => {
    // le jeu dessine juste avant (son rappel passe d'abord, à chaque image) : depuis le début de l'image `t`, tout ce qu'il a fait
    chrono.calcul += performance.now() - t;
    chrono.cadres++;
    const ecart = t - avant;
    avant = t;
    images++;
    pire = Math.max(pire, ecart);
    // un onglet caché ne dessine plus : son retour n'est pas un à-coup
    if (ecart > 50 && ecart < 2000) acoups.push(t);
    while (acoups.length && acoups[0]! < t - 10000) acoups.shift();
    if (t - affiche >= 500) {
      const ips = Math.round((images * 1000) / (t - affiche));
      const n = Math.max(1, chrono.images);
      const parties = (['fond', 'tuiles', 'decor', 'personnages', 'effets'] as const)
        .map((p) => `${NOMS[p]} ${ms(chrono.temps[p] / n)}`)
        .join(' · ');
      const simu = `${NOMS.simulation} ${ms(chrono.temps.simulation / Math.max(1, chrono.pas))}`;
      const coupee = chrono.coupee ? `coupé : ${NOMS[chrono.coupee]}` : 'rien de coupé';
      m.textContent =
        `${ips} i/s · pire ${Math.round(pire)} ms · ${acoups.length} à-coups/10 s · ${finesse()}\n` +
        `calcul ${ms(chrono.calcul / Math.max(1, chrono.cadres))} ms par image, sur ${ms(1000 / Math.max(1, ips))} ms\n` +
        `ms : ${parties} · ${simu}\n` +
        `${coupee} (toucher pour couper)`;
      m.classList.toggle('mauvais', pire > 50);
      for (const k of Object.keys(chrono.temps) as Partie[]) chrono.temps[k] = 0;
      chrono.images = chrono.pas = chrono.cadres = chrono.calcul = 0;
      affiche = t;
      images = 0;
      pire = 0;
    }
    requestAnimationFrame(image);
  };
  requestAnimationFrame(image);
}
