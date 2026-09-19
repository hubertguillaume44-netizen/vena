// ————— UNE PORTE UNIQUE POUR LE p DU HASARD, ET AUCUN HUITIÈME SITE —————
//
// La règle était écrite, documentée dans CLAUDE.md, et appliquée dans DEUX endroits
// sur NEUF : « jamais battu en N tirages » veut dire « moins d'une fois sur N+1 »,
// pas « jamais ». Sept sites divisaient `auDessus` par `tirages`. Six d'entre eux
// rendaient en plus « 0 % » quand aucun tirage ne faisait aussi bien — c'est-à-dire
// « le hasard ne fait JAMAIS aussi bien », l'affirmation exacte que le +1 existe
// pour interdire, à l'endroit précis où quelqu'un décide de mettre une ligne en
// portefeuille.
//
// LE DÉFAUT N'ÉTAIT PAS L'ERREUR, C'ÉTAIT LA COPIE. Sept écritures du même calcul
// dont une seule juste : corriger les sept sans fermer la classe laisserait naître
// le huitième au prochain écran qui affiche un pourcentage. La garde est donc
// STRUCTURELLE — elle interdit la division, pas ses symptômes — et c'est la seule
// forme qui empêche un huitième site de naître.
//
// ANGLE MORT, déclaré (règle 9) : elle lit le source de l'application et du noyau de
// scan. Un calcul écrit dans un autre fichier, ou assemblé dynamiquement, lui
// échappe — comme à toute garde qui lit du source. Ce qu'elle ferme, c'est la
// récidive par recopie, qui est la façon dont les sept sont nés.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { borne } from "../lib/tranche.mjs";

const FICHIERS = [
  ["Vuna.dc.html", readFileSync(new URL("../../Vuna.dc.html", import.meta.url), "utf8")],
  ["scan-noyau.js", readFileSync(new URL("../../scan-noyau.js", import.meta.url), "utf8")],
];
const ligneDe = (src, i) => src.slice(0, i).split("\n").length;

test("aucun site ne divise auDessus par tirages — la porte est le seul chemin", () => {
  // ANCRÉE SUR CE QUI AGIT (règle 3) : une DIVISION, avec ses deux opérandes. Le mot
  // « auDessus » seul vit dans de la prose — les infobulles écrivent « 3 des 500
  // tirages font aussi bien », et c'est la forme JUSTE, deux nombres plutôt qu'un
  // ratio. C'est l'opérateur qui est interdit, pas le nom.
  const DIV = /([A-Za-z_$][\w$]*)\.auDessus\s*\/\s*(?:\(\s*)?([A-Za-z_$][\w$]*)\.tirages/g;
  const fautes = [];
  for (const [nom, src] of FICHIERS) {
    for (const m of src.matchAll(DIV)) {
      fautes.push(nom + ":" + ligneDe(src, m.index) + " — « " + m[0] + " »");
    }
  }
  assert.deepEqual(fautes, [],
    fautes.length + " site(s) divisent auDessus par tirages au lieu de passer par la "
    + "porte :\n  " + fautes.join("\n  ")
    + "\n\nLe p du hasard s'écrit `(auDessus + 1) / (tirages + 1)` et il ne s'écrit "
    + "QU'À UN ENDROIT : `pHasard(f)`. Sans le +1, « jamais battu en 500 tirages » "
    + "s'affiche « 0 % » — c'est-à-dire « le hasard ne fait JAMAIS aussi bien », ce "
    + "qui est faux, et faux exactement là où quelqu'un décide. Sept copies de ce "
    + "calcul ont vécu dans ce fichier, dont une seule était juste.\n"
    + "Appelez `this.pHasard(f)` ; si vous avez la configuration et pas le contrôle, "
    + "`this.verdictHasard(r)` porte en plus la règle des 200 tirages et le seuil "
    + "corrigé. Si vous vouliez la FRÉQUENCE OBSERVÉE et non une inférence, ne "
    + "l'affichez pas en pourcentage : « 3 tirages sur 500 font aussi bien » dit la "
    + "mesure sans prétendre au verdict — deux nombres, pas un ratio.");
});

test("la porte existe, porte le +1, et verdictHasard est son client", () => {
  // une garde qui interdit une écriture doit vérifier que l'écriture AUTORISÉE existe :
  // sinon elle passerait au vert le jour où quelqu'un supprime la porte et le calcul
  // avec — verte en ne gardant plus rien, le pire mode de panne
  const [, APP] = FICHIERS[0];
  const i = APP.indexOf("  pHasard(f) {");
  assert.ok(i > 0,
    "`pHasard` a disparu : la garde ci-dessus interdirait la division sans qu'aucune "
    + "porte ne la remplace — elle deviendrait une interdiction sans issue");
  const corps = APP.slice(i, borne(APP, "\n  }", i));
  assert.match(corps, /\(f\.auDessus \+ 1\) \/ \(f\.tirages \+ 1\)/,
    "`pHasard` ne porte plus le +1 : c'est LE calcul, et il n'est écrit nulle part "
    + "ailleurs — le corriger ici est le seul geste qui corrige tout le produit");
  assert.match(corps, /if \(!f \|\| !f\.tirages\) return null;/,
    "`pHasard` ne rend plus `null` quand il n'y a rien à mesurer : un zéro se lirait "
    + "comme un résultat, ce qui est la faute même qu'on vient de retirer");
  assert.ok(APP.includes("const p = this.pHasard(f);"),
    "`verdictHasard` ne passe plus par la porte : la vérité unique redeviendrait double");
  // et le plancher suit le +1 : 1/(N+1), pas 1/N
  const j = APP.indexOf("  plancherHasard(tirages) {");
  assert.ok(j > 0, "`plancherHasard` a disparu — le plancher redeviendrait écrit à la main");
  assert.match(APP.slice(j, borne(APP, "\n", j) + 2), /\(\(Number\(tirages\) \|\| 0\) \+ 1\)/,
    "`plancherHasard` divise encore par `tirages` : avec le +1 le plancher du test est "
    + "1/(N+1). Sept commentaires disaient « le plancher est 1/tirages » — de la prose "
    + "périmée, qui enseigne le faux à qui vient après (règle 5)");
});

test("plus aucun « 0 % » de hasard : la certitude ne s'affiche plus", () => {
  // Le symptôme, gardé en plus de la cause. `pHasard` ne peut PAS rendre zéro — il
  // rend au minimum 1/(N+1) — donc toute branche qui teste `auDessus === 0` pour
  // écrire « 0 % » est morte, et sa présence signale une copie ressuscitée.
  const [nom, APP] = FICHIERS[0];
  const fautes = [];
  const RX = /auDessus === 0\s*\?\s*'0 %'/g;
  for (const m of APP.matchAll(RX)) fautes.push(nom + ":" + ligneDe(APP, m.index));
  assert.deepEqual(fautes, [],
    "Une branche rend encore « 0 % » quand aucun tirage ne fait aussi bien (" 
    + fautes.join(", ") + "). « 0 % » dit « le hasard ne fait JAMAIS aussi bien » : "
    + "c'est une certitude que 500 tirages ne permettent pas de prononcer, et c'est "
    + "précisément ce que le +1 existe pour interdire. Avec `pHasard`, ce cas rend le "
    + "PLANCHER du test — 0,20 % à 500 tirages — et il n'y a rien à écrire de plus.\n"
    + "Le COMPTE, lui, reste juste et se dit : « aucun des 500 tirages ne fait aussi "
    + "bien » est une mesure, pas une inférence, et cette forme-là n'est pas visée.");
});
