#!/usr/bin/env python3
"""Les icônes de l'éditeur de niveau, tirées de Lucide (https://lucide.dev, licence ISC : libres d'usage, sans attribution exigée).

Usage : npm pack lucide-static && tar xzf lucide-static-*.tgz
        python3 outils/icones-editeur.py package/icons      Sortie : src/editeur/icones.ts (généré)
"""
import pathlib
import re
import sys

RACINE = pathlib.Path(__file__).resolve().parent.parent
SORTIE = RACINE / 'src' / 'editeur' / 'icones.ts'

# le nom dans l'éditeur : le nom de l'icône Lucide
ICONES = {
    'main': 'hand', 'pinceau': 'pencil', 'rectangle': 'square', 'gomme': 'eraser', 'pipette': 'pipette',
    'selection': 'square-dashed', 'annuler': 'undo-2', 'refaire': 'redo-2', 'menu': 'menu', 'tester': 'play',
    'zoomer': 'zoom-in', 'dezoomer': 'zoom-out', 'fermer': 'x', 'nouveau': 'file-plus', 'ouvrir': 'folder-open',
    'reglages': 'settings', 'verifier': 'circle-check', 'exporter': 'share-2', 'importer': 'upload',
    'modules': 'boxes', 'quitter': 'log-out', 'telecharger': 'download', 'copier': 'copy', 'supprimer': 'trash-2',
    'creer': 'package-plus',
}


def main():
    dossier = pathlib.Path(sys.argv[1])
    lignes = []
    for nom, lucide in ICONES.items():
        svg = (dossier / f'{lucide}.svg').read_text()
        dedans = ''.join(l.strip() for l in re.search(r'<svg[^>]*>(.*)</svg>', svg, re.S).group(1).splitlines())
        lignes.append(f"  {nom}: '{dedans}',")
    SORTIE.write_text(
        "// Fichier généré par outils/icones-editeur.py : ne pas modifier à la main.\n"
        "// Icônes Lucide (https://lucide.dev), licence ISC : © Lucide Contributors, et Cole Bemis pour Feather (MIT).\n\n"
        "/** Le dessin de chaque icône (le contenu d'un SVG de 24 × 24 à trait, voir `icone`). */\n"
        "const ICONES = {\n" + '\n'.join(lignes) + "\n} as const;\n\n"
        "export type NomIcone = keyof typeof ICONES;\n\n"
        "/** Une icône à trait, de la couleur du texte. */\n"
        "export function icone(nom: NomIcone): SVGSVGElement {\n"
        "  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');\n"
        "  svg.setAttribute('viewBox', '0 0 24 24');\n"
        "  svg.setAttribute('aria-hidden', 'true');\n"
        "  svg.setAttribute('class', 'ed-icone');\n"
        "  svg.innerHTML = ICONES[nom];\n"
        "  return svg;\n"
        "}\n"
    )
    print(f'{len(ICONES)} icônes')


if __name__ == '__main__':
    main()
