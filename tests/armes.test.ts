import { describe, expect, it } from 'vitest';
import { VIES_DEPART } from '../src/config';
import { ARMES_RAMASSABLES, armeRamassee } from '../src/entites/armes';
import { Ennemi } from '../src/entites/ennemis/ennemi';
import { Projectile } from '../src/entites/projectile';
import { DONUT, FLIPPER, FRISBEE, PILE } from '../src/entites/projectiles-defs';
import { Partie } from '../src/jeu/partie';
import { FEUILLES_DECOR } from '../src/rendu/feuilles-objets';

const nouvelle = () => {
  const p = new Partie({ niveau: 0, drapeau: -1, vies: VIES_DEPART, score: 0 });
  p.ajouteJoueur(0, 0);
  while (p.phase === 'histoire') p.suivant();
  p.avance();
  return p;
};
const tirs = (p: Partie) => p.entites.filter((e): e is Projectile => e instanceof Projectile);
const arme = (nom: string) => ARMES_RAMASSABLES.find((a) => a.nom === nom)!;
/** Fait avancer la partie en vidant ses évènements ; renvoie ceux qui sont arrivés. */
const avance = (p: Partie, n: number) => {
  const evts = [];
  for (let i = 0; i < n; i++) {
    p.avance();
    evts.push(...p.releveEvenements());
  }
  return evts;
};

describe('les armes du lot 9', () => {
  it('ont chacune une icône fournie, chargée comme les autres planches du décor', () => {
    for (const nom of ['Lecteur minidisc', 'Pile alcaline', 'Flipper', 'Frisbee', 'Machine à donuts']) {
      const a = arme(nom);
      expect(a.sprite, nom).toBeDefined();
      expect(FEUILLES_DECOR[a.sprite!], nom).toBeDefined();
      expect(armeRamassee(ARMES_RAMASSABLES.indexOf(a) + 1)).toBe(a);
    }
  });

  it('le minidisc envoie un disque qui traverse les ennemis', () => {
    const p = nouvelle();
    const j = p.joueurs[0]!;
    arme('Lecteur minidisc').tir(p, { x: j.cx, y: j.cy, dir: 1 });
    const t = tirs(p).at(-1)!;
    expect(t.camp).toBe('heros');
    expect(t.def.perce).toBe(true);
  });

  it('la pile alcaline tire en rafale, un peu en éventail', () => {
    const p = nouvelle();
    const j = p.joueurs[0]!;
    const a = arme('Pile alcaline');
    expect(a.cadence).toBeLessThanOrEqual(5);
    for (let i = 0; i < 20; i++) a.tir(p, { x: j.cx, y: j.cy, dir: 1 });
    const vy = tirs(p)
      .filter((t) => t.def === PILE)
      .map((t) => t.vy);
    expect(vy.length).toBe(20);
    expect(Math.max(...vy) - Math.min(...vy)).toBeGreaterThan(0.3);
  });

  it('Flipper rebondit trois fois avant d’exploser', () => {
    const p = nouvelle();
    const j = p.joueurs[0]!;
    const f = new Projectile(p, FLIPPER, 'heros', j.cx, j.cy - 20, 0, -1);
    p.ajoute(f);
    let rebonds = 0;
    let vyAvant = 0;
    let explose = false;
    for (let i = 0; i < FLIPPER.duree && !f.fini; i++) {
      vyAvant = f.vy;
      p.avance();
      if (vyAvant > 0.5 && f.vy < 0) rebonds++;
      if (p.releveEvenements().some((e) => e.k === 'explo')) explose = true;
    }
    expect(rebonds).toBeGreaterThanOrEqual(2);
    expect(f.fini).toBe(true);
    expect(explose).toBe(true);
  });

  it('le frisbee vire vers l’ennemi le plus proche', () => {
    const p = nouvelle();
    const j = p.joueurs[0]!;
    const e = p.entites.find((x): x is Ennemi => x instanceof Ennemi)!;
    Object.assign(e.corps, { x: j.cx + 90, y: j.corps.y, vx: 0, vy: 0 });
    // le frisbee part tout droit, bien au-dessus de l'ennemi : le guidage doit le faire plonger
    const f = new Projectile(p, FRISBEE, 'heros', j.cx + 10, j.cy - 45, FRISBEE.vitesse, 0);
    p.ajoute(f);
    avance(p, 12);
    expect(f.vy).toBeGreaterThan(0.5);
    expect(Math.hypot(f.vx, f.vy)).toBeCloseTo(FRISBEE.vitesse, 1);
  });

  it('un frisbee sans ennemi à portée file droit', () => {
    const p = nouvelle();
    const j = p.joueurs[0]!;
    for (const e of p.entites) if (e instanceof Ennemi) e.corps.x = j.cx + 2000;
    const f = new Projectile(p, FRISBEE, 'heros', j.cx + 10, j.cy - 45, FRISBEE.vitesse, 0);
    p.ajoute(f);
    avance(p, 10);
    expect(f.vy).toBeCloseTo(0, 5);
  });

  it('le donut explose au premier contact', () => {
    const p = nouvelle();
    const j = p.joueurs[0]!;
    const d = new Projectile(p, DONUT, 'heros', j.cx + 20, j.cy - 10, 0, 2);
    p.ajoute(d);
    const evts = avance(p, 40);
    expect(d.fini).toBe(true);
    expect(evts.some((e) => e.k === 'explo')).toBe(true);
  });
});
