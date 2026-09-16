// ————— UN MOT DE QUANTITÉ QUI REPREND LA VALEUR D'À CÔTÉ N'A RIEN MESURÉ —————
//
// Le message de pause disait « il manque 592 Mo » et, deux lignes plus bas, « la
// copie de travail demande 592 Mo libres ». Le MÊME nombre : « il manque »
// reprenait la taille DEMANDÉE au lieu du déficit. Si le disque a 590 Mo libres,
// il manque 2 Mo — et la phrase alarmait à la hauteur du besoin entier, sur un
// écran où l'utilisateur décide s'il a encore une sauvegarde.
//
// ET UN SECOND DÉFAUT VIVAIT DANS LES MÊMES LIGNES, plus grave : le calcul de la
// place libre était `(est.quota || 0) - (est.usage || 0)`. Un navigateur qui ne
// rapporte pas de quota donnait donc 0 — « zéro libre » — et la sauvegarde
// passait en pause PERMANENTE, à tort. Le commentaire juste au-dessus disait
// l'inverse : « deviner un besoin qu'on n'a pas mesuré fermerait la sauvegarde à
// tort ». L'intention était écrite, le code faisait le contraire : une ABSENCE de
// mesure lue comme un résultat, la règle 1 dans sa forme la plus pure.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { borne } from "../lib/tranche.mjs";

const APP = readFileSync(new URL("../../Vena.dc.html", import.meta.url), "utf8");

test("le manque se mesure : deux termes, jamais la valeur d'à côté deux fois", () => {
  const i = APP.indexOf("  MANQUE_PLACE(besoin, libre) {");
  assert.ok(i > 0,
    "MANQUE_PLACE a disparu : la phrase du manque redevient composée sur place, et "
    + "c'est là qu'elle avait pris la valeur d'à côté pour un déficit");
  const corps = APP.slice(i, borne(APP, "\n  }", i));
  // les DEUX termes, et ils sont DISTINCTS : c'est leur écart qui est l'information
  assert.match(corps, /this\.taille\(besoin\)/,
    "la phrase ne dit plus ce qui est DEMANDÉ");
  assert.match(corps, /this\.taille\(libre\)/,
    "la phrase ne dit plus ce qui RESTE : sans le second terme, « il manque » ne peut "
    + "être qu'une reprise du premier, et c'est exactement le défaut qu'on retire");
  // et quand la place n'est pas mesurable, elle ne prétend pas à un manque
  assert.match(corps, /libre === null \|\| libre === undefined/,
    "la phrase ne distingue plus « je ne sais pas » de « il en reste zéro » : le cas "
    + "non mesurable doit dire un REFUS constaté, pas un manque chiffré");
  assert.match(corps, /les refuse/,
    "le cas non mesurable ne dit plus ce qu'il a constaté");
  assert.ok(!/il manque/.test(corps),
    "« il manque » est de retour dans la phrase : le mot n'est juste que si le nombre "
    + "qui le suit est un ÉCART, et cette fonction n'en calcule pas — elle pose les "
    + "deux termes côte à côte et laisse le lecteur faire la soustraction, ce qui est "
    + "vérifiable, là où un déficit calculé ne l'est pas");
});

test("une absence de mesure n'est pas un stockage plein", () => {
  // Le geste, avec ses deux opérandes : c'est la lecture du quota qui décide, et
  // un `|| 0` sur un quota absent est ce qui transformait « inconnu » en « zéro ».
  const j = APP.indexOf("if (!force && this._autoTaille) {");
  assert.ok(j > 0, "la vérification de place a changé de forme — réancrez");
  const corps = APP.slice(j, borne(APP, "\n      }", j));
  // ANCRÉE SUR CE QUI AGIT, ET LA PREMIÈRE VERSION NE L'ÉTAIT PAS : elle cherchait
  // la chaîne `(est.quota || 0)` et l'a trouvée… dans le COMMENTAIRE qui raconte le
  // défaut retiré. Le commentaire qui explique une correction l'épelle — c'est son
  // travail. On interdit donc l'AFFECTATION complète, avec ses deux opérandes et son
  // Math.max : une prose ne l'écrit pas sans être du code.
  assert.ok(!/libre = Math\.max\(0, \(est\.quota \|\| 0\)/.test(corps),
    "l'affectation `libre = Math.max(0, (est.quota || 0) - …)` est de retour : un "
    + "navigateur qui ne rapporte pas de quota est alors lu « 0 libre », et la "
    + "sauvegarde automatique passe en pause PERMANENTE à tort — l'inverse exact de ce "
    + "que le commentaire d'à côté promet.");
  assert.match(corps, /Number\.isFinite\(est\.quota\)/,
    "le quota n'est plus éprouvé avant d'être cru : c'est cette épreuve qui distingue "
    + "« pas de place » de « pas de mesure »");
  assert.match(corps, /let libre = null;/,
    "la place libre ne part plus d'un « je ne sais pas » : une valeur initiale "
    + "numérique se confondrait avec une mesure");
  assert.match(corps, /if \(libre !== null && libre < besoin\)/,
    "la pause ne vérifie plus que la place a été MESURÉE avant de refuser : on ne "
    + "ferme pas la sauvegarde sur un chiffre qu'on n'a pas");
  // et le besoin est nommé une fois, pas recalculé dans la phrase
  assert.match(corps, /const besoin = this\._autoTaille \* 1\.2;/,
    "le besoin n'est plus nommé : recalculé dans le message, il pourrait diverger du "
    + "seuil qui décide — et c'est précisément en recopiant une valeur d'un endroit à "
    + "l'autre que « il manque » avait pris la place du déficit");
});
