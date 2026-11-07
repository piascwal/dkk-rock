/**
 * Le mode essai : les niveaux refaits, les héros et les coups encore en essai se jouent sur cet appareil avant d'être publiés aux
 * joueurs. Il s'allume dans Options (« Mode essai », l'appareil s'en souvient ; le jeu redémarre), ou avec `?essai` dans
 * l'adresse (`?essai=0` l'éteint). Un bandeau le rappelle, avec deux boutons : afficher ou masquer les mesures, et les copier.
 * Éteint, il ne coûte rien : rien n'est mesuré.
 */
import { chrono, COUPABLES, type Partie } from '../rendu/chrono';
import { COMMIT, VERSION } from '../version';

const CLE = 'dkk-rock.mode-essai';
const CLE_MESURES = 'dkk-rock.mesures-essai';

const lit = (cle: string): string | null => {
  try {
    return localStorage.getItem(cle);
  } catch {
    return null; // stockage indisponible : rien de retenu
  }
};
const ecrit = (cle: string, valeur: string | null): void => {
  try {
    if (valeur === null) localStorage.removeItem(cle);
    else localStorage.setItem(cle, valeur);
  } catch {
    // stockage indisponible : le choix ne durera que cette fois
  }
};

/** Vrai en mode essai : l'adresse le demande (`?essai`), ou l'appareil s'en souvient (Options). */
export function modeEssai(): boolean {
  const demande = new URLSearchParams(location.search).get('essai');
  if (demande === '0') return false;
  return demande !== null || lit(CLE) === '1';
}

/** Allume ou éteint le mode essai (Options) : l'appareil s'en souvient, et le jeu redémarre pour le prendre en compte. */
export function changeModeEssai(actif: boolean): void {
  ecrit(CLE, actif ? '1' : null);
  const url = new URL(location.href);
  url.searchParams.delete('essai');
  location.replace(url.toString());
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
  tout: 'tout le dessin',
};
const PARTIES = ['fond', 'tuiles', 'decor', 'personnages', 'effets', 'simulation'] as const;

const ms = (v: number): string => v.toFixed(1).replace('.', ',');

/** Les relevés des 30 dernières secondes (un par demi-seconde) : le bouton « Copier » les donne, pics compris. */
const historique: string[] = [];

/** Le bandeau du mode essai, en bas à gauche : son nom, puis « Mesures » (les afficher ou non) et « Copier » (le rapport). */
export function afficheBandeauEssai(): void {
  const b = document.createElement('div');
  b.id = 'bandeau-essai';
  const nom = document.createElement('span');
  nom.textContent = 'ESSAI';
  const mesures = document.createElement('button');
  const copier = document.createElement('button');
  const couper = document.createElement('button');
  mesures.textContent = 'Mesures';
  copier.textContent = 'Copier';
  // couper une partie du dessin, pour voir ce qu'elle coûte : un bouton à part (le compteur, en haut, ne capte plus de toucher :
  // on le touchait par mégarde en jouant, et la mesure se faisait sans les optimisations)
  const libelle = () => (couper.textContent = `Couper : ${chrono.coupee ? NOMS[chrono.coupee] : 'rien'}`);
  libelle();
  couper.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    const i = chrono.coupee ? COUPABLES.indexOf(chrono.coupee) : -1;
    chrono.coupee = COUPABLES[i + 1] ?? null;
    libelle();
    couper.classList.toggle('actif', chrono.coupee !== null);
  });
  mesures.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    const cachees = !document.body.classList.toggle('mesures-cachees');
    ecrit(CLE_MESURES, cachees ? null : 'cachees');
  });
  copier.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    const texte = rapport();
    const fini = () => {
      copier.textContent = 'Copié !';
      setTimeout(() => (copier.textContent = 'Copier'), 1500);
    };
    navigator.clipboard?.writeText(texte).then(fini, () => prompt('Rapport à copier :', texte));
    if (!navigator.clipboard) prompt('Rapport à copier :', texte);
  });
  if (lit(CLE_MESURES) === 'cachees') document.body.classList.add('mesures-cachees');
  b.append(nom, mesures, copier, couper);
  document.body.append(b);
}

/** Le rapport à coller : l'appareil, la version, puis les relevés des 30 dernières secondes, du plus ancien au plus récent. */
function rapport(): string {
  const ecran = `${screen.width}×${screen.height} à ${devicePixelRatio}`;
  return [
    `DKK essai · v${VERSION}${COMMIT ? ` ${COMMIT}` : ''} · ${navigator.userAgent}`,
    `écran ${ecran} · coupé : ${chrono.coupee ? NOMS[chrono.coupee] : 'rien'}`,
    'relevés par demi-seconde (moy = moyenne par image, max = la pire image) :',
    ...historique,
  ].join('\n');
}

/**
 * La mesure de fluidité du mode essai, en haut de l'écran. Première ligne : les images par seconde, la plus longue image de la
 * dernière demi-seconde, le nombre d'à-coups (images de plus de 50 ms) des dix dernières secondes, et la finesse d'affichage
 * (`finesse()`, « 3× »). Deuxième ligne : le temps de calcul par image. Troisième : le temps moyen et le pire de chaque partie du
 * dessin (et de la simulation, par pas), les tuiles cassées et les particules. Quatrième, s'il y en a une : la partie coupée (le bouton
 * « Couper » du bandeau passe à la suivante, voir rendu/chrono.ts).
 */
export function afficheMesuresEssai(finesse: () => string): void {
  chrono.actif = true;
  const m = document.createElement('div');
  m.id = 'mesures-essai';
  document.body.append(m);
  let avant = performance.now();
  let affiche = avant;
  let images = 0;
  let pire = 0;
  const acoups: number[] = [];
  const debut = avant;
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
      const moy = (p: Partie) => chrono.temps[p] / (p === 'simulation' ? Math.max(1, chrono.pas) : n);
      const parties = PARTIES.map((p) => `${NOMS[p]} ${ms(moy(p))}/${ms(chrono.pics[p])}`).join(' · ');
      const coupee = chrono.coupee ? `coupé : ${NOMS[chrono.coupee]}` : 'rien de coupé';
      const l1 = `${ips} i/s · pire ${Math.round(pire)} ms · ${acoups.length} à-coups/10 s · ${finesse()}`;
      const l2 = `calcul ${ms(chrono.calcul / Math.max(1, chrono.cadres))} ms par image, sur ${ms(1000 / Math.max(1, ips))} ms`;
      const l3 = `ms moy/max : ${parties} · ${chrono.tuiles} tuiles cassées · ${chrono.particules} particules`;
      m.textContent = `${l1}\n${l2}\n${l3}${chrono.coupee ? `\n${coupee.toUpperCase()}` : ''}`;
      m.classList.toggle('mauvais', pire > 50);
      historique.push(`${ms((t - debut) / 1000)} s · ${l1} · ${l2} · ${l3} · ${coupee}`);
      if (historique.length > 60) historique.shift();
      for (const k of Object.keys(chrono.temps) as Partie[]) chrono.temps[k] = chrono.pics[k] = 0;
      chrono.images = chrono.pas = chrono.cadres = chrono.calcul = chrono.tuiles = chrono.particules = 0;
      affiche = t;
      images = 0;
      pire = 0;
    }
    requestAnimationFrame(image);
  };
  requestAnimationFrame(image);
}
