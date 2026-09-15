// ————— TROIS INDICATEURS DE PROGRESSION POUR UN SEUL SCAN —————
//
// Pendant un scan, trois blocs disaient la même chose, visibles ensemble : la barre du
// bandeau (pourcentage, reste, instrument courant, Pause/Arrêter), le pied d'acier
// (mêmes chiffres, mêmes commandes), et un cadre « Scan en cours » qui répétait tout
// sans rien commander. Le cadre est parti. La répétition bandeau/pied, elle, est VOULUE :
// le bandeau colle en haut, le pied colle en bas — c'est la même information pour deux
// positions de défilement, pas deux informations.
//
// Ce que le cadre portait SEUL a été déplacé, pas jeté : la phrase qui rassure sur
// l'arrêt vit sous Pause / Arrêter, dans le pied — un message qui rassure se met à
// portée du geste qu'il rassure, pas trois écrans plus bas.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { borne, borneArriere } from "../lib/tranche.mjs";

const SOURCE = readFileSync(new URL("../../Vena.dc.html", import.meta.url), "utf8");
// le gabarit seul, commentaires effacés : on interdit le code, pas le récit du code
const GABARIT = SOURCE.slice(borne(SOURCE, "<x-dc>"), borne(SOURCE, "</x-dc>"))
  .replace(/<!--[\s\S]*?-->/g, "");

test("un seul indicateur de progression par surface, et le cadre ne revient pas", () => {
  // ————— LA PRISE EST LE TROU DU GABARIT, PAS LE TEXTE —————
  // Chaque indicateur nommant l'instrument courant passe par un trou dédié :
  // `scanBandeauDetail` pour le bandeau du haut, `barDroiteSous` pour le pied. Exactement
  // un chacun. Le trou du cadre, `progression`, n'existe plus : le remettre — la mutation
  // évidente — fait tomber ce test.
  const compte = (trou) => (GABARIT.match(new RegExp("\\{\\{ " + trou + " \\}\\}", "g")) || []).length;
  assert.equal(compte("scanBandeauDetail"), 1,
    "le bandeau du haut porte l’instrument courant UNE fois — un de plus est un indicateur de trop");
  assert.equal(compte("barDroiteSous"), 1,
    "le pied d’acier porte l’instrument courant UNE fois — un de plus est un indicateur de trop");
  for (const mort of ["progression", "aProgression", "scanEnCoursTitre"]) {
    assert.equal(compte(mort), 0,
      `le cadre « Scan en cours » est revenu (trou {{ ${mort} }}) : il répétait le bandeau `
      + "et le pied sans commander quoi que ce soit. Sa seule information propre — la "
      + "phrase qui rassure sur l’arrêt — vit déjà sous Pause / Arrêter, dans le pied.");
  }
  // ————— L'ANGLE MORT, DÉCLARÉ (règle 9) : un TROISIÈME indicateur écrit avec un trou
  // NEUF échapperait à ce compte — on ne peut pas dériver « ce qui nomme l'instrument »
  // du gabarit sans exécuter un scan, et la garde de rendu ne scanne pas. Si un nouveau
  // trou de progression naît un jour, ajoutez-le ici, à un exemplaire maximum.
});

test("la phrase qui rassure vit à portée du geste qu'elle rassure", () => {
  // Elle était la seule information PROPRE du cadre disparu, et elle sert à un moment
  // précis : la main au-dessus d'« Arrêter le scan ». Elle vit donc dans le même bloc
  // que ce bouton — le sc-if barEnCours du pied — et nulle part ailleurs.
  const i = GABARIT.indexOf('id="barreScan"');
  assert.ok(i > 0, "le pied d’acier a disparu — réancrez cette garde");
  const pied = GABARIT.slice(i, borne(GABARIT, "</div>\n      </div>", i));
  const iArret = pied.indexOf("{{ arreterScan }}");
  const iPhrase = pied.indexOf("Les résultats déjà calculés sont gardés");
  assert.ok(iArret > 0, "le bouton d’arrêt a quitté le pied");
  assert.ok(iPhrase > 0,
    "la phrase « Les résultats déjà calculés sont gardés… » a quitté le pied : c’est la "
    + "seule chose que le cadre disparu portait seul, et elle rassure le geste d’arrêt — "
    + "elle vit sous les deux boutons, pas trois écrans plus bas");
  assert.ok(iPhrase > iArret && iPhrase - iArret < 900,
    "la phrase doit suivre le bouton d’arrêt dans le même bloc — à portée du geste");
  // et une seule fois dans tout le gabarit : deux copies divergent
  assert.equal((GABARIT.match(/Les résultats déjà calculés sont gardés/g) || []).length, 1,
    "la phrase existe en plusieurs exemplaires : deux copies divergent, et la divergence est muette");
  // ————— AUCUN MOT DE POSITION DEPUIS UN PIED COLLANT —————
  // « La carte ci-dessous » était vrai depuis le cadre, dans le flux ; depuis un pied
  // collant, « ci-dessous » ment selon l'endroit où l'on a défilé — même famille que
  // « hier » sur une fenêtre figée : un mot relatif à un point de vue qui bouge.
  const phrase = pied.slice(iPhrase, iPhrase + 220);
  assert.ok(!/ci-dessous|ci-dessus/.test(phrase),
    "la phrase du pied porte un mot de position : depuis une barre collante, il ment");
});

test("le compteur de progression n'emploie pas le mot réservé à l'étage suivant", () => {
  // ————— L'ENTONNOIR A UN MOT PAR ÉTAGE, ET IL DESCEND —————
  //
  //   3 556 800  COMBINAISONS  ce que la grille engendre (le récapitulatif le dit)
  //     712 800  BALAYÉES      ce que le scan a parcouru (scanTestes)
  //       1 076  MESURÉES      ce qui a produit une ligne (lignesScan)
  //           0  RETENUES      ce qui passe les contrôles
  //
  // Le pied d'acier disait « mesurées » pour l'étage BALAYÉES : le même mot que
  // l'en-tête, à un rapport de 1 à 660 — les nombres justes, le mot menteur. Cette
  // garde tient le producteur du compteur, dans ses trois états : remettre « mesurées »
  // dans le bloc sombre la fait tomber.
  const i = SOURCE.indexOf("barGrosSous: enCours");
  assert.ok(i > 0, "le sous-titre du compteur a disparu — réancrez cette garde");
  const bloc = SOURCE.slice(i, borne(SOURCE, "barADroite:", i));
  assert.ok(!/mesur/i.test(bloc),
    "le compteur de progression emploie « mesur… » : ce mot désigne l'étage SUIVANT de "
    + "l'entonnoir — les combinaisons qui ont produit une ligne — et l'en-tête le porte "
    + "déjà pour lui. Ici, l'étage s'appelle BALAYÉES (le champ s'appelle scanTestes).");
  for (const attendu of ["balayées sur", "balayées en", "combinaisons à balayer"]) {
    assert.ok(bloc.includes(attendu),
      `l'état du compteur ne dit plus « ${attendu} » : les trois états parlent le même étage`);
  }
});
