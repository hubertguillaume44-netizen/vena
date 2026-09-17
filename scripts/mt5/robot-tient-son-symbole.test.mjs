// STATUT · CAUSE ÉTABLIE, MESURÉE — la cause est un FAIT DE SOURCE, relu ici.
//
// `nomRobot` (robot-mt5.js) compose le nom du fichier avec `cfg.sym` : un fichier
// nommé « Vena_<compte>_Spain35_… » ne peut avoir été émis que par un export de
// Spain35. Le testeur a pourtant rendu des chiffres sous ce nom sur un graphique
// d'un autre instrument, et rien à l'écran ne le disait — le robot trade `_Symbol`,
// pas le symbole mesuré.
//
// Ce qu'il émettait alors : `Print("ATTENTION : ce robot a été mesuré sur X, il
// tourne sur ", _Symbol)`, puis `return(INIT_SUCCEEDED)`. Une ligne parmi dix au
// démarrage, dans un journal que personne ne relit quand les chiffres s'affichent.
//
// LA CLASSE, et c'est elle qu'on ferme : un robot ne rend jamais de chiffres qui
// RESSEMBLENT à la mesure d'un instrument sans en être une. L'avertissement devient
// un refus, avec une porte explicite pour le seul cas légitime — le même instrument
// sous un autre nom chez le courtier (« GOLD » contre « GOLD.r »). Un accident ne
// peut plus se produire sans un geste ; un choix reste possible en un clic.
//
// Ancré sur ce qui AGIT (règle 3, critère d'ancrage) : la comparaison, le refus et
// la déclaration de l'entrée — jamais sur le texte du message, qu'une reformulation
// défait et qu'un commentaire imite.
import { test } from "node:test";
import assert from "node:assert/strict";
import { robotEmis } from "./sources-mql5.mjs";
import { borne } from "../lib/tranche.mjs";

const SRC = robotEmis({ cfg: { sym: "GOLD" } });

test("un robot posé sur un autre instrument REFUSE de démarrer", () => {
  assert.match(SRC, /StringCompare\(_Symbol, "GOLD", false\) != 0/,
    "le robot ne compare plus le symbole du graphique à celui sur lequel il a été "
    + "mesuré : il ne peut plus savoir qu'il tourne ailleurs.");
  assert.match(SRC, /if\(!InpSymboleLibre\)\s*\{[\s\S]{0,900}?return\(INIT_FAILED\);/,
    "la divergence de symbole n'aboutit plus à un INIT_FAILED. Un Print ne suffit "
    + "pas : le test tourne quand même et rend des chiffres qui ont l'air d'une "
    + "mesure de l'instrument affiché. C'est le pire mode de panne du dépôt — une "
    + "mesure fausse qui a la forme d'une mesure — et il est ici gratuit à fermer.");
});

test("le seul cas légitime garde une porte, et elle demande un geste", () => {
  assert.match(SRC, /input bool InpSymboleLibre = false;/,
    "l'entrée qui autorise un autre symbole a disparu, ou son défaut n'est plus "
    + "`false`. Un même instrument porte des noms différents selon le courtier "
    + "(« GOLD » / « GOLD.r ») : sans cette porte, le refus casse un usage réel. "
    + "Avec un défaut à `true`, il ne ferme plus rien.");
  // La porte ouverte NE DOIT PAS rendre le robot muet : les chiffres restent ceux
  // d'une autre mesure, et c'est la seule chose que le journal puisse encore dire.
  const branche = SRC.slice(borne(SRC, "if(!InpSymboleLibre)"), borne(SRC, "if(Period() != PERIOD_H1)"));
  assert.match(branche, /ATTENTION : ce robot a été mesuré sur GOLD/,
    "la branche autorisée ne prévient plus. Un geste explicite lève le refus, il "
    + "ne rend pas la mesure exacte pour autant.");
});
