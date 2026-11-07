import { BPM } from '../config';
import { ANIM, G, type Genre } from '../jeu/vue';
import { projecteurs, rampe, silhouette } from './titre-anime';
import { alea, G_PESANTEUR, jam, SCENES, saute, type Monde, type Scene } from './titre-choregraphie';

/**
 * L'écran titre « en scène » (mode essai) : les cinq DKK, bien plus grands, jouent la comédie sur la scène au lieu de rebondir sur
 * place. Ils courent, sautent, ricochent sur les bords de l'écran, se sautent par-dessus, se tapent dans la main, et un
 * public (silhouettes aux bras levés, flashs d'appareils) les regarde en bas de l'écran. Des scènes se succèdent au hasard,
 * entrecoupées d'un temps où tous jouent ensemble au rythme du jeu, et les projecteurs ne balaient pas de la même façon à chaque
 * scène. Léger : cinq sprites, un public de rectangles, une boucle sans fin. En affichage économe (ou mouvement réduit) : une image.
 */

type Qualite = 'auto' | 'max' | 'eco';
const HEROS: readonly Genre[] = [G.JBT, G.MAT, G.TOM, G.JBM, G.JBG];
/** le préfixe de leurs images à part : en l'air, l'image du saut, comme en jeu */
const NOMS = ['jbt', 'mat', 'tom', 'jbm', 'jbg'] as const;
const calme = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Lance la scène dans l'écran titre ; elle s'arrête seule quand l'écran est remplacé (la toile n'est plus dans la page). */
export function animeScene(ecran: HTMLElement, qualite: () => Qualite): void {
  const toile = document.createElement('canvas');
  toile.className = 'titre-fond';
  toile.setAttribute('aria-hidden', 'true');
  ecran.prepend(toile);
  const ctx = toile.getContext('2d');
  const tampon = document.createElement('canvas').getContext('2d');
  if (!ctx) return;
  const m: Monde = { acteurs: [], etincelles: [], W: 0, sol: 0, hh: 0, eclaire: -1, t: 0, etat: {} };
  let scene: Scene = jam;
  let dernier = performance.now();
  let horloge = 0;
  let suivante = 0;
  let demarree = false;
  const crowd = Array.from({ length: 60 }, () => ({
    phase: Math.random() * 6,
    taille: 0.7 + Math.random() * 0.5,
  }));
  let flashs: { x: number; t0: number }[] = [];

  const mesure = (W: number, H: number): void => {
    m.W = W;
    m.sol = H - Math.max(10, H * 0.03);
    m.hh = Math.max(70, Math.min(H * 0.42, W / 3.4, 300));
    const accueils = places(ecran, W, m.hh * 0.75);
    if (!m.acteurs.length)
      m.acteurs = HEROS.map((genre, i) => ({
        genre,
        x: accueils[i]!,
        z: 0,
        vz: 0,
        dir: accueils[i]! < W / 2 ? 1 : -1,
        tx: null,
        vitesse: 4,
        accueil: accueils[i]!,
      }));
    m.acteurs.forEach((a, i) => (a.accueil = accueils[i]!));
  };

  const change = () => {
    scene = scene === jam ? SCENES[alea(SCENES.length)]! : jam;
    m.t = 0;
    m.etat = {};
    scene.debut(m);
    suivante = horloge + scene.duree;
  };

  const physique = (dt: number) => {
    m.t += dt;
    scene.maj(m, dt);
    const g = G_PESANTEUR * m.hh;
    for (const a of m.acteurs) {
      if (a.tx !== null) {
        const d = a.tx - a.x;
        if (Math.abs(d) < 3) {
          [a.x, a.tx] = [a.tx, null];
          // rentré à sa place : il se tourne vers le milieu de la scène
          if (a.x === a.accueil) a.dir = a.x < m.W / 2 ? 1 : -1;
        } else {
          a.dir = d > 0 ? 1 : -1;
          a.x += a.dir * Math.min(Math.abs(d), a.vitesse * m.hh * dt);
          // un autre sur le chemin, à terre : on lui saute par-dessus
          if (
            a.z === 0 &&
            m.acteurs.some(
              (b) =>
                b !== a && b.z < m.hh * 0.3 && (b.x - a.x) * a.dir > 0 && (b.x - a.x) * a.dir < m.hh * 0.6,
            )
          )
            saute(m, a, 0.85);
        }
      }
      if (a.z > 0 || a.vz > 0) {
        a.z += a.vz * dt;
        a.vz -= g * dt;
        if (a.z <= 0) [a.z, a.vz] = [0, 0];
      }
    }
    m.etincelles = m.etincelles.filter((e) => m.t - e.t0 < 0.7);
    for (const e of m.etincelles) [e.x, e.y, e.vy] = [e.x + e.vx * dt, e.y + e.vy * dt, e.vy + g * 0.3 * dt];
  };

  const dessine = (W: number, H: number) => {
    const temps = (horloge * BPM) / 60;
    // les projecteurs : plus vifs et plus rapides quand quelqu'un a son solo
    const faisceaux = projecteurs(ctx, W, H, horloge * (m.eclaire >= 0 ? 1.4 : 1));
    rampe(ctx, W, m.sol, temps);
    const ordre = [...m.acteurs.keys()].sort((a, b) => m.acteurs[a]!.z - m.acteurs[b]!.z);
    for (const i of ordre) {
      const a = m.acteurs[i]!;
      const bouge = a.tx !== null;
      const lumiere = faisceaux.reduce((v, fx) => Math.max(v, 1 - Math.abs(fx - a.x) / (W * 0.12)), 0);
      const e = a.z > 0 ? ANIM.SAUT : bouge ? ANIM.COURT : ANIM.DEBOUT;
      const compteur = bouge ? Math.floor(horloge * 42) : (Math.floor(temps * 2) % 4) * 3;
      const ombre = i === m.eclaire ? 0 : 0.35 * (1 - Math.max(0, lumiere)) + (m.eclaire >= 0 ? 0.3 : 0);
      silhouette(
        ctx,
        tampon,
        a.genre,
        a.x,
        m.sol - a.z,
        m.hh / 20,
        a.dir < 0,
        compteur,
        ombre,
        1,
        e,
        a.z > 0 ? `${NOMS[i]}-saut` : undefined,
      );
    }
    for (const e of m.etincelles) {
      ctx.globalAlpha = Math.max(0, 1 - (m.t - e.t0) / 0.7);
      ctx.fillStyle = e.couleur;
      ctx.fillRect(e.x - 2, e.y - 2, 4, 4);
    }
    ctx.globalAlpha = 1;
    public_(ctx, W, H, temps, crowd, flashs, horloge);
  };

  const image = (maintenant: number) => {
    if (!toile.isConnected) return;
    const fige = qualite() === 'eco' || calme();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const [W, H] = [toile.clientWidth, toile.clientHeight];
    if (toile.width !== Math.round(W * dpr) || toile.height !== Math.round(H * dpr)) {
      toile.width = Math.round(W * dpr);
      toile.height = Math.round(H * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    mesure(W, H);
    if (!demarree) {
      demarree = true;
      scene.debut(m);
      suivante = jam.duree;
    }
    const dt = fige ? 0 : Math.min(0.05, (maintenant - dernier) / 1000);
    dernier = maintenant;
    horloge += dt;
    if (!fige && horloge >= suivante) change();
    // les flashs du public : de temps en temps, un appareil photo
    if (!fige && Math.random() < dt * 2.5) flashs.push({ x: Math.random() * W, t0: horloge });
    flashs = flashs.filter((f) => horloge - f.t0 < 0.25);
    physique(dt);
    dessine(W, H);
    if (!fige) requestAnimationFrame(image);
  };
  requestAnimationFrame(image);
}

/**
 * Les places d'accueil des cinq héros (centre de chacun, en px) : de part et d'autre de la colonne des boutons, plus nombreux du
 * côté où il y a le plus de place, serrés d'une largeur de héros `l` ; sans boutons, répartis sur toute la largeur.
 */
function places(ecran: HTMLElement, W: number, l: number): number[] {
  const b = ecran.querySelector('.boutons-menu')?.getBoundingClientRect();
  const boite = ecran.getBoundingClientRect();
  const [g, d] = b ? [b.left - boite.left - 8, b.right - boite.left + 8] : [W / 2, W / 2];
  const [L, R] = [Math.max(0, g), Math.max(0, W - d)];
  const n = L + R > 0 ? Math.max(1, Math.min(4, Math.round((5 * L) / (L + R)))) : 3;
  // de chaque côté, en rang depuis le bord des boutons vers le bord de l'écran
  const cote = (k: number, depuis: number, sens: number, place: number): number[] => {
    const pas = Math.min(l, place / k);
    return Array.from({ length: k }, (_, i) => depuis + sens * pas * (i + 0.5));
  };
  const gauche = cote(n, g, -1, L).reverse();
  const droite = cote(5 - n, d, 1, R);
  return [...gauche, ...droite].map((x) => Math.max(l / 2, Math.min(W - l / 2, x)));
}

/** Le public, en bas de l'écran : des silhouettes sombres aux bras levés qui se balancent, et des flashs d'appareils. */
function public_(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  temps: number,
  gens: { phase: number; taille: number }[],
  flashs: { x: number; t0: number }[],
  horloge: number,
): void {
  const pas = W / gens.length;
  ctx.fillStyle = '#0b0710';
  gens.forEach((g, i) => {
    const x = pas * (i + 0.5);
    const r = Math.max(6, H * 0.028) * g.taille;
    const bas = H + r * 0.6;
    const balance = Math.sin(temps * Math.PI + g.phase) * r * 0.25;
    ctx.beginPath();
    ctx.arc(x + balance, bas - r * 1.4, r, 0, Math.PI * 2);
    ctx.fill();
    // un bras levé, au rythme
    const haut = Math.sin(temps * Math.PI * 2 + g.phase * 2) > 0.2 ? r * 2.2 : r * 1.3;
    ctx.fillRect(x + r * 0.7 + balance, bas - r * 1.4 - haut, r * 0.45, haut);
  });
  for (const f of flashs) {
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = Math.max(0, 1 - (horloge - f.t0) / 0.25);
    ctx.fillRect(f.x - 2, H - Math.max(12, H * 0.07) - 2, 5, 5);
  }
  ctx.globalAlpha = 1;
}
