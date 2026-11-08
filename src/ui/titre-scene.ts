import { BPM } from '../config';
import { ANIM, G, type Genre } from '../jeu/vue';
import { FEUILLES_DECOR } from '../rendu/feuilles-objets';
import { projecteurs, rampe, silhouette } from './titre-anime';
import { joue, nouvelleChoregraphie } from './titre-choregraphie';
import { pas, sousLeDoigt, type Acteur, type Bloc, type Scene } from './titre-physique';

/**
 * L'écran titre « en scène » (mode essai) : les cinq DKK vivent sur la scène, chacun à son idée (voir titre-choregraphie.ts) ;
 * le logo et la colonne des boutons sont des obstacles (titre-physique.ts) : ils les escaladent, montent dessus, grimpent aux
 * bords de l'écran et filent suspendus au haut de l'écran, au lieu de passer derrière. Au doigt (ou à la souris), on attrape un
 * héros : il s'accroche (son image de tyrolienne), on le traîne et on le lance, il rebondit partout. En bas, le public en
 * ombres chinoises, rétroéclairé par la scène. Deux toiles : le fond (projecteurs, rampe) sous la page, les héros et le public
 * par-dessus (sans prendre les clics : le doigt n'attrape que les héros). En affichage économe : une image fixe.
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
function blocs(ecran: HTMLElement): Bloc[] {
  const boite = ecran.getBoundingClientRect();
  const r = (sel: string) => ecran.querySelector(sel)?.getBoundingClientRect();
  const res: Bloc[] = [];
  const [logo, slogan, boutons] = [r('.logo'), r('.slogan'), r('.boutons-menu')];
  if (logo) {
    const bas = slogan ? Math.max(logo.bottom, slogan.bottom) : logo.bottom;
    const [g, d] = slogan
      ? [Math.min(logo.left, slogan.left), Math.max(logo.right, slogan.right)]
      : [logo.left, logo.right];
    res.push({ x0: g - boite.left, y0: logo.top - boite.top + 6, x1: d - boite.left, y1: bas - boite.top });
  }
  if (boutons)
    res.push({
      x0: boutons.left - boite.left,
      y0: boutons.top - boite.top,
      x1: boutons.right - boite.left,
      y1: boutons.bottom - boite.top,
    });
  return res;
}

/** Lance la scène dans l'écran titre ; elle s'arrête seule quand l'écran est remplacé. */
export function animeScene(ecran: HTMLElement, qualite: () => Qualite): void {
  const fond = toile(ecran, 'titre-fond');
  const avant = toile(ecran, 'titre-avant');
  const [cf, ca] = [fond.getContext('2d'), avant.getContext('2d')];
  const tampon = document.createElement('canvas').getContext('2d');
  if (!cf || !ca) return;
  const s: Scene = { W: 0, H: 0, sol: 0, hh: 0, blocs: [] };
  const c = nouvelleChoregraphie();
  let acteurs: Acteur[] = [];
  let [dernier, horloge, image] = [performance.now(), 0, 0];
  const gens = Array.from({ length: 34 }, () => ({
    phase: Math.random() * 6,
    taille: 0.8 + Math.random() * 0.45,
    bras: Math.random() < 0.7,
  }));
  let flashs: { x: number; y: number; t0: number }[] = [];
  const doigt = { a: null as Acteur | null, x: 0, y: 0, vx: 0, vy: 0, t: 0 };

  const mesure = (W: number, H: number) => {
    [s.W, s.H, s.sol] = [W, H, H * 0.9];
    s.hh = Math.max(56, Math.min(H * 0.3, W / 5, 190));
    if (image++ % 20 === 0) s.blocs = blocs(ecran);
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
        minuteur: 0.5 + i * 0.7,
        ht: ht(nom),
        phase: Math.random() * 4,
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
    const k = s.hh / 20;
    for (const a of acteurs) {
      if (a === doigt.a) [a.x, a.y] = [doigt.x, doigt.y + a.ht * 0.92];
      const lumiere = faisceaux.reduce((v, fx) => Math.max(v, 1 - Math.abs(fx - a.x) / (W * 0.12)), 0);
      const ombre = 0.28 * (1 - Math.max(0, lumiere));
      const marche = a.etat === 'sol' && a.tx !== null;
      const [e, image_, gauche] =
        a.etat === 'air'
          ? [ANIM.SAUT, `${a.nom}-saut`, a.vx < 0 || (a.vx === 0 && a.dir < 0)]
          : a.etat === 'mur'
            ? [ANIM.SAUT, `${a.nom}-mur`, a.cote < 0]
            : a.etat === 'plafond' || a.etat === 'tenu'
              ? [ANIM.SAUT, `${a.nom}-tyrolienne`, a.dir < 0]
              : [marche ? ANIM.COURT : ANIM.DEBOUT, undefined, a.dir < 0];
      const compteur = marche
        ? Math.floor((horloge + a.phase) * 40)
        : (Math.floor((temps + a.phase) * 2) % 4) * 3;
      silhouette(ca, tampon, a.genre, a.x, a.y, k, gauche, compteur, ombre, 1, e, image_);
    }
    for (const e of c.etincelles) {
      ca.globalAlpha = Math.max(0, 1 - (c.t - e.t0) / 0.7);
      ca.fillStyle = e.couleur;
      ca.fillRect(e.x - 2, e.y - 2, 4, 4);
    }
    ca.globalAlpha = 1;
    // le public sous la page (les boutons restent devant lui), les héros devant lui
    lePublic(cf, W, H, temps, gens, flashs, horloge);
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
    const [W, H] = [avant.clientWidth, avant.clientHeight];
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
      joue(c, s, acteurs, dt);
    }
    for (const a of acteurs) pas(s, a, dt);
    dessine(W, H);
    if (!fige) requestAnimationFrame(anime);
  };
  requestAnimationFrame(anime);
}

/**
 * Le public, en bas de l'écran : une lueur de scène derrière lui, et des silhouettes bien noires qui se balancent, bras levés
 * au rythme, avec des flashs d'appareils photo.
 */
function lePublic(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  temps: number,
  gens: { phase: number; taille: number; bras: boolean }[],
  flashs: { x: number; y: number; t0: number }[],
  horloge: number,
): void {
  const r0 = Math.max(8, H * 0.042);
  const haut = H - r0 * 3.6;
  const lueur = ctx.createLinearGradient(0, haut - r0, 0, H);
  lueur.addColorStop(0, 'rgba(255, 90, 170, 0)');
  lueur.addColorStop(0.45, 'rgba(255, 120, 190, 0.32)');
  lueur.addColorStop(1, 'rgba(255, 210, 63, 0.18)');
  ctx.fillStyle = lueur;
  ctx.fillRect(0, haut - r0, W, H - haut + r0);
  const pas_ = W / gens.length;
  ctx.fillStyle = '#05030a';
  gens.forEach((g, i) => {
    const r = r0 * g.taille;
    const x = pas_ * (i + 0.5) + Math.sin(g.phase * 3) * pas_ * 0.25;
    const saut = Math.max(0, Math.sin(temps * Math.PI * 2 + g.phase)) * r * 0.35;
    const tete = H - r * 1.9 - saut;
    ctx.beginPath();
    ctx.arc(x, tete, r, 0, Math.PI * 2);
    ctx.fill();
    // les épaules
    ctx.fillRect(x - r * 1.5, tete + r * 0.8, r * 3, H - tete);
    if (g.bras) {
      const leve = Math.sin(temps * Math.PI + g.phase * 2) > -0.2;
      const h = leve ? r * 2.6 : r * 1.4;
      ctx.fillRect(x + r * 1.05, tete + r * 0.9 - h, r * 0.5, h);
      ctx.fillRect(x + r * 0.95, tete + r * 0.9 - h - r * 0.3, r * 0.7, r * 0.5);
    }
  });
  for (const f of flashs) {
    ctx.globalAlpha = Math.max(0, 1 - (horloge - f.t0) / 0.25);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(f.x - 3, f.y - 3, 6, 6);
  }
  ctx.globalAlpha = 1;
}
