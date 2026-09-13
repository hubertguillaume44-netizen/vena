// ————— ON INTERDIT LE CODE, PAS LE RÉCIT DU CODE —————
//
// Une garde qui lit du source tombe sur sa propre note : le commentaire qui raconte
// pourquoi une chaîne est interdite CITE cette chaîne, guillemets compris. C'est arrivé
// quatre fois dans ce dépôt — `//`, `/* */`, `{/* */}`, puis une note de `champsSession`
// qui écrivait le nom du réglage qu'elle venait de retirer.
//
// LA CONCLUSION N'EST PAS D'AJOUTER LE MOTIF SUIVANT : chaque langage apporte sa syntaxe.
// La forme retenue est LA PLUS PAUVRE ET LA PLUS SÛRE — la chaîne de caractères. Un
// commentaire n'en est jamais une, quelle que soit sa syntaxe, et reconnaître une chaîne
// ne demande de comprendre aucun langage : seulement ses guillemets et ses échappements.
//
// CE QU'ELLE NE COUVRE PAS : le texte écrit en clair entre deux balises. Là où ça compte,
// une garde de convention vérifie que la copie vit bien dans des littéraux, et échoue à la
// place des autres — voir `promesses-de-vente.test.mjs`.
//
// Ce module existe pour qu'il n'y en ait QU'UNE. Deux copies d'un analyseur divergent, et
// la divergence est muette : l'une verrait une chaîne que l'autre manque.

/** Les littéraux de chaîne d'une source, commentaires écartés. */
export function chainesLivrees(src) {
  const sorti = [];
  const n = src.length;
  let i = 0;
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (c === "/" && d === "/") { const f = src.indexOf("\n", i); i = f < 0 ? n : f; continue; }
    if (c === "/" && d === "*") { const f = src.indexOf("*/", i + 2); i = f < 0 ? n : f + 2; continue; }
    if (src.startsWith("<!--", i)) { const f = src.indexOf("-->", i + 4); i = f < 0 ? n : f + 3; continue; }
    if (c === '"' || c === "'" || c === "`") {
      let j = i + 1;
      while (j < n && src[j] !== c) { if (src[j] === "\\") j++; j++; }
      sorti.push(src.slice(i + 1, j));
      i = j + 1;
      continue;
    }
    i++;
  }
  return sorti;
}

/** Les mêmes, bout à bout — pour les gardes qui cherchent une phrase. */
export const blocLivre = (src) => chainesLivrees(src).join("\n");
