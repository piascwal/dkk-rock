import { VERSION } from '../version';

/** Les angles (degrés) et décalages (% de la largeur de l'écran) où chaque photo se pose : jamais deux fois pareil. */
const POSES = [
  { angle: -7, dx: -4 },
  { angle: 5, dx: 3 },
  { angle: -2, dx: -1 },
  { angle: 8, dx: 4 },
  { angle: -4, dx: 2 },
];

/** Une pile de photos : chacune tombe de travers sur la précédente, à chaque appel de `pose` (la première, d'elle-même). */
export class PileDePhotos {
  readonly element = document.createElement('div');
  private readonly photos: HTMLElement[];
  private tombees = 0;

  constructor(fichiers: readonly string[]) {
    this.element.className = 'pile-photos';
    this.photos = fichiers.map((fichier, i) => {
      const pose = POSES[i % POSES.length]!;
      const photo = document.createElement('figure');
      photo.className = 'photo';
      photo.style.setProperty('--angle', `${pose.angle}deg`);
      photo.style.setProperty('--dx', `${pose.dx}vw`);
      photo.style.zIndex = String(i + 1);
      const img = document.createElement('img');
      img.alt = '';
      img.src = `${import.meta.env.BASE_URL}sprites/${fichier}?v=${VERSION}`;
      photo.append(img);
      this.element.append(photo);
      return photo;
    });
    // la première arrive d'elle-même, juste après l'affichage de la page
    this.photos[0]?.style.setProperty('animation-delay', '0.3s');
    this.pose();
  }

  /** Laisse tomber la photo suivante ; false s'il n'en reste plus (le toucher doit alors passer à la page suivante). */
  pose(): boolean {
    const photo = this.photos[this.tombees];
    if (!photo) return false;
    photo.classList.add('tombee');
    this.tombees++;
    return true;
  }

  /** Il reste des photos à poser : un toucher les empile au lieu de passer la page. */
  get enAttente(): boolean {
    return this.tombees < this.photos.length;
  }
}
