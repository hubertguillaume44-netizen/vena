// STATUT · CAUSE ÉTABLIE, MESURÉE. La bande des deux lectures est calculée juste ; c'est
// la PHRASE qui promettait plus que le calcul.
//
// ————— CE QUE LA BANDE MESURE, VÉRIFIÉ DANS LE CODE —————
//
// `mesurerBande` et `testerUneFois` font tourner LE VRAI moteur sur LA VRAIE série
// (`this.base(sym)`, H1), à l'unité de décision de la ligne, deux fois : `sortie.prudent`
// à faux puis à vrai. Elles comparent le R net total, et comptent les trades `ambigu`.
// Rien n'est reconstruit, rien n'est approché. Le soupçon « il compare deux conventions
// sur des bougies reconstruites » est FAUX, et il fallait le vérifier avant de conclure.
//
// ————— CE QU'ELLE NE MESURE PAS, ET QUE LA PHRASE PROMETTAIT —————
//
// Elle couvre l'ordre des mouvements DANS une bougie. Elle ne voit ni le spread au
// remplissage, ni l'ordre des ticks, ni le pas de lot, ni la période réellement couverte.
// La phrase disait pourtant « exactement ce que le testeur doit rendre, aux frais près ».
// Quatre instruments rapportés avaient le bon nombre de trades, une bande NULLE, et une
// réussite divisée par deux : la phrase les a certifiés tous les quatre.
//
// ET SANS SÉCURISATION, LA BANDE EST NULLE PAR CONSTRUCTION — mesuré dans
// `lecture-ambigue.test.mjs` : zéro bougie ambiguë sur dix familles × quatre couples
// stop/objectif. Le certificat était alors une tautologie : il constatait qu'une
// convention jamais invoquée n'avait rien changé.
//
// > **Un indicateur juste peut mentir par son libellé.** Ce qui se garde ici n'est pas le
// > calcul — il est bon — mais l'écart entre ce qu'il mesure et ce qu'il laisse croire.
//
// ANGLE MORT DÉCLARÉ (règle 9) : elle lit des chaînes du producteur, pas l'écran. Une
// phrase équivalente écrite ailleurs et rendue à la place de celle-ci passerait. La
// garde de rendu qui fermerait ce trou demande un backtest complet au banc, que le
// semis ne produit pas encore.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { borne } from "../lib/tranche.mjs";

const APP = readFileSync(new URL("../../Vena.dc.html", import.meta.url), "utf8");

// la branche « bande nulle » du producteur, prise entre deux ancres qui AGISSENT
const DEP = "        if (b.largeur < 0.05) {";
const bloc = APP.slice(borne(APP, DEP), borne(APP, "        const pct = Math.round(", borne(APP, DEP)));

test("une bande nulle ne promet pas la conformité au testeur", () => {
  // la prise est le BLOC ENTIER, pas « la phrase collée à un return » : la mutation
  // qui a fait tomber la première version écrivait `return ('exactement…' && paliers`,
  // et l'ancre littérale ne l'a pas vue. Le corps du `if` ne contient que du code — la
  // prose qui raconte ce correctif vit AU-DESSUS, exprès.
  assert.ok(!bloc.includes("exactement ce que le testeur doit rendre"),
    "le verdict de bande nulle promet de nouveau « exactement ce que le testeur doit "
    + "rendre ». La bande ne couvre que l'ordre des mouvements DANS une bougie : quatre "
    + "instruments rapportés avaient le bon nombre de trades, une bande nulle, et une "
    + "réussite divisée par deux. Un indicateur juste peut mentir par son libellé.");

  // ce qu'elle DOIT dire : ce qu'elle ne couvre pas, nommé
  assert.match(bloc, /elle ne dit RIEN du spread au remplissage/,
    "le verdict de bande nulle ne nomme plus ce qu'il ne couvre pas. « Les deux lectures "
    + "s'accordent » sans son périmètre se lit comme « ce chiffre est solide » — et c'est "
    + "ce qui a été cru sur quatre lignes divergentes.");

  // et le cas tautologique se dit comme tel
  assert.match(bloc, /par construction/,
    "le verdict ne distingue plus « aucune bougie ambiguë, mesuré » de « aucune bougie "
    + "ne POUVAIT l'être, faute de sécurisation ». Sans palier la bande est nulle par "
    + "construction : l'annoncer comme un résultat est une tautologie habillée en "
    + "certificat.");
});

test("la note du panneau ne fait plus de la bande LE critère de conformité", () => {
  assert.ok(!APP.includes("est le critère de conformité au testeur MT5"),
    "la note du panneau redit « LE critère de conformité au testeur MT5 ». L'article "
    + "défini est la promesse : la bande est UN critère, celui de l'ordre intra-bougie. "
    + "Le spread au remplissage, le pas de lot et la période couverte ne s'y voient pas.");
  assert.ok(APP.includes("encadre UN écart au testeur MT5"),
    "la note du panneau ne borne plus ce que la bande encadre : réancrez-la plutôt que "
    + "de la laisser promettre une conformité générale.");
});
