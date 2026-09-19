// STATUT · CAUSE ÉTABLIE — erreur RAPPORTÉE sur un rapport MT5, ordre de préférence relu
// DANS LE DÉPÔT. Les deux défauts ci-dessous sont des faits du rapport #HongKong50 du
// 7 septembre 2026, lu par l'utilisateur ; le PDF n'est pas entré dans `scripts/mt5/`.
//
// ————— DEUX ERREURS DE CONVERSION, ET ELLES SE SONT COMPOSÉES —————
//
// Un écart de 38,4 R a été décomposé en trois hypothèses chiffrées. Les trois étaient
// fausses, et aucune ne portait sur le mécanisme : l'erreur était dans la CONVERSION du
// résultat MT5 en R, avant toute décomposition.
//
//   1. le net de +3 422,35 € a été converti au taux de l'ÉCRAN Vuna — 100 €/R — alors que
//      le rapport part d'un dépôt de 20 000 €. +4,00 R annoncé pour +14,8 R réels ;
//   2. `InpRisquePct` porte sur l'ÉQUITÉ COURANTE, pas sur le dépôt. La perte moyenne du
//      rapport vaut −231,22 €, pas −200 : l'équité monte de 20 000 à 23 422, sa moyenne
//      sur la course vaut environ 23 100, dont 1 % fait 231 €. À l'euro près.
//
// LE SECOND A FABRIQUÉ UN MÉCANISME. −231 lu contre −200 attendu se présente comme un
// dépassement de stop de 11 %, c'est-à-dire la signature d'un GAP — et l'instrument avait
// 900 bougies écartées pour l'expliquer. L'hypothèse était cohérente, chiffrée, et
// entièrement produite par un dénominateur faux. Normalisée sur la perte moyenne
// réalisée, la perte moyenne MT5 rend −1,000 R par construction.
//
// > UN RISQUE EN POURCENTAGE DE L'ÉQUITÉ COURANTE N'A PAS DE R CONSTANT SUR LA COURSE,
// > et le prendre pour constant fabrique un dépassement de stop qui n'est que de la
// > capitalisation.
//
// C'est la règle 8 sur une grandeur plutôt que sur un nom : `capital × risquePct` est un
// LIEU — ce que les réglages annonçaient au départ. La perte moyenne encaissée est la
// PROPRIÉTÉ — ce qu'un R a réellement coûté. Le second se mesure, le premier se déclare.
//
// ANGLE MORT DÉCLARÉ (règle 9), en tête : cette garde tient l'ORDRE DE PRÉFÉRENCE du
// code et l'absence d'un €/R constant dans le jeu de référence. Elle ne peut RIEN contre
// un humain qui lit un chiffre sur un écran et le divise de tête — c'est exactement ce
// qui s'est produit, et aucune garde de dépôt n'atteint ce geste. Ce qu'elle ferme est
// la moitié qui est dans les fichiers : plus aucun €/R constant à lire ici.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { borne } from "../lib/tranche.mjs";
import { euroParR } from "./comparer.mjs";
import { CADRE, REFERENCES } from "./references.mjs";

const COMPARER = readFileSync(new URL("./comparer.mjs", import.meta.url), "utf8");

test("le jeu de référence ne porte plus aucun €/R constant", () => {
  assert.equal(CADRE.eurParR, undefined,
    "`CADRE` porte de nouveau un €/R constant (" + CADRE.eurParR + "). Il n'est lu par "
    + "aucune ligne de code — il est lu par des humains, et il a produit un facteur "
    + "presque quatre sur la conversion d'un rapport MT5. Un risque en pourcentage de "
    + "l'équité courante n'a pas de R constant sur la course : le seul chiffre honnête "
    + "est la perte moyenne réellement encaissée, qui se lit dans le rapport.");
  // la prise : le cadre existe encore et porte bien ce dont le €/R se dérivait
  assert.equal(CADRE.capital, 20000, "le cadre a perdu son dépôt : la garde ne regarde "
    + "plus l'objet dont elle parle.");
  assert.equal(CADRE.risquePct, 1, "le cadre a perdu son pourcentage de risque.");
  assert.ok(REFERENCES.length >= 5, "seules " + REFERENCES.length + " références : la "
    + "garde n'a plus de prise sur le jeu qu'elle protège.");
});

// ————— L'ORDRE DE PRÉFÉRENCE EST LA MOITIÉ QUI EST DANS LE CODE —————
// `euroParR` estime le facteur de trois façons. Le nominal — capital × risque — doit
// rester le DERNIER recours : c'est celui qui ne mesure rien.
test("le nominal est le dernier recours de la conversion, jamais le premier", () => {
  const bloc = COMPARER.slice(borne(COMPARER, "export function euroParR("),
    borne(COMPARER, "export const rNet ="));
  assert.match(bloc, /const parStop = stops\.length >= 3 \? quantile\(stops, 0\.5\) : NaN;/,
    "la médiane du profit des stops pleins MT5 n'est plus calculée : c'est la SEULE des "
    + "trois estimations qui mesure ce qu'un R a réellement coûté.");
  const iStop = bloc.indexOf("Number.isFinite(parStop)");
  const iNom = bloc.indexOf(": nominal;");
  assert.ok(iStop >= 0 && iNom > iStop,
    "le nominal `capital × risque` n'est plus le dernier recours de `euroParR`. Il "
    + "annonce ce que les réglages promettaient au départ ; sous un risque "
    + "proportionnel à l'équité, il se trompe d'autant que la course a rapporté.");
});

// ————— ET LA PRÉFÉRENCE SE MESURE, PAS SEULEMENT SE LIT —————
// Un jeu de paires où le stop réel vaut 231 € pendant que le nominal en annonce 200 :
// la fonction doit rendre 231. C'est le cas exact du rapport #HongKong50.
test("sur une course qui capitalise, la conversion suit le stop réel et non le nominal", () => {
  const paires = [];
  // huit stops pleins encaissés à 231 € — la perte moyenne du rapport
  for (let i = 0; i < 8; i++) {
    paires.push({ sim: { R_net: -1 }, mt5: { profit: -231.22, net: -243 } });
  }
  // et quelques gagnants, pour que la régression ait de quoi mordre
  for (let i = 0; i < 6; i++) {
    paires.push({ sim: { R_net: 1.44 }, mt5: { profit: 333.35, net: 321 } });
  }
  const r = euroParR(paires, { impose: NaN, capital: CADRE.capital, risquePct: CADRE.risquePct });
  assert.equal(r.nominal, 200, "le nominal du cadre n'est plus 200 € : le décor de cette "
    + "mesure a changé et elle ne compare plus les deux chiffres qu'elle veut comparer.");
  assert.ok(Math.abs(r.retenu - 231.22) < 0.5,
    "la conversion retient " + r.retenu.toFixed(2) + " €/R au lieu des 231,22 € que les "
    + "stops ont réellement coûté. Elle est retombée sur le nominal (200 €), et tout "
    + "résultat converti serait surestimé de 15 % — de quoi faire naître un dépassement "
    + "de stop qui n'est que de la capitalisation.");
  assert.match(r.source, /stops pleins MT5/,
    "la conversion dit venir de « " + r.source + " » : elle ne mesure plus le stop réel.");
});
