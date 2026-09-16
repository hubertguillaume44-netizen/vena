// ————— CE QUI TOURNE AVANT LA PREMIÈRE BARRE NE DEMANDE PAS L'IMPOSSIBLE —————
//
// Rapport : le robot généré tue l'agent du testeur au démarrage — historique
// synchronisé, puis « disconnected / connection closed », sans une seule ligne de
// test. GOLD et Germany40 ; USNDAQ100 passe.
//
// DEUX PISTES ONT ÉTÉ ÉCARTÉES PAR LA MESURE, et il faut le dire avant le reste :
//   · `ArrayFree` — le correctif du script d'export ce matin. Mesuré : il n'y en a
//     AUCUN dans `robot-mt5.js`, ni dans le source émis. La panne de ce matin n'est
//     pas dans cet autre fichier.
//   · le STOP FRACTIONNAIRE (SL0p5 contre SL1). Mesuré en diffant deux robots émis :
//     la seule différence est `#define STOP_PCT` et `#define OBJECTIF_R`, plus du
//     texte d'en-tête. Un stop à 0,5 ne change RIEN à la structure du code généré —
//     ni dimensionnement, ni division, ni indice. La corrélation était réelle, la
//     causalité non.
//
// CE QUI RESTE EST UNE INCOHÉRENCE ENTRE DEUX FONCTIONS DU MÊME FICHIER.
// `AgrConstruire` plafonne sa demande d'historique sur `Bars()`, et son commentaire
// dit pourquoi : « demander un nombre FIXE fait échouer CopyRates tant que cet
// historique n'existe pas ». `SpOuvAmorcer`, qui tourne à `OnInit` — AVANT la
// première barre —, réclamait 6 000 bougies H1 sans condition, puis une plage M1
// couvrant jusqu'à 250 jours : plusieurs centaines de milliers de barres que le
// terminal construit EN MÉMOIRE, dans son propre processus.
//
// C'est le geste que le dépôt a déjà vu tuer un terminal, sur le script d'export —
// AUDNZD, 1,78 million de barres M1, « le terminal cesse de répondre plusieurs
// minutes par symbole ». Ici il part à l'initialisation, sur un agent de test, et ce
// qui le distingue d'un instrument à l'autre est la PROFONDEUR d'historique — pas le
// stop. GOLD, Germany40 et USNDAQ100 ne diffèrent pas par leur configuration : ils
// diffèrent par ce que le courtier en a.
//
// ANGLE MORT DÉCLARÉ (règle 9) : personne ici ne peut faire tourner MetaTrader. Cette
// garde ne PROUVE pas le diagnostic et ne le prétend pas — elle tient la forme
// défensive, celle qui rend la panne impossible que la cause soit celle-là ou une
// autre. C'est le même niveau d'engagement que `lecture-sans-crash`, et pour la même
// raison.
import { test } from "node:test";
import assert from "node:assert/strict";
import { genererMQ5, stampMaintenant } from "../../robot-mt5.js";

const SRC = genererMQ5(
  { sym: "GOLD", periode: 9, sl: 0.5, rr: 1.5, entree: "crois", ligne: "mme",
    filtre: "v1|", filtreNom: "", n: 40, total: 12, ut: "D1",
    heures_entree: { debut: 0, fin: 0 } },
  { risquePct: 1, ut: "D1", hasard: "non contrôlé", etat: { ut: "D1" },
    spreadMaxPct: 0.05, stamp: stampMaintenant(), magic: 1, moment: null,
    licence: null, spreadFacteur: 1, mesureVieille: false, heuresSession: null,
    paliers: [] });

test("aucun ArrayFree dans le source ÉMIS", () => {
  // ————— UNE GARDE ANCRÉE SUR L'ABSENCE —————
  // Il n'y en a aucun aujourd'hui : cette garde ne répare rien, elle empêche la
  // RÉINTRODUCTION — la troisième issue de la règle 14. `ArrayFree` détruit le tampon
  // d'un tableau dynamique ; ce qui reste n'est pas « un tableau vide », et un
  // `CopyRates`/`CopyBuffer` qui suit écrit hors d'une zone valide. Ce n'est pas une
  // exception MQL5 rattrapable : le processus meurt.
  //
  // Et elle porte sur le source ÉMIS, pas sur le fichier du dépôt :
  // `lecture-sans-crash` découvre les .mq5 de la racine, et le robot n'en est pas un —
  // il naît d'un générateur. Le trou était là.
  assert.equal((SRC.match(/\bArrayFree\s*\(/g) || []).length, 0,
    "`ArrayFree` est de retour dans le robot généré. Il détruit le tampon d'un "
    + "tableau dynamique, et le Copy* suivant écrit hors zone : le terminal meurt sans "
    + "exception rattrapable, comme sur le script d'export. Videz par "
    + "`ArrayResize(a, 0)` suivi de `ArraySetAsSeries(a, false)`.");
});

test("l'amorçage du plafond de spread ne réclame pas plus d'historique qu'il n'en existe", () => {
  assert.ok(SRC.includes("   int dispoH1 = Bars(_Symbol, PERIOD_H1);\n   int veut = SPREAD_FENETRE;"),
    "l'amorçage ne lit plus la profondeur disponible : il repart sur une demande de "
    + "6 000 bougies H1 quoi qu'il arrive, à OnInit, avant la première barre — la "
    + "leçon que la fonction voisine applique déjà, non appliquée ici");
  assert.ok(SRC.includes("   if(dispoH1 > 0 && veut > dispoH1) veut = dispoH1;"),
    "le plafond a disparu : la profondeur est lue et jetée, ce qui est pire que ne "
    + "pas la lire — on croit la demande bornée");
  assert.ok(SRC.includes("   if(Bars(_Symbol, PERIOD_M1) > 0)\n"),
    "la M1 se réclame de nouveau à l'aveugle : la plage couvre jusqu'à 250 jours, soit "
    + "des centaines de milliers de barres que le terminal construit EN MÉMOIRE dans "
    + "son propre processus. Le repli sur l'agrégat H1 existe et il est déclaré — quand "
    + "la M1 n'est pas là, on ne la demande pas.");
  // et le repli reste DIT : un amorçage plus serré que celui du moteur doit s'annoncer
  assert.ok(SRC.includes("repli immédiat sur l'agrégat H1, sans la réclamer."),
    "le repli immédiat ne s'annonce plus : le plafond sera plus serré que celui du "
    + "moteur et rien ne le dira — un écart de mesure silencieux entre le robot et le "
    + "backtest, qui est exactement ce que ce fichier existe pour éviter");
});

test("la voisine qui a enseigné la leçon la porte toujours", () => {
  // si `AgrConstruire` cessait de plafonner, la garde ci-dessus garderait une forme
  // dont plus rien ne justifierait l'existence — et on l'aurait copiée d'un modèle mort
  assert.ok(SRC.includes("   int dispo = Bars(_Symbol, PERIOD_H1);\n   if(dispo > 0 && besoin > dispo) besoin = dispo;"),
    "`AgrConstruire` ne plafonne plus sa demande sur la profondeur disponible : c'est "
    + "d'elle que vient la forme appliquée à l'amorçage, et sa disparition dirait que "
    + "la leçon a été perdue à sa source");
});
