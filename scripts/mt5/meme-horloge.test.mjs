// STATUT · CAUSE ÉTABLIE, MESURÉE DANS LE DÉPÔT — les quatre maillons sont relus ici,
// dans les quatre fichiers. Le candidat qu'elle referme venait d'un rapport MT5.
//
// ————— UN CANDIDAT QUI COÛTAIT UNE LECTURE DE SOURCE, ET LA RÉPONSE EST NON —————
//
// Le rapport #HongKong50 porte `InpPasDebutSemaine = true` : le robot refuse le dimanche
// et le lundi avant 02:00. Sur un instrument asiatique, dont la séance ouvre le dimanche
// soir en heure européenne, une règle que Vuna n'appliquerait pas — ou appliquerait sur
// une AUTRE horloge — déplacerait exactement le genre de douzaine de trades qu'on
// cherchait. Mesuré : les deux appliquent la même règle, et lisent la même horloge.
//
//   robot-mt5.js       TimeToStruct(TimeCurrent(), …)  → heure SERVEUR du courtier
//   Export_H1_Vuna.mq5 TimeToString(r[i].time, …)      → la même, écrite en horloge murale
//   moteur.js lireCsv  Date.UTC(an, mois-1, jour, h, m) → cette horloge murale, RANGÉE en UTC
//   moteur.js executable getUTCDay() / getUTCHours()    → relit donc l'heure SERVEUR
//
// L'accord ne tient pas parce que les deux sont en UTC — aucun des deux ne l'est. Il
// tient parce que `lireCsv` range l'horloge du serveur dans un champ UTC et que
// `executable` l'en ressort telle quelle. **Deux erreurs qui s'annulent exactement, et
// c'est ce qui rend cette garde nécessaire** : corriger l'une des deux « pour bien
// faire » romprait l'accord sans qu'aucun test ne rougisse aujourd'hui.
//
// > QUATRE MAILLONS DANS QUATRE FICHIERS, ET LE DÉFAUT N'EST DANS AUCUN D'EUX PRIS
// > ISOLÉMENT — il serait dans leur DÉSACCORD. C'est la forme de `manifeste-version`,
// > qui liait le chemin déposé, le chemin servi et le chemin demandé.
//
// ————— ET L'ANNULATION N'EST PAS LOCALE : ELLE PORTE LE SEAU D1 —————
//
// Mesuré en cherchant les autres consommateurs de cette horloge : `moteur.js` porte
// VINGT-TROIS lectures `getUTC*`, et la plus lourde n'est pas la règle de début de
// semaine — c'est `resamplerBrut`, qui construit le seau D1 sur
// `Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())`. Appliqué à une
// horloge murale de serveur, ce seau est le **jour calendaire du COURTIER** — c'est-à-dire
// exactement la frontière sur laquelle MT5 bâtit ses barres D1.
//
// Toute décision en `ut: 'D1'` — la plus courante du produit — repose donc sur la même
// annulation. Ce n'est pas un accident tolérable dans un coin : **c'est ce qui aligne le
// moteur sur le testeur**, et ça n'était écrit nulle part.
//
// ANGLE MORT DÉCLARÉ (règle 9), en tête : elle tient que les maillons LISENT la même
// horloge, que les deux seuils de début de semaine sont écrits pareil, et que le seau D1
// se construit sur cette même horloge. Elle ne couvre que DEUX des vingt-trois lectures —
// les deux dont on a mesuré qu'elles portent l'accord avec MT5. Les autres suivent la
// même convention sans qu'aucune garde ne le vérifie, et une conversion de fuseau posée
// dans `lireCsv` les emporterait toutes ensemble.
//
// Elle ne tient pas non plus l'instant où chacun applique la règle — Vuna la pose sur
// l'ouverture de la bougie, le robot sur le tick de sa tentative. À l'heure près les deux
// coïncident ; une règle future qui descendrait sous l'heure sortirait de sa prise sans
// qu'elle le dise.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { borne } from "../lib/tranche.mjs";

const ROBOT = readFileSync(new URL("../../robot-mt5.js", import.meta.url), "utf8");
const EXPORT = readFileSync(new URL("../../Export_H1_Vuna.mq5", import.meta.url), "utf8");
const MOTEUR = readFileSync(new URL("../../moteur.js", import.meta.url), "utf8");

test("le robot et le moteur refusent le MÊME début de semaine", () => {
  // le robot : ancré sur ce qui AGIT — le test de jour et le test d'heure
  assert.match(ROBOT, /if\(t\.day_of_week == 0\) \{ g_confRefus = "dimanche"; return false; \}/,
    "le robot ne refuse plus le dimanche sous cette forme : la garde a perdu sa prise "
    + "sur la règle qu'elle compare.");
  assert.match(ROBOT, /if\(t\.day_of_week == 1 && t\.hour < 2\)/,
    "le robot ne refuse plus le lundi avant 02:00, ou plus sous ce seuil. Si le seuil "
    + "change d'un côté seulement, Vuna entre des heures avant le robot — c'est la "
    + "panne déjà mesurée à 90 trades sur 434 sur BITCOIN.");

  // le moteur : le même jour, le même seuil, dans `executable`
  const exe = MOTEUR.slice(borne(MOTEUR, "  const executable = (i) => {"),
    borne(MOTEUR, "  // Plafond de spread"));
  assert.match(exe, /if \(j === 0\) return false;/,
    "`executable` ne refuse plus le dimanche.");
  assert.match(exe, /return !\(j === 1 && d\.getUTCHours\(\) < 2\);/,
    "`executable` ne refuse plus le lundi avant 02:00, ou plus sous ce seuil. Les deux "
    + "seuils doivent bouger ensemble ou pas du tout.");
});

test("les quatre maillons lisent la même horloge, et c'est celle du SERVEUR", () => {
  // 1 · le robot décide sur l'heure du serveur
  assert.match(ROBOT, /MqlDateTime t; TimeToStruct\(TimeCurrent\(\), t\);/,
    "le robot ne lit plus `TimeCurrent()` pour décider du début de semaine. S'il passait "
    + "à `TimeGMT()`, il déciderait sur une autre horloge que celle des bougies "
    + "exportées, et l'accord avec Vuna tomberait en silence.");
  // 2 · l'export écrit cette même heure, en horloge murale
  assert.match(EXPORT, /TimeToString\(r\[i\]\.time, TIME_DATE \| TIME_MINUTES\)/,
    "l'export n'écrit plus l'heure de la bougie telle que le serveur la donne. Toute "
    + "conversion posée ici décalerait la colonne `date` sans que rien d'autre bouge.");
  // 3 · lireCsv range cette horloge murale dans un champ UTC — sans la convertir
  assert.match(MOTEUR, /const ms = Date\.UTC\(an, mois - 1, jour, \+\(hm\[0\] \|\| 0\), \+\(hm\[1\] \|\| 0\)\);/,
    "`lireCsv` ne range plus l'horodatage tel quel. S'il se mettait à interpréter un "
    + "fuseau, l'heure du serveur cesserait de ressortir de `getUTCHours()`, les deux "
    + "règles de début de semaine se désaccorderaient — sans qu'aucune des deux change — "
    + "et le seau D1 cesserait d'être le jour calendaire du courtier.\n\n"
    // ————— ET LE GESTE JUSTE N'EST PAS CELUI QUI VIENT À L'ESPRIT —————
    // Une garde de convention doit ENSEIGNER la convention : quelqu'un arrive ici de
    // bonne foi, voit un `Date.UTC` posé sur une heure qui n'est pas UTC, et le corrige.
    // Le message doit donc dire ce qu'il faut faire À LA PLACE, et pas seulement ce qui
    // est interdit — sinon il se lit comme un veto, et un veto se contourne.
    + "LE GESTE N'EST PAS DE CORRIGER CETTE LIGNE. Si une vraie conversion de fuseau "
    + "devient nécessaire un jour, la convention se rend d'abord EXPLICITE : on nomme "
    + "l'horloge — « heure serveur du courtier » — partout où elle est lue, jusque dans "
    + "les identifiants, pour que le lecteur suivant sache qu'il n'y a rien à convertir. "
    + "Un commentaire ne suffira pas, un NOM si : c'est la leçon de `sessionInfo` devenu "
    + "`fenetreHeuresInfo`. Convertir ici sans avoir renommé ailleurs casse un accord qui "
    + "tient par annulation de deux erreurs, et rien d'autre ne rougira.");
  // 4 · et `executable` la ressort telle quelle
  const exe = MOTEUR.slice(borne(MOTEUR, "  const executable = (i) => {"),
    borne(MOTEUR, "  // Plafond de spread"));
  assert.match(exe, /const d = new Date\(df\.t\[i\]\);/,
    "`executable` ne lit plus l'horodatage de la bougie.");
  assert.ok(!/getHours\(\)|getDay\(\)/.test(exe),
    "`executable` lit une heure LOCALE : le verdict dépendrait du fuseau de la machine "
    + "de l'utilisateur, donc deux personnes mesureraient deux choses sur la même série.");
});

// ————— ET LE SEAU D1 EST LE PLUS LOURD CONSOMMATEUR DE CETTE ANNULATION —————
//
// `resamplerBrut` découpe la journée sur `getUTCDate()` d'une horloge murale de serveur :
// le seau D1 est donc le jour calendaire du COURTIER, la frontière même sur laquelle MT5
// bâtit ses barres D1. Toute décision en `ut: 'D1'` — la plus courante du produit —
// repose sur l'annulation décrite en tête. La garder ici, c'est garder l'alignement du
// moteur sur le testeur, pas un détail de fuseau.
test("le seau D1 se découpe sur la MÊME horloge que le reste", () => {
  const seau = MOTEUR.slice(borne(MOTEUR, "  const bucket = (ms) => {"),
    borne(MOTEUR, "  const t = [], o = [], h = [], l = [], c = [];"));
  assert.match(seau,
    /if \(ut === 'D1'\) return Date\.UTC\(d\.getUTCFullYear\(\), d\.getUTCMonth\(\), d\.getUTCDate\(\)\);/,
    "le seau D1 ne se construit plus sur les composantes `getUTC*` de l'horodatage. "
    + "Appliquées à l'horloge murale du serveur — ce que `lireCsv` range —, elles rendent "
    + "le jour calendaire du COURTIER, qui est la frontière des barres D1 de MT5. Une "
    + "conversion de fuseau posée ici décalerait toutes les décisions D1 d'une poignée "
    + "d'heures par rapport au testeur, sans qu'aucun compte de trades ne paraisse faux.");
  assert.match(seau, /const h = Math\.floor\(d\.getUTCHours\(\) \/ 4\) \* 4;/,
    "le seau H4 ne se découpe plus sur la même horloge que le seau D1 : les deux unités "
    + "se mettraient à désigner des barres différentes de celles du testeur.");
  assert.ok(!/getHours\(\)|getDate\(\)[^U]/.test(seau),
    "le seau lit une composante LOCALE : deux utilisateurs dans deux fuseaux "
    + "agrégeraient la même série en deux jeux de barres différents.");
});
