// ————— UN GESTE QUI RÉPOND DANS UNE AUTRE PIÈCE EST UN GESTE MUET —————
//
// « Exporter » (robot) ne produisait rien, et les deux causes plausibles étaient
// fausses : il n'y a aucun `si déjà exporté → return` dans `exporterRobot`, et sa
// libération d'URL est un `setTimeout(…, 2000)` comme les neuf autres du fichier —
// vérifié, aucun `revokeObjectURL` synchrone n'y subsiste.
//
// LA CAUSE ÉTAIT UN COMPLÉMENT EXACT, et c'est ce qui la rend instructive :
//
//   | vue                            | `hasardMsg` lisible | boutons d'export de robot |
//   | Mes décisions › Portefeuille   | NON                 | 3                         |
//   | Mes scans › Historique         | oui                 | 0                         |
//
// Les trois refus de `exporterRobot` — générateur inchargeable, filtre sans
// équivalent MQL5, générateur qui jette — PARLENT tous les trois : ils posent
// `hasardMsg`. Cette phrase n'avait de surface que sous `vueHistorique`, et les
// trois boutons qui la déclenchent vivent sous `vuePortefeuille`. Le geste
// répondait dans une pièce vide.
//
// C'EST « MESSAGE SANS SURFACE » À SA FORME LA PLUS TROMPEUSE. Les instances
// précédentes n'écrivaient RIEN — une garde qui lit l'état les attrape. Celle-ci
// écrit, et une garde qui lit l'état la trouverait parfaitement posée : seul le
// RENDU, sur LA BONNE VUE, distingue les deux. C'est la règle 11 avec une
// coordonnée de plus — non plus « la valeur arrive-t-elle », mais « arrive-t-elle
// LÀ OÙ le geste a été fait ».
//
// ANGLE MORT DÉCLARÉ (règle 9) : cette garde tient LE cas mesuré, pas la classe.
// La forme générale — « tout état de message a une surface sur chaque vue depuis
// laquelle il peut être posé » — demanderait de relier chaque `setState({ xMsg })`
// à la vue de son appelant, ce qu'aucune lecture de source ne donne : l'appelant
// est un producteur, et sa vue est décidée par le `sc-if` qui l'englobe à des
// milliers de lignes de là. Le jour où cette liaison existe, c'est elle qui
// remplace ce fichier. En attendant, la tournée des gestes est ce qui couvre la
// classe — à condition qu'elle ATTEIGNE les boutons, ce que le second test tient.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const APP = readFileSync(new URL("../../Vena.dc.html", import.meta.url), "utf8");
const SEMIS = readFileSync(new URL("./lib/semis.mjs", import.meta.url), "utf8");

test("le message de l'export de robot est rendu sur la vue où le geste se fait", () => {
  // les trois refus posent bien une phrase — sinon le geste serait muet à la source
  for (const refus of [
    "hasardMsg: 'Le générateur de robot n\\u2019a pas pu être chargé : '",
    "hasardMsg: 'Robot non exporté pour ' + this.nomComplet(v.sym)",
  ]) {
    assert.ok(APP.includes(refus),
      "un refus de `exporterRobot` ne pose plus de phrase : il redevient un `return "
      + "false` nu, et là aucune surface ne peut le rattraper — « " + refus.slice(0, 48) + " »");
  }
  // ET LA PHRASE A UNE SURFACE LÀ OÙ LES BOUTONS SONT.
  const n = APP.split('<sc-if value="{{ aHasardMsg }}" hint-placeholder-val="{{ false }}">').length - 1;
  assert.equal(n, 2,
    "`hasardMsg` n'a plus DEUX surfaces (" + n + " trouvée(s)) : les boutons d'export de "
    + "robot vivent sous `vuePortefeuille`, et la seule surface historique était sous "
    + "`vueHistorique`. Un refus s'affichait sur la page où il n'y a aucun bouton pour "
    + "le provoquer, et nulle part sur celle où il y en a trois.");
  assert.ok(APP.includes('<span style="flex-basis:100%;font-size:11.5px;line-height:1.5;color:var(--color-bg)">{{ hasardMsg }}</span>'),
    "la surface posée sur le Portefeuille a disparu ou changé de forme : le geste "
    + "recommence à répondre dans une pièce vide");
  // UN producteur, DEUX surfaces — jamais deux états
  assert.equal(APP.split("aHasardMsg: !!s.hasardMsg").length - 1, 1,
    "le message a maintenant deux producteurs : deux états pour une phrase finissent "
    + "par diverger, et c'est la panne que « un producteur, deux surfaces » évite");
});

test("le semis pose un portefeuille QUI PORTE des lignes — sinon la tournée ne voit rien", () => {
  // ————— LA RÈGLE 10 DANS L'OUTILLAGE QUI EXISTE POUR LA FERMER —————
  // Le semis créait `{ nom: 'Portefeuille principal', syms: [] }`. `pfSections` rend
  // `null` pour un portefeuille sans ligne : la section entière disparaît, et avec
  // elle « Exporter » (un par ligne) et « Exporter les robots ». La tournée passait
  // sur cette vue sans jamais voir ces boutons — verte parce qu'ils n'existaient
  // pas, pas parce qu'ils répondaient.
  assert.ok(SEMIS.includes("pfs: [{ nom: 'Portefeuille principal', syms: S }] });"),
    "le semis repose un portefeuille VIDE : `pfSections` rend null pour un "
    + "portefeuille sans ligne, la section entière disparaît, et les trois boutons "
    + "d'export de robot sortent de la tournée sans que rien ne le dise");
  assert.ok(SEMIS.includes("const absents = S.filter((sym) => !suivis.includes(sym));"),
    "le semis ne relit plus son portefeuille par le chemin du produit : il "
    + "rapporterait « 3 décisions » sur une vue dont la moitié des gestes n'est pas "
    + "rendue — le compte juste et le contenu muet, ce que ce module existe pour interdire");
  // et le produit garde bien la sortie anticipée que le semis contournait : c'est ELLE
  // qui faisait disparaître la section, et elle est légitime
  assert.ok(APP.includes("            if (!lignes.length) return null;"),
    "`pfSections` ne sort plus sur un portefeuille vide : un portefeuille sans ligne "
    + "afficherait une section creuse avec ses boutons d'export sur rien");
});

test("les pastilles de placement du portefeuille ont un texte ET un geste", () => {
  // ————— DEUX TROUS SUR LA MÊME RANGÉE, ET UN SEUL A ROUGI —————
  // Le gabarit lisait `cb3.ab` et `cb3.basculer` ; le producteur émettait `nom` et
  // `placer`. La pastille se rendait VIDE et INERTE — depuis toujours, chez tout
  // utilisateur ayant un portefeuille. Le runtime ne signale que le trou de TEXTE :
  // un `onClick` qui ne résout pas ne se plaint pas, il ne branche rien.
  //
  // Et il ne s'est montré qu'au premier portefeuille PEUPLÉ du banc : un tbody sans
  // rangée n'a aucun trou à résoudre. C'est la règle 10 qui l'a rendu visible, et la
  // garde de rendu qui l'a nommé.
  assert.ok(APP.includes('onClick="{{ cb3.basculer }}">{{ cb3.nom }}</button>'),
    "la pastille de placement relit un nom que le producteur n'émet pas : elle se "
    + "rend vide, ou sans geste, et le défaut ne se voit QUE sur un portefeuille "
    + "peuplé — c'est-à-dire chez l'utilisateur, jamais sur un banc à vide");
  assert.ok(APP.includes("              basculer: (e) => {"),
    "le geste de la pastille a repris un nom que le gabarit ne lit pas. Et `basculer` "
    + "est le mot juste : le clic RETIRE aussi, ce que l'infobulle dit déjà — "
    + "`placer` en décrivait la moitié");
  assert.ok(!APP.includes("{{ cb3.ab }}"),
    "`cb3.ab` est de retour dans le gabarit : aucun producteur ne l'émet");
});
