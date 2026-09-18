// STATUT · CAUSE ÉTABLIE, MESURÉE — le compte vient de l'utilisateur, sur `260918` :
// DOUZE lignes sur douze portaient un chiffre antérieur à la règle actuelle du moteur.
// Ce n'est pas un cas limite, c'est l'état du portefeuille entier.
//
// ————— TROIS AFFIRMATIONS DANS UN ÉCRAN, ET UN SEUL GESTE OFFERT —————
//
// L'en-tête disait « tout est à jour », le bloc « tout est rangé », et le compte à côté
// « 12 lignes sur 12 périmées ». Le sélecteur, lui, proposait « Rien à ranger ». Le seul
// geste réellement possible était d'ouvrir douze Backtests un par un.
//
// Et le total de la page — « + 31,5 R / an » — sommait douze chiffres morts. **Une somme
// est plus trompeuse que chacune de ses parts** : une ligne périmée se repère en
// l'ouvrant, personne ne rouvre douze lignes pour douter d'un total.
//
// ————— CE QUI EST POSÉ, ET POURQUOI SOUS CETTE FORME —————
//
//  · `remesurerLignes()` rejoue chaque ligne périmée et écrit le résultat. MÊME boucle
//    que `completerCor` : pause sur `exportEnCours` au grain de l'instrument, arrêt
//    demandable, bougies libérées par instrument. Deux boucles divergeraient.
//  · Les chiffres écrits viennent de `resume` et `segments` — les fonctions que le
//    Backtest appelle, pas une seconde dérivation.
//  · L'écriture se fait PAR LIGNE : un arrêt au milieu garde ce qui a été remesuré.
//  · La péremption devient une TÂCHE de la barre d'état, et passe DEVANT les autres.
//    C'est ce qui rend « tout est à jour » faux — la barre le dit quand il n'y a pas de
//    tâche, donc la rendre vraie c'est en poser une. Un second drapeau aurait été un
//    second état à tenir d'accord.
//
// ————— ET ELLE REFUSE PLUTÔT QUE D'ÉCRIRE UN CHIFFRE PLAUSIBLE —————
//
// `cfgDeLigne` rend `null` quand la variante n'est pas retrouvée — c'est déjà le critère
// dont le Backtest tire `varianteRatee`. Remesurer une telle ligne écrirait les chiffres
// d'une AUTRE configuration sous son intitulé : **pire que périmé**, parce qu'un chiffre
// périmé se détecte et celui-là non. Ces lignes restent intactes et sont NOMMÉES.
//
// ANGLE MORT DÉCLARÉ (règle 9) : cette garde lit le source. Elle prouve que la boucle a
// la bonne forme et que le refus existe ; elle ne prouve pas qu'un navigateur remesure
// douze lignes. Le banc de rendu part d'un profil neuf, sans ligne validée — il
// n'exerce pas ce chemin, et c'est pour cette raison que la contradiction a vécu.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { borne } from "../lib/tranche.mjs";

const APP = readFileSync(new URL("../../Vena.dc.html", import.meta.url), "utf8");
const BOUCLE = APP.slice(borne(APP, "  async remesurerLignes() {"),
  borne(APP, "\n  // Pousser vaut pour TOUTE la page"));

test("la remesure emprunte la MÊME discipline de fond que le complètement", () => {
  assert.match(BOUCLE, /while \(this\.state\.exportEnCours && !this\._remStop\)/,
    "la remesure ne se met plus en pause pendant un export. Une sauvegarde qui échoue "
    + "parce qu'un calcul de confort tournait est le pire compromis possible — et c'est "
    + "déjà écrit dans `completerCor`, qu'il s'agit de suivre, pas de réinventer.");
  assert.match(BOUCLE, /if \(this\._remStop \|\| this\.state\.scanEnCours\) break;/,
    "la boucle ne s'arrête plus sur demande, ou ne cède plus le pas à un scan.");
  assert.match(BOUCLE, /if \(!dejaCharge && this\.dfs && !estExemple\(sym\)\) delete this\.dfs\[sym\];/,
    "les bougies ne se libèrent plus par instrument : le cache du fil principal "
    + "croîtrait de façon monotone sur les douze lignes — c'est la panne mesurée sur "
    + "l'arriéré de 56 instruments.");
});

test("une ligne dont la configuration n'est pas retrouvée est LAISSÉE INTACTE et nommée", () => {
  assert.match(BOUCLE, /const cfg = this\.cfgDeLigne\(v\);\s*\n\s*if \(!cfg\) \{ refusees\.push/,
    "la remesure ne vérifie plus que la configuration de la ligne est retrouvée. "
    + "`cfgDeLigne` rend null quand la variante manque : mesurer quand même écrirait les "
    + "chiffres d'une AUTRE configuration sous l'intitulé de celle-ci. Périmé se "
    + "détecte ; faux sous un nom juste, non.");
  assert.match(BOUCLE, /refusees\.length/,
    "le bilan ne compte plus les lignes refusées : un geste de fond qui n'annonce que "
    + "ses réussites laisse croire qu'il a tout couvert.");
  assert.match(BOUCLE, /refusees\.join\(', '\)/,
    "les lignes laissées intactes ne sont plus NOMMÉES. « deux lignes refusées » "
    + "n'indique pas lesquelles rouvrir.");
});

test("les chiffres écrits viennent des fonctions du moteur, pas d'une seconde dérivation", () => {
  assert.match(BOUCLE, /const r = this\.M\.resume\(trades\);/,
    "la remesure ne dérive plus ses chiffres de `resume` : une seconde dérivation "
    + "divergerait du Backtest, et les deux écrans afficheraient deux vérités.");
  assert.match(BOUCLE, /const seg = this\.M\.segments\(trades, 5\);/,
    "les segments ne viennent plus de `segments`.");
  assert.match(BOUCLE, /_mv: this\.MOTEUR_V/,
    "la ligne remesurée ne reçoit plus l'estampille du moteur : elle resterait marquée "
    + "périmée après avoir été remesurée, et le compte ne descendrait jamais.");
  // par ligne, pas à la fin
  assert.match(BOUCLE, /this\.setState\(\{ valides: suite \},\s*\n\s*\(\) => this\.ecrirePf\(/,
    "l'écriture ne se fait plus ligne par ligne : un arrêt au milieu perdrait tout le "
    + "travail déjà fait, alors que chaque ligne remesurée vaut par elle-même.");
});

test("la péremption est une TÂCHE de la barre, et elle passe devant", () => {
  // ————— C'EST CE QUI REND « TOUT EST À JOUR » FAUX, SANS SECOND DRAPEAU —————
  const chaine = APP.slice(borne(APP, "        let tache = null;"),
    borne(APP, "barreEtat: nomCompte"));
  const iPerim = chaine.indexOf("if (nPerim) {");
  const iAutre = chaine.indexOf("} else if (!((this.baremes || {})[this.compteActif])) {");
  assert.ok(iPerim >= 0,
    "la barre d'état ne porte plus de tâche pour les lignes périmées : elle "
    + "réafficherait « tout est à jour » à côté d'un compte de douze périmées.");
  assert.ok(iAutre > iPerim,
    "la tâche de péremption n'est plus la PREMIÈRE. Une ligne périmée ne fausse pas "
    + "seulement sa propre valeur : elle fausse le total, la comparaison entre lignes et "
    + "celle avec un testeur. Proposer de scanner par-dessus, c'est bâtir sur des "
    + "chiffres morts.");
  assert.match(chaine, /bouton: 'Remesurer'/,
    "la tâche n'offre plus le geste. Une tâche sans bouton est un constat de plus.");
});

test("le total ne s'affiche pas comme un fait quand ses parts sont périmées", () => {
  assert.match(APP, /const nPerimPf = lignesPart\.filter\(\(x\) => x\.aMvVieux\)\.length;/,
    "le total ne compte plus ses parts périmées.");
  assert.ok(APP.includes('<sc-if value="{{ ps.aPfRAnPerime }}"'),
    "la réserve n'est plus rendue sous le total. Une somme de chiffres morts est plus "
    + "trompeuse que chacune de ses parts : personne ne rouvre douze lignes pour douter "
    + "d'un total.");
  // le chiffre RESTE : l'effacer le rendrait illisible, le laisser nu le rendrait faux
  assert.match(APP, /\{\{ ps\.pfRAn \}\}/,
    "le total a disparu au lieu d'être qualifié. Un écran sans chiffre ne se lit pas "
    + "davantage qu'un chiffre faux — la réserve accompagne la valeur, elle ne la "
    + "remplace pas.");
});
