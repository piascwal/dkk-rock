import { TUILE } from '../config';
import type { Camera } from './dessin';
import { ZOOM, type Editeur, type Outil } from './editeur';

/**
 * Les gestes sur la carte de l'éditeur :
 * - au doigt : un doigt peint avec l'outil choisi (ou déplace la vue avec la main) ; deux doigts déplacent et zooment (pincer),
 *   et le trait commencé par le premier doigt est oublié ; un doigt qui reste appuyé sans bouger ouvre les outils autour de lui
 *   (voir menu-rond.ts), et le trait qu'il avait commencé est oublié ; un module ou un accessoire suit le doigt et se pose quand on le lève ;
 * - à la souris : le bouton gauche peint, le droit, celui du milieu ou la barre d'espace déplacent, la molette zoome (un pavé
 *   tactile fait défiler, ou zoome en pinçant) ; le survol montre ce qui sera posé ;
 * - au clavier : Ctrl+Z / Ctrl+Y, B pinceau, R rectangle, E gomme, I pipette, S sélection, H main, + et − pour zoomer, les flèches déplacent.
 */

interface Point {
  x: number;
  y: number;
}

/** Les cases d'un segment (Bresenham) : un trait rapide ne laisse pas de trous. */
function segment(a: Point, b: Point, f: (x: number, y: number) => void): void {
  let [x, y] = [a.x, a.y];
  const [dx, dy] = [Math.abs(b.x - x), -Math.abs(b.y - y)];
  const [sx, sy] = [x < b.x ? 1 : -1, y < b.y ? 1 : -1];
  let err = dx + dy;
  for (;;) {
    f(x, y);
    if (x === b.x && y === b.y) return;
    const e2 = 2 * err;
    if (e2 >= dy) [err, x] = [err + dy, x + sx];
    if (e2 <= dx) [err, y] = [err + dx, y + sy];
  }
}

/** le temps d'appui sans bouger qui ouvre le menu en rond (ms), et le jeu toléré du doigt (px) */
const APPUI_LONG = 450;
const JEU_DU_DOIGT = 10;

const TOUCHES: Record<string, Outil> = {
  b: 'pinceau',
  r: 'rect',
  e: 'gomme',
  i: 'pipette',
  h: 'main',
  s: 'selection',
};

export function brancheGestes(ed: Editeur): void {
  const t = ed.toile;
  const doigts = new Map<number, Point>();
  let trait: { derniere: Point } | null = null;
  let pince: { dist: number; milieu: Point; cam: Camera } | null = null;
  let glisse: Point | null = null;
  let espace = false;
  /** l'appui long en cours : le doigt, où il s'est posé, le minuteur */
  let appui: { id: number; x: number; y: number; minuteur: ReturnType<typeof setTimeout> } | null = null;
  /** le doigt qui a ouvert le menu en rond, tant qu'il est posé */
  let rond: number | null = null;
  const oublieAppui = () => {
    if (appui) clearTimeout(appui.minuteur);
    appui = null;
  };
  /** un module ou un accessoire : il suit le doigt, et se pose au lâcher */
  const auLacher = () =>
    ed.outil !== 'gomme' &&
    ed.outil !== 'selection' &&
    (ed.choix.famille === 'decor' || ed.choix.famille === 'modules' || ed.choix.cle === 'tyro');
  const milieu = (): [Point, number] => {
    const [a, b] = [...doigts.values()] as [Point, Point];
    return [{ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, Math.hypot(a.x - b.x, a.y - b.y)];
  };

  t.addEventListener('contextmenu', (e) => e.preventDefault());
  t.addEventListener('pointerdown', (e) => {
    t.setPointerCapture(e.pointerId);
    doigts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    oublieAppui();
    if (doigts.size === 1 && e.pointerType !== 'mouse') {
      const [id, x, y] = [e.pointerId, e.clientX, e.clientY];
      appui = {
        id,
        x,
        y,
        minuteur: setTimeout(() => {
          appui = null;
          if (trait) ed.doc.abandonne();
          [trait, glisse, ed.apercu, rond] = [null, null, null, id];
          ed.rond.ouvre(x, y);
          ed.redessine();
        }, APPUI_LONG),
      };
    }
    if (doigts.size === 2) {
      if (trait) ed.doc.abandonne();
      trait = null;
      glisse = null;
      ed.apercu = null;
      const [m, dist] = milieu();
      pince = { dist: Math.max(1, dist), milieu: m, cam: { ...ed.cam } };
      return;
    }
    if (doigts.size > 2 || pince) return;
    if (ed.outil === 'main' || e.button === 1 || e.button === 2 || espace) {
      glisse = { x: e.clientX, y: e.clientY };
      return;
    }
    if (e.button !== 0) return;
    const c = ed.caseSous(e.clientX, e.clientY);
    if (ed.outil === 'pipette') return ed.pipette(c.x, c.y);
    ed.doc.commence();
    trait = { derniere: c };
    if (auLacher()) ed.apercoit(c.x, c.y);
    else if (ed.outil === 'rect' || ed.outil === 'selection')
      ed.apercu = { genre: 'rect', x0: c.x, y0: c.y, x1: c.x, y1: c.y, pointille: ed.outil === 'selection' };
    else ed.peint(c.x, c.y);
    ed.redessine();
  });

  t.addEventListener('pointermove', (e) => {
    if (doigts.has(e.pointerId)) doigts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (appui?.id === e.pointerId && Math.hypot(e.clientX - appui.x, e.clientY - appui.y) > JEU_DU_DOIGT)
      oublieAppui();
    if (rond === e.pointerId) return ed.rond.survole(e.clientX, e.clientY);
    if (pince && doigts.size >= 2) {
      const [m, dist] = milieu();
      const r = t.getBoundingClientRect();
      const z = Math.max(ZOOM[0], Math.min(ZOOM[1], (pince.cam.zoom * dist) / pince.dist));
      // le point du monde sous le milieu des doigts au début reste sous leur milieu : on zoome et on déplace à la fois
      const wx = pince.cam.x + (pince.milieu.x - r.left) / pince.cam.zoom;
      const wy = pince.cam.y + (pince.milieu.y - r.top) / pince.cam.zoom;
      Object.assign(ed.cam, { zoom: z, x: wx - (m.x - r.left) / z, y: wy - (m.y - r.top) / z });
      return ed.redessine();
    }
    if (glisse) {
      ed.cam.x -= (e.clientX - glisse.x) / ed.cam.zoom;
      ed.cam.y -= (e.clientY - glisse.y) / ed.cam.zoom;
      glisse = { x: e.clientX, y: e.clientY };
      return ed.redessine();
    }
    if (pince) return;
    const c = ed.caseSous(e.clientX, e.clientY);
    if (!trait) {
      if (e.pointerType === 'mouse') ed.apercoit(c.x, c.y);
      return;
    }
    if (c.x === trait.derniere.x && c.y === trait.derniere.y) return;
    if (ed.apercu?.genre === 'rect') Object.assign(ed.apercu, { x1: c.x, y1: c.y });
    else if (auLacher()) ed.apercoit(c.x, c.y);
    else segment(trait.derniere, c, (x, y) => ed.peint(x, y));
    trait.derniere = c;
    ed.redessine();
  });

  const lache = (e: PointerEvent, annule: boolean) => {
    doigts.delete(e.pointerId);
    if (appui?.id === e.pointerId) oublieAppui();
    if (rond === e.pointerId) {
      rond = null;
      if (!annule) ed.rond.lache(e.clientX, e.clientY);
      return;
    }
    if (pince) {
      if (doigts.size === 0) pince = null;
      return;
    }
    glisse = null;
    if (!trait) return;
    const c = trait.derniere;
    trait = null;
    if (annule) ed.doc.abandonne();
    else {
      const a = ed.apercu;
      if (a?.genre === 'rect' && a.pointille) ed.selectionne(a.x0, a.y0, a.x1, a.y1);
      else if (a?.genre === 'rect') ed.remplit(a.x0, a.y0, a.x1, a.y1);
      else if (auLacher()) ed.poseAuLacher(c.x, c.y);
      ed.doc.termine();
    }
    if (e.pointerType !== 'mouse') ed.apercu = null;
    ed.redessine();
  };
  t.addEventListener('pointerup', (e) => lache(e, false));
  t.addEventListener('pointercancel', (e) => lache(e, true));
  t.addEventListener('pointerleave', (e) => {
    if (e.pointerType === 'mouse' && !trait) {
      ed.apercu = null;
      ed.redessine();
    }
  });

  t.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      const r = t.getBoundingClientRect();
      // une molette (des crans) ou un pincement de pavé tactile (ctrl) zoome ; un pavé tactile qui défile déplace
      if (e.ctrlKey || (e.deltaX === 0 && Math.abs(e.deltaY) >= 40))
        ed.zoome(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.002)), e.clientX - r.left, e.clientY - r.top);
      else {
        ed.cam.x += e.deltaX / ed.cam.zoom;
        ed.cam.y += e.deltaY / ed.cam.zoom;
        ed.redessine();
      }
    },
    { passive: false },
  );

  window.addEventListener('keydown', (e) => {
    if (ed.racine.hidden || (e.target as HTMLElement).closest?.('input, textarea, select')) return;
    const k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && k === 'z') ed.doc[e.shiftKey ? 'refait' : 'annule']();
    else if ((e.ctrlKey || e.metaKey) && k === 'y') ed.doc.refait();
    else if (e.ctrlKey || e.metaKey) return;
    else if (k === 'escape') {
      ed.palette.ferme();
      ed.rond.ferme();
    } else if (k === ' ') espace = true;
    else if (TOUCHES[k]) ed.choisitOutil(TOUCHES[k]);
    else if (k === '+' || k === '=') ed.zoome(1.4);
    else if (k === '-') ed.zoome(1 / 1.4);
    else if (k.startsWith('arrow')) {
      const d = (4 * TUILE) / Math.max(1, ed.cam.zoom / 2);
      ed.cam.x += k === 'arrowleft' ? -d : k === 'arrowright' ? d : 0;
      ed.cam.y += k === 'arrowup' ? -d : k === 'arrowdown' ? d : 0;
      ed.redessine();
    } else return;
    e.preventDefault();
  });
  window.addEventListener('keyup', (e) => {
    if (e.key === ' ') espace = false;
  });
}
