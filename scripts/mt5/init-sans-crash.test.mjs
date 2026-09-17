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
import { borne } from "../lib/tranche.mjs";

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

test("les SIX jalons d'initialisation sont là, dans l'ordre, la version en tête", () => {
  // ————— TANT QU'ON NE SAIT PAS OÙ L'ON EST ARRIVÉ, TOUT EST HYPOTHÈSE —————
  // L'agent meurt 139 ms après « historique prêt », sans un message. Trois jalons ne
  // suffisaient pas : entre « journaux posés » et « amorçage fini » il reste le
  // balayage des objets, la lecture du seau, et le PREMIER appel à Agreger avec de
  // vraies bougies — celui-là tournait au premier tick, donc aucun jalon ne pouvait
  // l'encadrer. Il est remonté dans OnInit, entre deux jalons.
  //
  // Six jalons distinguent les trois issues que le journal ne distingue pas seul :
  // un ExpertRemove() s'arrête PROPREMENT après un jalon ; un dépassement mémoire
  // meurt PENDANT le bloc le plus gourmand ; une exception native tue à l'instruction
  // même. Dans les trois cas, c'est le dernier jalon imprimé qui borne.
  const apres = SRC.slice(borne(SRC, "int OnInit()"));
  const exec = apres.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("//"));
  assert.equal(exec[0], "int OnInit()", "OnInit a changé de forme — réancrez");
  assert.equal(exec[1], "{", "OnInit a changé de forme — réancrez");
  // LA VERSION EST DANS LA PREMIÈRE INSTRUCTION, pas seulement présente : un .ex5
  // oublié dans MQL5\\Experts porte un stamp d'export lui aussi, et le stamp date le
  // FICHIER, pas le code qui l'a écrit.
  assert.match(exec[2], /^Print\("VENA INIT 1\/6 · v", VENA_VERSION,/,
    "la première instruction d'OnInit n'imprime plus la version — elle est « "
    + exec[2].slice(0, 60) + " ». Sans elle, un agent qui meurt ne dit pas quelle build "
    + "tournait, et on corrige à l'aveugle une version qui n'est peut-être pas celle "
    + "qui plante.");
  // LES SIX, ET DANS L'ORDRE : un jalon déplacé ne borne plus, il décrit.
  const rangs = [...SRC.matchAll(/VENA INIT (\d)\/6/g)].map((m) => Number(m[1]));
  assert.deepEqual(rangs, [1, 2, 3, 4, 5, 6],
    "les six jalons ne sont plus au complet ni dans l'ordre du déroulement (relevé : "
    + JSON.stringify(rangs) + "). Chacun borne UN bloc d'initialisation ; celui qui "
    + "manque est le bloc qu'on ne pourra pas innocenter.");
  // et le sixième couvre le premier agrégat RÉEL, ce que le tick faisait hors de portée
  assert.match(apres, /bool ok = Agreger\(SEC_SIGNAL\);/,
    "le premier appel à Agreger est ressorti d'OnInit : il repart au premier tick, "
    + "hors de tout jalon — or c'est exactement la fenêtre que le journal désigne, "
    + "139 ms après la fin de la synchronisation");
});

test("aucune lecture d'historique ne se refait indéfiniment : la TENTATIVE est mémorisée", () => {
  // ————— CE N'ÉTAIT PAS UN CRASH, C'ÉTAIT UNE BOUCLE —————
  // Mesuré sur le VPS : CPU à 100 %, 2 h 12 d'uptime, aucun test terminé, aucun onglet
  // de résultats. Le « disconnected / connection closed » du journal est l'agent qu'on
  // TUE, pas un agent qui meurt. Le robot ne plante pas : il n'avance pas.
  //
  // Et la boucle n'est pas littérale — le source émis ne contient qu'UNE `while`, et
  // elle est bornée (`j < nm`) ; tous les `for` décrémentent. La boucle est dans le
  // CACHE :
  //
  //   · le garde exigeait `g_n > 0` ;
  //   · les deux sorties d'échec rendaient la main AVANT d'écrire le cache.
  //
  // Donc quand l'historique manque, ou qu'aucun seau ne se forme, rien n'est mémorisé
  // et TOUT est refait — Bars(), CopyRates() sur des milliers de bougies, puis la
  // boucle d'agrégation — à chaque appel. Et `Agreger` est appelé plusieurs fois par
  // tick, par C_, H_, L_ et LigneAgr.
  //
  // C'EST MOT POUR MOT LA PANNE FERMÉE LE MATIN MÊME DANS `Export_H1_Vena` :
  // `AttendreHistorique` tournait 1 800 s parce que `lu = -1` ne satisfaisait jamais sa
  // condition de sortie. Un échec qui se reproduit à l'identique n'est plus une
  // attente, c'est une boucle. Le correctif avait été posé dans un fichier et pas dans
  // l'autre — exactement comme `ArrayFree`. Deux fois la même leçon non portée d'un
  // fichier à son voisin, en un jour : c'est ça qui mérite d'être retenu, plus que
  // chacune des deux pannes.
  //
  // Le départage des instruments tombe alors sans rien supposer de leur configuration :
  // celui dont l'historique est déjà profond agrège une fois par bougie H1 ; celui dont
  // il manque recommence sans fin.
  assert.ok(SRC.includes("   if(g_secCache == sec && g_bougieCache == derH1) return g_agrOk;"),
    "le cache exige de nouveau un résultat pour se déclencher : sur un historique "
    + "manquant il ne retient RIEN, et l'agrégation complète repart à chaque appel — "
    + "plusieurs fois par tick, pour toujours. Un cœur à 100 %, aucun test qui finit.");
  assert.ok(SRC.includes("   g_secCache = sec; g_bougieCache = derH1; g_agrOk = false;"),
    "la TENTATIVE n'est plus mémorisée avant le travail : les sorties d'échec rendent "
    + "la main sans laisser de trace, et la question « a-t-on déjà essayé pour cette "
    + "bougie ? » redevient sans réponse");
  assert.ok(SRC.includes("   g_agrOk = (g_n > 1);"),
    "le résultat n'est plus publié séparément de la tentative : les deux redeviennent "
    + "une seule valeur, et c'est cette confusion qui produisait la boucle");
  assert.ok(!SRC.includes("g_bougieCache == derH1 && g_n > 0"),
    "l'ancien garde est revenu : `g_n > 0` fait dépendre le cache du SUCCÈS, donc le "
    + "cas le plus coûteux — celui où il n'y a rien à agréger — est précisément celui "
    + "qui ne se mémorise pas");
  // ————— ET LA BOUCLE LITTÉRALE RESTE BORNÉE —————
  // Une seule `while` dans le source émis, et son test porte sur un compte : si une
  // seconde apparaît, ou si celle-ci perd sa borne, cette garde le dit.
  const whiles = SRC.match(/while\s*\([^)]*\)/g) || [];
  assert.equal(whiles.length, 1,
    "le source émis contient " + whiles.length + " boucles `while` au lieu d'une : "
    + "chacune est une occasion de tourner sans fin dans un agent de test, et celle "
    + "d'origine était bornée par un compte de tableau. Bornez la nouvelle, ou dites "
    + "ici pourquoi elle ne peut pas tourner.\n  " + whiles.join("\n  "));
  assert.match(whiles[0], /while\(j < nm && mT\[j\] < hT\[i\]\)/,
    "la seule `while` du robot a changé de forme : elle était bornée par `j < nm`, le "
    + "nombre d'éléments réellement lus. Vérifiez sa borne avant de réancrer.");
});
