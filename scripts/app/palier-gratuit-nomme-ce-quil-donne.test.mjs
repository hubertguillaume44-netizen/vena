// STATUT · CAUSE ÉTABLIE — omission RAPPORTÉE (la colonne « 0 € » de l'accueil ne
// nommait que les trois instruments), emplacement et dérivation du compte MESURÉS DANS
// LE DÉPÔT.
//
// ————— LE RAPPORT DÉSIGNAIT /tarifs, LA PHRASE VIVAIT SUR L'ACCUEIL —————
//
// Mesuré avant d'écrire : « Trois instruments à vous · Sans limite de durée, sans compte
// à créer » est le résumé de l'ACCUEIL ; `/tarifs` nommait déjà les séries d'exemple.
// Le geste était juste, la carte non — et les deux se vérifient séparément. Porter le
// geste là où le rapport pointe aurait ajouté une ligne à une colonne qui l'avait déjà,
// en laissant l'accueil muet : un défaut neuf, posé au nom d'une consigne exacte sur ce
// qu'il fallait faire.
//
// ANGLE MORT DÉCLARÉ (règle 9), EN TÊTE : rien ici ne rend la page. La garde lit les
// littéraux des deux routes — c'est la forme que la prose ne peut pas imiter, et celle
// que les autres gardes de promesse utilisent —, pas l'écran. Une phrase présente dans
// une branche jamais rendue passerait.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { chainesLivrees } from "./chaines-livrees.mjs";
import { borne } from "../lib/tranche.mjs";

const RACINE = new URL("../../", import.meta.url);
const lire = (rel) => readFileSync(new URL(rel, RACINE), "utf8");
const APP = lire("Vena.dc.html");
const MOD = lire("src/lib/palier-gratuit.ts");

/** Les deux surfaces où le palier gratuit s'énonce, et ce que chacune doit nommer. */
const SURFACES = [
  ["src/routes/index.tsx", "le résumé de l’accueil"],
  ["src/routes/tarifs.tsx", "la colonne gratuite de /tarifs"],
];

/** Tout le source du site, récursivement — aucun périmètre écrit à la main (règle 7). */
function tousLesSources(rel) {
  const out = [];
  for (const e of readdirSync(new URL(rel + "/", RACINE), { withFileTypes: true })) {
    const p2 = rel + "/" + e.name;
    if (e.isDirectory()) out.push(...tousLesSources(p2));
    else if (/\.(ts|tsx)$/.test(e.name)) out.push(p2);
  }
  return out;
}

/** Les phrases du module, par leur nom — leur VALEUR, jamais le texte du fichier.
 *  Première forme de cette garde : elle collait le module ENTIER dans la botte de foin
 *  dès qu'une route le citait. Ses commentaires portent « Trois instruments à vous » —
 *  c'est leur travail, ils racontent ce qui manquait —, si bien qu'elle trouvait la
 *  phrase dans son propre récit. La règle 3, dans une garde écrite pour du texte de
 *  vente : on lit ce qui AGIT, pas la prose autour. Mesuré par mutation : retirer
 *  « Trois instruments à vous » de /tarifs la laissait VERTE. */
const PHRASES = new Map([...MOD.matchAll(/export const (GRATUIT_\w+) = "([^"]+)"/g)]
  .map((m) => [m[1], m[2]]));

/** Un nom de constante est RENDU quand il paraît ailleurs que sur sa ligne d'import.
 *  Deuxième forme : la garde se contentait de l'import — donc retirer la ligne du JSX
 *  la laissait verte alors que l'écran ne portait plus rien. Un import ne rend pas :
 *  c'est la règle 11 sur une constante au lieu d'un trou de gabarit. */
function rendu(src, cle) {
  const sansImports = src.split("\n").filter((l) => !/^\s*import\b/.test(l)).join("\n");
  return new RegExp("\\b" + cle + "\\b").test(sansImports);
}

/** Ce que la surface DIT : ses littéraux, plus la valeur des phrases qu'elle rend. */
function promesse(fichier) {
  const src = lire(fichier);
  const bouts = chainesLivrees(src);
  for (const [cle, val] of PHRASES) if (rendu(src, cle)) bouts.push(val);
  return bouts.join(" · ");
}

test("le palier gratuit nomme les DEUX choses qu'il donne", () => {
  // Les instruments à soi ET les séries d'exemple. Nommer les premiers seuls décrit un
  // outil qu'il faut alimenter avant d'essayer — et c'est le contraire de ce que le
  // gratuit offre.
  const manques = [];
  for (const [fichier, quoi] of SURFACES) {
    const txt = promesse(fichier);
    if (!/instruments? à vous/.test(txt)) manques.push(quoi + " : les instruments à soi");
    if (!/séries d’exemple/.test(txt)) manques.push(quoi + " : les séries d’exemple");
  }
  // LA GARDE PROUVE SA PRISE : si la résolution des phrases cassait, `promesse` ne
  // rendrait que les littéraux du fichier et la garde chercherait dans du décor.
  assert.ok(PHRASES.size >= 3, "les phrases du module ne se lisent plus ("
    + PHRASES.size + ") : la garde a perdu sa prise, réancrez-la.");
  assert.deepEqual(manques, [], "le palier gratuit n’énonce plus ce qu’il donne :\n  "
    + manques.join("\n  ")
    + "\n\nIl donne DEUX choses, et la seconde est celle qui permet d’essayer sans rien "
    + "avoir exporté. Quelqu’un qui arrive sans données et ne lit que « trois "
    + "instruments à vous » comprend qu’il doit d’abord installer MT5, compiler un "
    + "script et exporter un CSV pour voir le produit. Les séries d’exemple existent "
    + "précisément pour qu’il n’ait pas à le faire.");
});

test("le compte des séries se DÉRIVE de l'application, il ne s'écrit pas en dur", () => {
  // Deux applications, deux paquets : le site ne peut pas importer `SYM_EXEMPLES`. Le
  // nombre est donc écrit une fois côté site, et c'est CETTE garde qui lie les deux
  // bouts — la forme de `manifeste-version` : le défaut ne serait dans aucun des deux
  // pris isolément, il serait dans leur désaccord.
  const i = borne(APP, "const EXEMPLES = [");
  const bloc = APP.slice(i, borne(APP, "\n];", i));
  const vrai = (bloc.match(/^\s*\['/gm) || []).length;
  assert.ok(vrai >= 5, "la liste des séries d’exemple ne se lit plus dans l’application "
    + "(" + vrai + " trouvée[s]) : la garde a perdu sa prise, réancrez-la.");
  const annonce = Number((MOD.match(/export const NB_EXEMPLES = (\d+);/) || [])[1]);
  assert.equal(annonce, vrai,
    "le site annonce " + annonce + " séries d’exemple, l’application en engendre "
    + vrai + ". Un compte écrit deux fois diverge à la première série ajoutée, et c’est "
    + "la page de VENTE qui garde l’ancien chiffre.");
  // et la phrase l'épelle : un nombre juste dans une constante et faux dans le texte
  // rendu serait le même défaut, un cran plus loin (règle 11, côté copie)
  const MOTS = ["zéro", "une", "deux", "trois", "quatre", "cinq", "six", "sept", "huit",
    "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze"];
  const mot = MOTS[vrai];
  assert.ok(mot, "aucun mot français prévu pour " + vrai + " : complétez la liste.");
  for (const cle of ["GRATUIT_EXEMPLES", "GRATUIT_EXEMPLES_TARIFS"]) {
    const phrase = (MOD.match(new RegExp("export const " + cle + ' = "([^"]+)"')) || [])[1];
    assert.ok(phrase, cle + " a disparu du module : les deux routes la lisent par son nom.");
    assert.match(phrase, new RegExp("\\b" + mot + "\\b", "i"),
      "la phrase « " + phrase + " » n’épelle pas « " + mot + " » alors que "
      + "l’application engendre " + vrai + " séries. Le chiffre de la constante et celui "
      + "du texte rendu sont deux vérités à tenir d’accord.");
  }
});

test("le site reprend le MOT du produit — il n'en invente pas un second", () => {
  // L'application les appelle « séries d'exemple » partout : la pastille, le filtre de
  // provenance, le bandeau. Un second vocabulaire sur le site divergerait, et le
  // lecteur croirait à deux choses différentes.
  // LA SURFACE SE DÉCOUVRE (règle 7). Premier jet : les deux routes seulement — et le
  // second vocabulaire est apparu dans le MODULE, hors périmètre, sans que rien ne
  // rougisse. Mesuré par mutation.
  const interdits = [];
  for (const fichier of tousLesSources("src")) {
    const quoi = fichier;
    for (const c of chainesLivrees(lire(fichier))) {
      if (!/séries|série/i.test(c)) continue;
      const m = c.match(/\b(fictiv\w*|fauss\w*|faux|factic\w*|simulé\w*|bidon)\b/i);
      if (m) interdits.push(quoi + " : « " + m[0] + " » dans « " + c.slice(0, 60) + " »");
    }
  }
  assert.deepEqual(interdits, [], "le site invente un second mot pour les séries "
    + "d’exemple :\n  " + interdits.join("\n  ")
    + "\n\nL’application les nomme « séries d’exemple » partout. Deux vocabulaires pour "
    + "la même chose divergent, et la divergence est muette : le lecteur croit à deux "
    + "choses différentes. Reprendre le mot du produit, ne pas en inventer un.");
});

test("la réserve d'honnêteté reste dans l'APPLICATION, elle n'est pas recopiée sur le site", () => {
  // Elle vit là où elle sert : au moment où quelqu'un lance un scan sur ces séries. La
  // page VEND, l'application AVERTIT quand ça compte — et une réserve recopiée devient
  // une seconde copie à tenir d'accord, qui divergera en silence.
  assert.ok(APP.includes("Sur ces trois ans, cet univers monte"),
    "la réserve a quitté l’application : c’est elle qui doit la porter, au moment du "
    + "scan. Si elle a été réécrite, réancrez cette garde sur sa nouvelle forme — ne la "
    + "déplacez pas vers le site.");
  const copies = [];
  for (const [fichier, quoi] of SURFACES) {
    for (const c of chainesLivrees(lire(fichier))) {
      if (/cet univers monte|résultat flatteur|tirage, pas une promesse/i.test(c)) {
        copies.push(quoi + " : « " + c.slice(0, 70) + " »");
      }
    }
  }
  assert.deepEqual(copies, [], "la réserve de l’application est recopiée sur le site :\n  "
    + copies.join("\n  ")
    + "\n\nDeux copies divergent, et la divergence est muette. La page vend ; "
    + "l’application avertit à l’endroit où l’avertissement change une décision.");
});
