// STATUT · CAUSE ÉTABLIE — panne RAPPORTÉE, cause relue DANS LE DÉPÔT. Observée chez
// l'utilisateur sur `260917.15` (ligne Dow Jones 30 rouverte, résultat affiché
// +38,3 R · 142 trades, « Sauvegarder ce résultat » grisé quand même).
//
// ————— ANGLE MORT, EN TÊTE (règle 9) —————
// Cette garde lit le SOURCE. Elle prouve qu'il n'existe qu'une signature et que tous
// ses lecteurs la lisent ; elle ne prouve pas que le bouton s'active dans un
// navigateur. C'est exactement pourquoi la panne a vécu : tous les tests passaient. Ce
// qui la complète est `panneau-mesure-ce-quil-affiche`, qui recompte au rendu.
//
// ————— TROIS AFFIRMATIONS QUI NE POUVAIENT PAS ÊTRE VRAIES ENSEMBLE —————
//
// Sur le même écran, après une mesure RÉUSSIE : « Sauvegarder ce résultat » grisé, le
// bandeau qui demandait de mesurer avant de sauvegarder, et l'en-tête qui affirmait que
// tout était à jour. Trois lecteurs, deux valeurs, aucun accord possible.
//
// La cause n'était pas « une comparaison dont un seul côté avance » — c'était pire :
// les deux côtés lisaient DEUX CONFIGURATIONS DIFFÉRENTES. La mesure enregistrait la
// signature de la configuration de la LIGNE rouverte ; le prédicat comparait à celle du
// PANNEAU. Sur une ligne dont les filtres ne se reconstituent pas — la « Reprise
// INCOMPLÈTE » que le bandeau annonce déjà — le bouton restait grisé pour toujours,
// quel que soit le nombre de mesures. Trois semaines de comparaisons MT5 bloquées là.
//
// ————— ET LA PREMIÈRE CORRECTION A FERMÉ LE DÉSACCORD SANS FERMER LE DÉFAUT —————
//
// Elle a fait converger les quatre lecteurs sur UNE signature intermédiaire. Le bouton
// s'est rallumé, et le panneau continuait d'afficher les chiffres d'une configuration
// qu'il ne montrait pas : cette valeur unique était celle de la LIGNE.
//
// > Faire converger deux dérivées sur une valeur ferme un désaccord. Ça ne dit rien
// > sur le fait que la valeur soit la BONNE.
//
// La sortie n'était pas d'aligner les lecteurs, c'était qu'il n'y ait plus deux
// configurations à départager : le panneau mesure ses réglages, toujours, donc il n'y a
// plus qu'une signature et c'est celle du panneau. Cette garde a donc CHANGÉ D'ANCRE —
// son invariant (une valeur, tous les lecteurs) n'a pas bougé, sa prise est désormais
// `sigCourante`, et le compte des lecteurs reste ce qui la tient.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { borne } from "../lib/tranche.mjs";

const APP = readFileSync(new URL("../../Vuna.dc.html", import.meta.url), "utf8");

test("le prédicat de « Sauvegarder » lit la signature des RÉGLAGES AFFICHÉS", () => {
  assert.match(APP, /perime\(\) \{ return !this\.state\.res \|\| this\.state\.signature !== this\.sigCourante\(\); \}/,
    "`perime()` ne lit plus la signature du panneau. Toute autre valeur rouvre le "
    + "défaut : un résultat enregistré sous une configuration et comparé à une autre ne "
    + "peuvent jamais coïncider, et « Sauvegarder ce résultat » reste grisé après une "
    + "mesure réussie.");
});

test("la mesure ENREGISTRE la même valeur que celle qu'on lui comparera", () => {
  assert.match(APP, /const sig = this\.sigCourante\(\);/,
    "la mesure n'enregistre plus la signature du panneau. Enregistrer une expression et "
    + "en comparer une autre est le défaut même : deux dérivées d'une seule question.");
});

test("les QUATRE lecteurs lisent la même valeur — aucun n'est oublié", () => {
  // ————— LE COMPTE EST LA GARDE —————
  // Trois lecteurs alignés sur quatre laissent la panne entière, sous une autre forme :
  // le quatrième relançait le calcul en boucle. On compte donc, plutôt que de vérifier
  // les trois qu'on a en tête.
  const lecteurs = (APP.match(/this\.sigCourante\(\)/g) || []).length;
  assert.equal(lecteurs, 4,
    `${lecteurs} lecteurs de la signature du panneau au lieu de 4. Les quatre sont : le `
    + "raccourci de `lancerTest` (« rien n'a changé, ne recalcule pas »), "
    + "l'enregistrement du résultat, `perime()`, et la relance différée après un rendu "
    + "survenu pendant le calcul. Un lecteur de plus qui lirait autre chose rouvre le "
    + "désaccord ; un lecteur de moins veut dire qu'on en a retiré un sans le dire.");
});

test("aucune seconde signature ne renaît d'une configuration de ligne", () => {
  // ————— L'ANCRAGE SUR L'ABSENCE (règle 14, troisième issue) —————
  // La forme intermédiaire dérivait la signature de `cfgLigne` quand il y en avait une.
  // Elle est partie avec le panneau qui mesurait la ligne ; c'est sa RÉINTRODUCTION qui
  // est le risque, puisque la doctrine reste écrite au-dessus.
  assert.ok(!/signature\(\s*(this\.state\.)?cfgLigne/.test(APP),
    "une signature se dérive de nouveau de `cfgLigne`. C'est la forme intermédiaire : "
    + "elle ferme le désaccord entre lecteurs et laisse le panneau afficher les "
    + "chiffres d'une configuration qu'il ne montre pas.");
  const bloc = APP.slice(borne(APP, "  async testerUneFois() {"), borne(APP, "    const res = this.M.resume(trades);"));
  assert.match(bloc, /const trades = this\.mesurer\(this\.state\.btSym, cfg, this\.state\.ut, df\);/,
    "la mesure ne porte plus sur `cfg` — la configuration COURANTE du panneau. Si elle "
    + "retombe sur `cfgLigne`, l'écran affiche un chiffre que ses réglages ne "
    + "produisent pas : mesuré à 42 trades / +15,7 R affichés contre 37 / −11,5 R "
    + "produits par le panneau, le signe opposé.");
});

test("toucher un réglage sort du mode ligne — sinon la reprise mentirait", () => {
  // `cfgLigne` ne pilote plus la mesure ; il reste le JUGE de la fidélité de la reprise
  // (`repriseEcart`, `ecartLigne`). Le garder après un réglage touché ferait comparer le
  // panneau à une ligne qu'il ne prétend plus rejouer, et le bandeau crierait à tort —
  // une garde qui crie à tort n'est plus lue quand elle a raison (règle 16).
  const bloc = APP.slice(borne(APP, "  maj(patch) {"), borne(APP, "  sigCourante() {"));
  assert.match(bloc, /cfgLigne: null, ligneAttendue: null/,
    "`maj()` ne remet plus `cfgLigne` à null : le panneau continuerait de se comparer à "
    + "une ligne dont il ne porte plus les réglages.");
});
