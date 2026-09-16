// ————— UN CHAMP, UN GESTE, ET UN LIBELLÉ QUI NE PEUT PAS MENTIR —————
//
// Le champ « tirages au hasard » portait 500 et AUCUN bouton ne le proposait :
// « pousser à 2 000 » et « pousser à 10 000 » étaient les deux seules valeurs
// atteignables, et tous deux figés dès que plus rien ne manquait à leur palier.
// Quelqu'un qui veut 3 500 n'avait aucun chemin ; quelqu'un qui lit 500 dans le
// champ n'avait pas de bouton pour l'appliquer.
//
// Le libellé est COMPOSÉ depuis la valeur du champ : il ne peut pas annoncer un
// nombre que le geste n'appliquerait pas. Deux façons de fixer le même nombre
// auraient divergé — c'est la leçon des quatre producteurs qui recalculaient
// chacun sa copie de l'état du tirage, et qui ont mis la page entière en panne.
//
// ET LE PRIX SE DIT AVANT DE PARTIR. 10 000 tirages × les têtes × cinquante-six
// instruments est un budget que personne n'estime de tête. La ligne d'état des
// scans antérieurs le disait déjà ; le poussage partait muet sur plusieurs
// minutes de calcul. Même estimation pour les deux, écrite une fois.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { borne } from "../lib/tranche.mjs";

const APP = readFileSync(new URL("../../Vena.dc.html", import.meta.url), "utf8");

test("le libellé du poussage se dérive du champ, et porte sa durée", () => {
  const i = APP.indexOf("          corPousserTxt: 'Pousser à '");
  assert.ok(i > 0,
    "le libellé du poussage a disparu ou n'est plus composé : écrit en dur, il "
    + "annoncerait un nombre que le geste n'applique pas");
  const bloc = APP.slice(i, borne(APP, "corRaccourcis:", i));
  assert.match(bloc, /cible\.toLocaleString\('fr-FR'\)/,
    "le libellé ne lit plus la CIBLE : c'est elle qui rend le mensonge impossible");
  assert.match(bloc, /dureeCible \? ' · environ ' \+ dureeCible : ''/,
    "le libellé n'annonce plus la durée. Un travail de plusieurs minutes qui part "
    + "sans dire son prix est un travail que l'utilisateur n'a pas accepté — et la "
    + "ligne des scans antérieurs le dit déjà, donc l'asymétrie ne se défend pas.");
  // et la cible vient du CHAMP, bornée comme lui
  assert.ok(APP.includes("const cible = Math.max(200, Math.min(20000, Number(s.nTirages) || TIRAGES_DEFAUT));"),
    "la cible du poussage ne vient plus du champ, ou n'est plus bornée comme lui : "
    + "un libellé qui annonce 50 000 sur un champ qui en accepte 20 000 ment aussi");
  assert.ok(APP.includes("corPousser: () => this.pousserCor(cible),"),
    "le geste n'applique plus la cible du libellé : c'est exactement l'écart que "
    + "cette garde existe pour interdire");
});

test("les raccourcis ÉCRIVENT dans le champ, ils ne calculent pas", () => {
  const i = APP.indexOf("          corRaccourcis: [2000, 10000].map((n) => ({");
  assert.ok(i > 0, "les raccourcis ont disparu — réancrez");
  const bloc = APP.slice(i, borne(APP, "})),", i));
  assert.match(bloc, /poser: \(\) => this\.setState\(\{ nTirages: n \}/,
    "un raccourci ne pose plus la valeur dans le champ");
  assert.ok(!/pousserCor\(/.test(bloc),
    "un raccourci LANCE le calcul directement : il y a de nouveau deux façons de "
    + "fixer le même nombre, et elles divergeront. Un raccourci écrit dans le champ ; "
    + "le bouton « Pousser à » est le seul chemin vers le calcul.");
  // un seul appelant du calcul depuis cette zone
  // L'ancre sort du `slice(` : elle porte `Math.max(200, Math.min(20000` — des
  // parenthèses NON APPARIÉES dans un littéral — et le détecteur de
  // `bornes-de-tranche` compte la profondeur sans connaître les chaînes : il
  // débordait la fin réelle de l'appel et attrapait un `.indexOf(` d'après. Faux
  // positif de SON côté, mais la sortie la moins chère est ici : une ancre nommée
  // se lit mieux qu'une chaîne de soixante caractères dans une expression.
  const ANCRE_CIBLE = "const cible = Math.max(200, Math.min(20000";
  const zone = APP.slice(borne(APP, ANCRE_CIBLE), borne(APP, "aCorMsg:", i));
  const appels = (zone.match(/this\.pousserCor\(/g) || []).length;
  assert.equal(appels, 1,
    appels + " appel(s) à pousserCor dans la zone du poussage : il en faut UN. "
    + "Le champ est la seule vérité du nombre, et le bouton son seul consommateur.");
});

test("la durée du poussage et celle des scans antérieurs sortent du même calcul", () => {
  const i = APP.indexOf("  dureeCor(but, liste) {");
  assert.ok(i > 0,
    "dureeCor a disparu : l'estimation redevient écrite sur place, et deux copies "
    + "finiraient par annoncer deux durées pour le même calcul");
  const corps = APP.slice(i, borne(APP, "\n  }", i));
  assert.match(corps, /if \(!attente\.length\) return null;/,
    "dureeCor rend une durée quand il n'y a rien à faire : un « environ 0 s » se "
    + "lirait comme une mesure");
  assert.match(corps, /vv\.combisParSec/,
    "la durée ne vient plus de la vitesse MESURÉE de la machine : une constante "
    + "annoncerait la même durée à tout le monde");
  // les DEUX consommateurs
  const usages = (APP.match(/this\.dureeCor\(/g) || []).length;
  assert.ok(usages >= 2,
    usages + " appel(s) à dureeCor : il en faut au moins 2 — la ligne d'état des "
    + "scans antérieurs et le bouton de poussage. S'il n'en reste qu'un, l'autre a "
    + "recommencé à calculer sa propre estimation.");
});
