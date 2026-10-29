import { C } from '../jeu/commandes';

/**
 * Les touches du clavier (version ordinateur) : chaque action en a une à trois, réaffectables dans Options → Touches du clavier et
 * gardées dans le navigateur. On range des `KeyboardEvent.code` (la place de la touche, quelle que soit la disposition : ZQSD
 * en AZERTY comme WASD en QWERTY sont aux mêmes places). Une touche ne sert qu'à une action.
 */

export type ActionTouche = 'gauche' | 'droite' | 'haut' | 'bas' | 'saut' | 'tir' | 'special' | 'pause';

export interface DefAction {
  id: ActionTouche;
  nom: string;
  aide: string;
  /** le bit de commande (jeu/commandes.ts) ; la pause n'en a pas */
  commande: number;
}

export const ACTIONS: readonly DefAction[] = [
  { id: 'gauche', nom: 'Aller à gauche', aide: 'Marcher, nager, piloter', commande: C.GAUCHE },
  { id: 'droite', nom: 'Aller à droite', aide: 'Marcher, nager, piloter', commande: C.DROITE },
  { id: 'haut', nom: 'Haut', aide: 'Monter à l’échelle, viser en haut, changer de voie', commande: C.HAUT },
  { id: 'bas', nom: 'Bas', aide: 'Descendre, se baisser, viser en bas', commande: C.BAS },
  {
    id: 'saut',
    nom: 'Sauter',
    aide: 'Sauter, s’agripper au mur, voler, valider un écran de fin',
    commande: C.SAUT,
  },
  { id: 'tir', nom: 'Tirer', aide: 'Tir de l’instrument', commande: C.TIR },
  { id: 'special', nom: 'Tir spécial', aide: 'Le tir spécial du héros', commande: C.SPECIAL },
  { id: 'pause', nom: 'Pause', aide: 'Mettre le jeu en pause, ou le reprendre', commande: 0 },
];

export const DEFAUTS: Readonly<Record<ActionTouche, readonly string[]>> = {
  gauche: ['ArrowLeft', 'KeyA', 'KeyQ'],
  droite: ['ArrowRight', 'KeyD'],
  haut: ['ArrowUp', 'KeyW', 'KeyZ'],
  bas: ['ArrowDown', 'KeyS'],
  saut: ['Space', 'KeyK'],
  tir: ['KeyJ', 'KeyX', 'ShiftLeft'],
  special: ['KeyL', 'KeyC'],
  pause: ['Escape', 'KeyP'],
};

export const MAX_TOUCHES = 3;
const CLE = 'dkk-touches';

/** Les touches qu'on ne donne pas : Entrée valide les écrans, Tab et les touches de fonction sont au navigateur. Échap : la pause. */
export function touchePermise(code: string, action: ActionTouche): boolean {
  if (!/^[A-Za-z0-9]{1,20}$/.test(code)) return false;
  if (
    /^(Enter|NumpadEnter|Tab|ContextMenu|Meta.*|OS.*|F\d+|CapsLock|NumLock|ScrollLock|Pause|PrintScreen)$/.test(
      code,
    )
  )
    return false;
  return code !== 'Escape' || action === 'pause';
}

const ID = new Set<string>(ACTIONS.map((a) => a.id));

export class Touches {
  private liees = new Map<ActionTouche, string[]>();
  private parCode = new Map<string, ActionTouche>();
  /** appelée quand les touches changent (le clavier lâche ce qu'il tenait) */
  onChange: () => void = () => {};

  constructor(private readonly stockage: Pick<Storage, 'getItem' | 'setItem'> | null = null) {
    this.charge();
  }

  liste(a: ActionTouche): readonly string[] {
    return this.liees.get(a) ?? [];
  }

  action(code: string): ActionTouche | undefined {
    return this.parCode.get(code);
  }

  /** Le bit de commande de la touche, 0 si elle ne commande rien (ou si c'est la pause). */
  commande(code: string): number {
    const a = this.parCode.get(code);
    return a ? (ACTIONS.find((d) => d.id === a)?.commande ?? 0) : 0;
  }

  estParDefaut(): boolean {
    return ACTIONS.every((a) => this.liste(a.id).join() === DEFAUTS[a.id].join());
  }

  /** Donne `code` à l'action, à la place de sa touche n°`index` (ou en plus, si `index` dépasse). Renvoie une explication si on ne peut pas. */
  affecte(a: ActionTouche, index: number, code: string): string | null {
    if (!touchePermise(code, a)) return 'Cette touche est réservée.';
    const autre = this.parCode.get(code);
    const siennes = [...this.liste(a)];
    if (autre && autre !== a) {
      if (this.liste(autre).length <= 1) {
        return `« ${nomAction(autre)} » n’aurait plus aucune touche : changez-en d’abord une.`;
      }
      this.liees.set(
        autre,
        this.liste(autre).filter((c) => c !== code),
      );
    }
    if (index < siennes.length) siennes[index] = code;
    else if (siennes.length < MAX_TOUCHES) siennes.push(code);
    else return `Pas plus de ${MAX_TOUCHES} touches par action.`;
    this.liees.set(
      a,
      siennes.filter((c, i) => siennes.indexOf(c) === i),
    );
    this.fini();
    return null;
  }

  retire(a: ActionTouche, index: number): void {
    const l = this.liste(a);
    if (l.length <= 1) return;
    this.liees.set(
      a,
      l.filter((_, i) => i !== index),
    );
    this.fini();
  }

  reinitialise(): void {
    for (const a of ACTIONS) this.liees.set(a.id, [...DEFAUTS[a.id]]);
    this.fini();
  }

  private fini(): void {
    this.parCode.clear();
    for (const [a, l] of this.liees) for (const c of l) this.parCode.set(c, a);
    try {
      this.stockage?.setItem(CLE, JSON.stringify(Object.fromEntries(this.liees)));
    } catch {
      /* navigation privée : les touches ne seront pas gardées */
    }
    this.onChange();
  }

  /** Relit les touches gardées : ce qui est faux est ignoré, une touche déjà prise l'est par la première action ; une action sans touche reprend les siennes. */
  private charge(): void {
    let brut: unknown = null;
    try {
      brut = JSON.parse(this.stockage?.getItem(CLE) ?? 'null');
    } catch {
      brut = null;
    }
    const lu = brut && typeof brut === 'object' ? (brut as Record<string, unknown>) : {};
    const prises = new Set<string>();
    for (const { id } of ACTIONS) {
      const v = lu[id];
      const l = (Array.isArray(v) ? v : [])
        .filter((c): c is string => typeof c === 'string' && ID.has(id) && touchePermise(c, id))
        .filter((c, i, t) => t.indexOf(c) === i && !prises.has(c))
        .slice(0, MAX_TOUCHES);
      this.liees.set(id, l.length ? l : DEFAUTS[id].filter((c) => !prises.has(c)));
      for (const c of this.liees.get(id)!) prises.add(c);
    }
    for (const [a, l] of this.liees) for (const c of l) this.parCode.set(c, a);
  }
}

export const nomAction = (a: ActionTouche): string => ACTIONS.find((d) => d.id === a)?.nom ?? a;

const NOMS: Record<string, string> = {
  ArrowLeft: '←',
  ArrowRight: '→',
  ArrowUp: '↑',
  ArrowDown: '↓',
  Space: 'Espace',
  ShiftLeft: 'Maj gauche',
  ShiftRight: 'Maj droite',
  ControlLeft: 'Ctrl gauche',
  ControlRight: 'Ctrl droite',
  AltLeft: 'Alt gauche',
  AltRight: 'Alt droite',
  Escape: 'Échap',
  Backspace: 'Retour arrière',
  Delete: 'Suppr',
  Insert: 'Inser',
  Home: 'Début',
  End: 'Fin',
  PageUp: 'Page ↑',
  PageDown: 'Page ↓',
  Backquote: '`',
  Minus: '-',
  Equal: '=',
  BracketLeft: '[',
  BracketRight: ']',
  Backslash: '\\',
  Semicolon: ';',
  Quote: "'",
  Comma: ',',
  Period: '.',
  Slash: '/',
};

/** Le caractère que la disposition du clavier met à cette place (AZERTY, QWERTY...), quand le navigateur le dit. */
let disposition: ReadonlyMap<string, string> | null = null;
void (
  navigator as Navigator & { keyboard?: { getLayoutMap?: () => Promise<ReadonlyMap<string, string>> } }
).keyboard
  ?.getLayoutMap?.()
  .then((m) => (disposition = m))
  .catch(() => {});

/** Le nom d'une touche, comme on la lit sur le clavier. */
export function libelle(code: string): string {
  const lu = disposition?.get(code);
  if (lu && lu.length === 1 && !NOMS[code]) return lu.toUpperCase();
  if (NOMS[code]) return NOMS[code]!;
  const m = /^(?:Key|Digit)(.)$/.exec(code);
  if (m) return m[1]!;
  const n = /^Numpad(.+)$/.exec(code);
  return n ? `Pavé ${n[1]}` : code;
}

export const touches = new Touches(
  (() => {
    try {
      return localStorage;
    } catch {
      return null;
    }
  })(),
);
