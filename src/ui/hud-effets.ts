import { QUARTS_PAR_COEUR } from '../config';

/**
 * Les cœurs du HUD prennent vie : un quart perdu fait trembler le cœur touché et en fait sortir un petit éclat rouge ; un cœur
 * vidé éclate en morceaux ; un cœur regagné (tonneau WOG) gonfle avec un éclat doré. Les éclats vivent dans un calque à part,
 * par-dessus le HUD (que celui-ci peut redessiner sans les couper). Rien si le système demande moins d'animations.
 */

const calque = (() => {
  let c: HTMLElement | null = null;
  return () => {
    if (!c) {
      c = document.createElement('div');
      c.className = 'hud-effets';
      document.body.append(c);
    }
    return c;
  };
})();

const calme = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Des éclats carrés qui partent du centre de `cible` (pixels de l'écran). */
function eclats(cible: DOMRect, couleurs: readonly string[], nombre: number, portee: number): void {
  const cx = cible.left + cible.width / 2;
  const cy = cible.top + cible.height / 2;
  for (let i = 0; i < nombre; i++) {
    const e = document.createElement('i');
    e.className = 'eclat-hud';
    e.style.left = `${cx}px`;
    e.style.top = `${cy}px`;
    e.style.background = couleurs[i % couleurs.length]!;
    calque().append(e);
    const angle = (i / nombre) * Math.PI * 2 + Math.random() * 0.6;
    const d = portee * (0.6 + Math.random() * 0.6);
    e.animate(
      [
        { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
        {
          transform: `translate(calc(-50% + ${Math.cos(angle) * d}px), calc(-50% + ${Math.sin(angle) * d + portee * 0.4}px)) scale(0.4)`,
          opacity: 0,
        },
      ],
      { duration: 450 + Math.random() * 200, easing: 'cubic-bezier(.2,.7,.4,1)' },
    ).onfinish = () => e.remove();
  }
}

/** Les cœurs d'un joueur viennent de passer de `avant` à `apres` points de vie (en quarts) : `coeurs`, leur rangée dans le HUD. */
export function animeCoeurs(coeurs: HTMLElement, avant: number, apres: number): void {
  if (avant === apres || calme()) return;
  const liste = coeurs.querySelectorAll<HTMLElement>('.coeur-q');
  if (apres < avant) {
    // le cœur touché : celui qui contenait le dernier quart perdu
    const touche = liste[Math.ceil(avant / QUARTS_PAR_COEUR) - 1];
    if (!touche) return;
    coeurs.animate(
      [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-3px)' },
        { transform: 'translateX(3px)' },
        { transform: 'translateX(-2px)' },
        { transform: 'translateX(0)' },
      ],
      { duration: 260 },
    );
    const vide = apres <= (Math.ceil(avant / QUARTS_PAR_COEUR) - 1) * QUARTS_PAR_COEUR;
    if (vide) {
      // il éclate : il gonfle, puis ses morceaux s'envolent
      touche.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.7)' }, { transform: 'scale(1)' }], {
        duration: 280,
        easing: 'ease-out',
      });
      eclats(touche.getBoundingClientRect(), ['#e5243b', '#ff9a9a', '#3a0a10'], 12, 26);
    } else eclats(touche.getBoundingClientRect(), ['#e5243b', '#ff9a9a'], 5, 14);
    return;
  }
  // regagné : chaque cœur qui a pris des quarts gonfle, avec un éclat doré
  for (let c = Math.floor(avant / QUARTS_PAR_COEUR); c < Math.ceil(apres / QUARTS_PAR_COEUR); c++) {
    const coeur = liste[c];
    if (!coeur) continue;
    coeur.animate(
      [
        { transform: 'scale(1)', filter: 'none' },
        { transform: 'scale(1.6)', filter: 'drop-shadow(0 0 4px #ffd23f) brightness(1.4)' },
        { transform: 'scale(1)', filter: 'none' },
      ],
      { duration: 420, delay: (c - Math.floor(avant / QUARTS_PAR_COEUR)) * 70, easing: 'ease-out' },
    );
    eclats(coeur.getBoundingClientRect(), ['#ffd23f', '#fff6b0'], 6, 16);
  }
}
