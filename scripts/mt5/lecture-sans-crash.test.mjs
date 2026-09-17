// STATUT · PANNE OBSERVÉE, MÉCANISME NON PROUVÉ. La mort du terminal est un fait — le
// journal de l'utilisateur porte l'access violation sur US2000.cash, et la séquence
// ci-dessous s'y lit. Ce qui reste une hypothèse est le MÉCANISME : qu'ArrayFree laisse
// un tampon que CopyRates réutilise. Personne ici ne peut faire tourner MetaTrader pour
// le confirmer.
//
// C'est une troisième valeur, et elle est née en marquant ce fichier : entre « cause
// établie » et « correctif de forme » il y a le cas où la PANNE est mesurée et son
// EXPLICATION devinée. Les confondre avec l'une ou l'autre mentirait dans les deux sens.
//
// ————— UN SCRIPT NE DOIT PAS POUVOIR TUER LE TERMINAL DE QUELQU'UN —————
//
// `Export_H1_Vena` a fait mourir MetaTrader sur US2000.cash : « Access violation
// write » avec des registres ymm et des vmovdqu — une copie mémoire vectorisée
// qui écrit hors d'une zone valide. Ce n'est PAS une exception MQL5 rattrapable :
// le processus meurt, et l'utilisateur perd son terminal parce qu'il a lancé
// notre script. Aucun try, aucun message, aucun rapport possible.
//
// LA SÉQUENCE, lue dans le journal : HK50.cash se termine normalement — donc `r`
// et `m1` viennent d'être libérés par `ArrayFree` — puis US2000.cash entre dans
// sa première tranche et appelle `CopyRates` sur CES MÊMES tableaux, déclarés
// hors de la boucle. `ArrayFree` détruit le tampon d'un tableau dynamique ; ce
// qui reste n'est pas « un tableau vide », et le drapeau d'`ArraySetAsSeries` ne
// lui survit pas. Le même `ArrayFree` vivait aussi DANS la boucle, à chaque
// tranche sans données.
//
// CETTE GARDE NE PROUVE PAS LE DIAGNOSTIC, et elle ne le prétend pas : personne
// ici ne peut faire tourner MetaTrader. Elle tient la FORME défensive — celle qui
// rend le crash impossible que la cause soit celle-là ou l'autre — et c'est le
// bon niveau d'engagement quand la panne est hors d'atteinte du banc (règle 9).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readdirSync } from "node:fs";
import { sourcesMQL5 } from "./sources-mql5.mjs";
import { borne } from "../lib/tranche.mjs";

const RACINE = new URL("../../", import.meta.url);
// ————— LA SURFACE EST LA CLASSE, PAS LE LIEU —————
// Elle disait « tout script MQL5 DE LA RACINE », et se croyait une découverte : c'en
// était une, mais sur un LIEU. Le robot naît d'un générateur, n'a pas la forme d'un
// fichier `.mq5`, et l'interdiction d'`ArrayFree` ne l'a donc jamais couvert — le
// correctif avait fermé une classe, la garde gardait un dossier.
// `sourcesMQL5()` rend ce que la classe désigne vraiment : tout source MQL5 que
// l'utilisateur peut faire tourner, livré OU produit.
const SCRIPTS = sourcesMQL5()
  .filter((x) => x.src.includes("CopyRates("))
  .map((x) => [x.nom, x.src]);

test("aucun script ne DÉTRUIT un tableau qu'il va relire", () => {
  assert.ok(SCRIPTS.length > 0,
    "aucun script MQL5 ne lit de bougies : la garde ne mesure plus rien — réancrez");
  const fautes = [];
  for (const [nom, src] of SCRIPTS) {
    src.split("\n").forEach((l, i) => {
      // ANCRÉ SUR CE QUI AGIT : l'appel avec ses parenthèses. Le mot « ArrayFree »
      // vit légitimement dans le commentaire qui raconte ce crash — c'est son
      // travail de le nommer (règle 3).
      if (/ArrayFree\s*\(/.test(l) && !/^\s*\/\//.test(l)) {
        fautes.push(nom + ":" + (i + 1) + " — " + l.trim().slice(0, 90));
      }
    });
  }
  assert.deepEqual(fautes, [],
    "`ArrayFree` est de retour :\n  " + fautes.join("\n  ")
    + "\n\nSur un tableau déclaré HORS de la boucle et relu à la tranche — ou au "
    + "symbole — suivant, il détruit le tampon et emporte le drapeau de série. Le "
    + "terminal est mort là-dessus, sans exception rattrapable et sans message. "
    + "Videz avec `ViderRates(x)` : ArrayResize(x, 0) rend la même mémoire sans "
    + "détruire l'objet, et repose ArraySetAsSeries explicitement.");
});

test("le vidage repose le drapeau de série, et il est défini avant d'être appelé", () => {
  const [nom, src] = SCRIPTS.find(([n]) => n.startsWith("Export_H1"))
    || assert.fail("Export_H1_Vena introuvable — réancrez");
  const i = src.indexOf("void ViderRates(MqlRates &a[])");
  assert.ok(i > 0,
    nom + " : ViderRates a disparu, alors que la garde ci-dessus interdit ArrayFree — "
    + "elle deviendrait une interdiction sans issue");
  const corps = src.slice(i, borne(src, "\n}", i));
  assert.match(corps, /ArrayResize\(a, 0\);/,
    "ViderRates ne rend plus la mémoire : la raison d'être du vidage entre deux "
    + "tranches était de ne pas garder un an de bougies pendant qu'on en lit un autre");
  assert.match(corps, /ArraySetAsSeries\(a, false\);/,
    "ViderRates ne repose plus le drapeau de série. On ne PARIE pas sur ce qu'une "
    + "libération laisse derrière elle : c'est précisément le pari qui a tué le terminal.");
  const premierAppel = src.indexOf("ViderRates(", i + 10);
  assert.ok(premierAppel > i,
    "ViderRates est appelée avant d'être définie : MQL5 compile de haut en bas");
});

test("aucune plage inversée n'est demandée au terminal, et chaque tranche se journalise", () => {
  const fautes = [], muets = [];
  for (const [nom, src] of SCRIPTS) {
    const lignes = src.split("\n");
    lignes.forEach((l, i) => {
      // ————— CET INVARIANT-CI EST DE LIEU, ET IL LE RESTE —————
      // La classe « aucun ArrayFree » vaut pour TOUT source MQL5 ; celui-ci ne vaut
      // que pour les lectures PAR PLAGE — deux dates passées au terminal. Le robot,
      // lui, lit par NOMBRE : `t1 - 1 < t0` n'y a aucun sens, et `InpTracerTranches`
      // n'y existe pas. Élargir la surface l'a fait échouer sur deux appels
      // parfaitement sains.
      //
      // La règle qui a fait élargir la première joue donc dans les deux sens : un
      // invariant de LIEU garde son lieu. Mais on ne le dit pas par un nom de
      // fichier — on le dit par la PROPRIÉTÉ qui le rend applicable : l'appel
      // passe-t-il une plage ? Un futur script qui lira par plage sera couvert sans
      // être nommé ; un futur générateur qui lira par nombre ne le sera pas à tort.
      if (!/=\s*CopyRates\s*\([^)]*,\s*t0\s*,/.test(l)) return;
      // les vingt lignes qui précèdent l'appel portent sa préparation
      const avant = lignes.slice(Math.max(0, i - 20), i).join("\n");
      if (!/if\(t1 - 1 < t0\) continue;/.test(avant)) {
        fautes.push(nom + ":" + (i + 1) + " — " + l.trim().slice(0, 80));
      }
      if (!/InpTracerTranches/.test(avant)) {
        muets.push(nom + ":" + (i + 1) + " — " + l.trim().slice(0, 80));
      }
    });
  }
  assert.deepEqual(fautes, [],
    "Un CopyRates part sans garde-fou de plage :\n  " + fautes.join("\n  ")
    + "\n\n`t1` est borné à TimeCurrent() : sur la dernière tranche, `t1 - 1` peut "
    + "passer sous `t0`. Demander une plage inversée au terminal n'a aucun sens, et "
    + "on ne sait pas ce qu'il en fait — c'est le second candidat du crash, et il "
    + "coûte une ligne à écarter.");
  assert.deepEqual(muets, [],
    "Un CopyRates part sans dire QUELLE tranche :\n  " + muets.join("\n  ")
    + "\n\nLe terminal est mort sur US2000.cash sans que rien ne dise sur quelle "
    + "année : le journal s'arrêtait au symbole. Une panne hors de portée du banc "
    + "ne se diagnostique que par ce qu'elle a laissé écrit — la prochaine "
    + "occurrence doit dire OÙ.");
});
