// STATUT · CAUSE ÉTABLIE, MESURÉE. Le champ « Depuis » du Backtest portait
// `value="01/01/2020"` EN DUR, `disabled`, lié à aucune donnée. Il n'a jamais reflété
// quoi que ce soit — et grisé, il se lisait comme un paramètre faisant autorité.
//
// ————— UNE CONSTANTE GRISÉE SE LIT COMME UNE MESURE —————
//
// AUDUSD y affichait « depuis 01/01/2020 » sur une série qui commence en 2023. Seule la
// durée en petit — 3,4 ans — le trahissait, à côté de quatre autres lignes à 6,6. Le
// testeur MT5 tournait sur 6,6 ans : la comparaison portait sur deux périodes
// différentes, et le facteur 4,07 qu'on en a tiré tombe à ~2,1 une fois les dates
// alignées. La moitié de l'écart venait de la comparaison, pas du produit.
//
// C'est la famille du mot relatif sur une fenêtre figée, appliquée à une BORNE : la
// borne DEMANDÉE n'est pas la borne MESURÉE, et seule la seconde décrit ce qui a été
// calculé. Le champ affiche désormais ce que la série couvre vraiment, lu dans ses
// bougies, et un bandeau le signale quand la couverture est plus courte.
//
// ANGLE MORT DÉCLARÉ (règle 9) : elle interdit la constante et exige la liaison, elle ne
// vérifie pas que le calcul de couverture est juste. Ce que la série porte se lit dans
// `df.t[0]` et `df.t[n-1]` — il n'y a pas d'autre source à confronter.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { borne } from "../lib/tranche.mjs";

const APP = readFileSync(new URL("../../Vena.dc.html", import.meta.url), "utf8");

test("aucune BORNE de période n'est écrite en dur dans le gabarit", () => {
  // ancré sur ce qui AGIT : un attribut `value=` portant une date littérale, ce que la
  // prose ne peut pas produire — un commentaire ne porte pas d'attribut HTML.
  const durs = [...APP.matchAll(/value="(\d{2}\/\d{2}\/\d{4})"/g)].map((m) => m[1]);
  assert.deepEqual(durs, [],
    "date(s) écrite(s) en dur dans un attribut `value` du gabarit : " + durs.join(", ")
    + ". Une borne affichée doit être LUE dans les données. Grisée, une constante se lit "
    + "comme un paramètre mesuré : « depuis 01/01/2020 » a été cru sur une série qui "
    + "commence en 2023, et la comparaison au testeur MT5 a porté sur deux périodes "
    + "différentes sans que rien ne le dise.");
});

test("la période affichée est LIÉE à la série, et l'écart se signale", () => {
  const champ = APP.slice(borne(APP, "Période couverte</span>"),
    borne(APP, "</label>", borne(APP, "Période couverte</span>")));
  assert.match(champ, /value="\{\{ btCouverture \}\}"/,
    "le champ « Période couverte » n'est plus lié à `btCouverture` : il afficherait de "
    + "nouveau une valeur qui ne vient pas des bougies.");

  // le producteur lit la SÉRIE, pas un réglage — ancré sur l'appel
  assert.ok(APP.includes("const df = this.serieH1(s.btSym);"),
    "le producteur de la couverture ne lit plus la série de l'instrument mesuré : "
    + "réancrez-le, ou la borne redevient déclarative.");
  assert.ok(APP.includes("btCouvertureCourte: courte,"),
    "le drapeau de couverture partielle a disparu : une période plus courte que celle "
    + "d'un test MT5 ne se signalerait plus, et c'est exactement ce qui a fait conclure "
    + "à un facteur 4 là où il y en avait 2.");

  // et il est RENDU : un drapeau que personne ne lit ne vaut rien
  assert.ok(APP.includes('<sc-if value="{{ btCouvertureCourte }}"'),
    "le drapeau existe mais n'est plus rendu : le champ seul ne suffit pas, c'est le "
    + "bandeau qui arrête quelqu'un en train de comparer deux périodes différentes.");
});
