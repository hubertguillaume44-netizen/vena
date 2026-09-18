// STATUT · CAUSE ÉTABLIE, MESURÉE DANS LE DÉPÔT — la cause est un FAIT DE SOURCE,
// relu ici.
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

// ————— LA RÈGLE DE NOYAU, PORTÉE ICI ET MESURÉE SUR DES CAS RÉELS —————
//
// Le refus comparait les chaînes BRUTES, et ce courtier écrit ses indices
// « #HongKong50 » là où la mesure porte « HongKong50 » : le refus tombait sur le MÊME
// instrument. La seule sortie était de cocher InpSymboleLibre — ce qui désarme la garde
// entièrement, et elle a laissé passer, le soir même, un robot HongKong50 sur les
// données d'un autre instrument. **Une garde qu'on doit désactiver pour travailler ne
// garde rien, et elle est pire que pas de garde : on la croit là.**
//
// Le port ci-dessous suit le MQL5 pas à pas. Il ne prouve pas que le robot compile ni
// qu'il exécute ce chemin — aucun harnais MQL5 ne tourne ici (angle mort déclaré plus
// bas) —, il prouve que la RÈGLE fait ce qu'on dit d'elle sur des cas nommés, dont les
// deux accidents réels. Le troisième test lie les deux : le source émis doit appeler
// la règle, sinon ce port mesurerait une règle que personne n'exécute.
const noyau = (x) => x.toUpperCase().replace(/[^0-9A-Z]/g, "");
function memeInstrument(a, b) {
  const na = noyau(a), nb = noyau(b);
  if (!na.length || !nb.length) return false;
  if (na === nb) return true;
  const court = na.length <= nb.length ? na : nb;
  const longe = na.length <= nb.length ? nb : na;
  return longe.slice(0, court.length) === court
      || longe.slice(longe.length - court.length) === court;
}

const CAS = [
  ["#HongKong50", "HongKong50", true,  "décoration de tête — le cas qui désarmait la garde"],
  ["SILVEREURO",  "HongKong50", false, "L'ACCIDENT : un robot HongKong50 sur SILVEREURO"],
  ["#Spain35",    "SILVEREURO", false, "l'accident de la veille, dans l'autre sens"],
  ["GOLD.r",      "GOLD",       true,  "suffixe de courtier"],
  ["EURUSD.pro",  "EURUSD",     true,  "suffixe de courtier"],
  ["FX_EURUSD",   "EURUSD",     true,  "préfixe alphanumérique de courtier"],
  ["US30cash",    "US30",       true,  "suffixe collé, sans séparateur"],
  ["US_30",       "US30",       true,  "séparateur au milieu du nom"],
  ["AUS200",      "US2000",     false, "deux indices réels que rien ne doit confondre"],
  ["XAUUSD",      "GOLD",       false, "même sous-jacent, noms sans rapport : refusé"],
  ["GOLDMINI",    "GOLD",       true,  "ANGLE MORT ASSUMÉ — accepté, et dit au journal"],
];

test("la règle de noyau accepte la décoration et refuse un autre instrument", () => {
  for (const [a, b, attendu, note] of CAS) {
    assert.equal(memeInstrument(a, b), attendu,
      `« ${a} » contre « ${b} » : attendu ${attendu}, ${note}. La règle est : capitales, `
      + "tout caractère non alphanumérique retiré, puis l'un des deux noms doit être "
      + "PRÉFIXE ou SUFFIXE de l'autre. Elle n'a aucune liste de courtiers ni de "
      + "préfixes connus, et c'est ce qui la rend tenable.");
  }
});

test("le source émis appelle la règle plutôt que de comparer les chaînes brutes", () => {
  // sans cet ancrage, le port ci-dessus mesurerait une règle que le robot n'exécute pas
  assert.match(SRC, /if\(MemeInstrument\(_Symbol, "GOLD"\)\)/,
    "le robot ne consulte plus la règle de noyau : un « #GOLD » redeviendrait un refus, "
    + "l'utilisateur rebasculerait InpSymboleLibre, et la garde serait désarmée comme "
    + "elle l'a déjà été.");
  assert.match(SRC, /string sortie = "";[\s\S]{0,260}?if\(EstAlnum\(c\)\) sortie \+= ShortToString\(c\);/,
    "NoyauSymbole ne retire plus les caractères non alphanumériques : le « # » des "
    + "indices reviendrait dans la comparaison.");
  assert.match(SRC, /if\(StringSubstr\(longe, 0, c\) == court\) return true;/,
    "la relation de PRÉFIXE a disparu : « GOLD.r » cesserait d'être reconnu.");
  assert.match(SRC, /if\(StringSubstr\(longe, l - c, c\) == court\) return true;/,
    "la relation de SUFFIXE a disparu : « FX_EURUSD » cesserait d'être reconnu.");
});

test("le seul cas légitime garde une porte, et elle demande un geste", () => {
  assert.match(SRC, /input bool InpSymboleLibre = false;/,
    "l'entrée qui autorise un autre symbole a disparu, ou son défaut n'est plus "
    + "`false`. Un même instrument porte des noms différents selon le courtier "
    + "(« GOLD » / « GOLD.r ») : sans cette porte, le refus casse un usage réel. "
    + "Avec un défaut à `true`, il ne ferme plus rien.");
  // La porte ouverte NE DOIT PAS rendre le robot muet : les chiffres restent ceux
  // d'une autre mesure, et c'est la seule chose que le journal puisse encore dire.
  const branche = SRC.slice(borne(SRC, "if(MemeInstrument(_Symbol,"), borne(SRC, "if(Period() != PERIOD_H1)"));
  assert.match(branche, /ATTENTION : ce robot a été mesuré sur GOLD/,
    "la branche autorisée ne prévient plus. Un geste explicite lève le refus, il "
    + "ne rend pas la mesure exacte pour autant.");
  assert.match(branche, /noyaux DIFFÉRENTS/,
    "la branche autorisée ne dit plus que les NOYAUX diffèrent. Depuis la règle de "
    + "noyau, InpSymboleLibre ne sert plus qu'aux cas qu'elle a refusés — c'est-à-dire "
    + "aux vrais changements d'instrument, et c'est cela qu'il faut écrire.");
});
