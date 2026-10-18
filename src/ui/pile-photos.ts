import { VERSION } from '../version';

/** Les angles (degrés) et décalages (% de la largeur de l'écran) où chaque photo se pose : jamais deux fois pareil. */
const POSES = [
  { angle: -7, dx: -4 },
  { angle: 5, dx: 3 },
  { angle: -2, dx: -1 },
  { angle: 8, dx: 4 },
  { angle: -4, dx: 2 },
];

/** Le délai entre deux photos qui tombent sur la pile, en secondes. */
const DELAI = 0.9;

/** Une pile de photos : elles tombent l'une après l'autre, chacune posée de travers sur la précédente. */
export function pileDePhotos(fichiers: readonly string[]): HTMLElement {
  const pile = document.createElement('div');
  pile.className = 'pile-photos';
  fichiers.forEach((fichier, i) => {
    const pose = POSES[i % POSES.length]!;
    const photo = document.createElement('figure');
    photo.className = 'photo';
    photo.style.setProperty('--angle', `${pose.angle}deg`);
    photo.style.setProperty('--dx', `${pose.dx}vw`);
    photo.style.animationDelay = `${0.3 + i * DELAI}s`;
    photo.style.zIndex = String(i + 1);
    const img = document.createElement('img');
    img.alt = '';
    img.src = `${import.meta.env.BASE_URL}sprites/${fichier}?v=${VERSION}`;
    photo.append(img);
    pile.append(photo);
  });
  return pile;
}
