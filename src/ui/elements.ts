/** Petits constructeurs d'éléments HTML : le texte passe toujours par textContent. */
export const el = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  texte = '',
  classe = '',
): HTMLElementTagNameMap[K] => {
  const e = document.createElement(tag);
  if (texte) e.textContent = texte;
  if (classe) e.className = classe;
  return e;
};

export const bouton = (texte: string, action: () => void, classe = ''): HTMLButtonElement => {
  const b = el('button', texte, classe);
  b.type = 'button';
  b.addEventListener('click', action);
  return b;
};

/**
 * Les boutons d'un écran de menu sont en colonne ; si la colonne dépasse l'écran, on la coupe en plusieurs colonnes de même
 * hauteur : le moins de colonnes possible. À rappeler quand l'écran change de taille.
 */
export function ajusteColonnes(ecran: HTMLElement): void {
  for (const c of ecran.querySelectorAll<HTMLElement>('.boutons-menu, .ligne')) {
    const n = c.children.length;
    let lignes = n;
    c.style.setProperty('--lignes', String(lignes));
    while (lignes > 1 && ecran.scrollHeight > ecran.clientHeight + 1)
      c.style.setProperty('--lignes', String(--lignes));
    // des colonnes de même hauteur : 6 boutons sur 5 lignes font 2 colonnes, donc 3 + 3
    c.style.setProperty('--lignes', String(Math.ceil(n / Math.ceil(n / lignes))));
  }
}
