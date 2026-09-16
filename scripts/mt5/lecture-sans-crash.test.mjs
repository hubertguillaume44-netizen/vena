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
import { borne } from "../lib/tranche.mjs";

const RACINE = new URL("../../", import.meta.url);
// DÉCOUVERTE, pas énumération (règle 7) : tout script MQL5 de la racine qui lit
// des bougies est concerné. Un troisième script demain est couvert sans être nommé.
const SCRIPTS = readdirSync(RACINE)
  .filter((f) => f.endsWith(".mq5"))
  .map((f) => [f, readFileSync(new URL(f, RACINE), "utf8")])
  .filter(([, src]) => src.includes("CopyRates("));

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
      if (!/=\s*CopyRates\s*\(/.test(l)) return;
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
