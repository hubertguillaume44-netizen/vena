// STATUT · CAUSE ÉTABLIE, MESURÉE DANS LE DÉPÔT — les quatre maillons sont relus ici,
// dans les quatre fichiers. Le candidat qu'elle referme venait d'un rapport MT5.
//
// ————— UN CANDIDAT QUI COÛTAIT UNE LECTURE DE SOURCE, ET LA RÉPONSE EST NON —————
//
// Le rapport #HongKong50 porte `InpPasDebutSemaine = true` : le robot refuse le dimanche
// et le lundi avant 02:00. Sur un instrument asiatique, dont la séance ouvre le dimanche
// soir en heure européenne, une règle que Véna n'appliquerait pas — ou appliquerait sur
// une AUTRE horloge — déplacerait exactement le genre de douzaine de trades qu'on
// cherchait. Mesuré : les deux appliquent la même règle, et lisent la même horloge.
//
//   robot-mt5.js       TimeToStruct(TimeCurrent(), …)  → heure SERVEUR du courtier
//   Export_H1_Vena.mq5 TimeToString(r[i].time, …)      → la même, écrite en horloge murale
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
// ANGLE MORT DÉCLARÉ (règle 9), en tête : elle tient que les quatre maillons LISENT la
// même horloge et que les deux seuils sont écrits pareil. Elle ne tient PAS l'instant où
// chacun applique la règle — Véna la pose sur l'ouverture de la bougie, le robot sur le
// tick de sa tentative. À l'heure près les deux coïncident ; une règle future qui
// descendrait sous l'heure sortirait de sa prise sans qu'elle le dise.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { borne } from "../lib/tranche.mjs";

const ROBOT = readFileSync(new URL("../../robot-mt5.js", import.meta.url), "utf8");
const EXPORT = readFileSync(new URL("../../Export_H1_Vena.mq5", import.meta.url), "utf8");
const MOTEUR = readFileSync(new URL("../../moteur.js", import.meta.url), "utf8");

test("le robot et le moteur refusent le MÊME début de semaine", () => {
  // le robot : ancré sur ce qui AGIT — le test de jour et le test d'heure
  assert.match(ROBOT, /if\(t\.day_of_week == 0\) \{ g_confRefus = "dimanche"; return false; \}/,
    "le robot ne refuse plus le dimanche sous cette forme : la garde a perdu sa prise "
    + "sur la règle qu'elle compare.");
  assert.match(ROBOT, /if\(t\.day_of_week == 1 && t\.hour < 2\)/,
    "le robot ne refuse plus le lundi avant 02:00, ou plus sous ce seuil. Si le seuil "
    + "change d'un côté seulement, Véna entre des heures avant le robot — c'est la "
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
    + "exportées, et l'accord avec Véna tomberait en silence.");
  // 2 · l'export écrit cette même heure, en horloge murale
  assert.match(EXPORT, /TimeToString\(r\[i\]\.time, TIME_DATE \| TIME_MINUTES\)/,
    "l'export n'écrit plus l'heure de la bougie telle que le serveur la donne. Toute "
    + "conversion posée ici décalerait la colonne `date` sans que rien d'autre bouge.");
  // 3 · lireCsv range cette horloge murale dans un champ UTC — sans la convertir
  assert.match(MOTEUR, /const ms = Date\.UTC\(an, mois - 1, jour, \+\(hm\[0\] \|\| 0\), \+\(hm\[1\] \|\| 0\)\);/,
    "`lireCsv` ne range plus l'horodatage tel quel. S'il se mettait à interpréter un "
    + "fuseau, l'heure du serveur cesserait de ressortir de `getUTCHours()` et les deux "
    + "règles de début de semaine se désaccorderaient — sans qu'aucune des deux change.");
  // 4 · et `executable` la ressort telle quelle
  const exe = MOTEUR.slice(borne(MOTEUR, "  const executable = (i) => {"),
    borne(MOTEUR, "  // Plafond de spread"));
  assert.match(exe, /const d = new Date\(df\.t\[i\]\);/,
    "`executable` ne lit plus l'horodatage de la bougie.");
  assert.ok(!/getHours\(\)|getDay\(\)/.test(exe),
    "`executable` lit une heure LOCALE : le verdict dépendrait du fuseau de la machine "
    + "de l'utilisateur, donc deux personnes mesureraient deux choses sur la même série.");
});
