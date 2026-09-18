// STATUT · INSTRUMENTATION, AUCUNE CAUSE PRÉTENDUE. Rien n'est réparé ici : trois faits
// que l'application possédait déjà SÉPARÉMENT sont rendus lisibles ENSEMBLE, au moment
// où la promesse se fait. La corrélation qu'ils portent est RAPPORTÉE — neuf instruments,
// un seul courtier, un seul compte, mesures faites hors du dépôt.
//
// ————— LA QUESTION DU PRODUIT EST « CE ROBOT FERA-T-IL CE QUE CETTE LIGNE ANNONCE ? » —————
//
// Trois faits l'ont prédite sur neuf instruments rejoués, et les trois vivaient déjà dans
// l'application — chacun sur un écran différent, donc lisibles par personne ensemble :
//
//   bougies retirées par la fenêtre horaire   0 sur les six concordants · ~900 sur les deux divergents
//   durée du résultat                          6,5–6,6 ans quand ils concordent · 3,4 à 4,9 sinon
//   reprise fidèle                             INCOMPLÈTE sur les trois non comparables
//
// ————— ET « VALIDE » EST INTERDIT, PARCE QUE LA MESURE NE LE PORTE PAS —————
//
// C'est la règle du statut appliquée à un écran que voit un CLIENT. Ce qu'on a est une
// corrélation sur neuf instruments chez un courtier ; une phrase qui dirait « valide »
// promettrait une loi. La formule est « vérifié contre le testeur » ou « non vérifié »,
// et **l'énoncé porte son échantillon** — sans lui il redevient un verdict que rien ne
// soutient. Une ligne de statut fausse est pire que pas de ligne du tout, et cette
// règle-là ne change pas parce que le lecteur est un client plutôt qu'un développeur.
//
// ET LE MOT « SÉANCE » N'APPARAÎT PAS SUR LES ÉCARTÉES. Le brief qui a demandé cet écran
// écrivait « bougies hors séance » — c'est exactement la confusion que
// `fenetre-nest-pas-seance` interdit depuis qu'elle a disculpé à tort la règle de séance
// du moteur. Deux populations, deux mécanismes : celles-ci sont RETIRÉES de la série.
//
// ANGLE MORT DÉCLARÉ (règle 9), en tête : cette garde tient les MOTS et les trois états.
// Elle ne peut pas vérifier que la corrélation citée est encore vraie — elle vient de
// neuf rejeux hors dépôt, et si un dixième instrument la cassait, rien ici ne rougirait.
// C'est précisément pourquoi la phrase porte son échantillon plutôt qu'un verdict : le
// texte dit ce qu'il est, faute de pouvoir être gardé.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { borne } from "../lib/tranche.mjs";

const APP = readFileSync(new URL("../../Vena.dc.html", import.meta.url), "utf8");

// ————— ON LIT CE QUE LA PHRASE PRODUIT, PAS COMMENT ELLE EST COUPÉE —————
//
// Troisième occurrence de la même classe, et le seuil était écrit d'avance dans
// CLAUDE.md : « si le cas revient une troisième fois, la conclusion n'est pas un
// troisième `prettier-ignore` — c'est de concaténer les littéraux adjacents avant de
// lire ». `mentionLancement` et `SANS_COMPTE` l'avaient payé deux fois, et les deux fois
// ce qui restait invisible était LA PREUVE, qui vient après la promesse.
//
// Ici la phrase coupée était « … neuf instruments rejoués chez UN ' + 'courtier … » :
// l'échantillon lui-même, tranché en deux par la largeur du formateur. La prise cesse
// donc d'être « le texte tel qu'il est écrit » pour devenir « le texte tel qu'il est
// RENDU », et la façon dont il est coupé cesse d'exister pour la garde.
const recoller = (t) => t.replace(/'\s*\n?\s*\+\s*'/g, "");
const BLOC = APP.slice(borne(APP, "  reservesExport(v) {"),
  borne(APP, "  fenPlate(fen) {"));

test("les trois faits sont lus, chacun à sa source", () => {
  assert.match(BLOC, /this\.diag && this\.diag\[sym\]/,
    "les bougies retirées par la fenêtre horaire ne sont plus lues : c'est le seul des "
    + "trois faits qui sépare les six concordants des deux divergents sans exception.");
  assert.match(BLOC, /if \(!this\.cfgDeLigne\(v\)\)/,
    "la reprise n'est plus éprouvée. `cfgDeLigne` rendant null est déjà le critère dont "
    + "le Backtest tire `varianteRatee` — une ligne dans ce cas donne un robot bâti sur "
    + "des réglages qui ne sont pas ceux mesurés.");
  assert.match(BLOC, /mes < serie \* 0\.75/,
    "la durée de la mesure n'est plus comparée à celle de la série. Un robot lancé sur "
    + "toute la série ne rejoue alors pas la même période — et comparer deux périodes "
    + "différentes est ce qui a invalidé la moitié des tableaux de ce chantier.");
});

test("TROIS états, et « pas mesurable » ne s'écrit pas comme zéro", () => {
  assert.match(BLOC, /if \(!d\) \{/,
    "l'état « série non chargée » a disparu. Annoncer zéro bougie retirée sans avoir "
    + "regardé est une DISCULPATION qu'aucune mesure ne soutient — c'est la leçon de "
    + "`cachesDispo`, au même endroit du raisonnement.");
  assert.match(BLOC, /serait une disculpation/,
    "le troisième état ne dit plus pourquoi il existe.");
  // et le cas « rien à signaler » est le SILENCE, pas une phrase rassurante
  assert.match(BLOC, /const out = \[\];/,
    "les réserves ne sont plus une liste : une ligne sans rien à signaler doit rendre "
    + "VIDE, pas une phrase qui rassure sur ce qui n'a pas été vérifié.");
});

test("le mot « valide » est interdit, et l'énoncé porte son ÉCHANTILLON", () => {
  const i = borne(APP, "                  + 'Lisez la première ligne du journal du test.'");
  const aide = recoller(APP.slice(i, borne(APP, "          dragStart: (e) => {", i)));

  assert.ok(!/valid[ée]/i.test(aide) && !/valid[ée]/i.test(BLOC),
    "le mot « valide » est revenu dans ce que lit le client. Ce qu'on a est une "
    + "corrélation sur neuf instruments chez UN courtier — « valide » promet une loi. "
    + "La formule est « vérifié contre le testeur » ou « non vérifié ».");
  assert.match(aide, /VÉRIFIÉ CONTRE LE TESTEUR \? Non pour cette ligne\./,
    "la formule convenue a disparu. Elle dit ce qui a été fait et ce qui ne l'a pas "
    + "été ; un adjectif dirait ce que la ligne EST, ce que personne ne sait.");
  assert.match(aide, /neuf instruments rejoués chez UN courtier, sur UN compte/,
    "l'énoncé ne porte plus son échantillon. Sans lui il redevient un verdict : « le "
    + "testeur rend 7 à 11 points en moins » se lit comme une loi quand c'est une "
    + "corrélation sur neuf cas, un courtier, un compte.");
  // ————— ET LA PHRASE QUI NIE LE MOT NE PEUT PAS L'ÉPELER —————
  // Premier jet du produit : « ils ne valident rien ». La garde l'a refusé, et elle avait
  // raison — son interdit est ABSOLU et doit le rester, sans quoi il faudrait lui
  // apprendre à distinguer l'affirmation de la négation, puis le cas suivant. C'est le
  // motif de plus que la règle 3 refuse. Le texte a donc changé de MOT plutôt que la
  // garde d'exception : « ils n'attestent rien » dit la même chose sans l'épeler.
  // l'apostrophe vit en ÉCHAPPEMENT dans le source (`\\u2019`, six caractères) : un motif
  // qui porte le vrai caractère ne la trouve jamais. On s'ancre donc sur un fragment sans
  // apostrophe — c'est la même correction que dans `sorties-hors-seance`.
  assert.match(aide, /attestent rien/,
    "la phrase ne dit plus ce qu'elle N'EST PAS. « Ils indiquent où regarder » sans sa "
    + "négation laisse le lecteur conclure lui-même, et il conclura dans le sens qui "
    + "l'arrange. Elle ne peut pas non plus employer le mot interdit pour le nier — "
    + "l'interdit est absolu, c'est la formulation qui s'adapte.");
  assert.match(BLOC, /pas une règle\./,
    "le repère des 7 à 11 points ne porte plus sa réserve à l'endroit où il est écrit. "
    + "Une réserve placée ailleurs SUIT l'affirmation au lieu de la tempérer.");
});

test("« séance » ne revient pas sur les bougies retirées par la fenêtre", () => {
  assert.ok(!/s[ée]ance/i.test(BLOC),
    "le mot « séance » est revenu sur les bougies que la fenêtre horaire retire. Ce "
    + "n'est PAS la séance de négociation : `fenetreHomogene` retient l'intersection "
    + "des heures cotées toutes années confondues, et confondre les deux a déjà "
    + "disculpé à tort la règle de séance du moteur. Le brief qui a demandé cet écran "
    + "écrivait « hors séance » — c'est la formulation qu'il faut corriger, pas la "
    + "garde.");
  assert.match(BLOC, /RETIRÉES par la fenêtre horaire homogène/,
    "les bougies ne sont plus nommées par ce qui les sépare de l'autre population : "
    + "elles sont RETIRÉES de la série, quand celles de la règle de séance y sont "
    + "présentes et seulement sautées à l'évaluation.");
});
