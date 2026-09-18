// STATUT · CAUSE ÉTABLIE — pannes RAPPORTÉES au journal MT5, causes relues DANS LE
// DÉPÔT. Les deux pannes qui ouvrent ce registre ont été
// OBSERVÉES : 1 800 s par symbole au journal MT5, puis 2 h 12 de processeur à 100 %
// sans un seul test terminé. Invariant et cause tiennent tous les deux.
//
// ————— AUCUNE BOUCLE D'UN SOURCE MQL5 NE TOURNE SANS BORNE DITE —————
//
// Deux pannes en un jour, même forme, deux fichiers :
//   · `AttendreHistorique` (Export_H1_Vena) tournait 1 800 s par symbole parce que
//     `lu = -1` ne satisfaisait jamais sa condition de sortie ;
//   · le cache d'agrégation du robot refaisait la lecture ET l'agrégation à chaque
//     appel — plusieurs fois par tick — parce qu'il mémorisait le SUCCÈS au lieu de
//     la TENTATIVE. CPU à 100 %, 2 h 12, aucun test terminé.
//
// Le correctif du matin a été posé dans un fichier, pas dans son voisin. C'est la
// classe qu'il fermait, pas le fichier : la garde se pose donc sur `sourcesMQL5()`.
//
// ————— POURQUOI UN REGISTRE ET PAS UN CRITÈRE —————
// Une garde syntaxique n'aurait attrapé NI l'une NI l'autre : `AttendreHistorique`
// bouclait sur `while(GetTickCount() < fin && !IsStopped())` — bornée par le temps,
// et défectueuse quand même ; le cache, lui, n'a aucune boucle. « Borné » n'est pas
// une propriété du texte, c'est un raisonnement — et un raisonnement s'écrit.
//
// Le registre porte donc CHAQUE boucle d'attente ou de relecture de la surface, avec
// la raison pour laquelle elle se termine. Il échoue DANS LES DEUX SENS : une boucle
// nouvelle échoue jusqu'à ce que quelqu'un dise ce qui l'arrête ; une entrée dont la
// boucle a disparu échoue aussi, pour que le registre ne devienne pas une liste de
// tolérances que plus personne ne relève.
//
// ANGLE MORT DÉCLARÉ (règle 9) : il relève les `while`. Une répétition SANS boucle —
// celle du cache d'agrégation, rejouée par l'appelant à chaque tick — lui est
// invisible, et c'était la pire des deux. Elle est tenue à part, par
// `init-sans-crash`, sur l'invariant « la tentative est mémorisée ». Le jour où l'on
// sait relever une répétition par appel, c'est ici que ça vient.
import { test } from "node:test";
import assert from "node:assert/strict";
import { sourcesMQL5 } from "./sources-mql5.mjs";

// clé = source · condition de la boucle  ·  valeur = ce qui la termine, en toutes
// lettres. Écrire la raison est le travail : si elle ne s'écrit pas, la boucle ne se
// termine pas.
const BOUCLES = new Map([
  ["Export_H1_Vena.mq5 · while(pMax < ArraySize(paliers) - 1 && paliers[pMax] < besoin)",
    "pMax croît strictement et la condition le borne à ArraySize(paliers) - 1"],
  ["Export_H1_Vena.mq5 · while(GetTickCount() < fin && !IsStopped())",
    "échéance InpAttenteSec, arrêt utilisateur, ET sortie sur deux tours d'échec "
    + "identiques (lu <= 0 && premiere == 0) — c'est cette dernière qui manquait, et "
    + "son absence coûtait 1 800 s par symbole"],
  ["Export_H1_Vena.mq5 · while(iM1 < nM1 && m1[iM1].time < r[i].time)",
    "iM1 croît strictement et nM1 est le nombre de M1 réellement lues"],
  ["Export_H1_Vena.mq5 · while(j < nM1 && m1[j].time < r[i].time + 3600)",
    "j croît strictement et nM1 borne le parcours"],
  ["Export_H1_Vena.mq5 · while(!FileIsEnding(f))",
    "FileReadString avance le pointeur à CHAQUE tour, avant tout continue : la fin "
    + "de fichier finit par arriver"],
  ["Vena_Releve.mq5 · while(!FileIsEnding(f))",
    "FileReadString avance le pointeur à CHAQUE tour, avant tout continue"],
  ["robot-mt5.js → .mq5 émis · while(j < nm && mT[j] < hT[i])",
    "j croît strictement et nm est le minimum des comptes réellement lus"],
]);

// Les conditions portent des parenthèses imbriquées — ArraySize(), GetTickCount(),
// FileIsEnding(). Un relevé qui s'arrête à la première parenthèse fermante tronque
// la condition, et deux boucles différentes se confondent alors sous une même clé :
// le registre exempterait la seconde sans que personne le voie. On équilibre.
const conditionA = (ligne, k) => {
  let p = ligne.indexOf("(", k), d = 0, j = p;
  if (p < 0) return null;
  for (; j < ligne.length; j++) {
    if (ligne[j] === "(") d++;
    else if (ligne[j] === ")") { d--; if (!d) break; }
  }
  return d === 0 ? ligne.slice(k, j + 1).replace(/\s+/g, " ") : null;
};

const relever = () => {
  const out = [];
  for (const { nom, src } of sourcesMQL5()) {
    src.split("\n").forEach((l) => {
      const k = l.search(/\bwhile\s*\(/);
      if (k < 0) return;
      const c = conditionA(l, k);
      if (c) out.push(nom + " · " + c);
    });
  }
  return [...new Set(out)];
};

test("chaque boucle d'un source MQL5 dit ce qui l'arrête", () => {
  const vues = relever();
  assert.ok(vues.length > 0,
    "aucune boucle relevée dans la surface MQL5 : la garde ne mesure plus rien — "
    + "soit `sourcesMQL5()` a perdu sa prise, soit le relevé ne reconnaît plus les "
    + "boucles. Dans les deux cas elle serait verte en ne gardant rien.");
  const inconnues = vues.filter((v) => !BOUCLES.has(v));
  assert.deepEqual(inconnues, [],
    "Des boucles d'un source MQL5 ne disent pas ce qui les arrête :\n  "
    + inconnues.join("\n  ")
    + "\n\nUne boucle qui tourne dans un agent de test ne plante pas : elle mange un "
    + "cœur et ne rend jamais la main, et le « disconnected » qu'on lit dans le "
    + "journal est l'agent qu'on TUE. Inscrivez-la dans BOUCLES avec la raison pour "
    + "laquelle elle se termine — et si vous ne pouvez pas l'écrire, c'est qu'elle ne "
    + "se termine pas.");
  const disparues = [...BOUCLES.keys()].filter((k) => !vues.includes(k));
  assert.deepEqual(disparues, [],
    "Des entrées du registre ne correspondent à aucune boucle :\n  "
    + disparues.join("\n  ")
    + "\n\nC'est peut-être une bonne nouvelle — la boucle est partie — et c'est quand "
    + "même un échec : un registre qu'on ne vide pas devient une liste d'exemptions "
    + "que plus personne ne relève. Retirez la ligne, ou réancrez-la si la condition "
    + "a seulement changé de forme.");
});

test("la surface couvre le PRODUIT autant que le LIVRÉ", () => {
  // c'est tout l'objet de ce fichier : la classe, pas le lieu. Si la surface
  // reperdait le source émis, cette garde et celle d'ArrayFree redeviendraient des
  // gardes de dossier sans que rien ne le dise.
  const noms = sourcesMQL5().map((x) => x.origine);
  assert.ok(noms.includes("livré"),
    "la surface ne découvre plus aucun script livré à la racine");
  assert.ok(noms.includes("produit"),
    "la surface a reperdu le source ÉMIS par le générateur. C'est exactement le trou "
    + "qui a laissé passer `ArrayFree` puis l'attente sans borne : le correctif "
    + "fermait une classe, la garde gardait un dossier.");
});
