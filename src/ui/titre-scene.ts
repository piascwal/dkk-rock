import { BPM } from '../config';
import { ANIM, G, type Genre } from '../jeu/vue';
import { FEUILLES_DECOR } from '../rendu/feuilles-objets';
import { projecteurs, rampe, silhouette } from './titre-anime';
import {
  dessineBatterie,
  dessineEffetsBatterie,
  joueBatterie,
  nouvelleBatterie,
  placeBatterie,
} from './titre-batterie';
import { joue, nouvelleChoregraphie } from './titre-choregraphie';
import { dessineConcert, joueConcert, nouveauConcert } from './titre-concert';
import { blocsDesEnceintes, dessineEnceintes, lePublic, type Spectateur } from './titre-decor';
import { pas, sousLeDoigt, type Acteur, type Bloc, type Scene } from './titre-physique';

/**
 * L'écran titre « en scène » (mode essai) : les cinq DKK vivent sur la scène, chacun à son idée (voir titre-choregraphie.ts) ;
 * le logo et la colonne des boutons sont des obstacles (titre-physique.ts) : ils les escaladent, montent dessus, grimpent aux
 * bords de l'écran et filent suspendus au haut de l'écran, au lieu de passer derrière. Au doigt (ou à la souris), on attrape un
 * héros : il s'accroche (son image de tyrolienne), on le traîne et on le lance, il rebondit partout. En bas, le public en
 * ombres chinoises, rétroéclairé par la scène, devant les héros (sauf sur les boutons et le logo). Deux toiles : le fond (projecteurs,
 * rampe) sous la page, les héros et le public par-dessus (sans prendre les clics : le doigt n'attrape que les héros). En affichage économe : une image fixe.
 */

type Qualite = 'auto' | 'max' | 'eco';
const HEROS: readonly [Genre, string][] = [
  [G.JBT, 'jbt'],
  [G.MAT, 'mat'],
  [G.TOM, 'tom'],
  [G.JBM, 'jbm'],
  [G.JBG, 'jbg'],
];
const calme = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

const toile = (ecran: HTMLElement, classe: string): HTMLCanvasElement => {
  const c = document.createElement('canvas');
  c.className = classe;
  c.setAttribute('aria-hidden', 'true');
  ecran.prepend(c);
  return c;
};

/** Les obstacles : le logo (avec son slogan) et la colonne des boutons, en pixels de la toile. */
function blocs(ecran: HTMLElement): { logo: Bloc | null; menu: Bloc | null } {
  const boite = ecran.getBoundingClientRect();
  const r = (sel: string) => ecran.querySelector(sel)?.getBoundingClientRect();
  const res: { logo: Bloc | null; menu: Bloc | null } = { logo: null, menu: null };
  const [logo, slogan, boutons] = [r('.logo'), r('.slogan'), r('.boutons-menu')];
  if (logo) {
    const bas = slogan ? Math.max(logo.bottom, slogan.bottom) : logo.bottom;
    const [g, d] = slogan
      ? [Math.min(logo.left, slogan.left), Math.max(logo.right, slogan.right)]
      : [logo.left, logo.right];
    res.logo = { x0: g - boite.left, y0: logo.top - boite.top + 6, x1: d - boite.left, y1: bas - boite.top };
  }
  if (boutons)
    res.menu = {
      x0: boutons.left - boite.left,
      y0: boutons.top - boite.top,
      x1: boutons.right - boite.left,
      y1: boutons.bottom - boite.top,
    };
  return res;
}

/** Lance la scène dans l'écran titre ; elle s'arrête seule quand l'écran est remplacé. */
export function animeScene(ecran: HTMLElement, qualite: () => Qualite): void {
  const fond = toile(ecran, 'titre-fond');
  const avant = toile(ecran, 'titre-avant');
  const [cf, ca] = [fond.getContext('2d'), avant.getContext('2d')];
  const tampon = document.createElement('canvas').getContext('2d');
  if (!cf || !ca) return;
  const s: Scene = { W: 0, H: 0, sol: 0, hh: 0, blocs: [], logo: null, menu: null };
  const c = nouvelleChoregraphie();
  const batterie = nouvelleBatterie();
  const concert = nouveauConcert(ecran);
  let acteurs: Acteur[] = [];
  let [dernier, horloge, image] = [performance.now(), 0, 0];
  const gens: Spectateur[] = Array.from({ length: 34 }, () => ({
    phase: Math.random() * 6,
    taille: 0.8 + Math.random() * 0.45,
    geste: Math.random() < 0.3 ? 'rien' : Math.random() < 0.5 ? 'poing' : 'cornes',
  }));
  let flashs: { x: number; y: number; t0: number }[] = [];
  const doigt = { a: null as Acteur | null, x: 0, y: 0, vx: 0, vy: 0, t: 0 };

  const mesure = (W: number, H: number) => {
    [s.W, s.H, s.sol] = [W, H, H * 0.9];
    s.hh = Math.max(50, Math.min(H * 0.26, W / 5.5, 170));
    // les obstacles : le logo et les boutons (relus de la page de temps en temps), et les enceintes aux deux bords de la scène
    // (pas pendant que le logo est cassé : il penche, sa boîte grandirait et pousserait ceux qui sont dessus)
    if (image++ % 20 === 0 && !concert.degats) Object.assign(s, blocs(ecran));
    s.blocs = [...[s.logo, s.menu].filter((b) => b !== null), ...blocsDesEnceintes(W, s.sol, s.hh)];
    placeBatterie(batterie, s);
    const k = s.hh / 20;
    const ht = (nom: string) => {
      const f = FEUILLES_DECOR[`${nom}-tyrolienne`];
      return f ? ((f.h * (f.echelle ?? 1)) / (f.densite ?? 1)) * k : s.hh * 1.05;
    };
    if (!acteurs.length)
      acteurs = HEROS.map(([genre, nom], i) => ({
        genre,
        nom,
        x: (W * (i + 0.5)) / HEROS.length,
        y: s.sol,
        vx: 0,
        vy: 0,
        dir: i < 2 ? 1 : -1,
        etat: 'air',
        cote: 1,
        surBord: false,
        tx: null,
        grimpe: false,
        lance: false,
        plafond: 0,
        objectif: null,
        minuteur: 0.5 + i * 0.7,
        ht: ht(nom),
        phase: Math.random() * 4,
        dirige: false,
        pose: null,
        poseLigne: 0,
      }));
    acteurs.forEach((a) => (a.ht = ht(a.nom)));
  };

  // le doigt : il n'attrape que les héros ; le reste de l'écran (les boutons) reste à lui
  const position = (e: PointerEvent) => {
    const b = avant.getBoundingClientRect();
    return [e.clientX - b.left, e.clientY - b.top] as const;
  };
  const appuie = (e: PointerEvent) => {
    const [x, y] = position(e);
    const a = sousLeDoigt(s, acteurs, x, y);
    if (!a) return;
    e.preventDefault();
    e.stopPropagation();
    Object.assign(doigt, { a, x, y, vx: 0, vy: 0, t: performance.now() });
    [a.etat, a.tx, a.lance] = ['tenu', null, false];
  };
  const bouge = (e: PointerEvent) => {
    if (!doigt.a) return;
    const [x, y] = position(e);
    const dt = Math.max(0.008, (performance.now() - doigt.t) / 1000);
    [doigt.vx, doigt.vy] = [
      doigt.vx * 0.5 + ((x - doigt.x) / dt) * 0.5,
      doigt.vy * 0.5 + ((y - doigt.y) / dt) * 0.5,
    ];
    Object.assign(doigt, { x, y, t: performance.now() });
  };
  const relache = () => {
    const a = doigt.a;
    if (!a) return;
    const max = s.hh * 40;
    [a.etat, a.lance] = ['air', true];
    [a.vx, a.vy] = [Math.max(-max, Math.min(max, doigt.vx)), Math.max(-max, Math.min(max, doigt.vy))];
    doigt.a = null;
    // le clic qui suit le lâcher ne doit pas appuyer sur le bouton d'en dessous
    const bloqueClic = (e: Event) => (e.stopPropagation(), e.preventDefault());
    window.addEventListener('click', bloqueClic, { capture: true, once: true });
    setTimeout(() => window.removeEventListener('click', bloqueClic, { capture: true }), 400);
  };
  ecran.addEventListener('pointerdown', appuie, { capture: true });
  window.addEventListener('pointermove', bouge);
  window.addEventListener('pointerup', relache);
  window.addEventListener('pointercancel', relache);

  const dessine = (W: number, H: number) => {
    const temps = (horloge * BPM) / 60;
    const faisceaux = projecteurs(cf, W, H, horloge);
    rampe(cf, W, s.sol, temps);
    dessineEnceintes(cf, W, s.sol, s.hh, temps);
    dessineBatterie(ca, batterie, s);
    dessineConcert(ca, concert, s);
    const k = s.hh / 20;
    for (const a of acteurs) {
      if (a.etat === 'batterie') continue;
      // tenu au doigt : il pend un peu sous le doigt (le doigt ne le cache pas)
      // (jamais sous la scène : attrapé au sol, il y reste tant que le doigt ne le soulève pas)
      if (a === doigt.a)
        [a.x, a.y] = [Math.max(0, Math.min(W, doigt.x)), Math.min(s.sol, doigt.y + a.ht * 0.92 + s.hh * 0.3)];
      const lumiere = faisceaux.reduce((v, fx) => Math.max(v, 1 - Math.abs(fx - a.x) / (W * 0.12)), 0);
      const ombre = 0.28 * (1 - Math.max(0, lumiere));
      const marche = a.etat === 'sol' && a.tx !== null;
      const [e, image_, gauche] =
        a.pose && a.etat === 'sol'
          ? [ANIM.DEBOUT, a.pose, a.dir < 0]
          : a.etat === 'air'
            ? [ANIM.SAUT, `${a.nom}-saut`, a.vx < 0 || (a.vx === 0 && a.dir < 0)]
            : a.etat === 'mur'
              ? [ANIM.SAUT, `${a.nom}-mur`, a.cote < 0]
              : a.etat === 'plafond' || a.etat === 'tenu'
                ? [ANIM.SAUT, `${a.nom}-tyrolienne`, a.dir < 0]
                : [marche ? ANIM.COURT : ANIM.DEBOUT, undefined, a.dir < 0];
      const compteur = marche
        ? Math.floor((horloge + a.phase) * 40)
        : (Math.floor((temps + a.phase) * 2) % 4) * 3;
      // suspendu ou tenu : la tyrolienne se balance (ses deux temps)
      const balance = Math.floor((horloge + a.phase) * 2.6) % 2;
      silhouette(
        ca,
        tampon,
        a.genre,
        a.x,
        a.y,
        k,
        gauche,
        compteur,
        ombre,
        1,
        e,
        image_,
        a.pose ? a.poseLigne : balance,
      );
    }
    dessineEffetsBatterie(ca, batterie, s);
    for (const e of c.etincelles) {
      ca.globalAlpha = Math.max(0, 1 - (c.t - e.t0) / 0.7);
      ca.fillStyle = e.couleur;
      ca.fillRect(e.x - 2, e.y - 2, 4, 4);
    }
    ca.globalAlpha = 1;
    // le public devant les héros (on les voit depuis la salle), mais jamais sur les boutons ni le logo : découpés de son dessin
    ca.save();
    ca.beginPath();
    ca.rect(0, 0, W, H);
    for (const b of s.blocs) ca.rect(b.x0 - 2, b.y0 - 2, b.x1 - b.x0 + 4, b.y1 - b.y0 + 4);
    ca.clip('evenodd');
    lePublic(ca, W, H, temps, gens, flashs, horloge);
    ca.restore();
  };

  const anime = (maintenant: number) => {
    if (!avant.isConnected) {
      ecran.removeEventListener('pointerdown', appuie, { capture: true });
      window.removeEventListener('pointermove', bouge);
      window.removeEventListener('pointerup', relache);
      window.removeEventListener('pointercancel', relache);
      return;
    }
    const fige = qualite() === 'eco' || calme();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    // la taille de l'écran (bornée : une toile mal placée qui grandirait d'elle-même ne doit jamais emporter la page)
    const [W, H] = [Math.min(avant.clientWidth, 4096), Math.min(avant.clientHeight, 4096)];
    for (const t of [fond, avant])
      if (t.width !== Math.round(W * dpr) || t.height !== Math.round(H * dpr))
        [t.width, t.height] = [Math.round(W * dpr), Math.round(H * dpr)];
    for (const x of [cf, ca]) {
      x.setTransform(dpr, 0, 0, dpr, 0, 0);
      x.clearRect(0, 0, W, H);
    }
    mesure(W, H);
    const dt = fige ? 0.5 : Math.min(0.04, (maintenant - dernier) / 1000);
    dernier = maintenant;
    horloge += dt;
    if (!fige) {
      if (Math.random() < dt * 3)
        flashs.push({ x: Math.random() * W, y: H * (0.9 + Math.random() * 0.06), t0: horloge });
      flashs = flashs.filter((f) => horloge - f.t0 < 0.25);
      joueBatterie(batterie, s, acteurs, dt);
      joueConcert(concert, batterie, s, acteurs, dt);
      joue(c, s, acteurs, dt);
    }
    for (const a of acteurs) pas(s, a, dt);
    dessine(W, H);
    if (!fige) requestAnimationFrame(anime);
  };
  requestAnimationFrame(anime);
}
