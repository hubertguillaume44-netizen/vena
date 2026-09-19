// STATUT · CAUSE ÉTABLIE — encombrement RAPPORTÉ (le panneau déplié fait ~590 x 230 px
// sur un graphique de 1 000 px et couvre l'action de prix récente), structure du pli
// MESURÉE DANS LE DÉPÔT, sur le source émis.
//
// ANGLE MORT DÉCLARÉ (règle 9), EN TÊTE et non en note : rien ici n'exécute MQL5. Cette
// garde ne mesure PAS une hauteur en pixels — elle mesure la STRUCTURE qui la produit :
// le nombre de rangées que `Ligne()` ouvre sur le chemin replié, sous la règle de
// `Ligne()` relue dans le source émis. Un `PanneauFond` qui calculerait sa hauteur
// autrement passerait ici. Le jour où un harnais MQL5 tournera, c'est cette ligne qu'il
// remplacera.
//
// ————— CE QUE LE PLI NE DOIT PAS FAIRE : UNE SECONDE VÉRITÉ —————
//
// Le panneau replié montre MOINS de la même chose, jamais autre chose. La tentation, en
// écrivant une forme réduite, est de la reformuler — « ARRÊTÉ » d'un côté, la ligne
// complète de l'autre — et le panneau porte alors deux états qu'il faut tenir d'accord.
// C'est la figure de `deposes` : une garde sur un chemin ferme un CAS, une source unique
// ferme la CLASSE. L'état s'écrit donc UNE fois, et seule sa colonne change.
//
// ————— ET L'ARRÊT EST LE CAS OÙ LE PANNEAU EXISTE —————
//
// Un robot arrêté qui se replierait sur le seul mot de son état ferait perdre le geste
// qui débloque. Le motif voyage donc dans la rangée repliée — et l'écrire a fait tomber
// un défaut plus ancien : TROIS conditions distinctes arrêtent le robot, et le panneau
// les couvrait toutes les trois du même conseil, faux pour deux d'entre elles. Un motif
// qui couvre trois causes n'en nomme aucune : il disculpe sans avoir regardé.
import { test } from "node:test";
import assert from "node:assert/strict";
import { robotEmis } from "./sources-mql5.mjs";
import { borne } from "../lib/tranche.mjs";

const SRC = robotEmis();

/** Un motif, et le refus de mesurer quand il ne mord pas une fois exactement. */
function une(re, quoi) {
  const t = [...SRC.matchAll(re)];
  assert.equal(t.length, 1, quoi + " : attendu 1 occurrence, vu " + t.length
    + " — l'ancre a perdu sa prise, réancrez la garde plutôt que de la croire verte.");
  return t[0];
}

// ————— LA RÈGLE DE RANGÉE, PORTÉE — ET RELUE AVANT D'ÊTRE APPLIQUÉE —————
// « Les colonnes croissent, donc il n'y a qu'une rangée » est une inférence sur le code
// de `Ligne()`. Un port qui ne vérifie pas que la règle portée est encore celle qui
// tourne mesure une règle que personne n'exécute (robot-tient-son-symbole, même forme).
const REGLE = "bool nouvelle = (g_nobj == 0 || colonne <= g_cln[g_nobj - 1]);";
function rangees(colonnes) {
  let n = 0, prec = null;
  for (const c of colonnes) { if (prec === null || c <= prec) n++; prec = c; }
  return n;
}

test("replié, le panneau tient en UNE rangée — sous la règle de Ligne(), relue", () => {
  assert.ok(SRC.includes(REGLE),
    "la règle d'ouverture de rangée de Ligne() a changé : le port de cette garde ne "
    + "décrit plus ce qui tourne. Relisez-la, puis réécrivez rangees().");

  const symbole = une(/corps \+ 6, true, (\d)\);/g, "la cellule du symbole et du sens");
  const etat    = une(/corps \+ 6, true,\n\s*g_plie \? (\d) : (\d)\);/g,
    "la cellule d'état, écrite UNE fois pour les deux formes");
  const detail  = une(/corps \+ 6, false, (\d)\);/g, "la cellule de détail du panneau replié");

  const replie  = [symbole[1], etat[1], detail[1]].map(Number);
  assert.deepEqual(replie, [0, 2, 3],
    "les colonnes du chemin replié ont bougé : " + replie.join(", "));
  assert.equal(rangees(replie), 1,
    "le panneau replié ouvre " + rangees(replie) + " rangées au lieu d'une");

  // ET LA RÈGLE MORD : sans cette contre-épreuve, rangees() pourrait rendre 1 sur
  // n'importe quoi et l'assertion ci-dessus mesurerait le décor.
  assert.equal(rangees([0, 3, 3]), 2, "le port de la règle ne distingue plus rien");

  // déplié, l'état reprend sa colonne de droite : le pli ne déplace rien d'autre
  assert.equal(Number(etat[2]), 3, "déplié, l'état doit rester dans la colonne de droite");

  // et le chemin replié rend la main AVANT le premier filet : un séparateur ajoute
  // neuf pixels à la hauteur, donc une rangée repliée qui en poserait un ne serait
  // plus une rangée
  const t0 = borne(SRC, "   if(g_plie)\n   {");
  const t1 = borne(SRC, "   Separateur();", t0);
  const bloc = SRC.slice(t0, t1);
  assert.ok(bloc.includes("      PanneauDessiner();\n      return;"),
    "le chemin replié doit dessiner et rendre la main avant le premier Separateur()");
});

test("un seul indicateur d'état par surface — le pli n'en crée pas un second", () => {
  // Le pli montre moins de la MÊME chose. Deux littéraux d'état seraient deux vérités,
  // et rien à l'écran ne dirait laquelle est la bonne.
  for (const mot of ['"● EN MARCHE"', '"● ARRÊTÉ"']) {
    const n = (SRC.split(mot).length - 1);
    assert.equal(n, 1, "le littéral d'état " + mot + " paraît " + n + " fois dans le "
      + "source émis : le panneau porte deux formulations de son état.");
  }
  // et les deux vivent dans la MÊME expression, celle dont la colonne est conditionnelle
  une(/Ligne\(marche \? "● EN MARCHE" : "● ARRÊTÉ", marche \? vert : rouge, "", corps \+ 6, true,\n\s*g_plie \? \d : \d\);/g,
    "l'unique écriture de l'état, partagée par les deux formes");
});

test("replié et ARRÊTÉ, la rangée porte le MOTIF — jamais le seul mot", () => {
  const t0 = borne(SRC, "   if(g_plie)\n   {");
  const t1 = borne(SRC, "   Separateur();", t0);
  const bloc = SRC.slice(t0, t1);
  assert.ok(/:\s*"— " \+ motif/.test(bloc),
    "la rangée repliée doit nommer le motif de l'arrêt : sans lui, le panneau replié "
    + "annonce un robot arrêté sans dire ce qui le débloque — et l'arrêt est "
    + "précisément le cas où ce panneau existe.");
  assert.ok(bloc.includes("pos.enR") && bloc.includes("pos.gain"),
    "en marche avec une position, la rangée repliée doit porter le R et l'euro");
  assert.ok(bloc.includes('"aucune position"'),
    "en marche sans position, la rangée repliée doit le dire — un blanc se lit "
    + "« pas encore mesuré »");
});

test("le motif de l'arrêt distingue les TROIS causes, chacune avec son geste", () => {
  const t0 = borne(SRC, "bool EtatRobot(string &motif, string &geste)");
  const t1 = borne(SRC, "\nstruct PosVuna", t0);
  const bloc = SRC.slice(t0, t1);
  const motifs = [...bloc.matchAll(/motif = "([^"]+)"/g)].map((m) => m[1]);
  const gestes = [...bloc.matchAll(/geste = "([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(motifs).size, 3, "trois motifs distincts attendus, vus : " + motifs.join(" | "));
  assert.equal(new Set(gestes).size, 3, "trois gestes distincts attendus, vus : " + gestes.join(" | "));
  for (const cond of ["TERMINAL_TRADE_ALLOWED", "MQL_TRADE_ALLOWED", "ACCOUNT_TRADE_EXPERT"]) {
    assert.ok(bloc.includes(cond), "la condition " + cond + " ne décide plus d'un motif");
  }
  // une seule source : le panneau ne relit pas les trois booléens de son côté
  assert.equal((SRC.split("TerminalInfoInteger(TERMINAL_TRADE_ALLOWED)").length - 1), 1,
    "l'état du terminal doit être lu à UN seul endroit");
});

test("le clic se filtre sur le NOM de l'objet, jamais sur une position d'écran", () => {
  const t0 = borne(SRC, "void OnChartEvent(");
  const t1 = borne(SRC, "\nvoid OnTick()", t0);
  const bloc = SRC.slice(t0, t1);
  assert.ok(bloc.includes('if(sparam != PAN_PREF + "PLI") return;'),
    "le gestionnaire doit se filtrer sur le nom de l'objet cliqué");
  assert.ok(bloc.includes("if(id != CHARTEVENT_OBJECT_CLICK) return;"),
    "le gestionnaire doit se filtrer sur CHARTEVENT_OBJECT_CLICK");
  // Le panneau change de largeur à chaque rangée et à chaque taille de police : une
  // zone cliquable écrite en pixels serait fausse au premier redimensionnement.
  for (const interdit of ["lparam", "dparam", "CHART_WIDTH", "XDISTANCE"]) {
    assert.ok(!new RegExp("\\b" + interdit + "\\b[^\\n]*[<>=]").test(bloc),
      "le clic est arbitré sur " + interdit + " — c'est une position d'écran");
  }
  // et c'est un BOUTON : un OBJ_LABEL ne rend pas CHARTEVENT_OBJECT_CLICK de façon fiable
  une(/ObjectCreate\(0, nom, OBJ_BUTTON, 0, 0, 0\);/g, "le bouton de pli");
});

test("le pli survit au redémarrage, et se relit APRÈS les entrées effectives", () => {
  // La clé porte le symbole ET le magique : deux robots sur deux graphiques du même
  // symbole ne partagent pas leur pli.
  une(/string PliCle\(\) \{ return "VUNA_PLIE_" \+ _Symbol \+ "_" \+ IntegerToString\(InpMagic\); \}/g,
    "la clé du pli");
  une(/GlobalVariableSet\(PliCle\(\), g_plie \? 1\.0 : 0\.0\);/g, "l'écriture du pli");

  // L'ORDRE est le sujet, pas la présence — la forme de dimension-devise : un panneau
  // replié cache des chiffres, jamais ce avec quoi le robot a DÉMARRÉ.
  const entrees = borne(SRC, "VUNA ENTRÉES EFFECTIVES 2/2");
  const relu = borne(SRC, "   g_plie = (GlobalVariableCheck(PliCle())");
  assert.ok(relu > entrees,
    "le pli est relu AVANT la ligne des entrées effectives : les deux lignes qui disent "
    + "ce que le robot a démarré avec doivent partir au journal les premières.");
});

test("les rangées cachées sont DÉTRUITES, pas masquées", () => {
  // Des labels invisibles compteraient dans PAN_MAX, dont le dépassement se journalise :
  // le plafond se plaindrait à tort, sur un panneau qui n'affiche qu'une rangée.
  une(/for\(int k = g_nobj; k < PAN_OBJ; k\+\+\) ObjectDelete\(0, PAN_PREF \+ "O" \+ IntegerToString\(k\)\);/g,
    "la destruction des cellules au-delà de la dernière écrite");
  assert.ok(/if\(r >= g_nlig \|\| g_sep\[r\] != 1\) ObjectDelete\(0, PAN_PREF \+ "S"/.test(SRC),
    "les filets au-delà de la dernière rangée doivent être détruits");
  assert.ok(!/OBJPROP_TIMEFRAMES/.test(SRC),
    "le panneau masque des objets au lieu de les détruire : ils compteraient dans PAN_MAX");
});
