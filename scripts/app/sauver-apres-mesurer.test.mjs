// STATUT · CAUSE ÉTABLIE, MESURÉE — la panne a été observée chez l'utilisateur sur
// `260917.15` (ligne Dow Jones 30 rouverte, « Mesurer » cliqué, résultat affiché
// +38,3 R · 142 trades) et sa cause est relue ici dans le source.
//
// ————— TROIS AFFIRMATIONS QUI NE POUVAIENT PAS ÊTRE VRAIES ENSEMBLE —————
//
// Sur le même écran, après une mesure RÉUSSIE : « Sauvegarder ce résultat » grisé, le
// bandeau « réglages modifiés — mesurez avant de sauvegarder », et l'en-tête « tout est
// à jour ». Trois lecteurs, deux valeurs, aucun accord possible.
//
// La cause n'était pas « une comparaison dont un seul côté avance » — c'était pire :
// les deux côtés lisaient DEUX CONFIGURATIONS DIFFÉRENTES.
//
//   lancerTest   enregistrait  signature(cfgLigne || cfg)   ← la ligne rouverte
//   perime()     comparait à   sigCourante()                ← le panneau, seulement
//
// Et le cas n'est pas rare : une ligne dont les filtres ne se reconstituent pas depuis
// le panneau CONSERVE `cfgLigne` — c'est la « Reprise INCOMPLÈTE » que le bandeau
// annonce déjà. Sur ces lignes, le bouton restait grisé pour toujours, quel que soit le
// nombre de mesures. Trois semaines de comparaisons MT5 bloquées là : les valeurs
// remesurées ne pouvaient pas être enregistrées.
//
// ————— LA FORME : UNE VALEUR, PAS DEUX DÉRIVÉES —————
//
// `sigAMesurer()` est la signature de ce que le prochain « Mesurer » calculera. QUATRE
// lecteurs la lisent, et c'est le nombre qui compte : le raccourci de `lancerTest`,
// l'enregistrement du résultat, `perime()`, et la relance différée. Le quatrième avait
// été oublié d'un premier jet — il lisait encore `sigCourante()`, ce qui relançait le
// calcul en boucle sur une ligne incomplète.
//
// ANGLE MORT DÉCLARÉ (règle 9) : cette garde lit le SOURCE, pas l'écran. Elle prouve que
// les quatre lecteurs lisent la même expression ; elle ne prouve pas que le bouton
// s'active dans un navigateur. Le banc de rendu part d'un navigateur neuf, sans ligne de
// portefeuille rouverte, donc il n'exerce pas ce chemin — c'est exactement pourquoi la
// panne a vécu : tous les tests passaient.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { borne } from "../lib/tranche.mjs";

const APP = readFileSync(new URL("../../Vena.dc.html", import.meta.url), "utf8");

test("le prédicat du bouton lit la signature de ce qui sera MESURÉ", () => {
  assert.match(APP, /perime\(\) \{ return !this\.state\.res \|\| this\.state\.signature !== this\.sigAMesurer\(\); \}/,
    "`perime()` ne lit plus `sigAMesurer()`. S'il retombe sur `sigCourante()`, il "
    + "compare le panneau à un résultat mesuré sur la configuration d'une ligne "
    + "rouverte : les deux ne peuvent plus jamais coïncider, et « Sauvegarder ce "
    + "résultat » reste grisé après une mesure réussie.");
});

test("la mesure ENREGISTRE la même valeur que celle qu'on lui comparera", () => {
  assert.match(APP, /const sig = this\.sigAMesurer\(\);/,
    "la mesure n'enregistre plus `sigAMesurer()`. Enregistrer une expression et en "
    + "comparer une autre est le défaut même : deux dérivées d'une seule question.");
});

test("les QUATRE lecteurs lisent la même valeur — aucun n'est oublié", () => {
  // ————— LE COMPTE EST LA GARDE —————
  // Trois lecteurs alignés sur quatre laissent la panne entière, sous une autre forme :
  // le quatrième relançait le calcul en boucle. On compte donc, plutôt que de vérifier
  // les trois qu'on a en tête.
  const lecteurs = (APP.match(/this\.sigAMesurer\(\)/g) || []).length;
  assert.equal(lecteurs, 4,
    `${lecteurs} lecteurs de \`sigAMesurer()\` au lieu de 4. Les quatre sont : le `
    + "raccourci de `lancerTest` (« rien n'a changé, ne recalcule pas »), "
    + "l'enregistrement du résultat, `perime()`, et la relance différée après un rendu "
    + "survenu pendant le calcul. Un lecteur de plus qui ne lit pas cette valeur rouvre "
    + "le désaccord ; un lecteur de moins veut dire qu'on en a retiré un sans le dire.");

  // et plus personne ne compare directement `sigCourante()` à la signature enregistrée
  const bloc = APP.slice(borne(APP, "  async lancerTest("), borne(APP, "  sigCourante() {"));
  assert.ok(!/sigCourante\(\) !== this\.state\.signature|this\.state\.signature === this\.sigCourante\(\)/.test(bloc),
    "une comparaison directe entre `sigCourante()` et la signature enregistrée est "
    + "revenue. C'est la forme exacte du défaut : le panneau d'un côté, la ligne "
    + "rouverte de l'autre.");
});

test("sigAMesurer rend la configuration de la LIGNE quand il y en a une", () => {
  const bloc = APP.slice(borne(APP, "  sigAMesurer() {"), borne(APP, "  perime() {"));
  assert.match(bloc, /const c = this\.state\.cfgLigne;/,
    "`sigAMesurer()` ne consulte plus `cfgLigne` : il redeviendrait `sigCourante()`, et "
    + "le résultat d'une ligne rouverte porterait une signature que personne ne "
    + "recalcule pareil.");
  assert.match(bloc, /if \(!c\) return this\.sigCourante\(\);/,
    "sans ligne rouverte, la signature doit rester celle du panneau — sinon toucher un "
    + "réglage ne relancerait plus rien.");
  // mémoïsée sur l'IDENTITÉ de l'objet : sérialiser à chaque rendu était le coût que la
  // mémo de `sigCourante` avait été écrite pour éviter
  assert.match(bloc, /if \(this\._sigL && this\._sigL\.cfg === c\) return this\._sigL\.val;/,
    "la mémoïsation par identité d'objet a disparu : `perime()` est lu à CHAQUE rendu, "
    + "et il sérialiserait la configuration entière à chaque fois.");
});

test("toucher un réglage sort du mode ligne — sinon le panneau serait décoratif", () => {
  // Sans ce nettoyage, `sigAMesurer()` rendrait toujours la signature de la ligne, et
  // modifier un réglage ne changerait plus rien : le pire des deux mondes, un panneau
  // qui ne pilote plus la mesure qu'il affiche.
  const bloc = APP.slice(borne(APP, "  maj(patch) {"), borne(APP, "  sigCourante() {"));
  assert.match(bloc, /cfgLigne: null, ligneAttendue: null/,
    "`maj()` ne remet plus `cfgLigne` à null : la signature resterait celle de la ligne "
    + "rouverte quoi qu'on règle, et le résultat cesserait de décrire l'écran.");
});
