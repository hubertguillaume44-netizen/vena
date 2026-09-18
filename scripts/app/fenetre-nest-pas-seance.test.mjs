// STATUT · CAUSE ÉTABLIE, MESURÉE — la panne est un diagnostic faux, documenté dans
// le brief du 17 septembre 2026, et sa cause est relue ici dans le source.
//
// ————— DEUX GRANDEURS, UN SEUL MOT —————
//
// `nettoyer` (moteur.js) rend `heuresSession` : les heures présentes dans TOUTES les
// années de la série — la fenêtre horaire homogène —, et `ecartees` : les bougies
// retirées parce qu'elles tombent hors de cette fenêtre. Ni l'une ni l'autre n'a de
// rapport avec la séance de négociation, qui vit dans la colonne `sess` et que le
// moteur lit par `releve(i)`.
//
// Le panneau les affichait sous « session … · N bougies écartées ». Lues comme « la
// séance du courtier » et « les bougies hors séance », elles ont produit une
// inférence fausse : deux instruments à fenêtre étroite divergeaient d'un testeur,
// deux à fenêtre pleine divergeaient aussi, donc la règle de séance était disculpée.
// Le nombre lu ne l'avait jamais mesurée.
//
// LA GARDE S'ANCRE SUR L'ABSENCE (règle 14, troisième issue) : le champ est renommé,
// donc son sujet a disparu, et ce qui reste à garder est la RÉINTRODUCTION — un
// futur libellé qui remettrait le mot « séance » sur cette grandeur-là.
//
// ANGLE MORT DÉCLARÉ (règle 9) : elle ne garde que CE champ. Un libellé qui ment sur
// ce qu'il porte est de la prose, et la règle 3 interdit d'ancrer une garde sur de la
// prose — il n'existe donc pas de garde de classe ici, et c'est la quatrième fois que
// la classe mord (« Depuis », « les deux lectures s'accordent », « Période couverte »,
// celui-ci). Ce qui tient la classe est écrit dans CLAUDE.md et ne tient que par
// discipline ; le seuil pour construire une forme y est posé.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { borne } from "../lib/tranche.mjs";

const APP = readFileSync(new URL("../../Vena.dc.html", import.meta.url), "utf8");
const MOTEUR = readFileSync(new URL("../../moteur.js", import.meta.url), "utf8");

test("la fenêtre horaire homogène et la séance restent deux grandeurs", () => {
  // ancré sur ce qui AGIT : le producteur, avec sa lecture de diag
  // La fenêtre s'arrête à `fenetreHeuresAide`, et c'est délibéré : l'infobulle NOMME la
  // séance pour la nier — « ce n'est PAS la séance de négociation » — et une garde qui
  // interdit un mot s'exclut du texte dont l'interdit est le sujet. C'est ce qu'on garde
  // ici : la chaîne AFFICHÉE, pas le texte qui l'explique.
  const i = borne(APP, "      fenetreHeuresInfo: this.diag");
  const bloc = APP.slice(i, borne(APP, "      fenetreHeuresAide:", i));
  assert.match(bloc, /this\.diag\[s\.btSym\]\.ecartees/,
    "le champ ne lit plus `ecartees` : la garde a perdu sa prise et ne regarde plus "
    + "la grandeur dont il est question.");
  assert.ok(!/s[ée]ance/i.test(bloc),
    "le mot « séance » est revenu sur la fenêtre horaire homogène. Ce n'est pas la "
    + "séance de négociation : `heuresSession` est l'intersection des heures cotées "
    + "toutes années confondues, et `ecartees` compte les bougies hors de cette "
    + "fenêtre. Les confondre a déjà disculpé à tort la règle de séance du moteur. "
    + "Le nombre de bougies que cette règle saute vraiment est `sautesVues`, rendu "
    + "sous le résultat.");
});

test("la règle de séance du moteur, elle, lit bien la colonne sess", () => {
  // si cette lecture change, la distinction gardée ci-dessus n'a plus le même sens :
  // la garde doit tomber plutôt que de continuer à garder une hypothèse périmée
  assert.match(MOTEUR, /const enSeance = cfg\.hors_seance === true \? \(\) => true : \(i\) => !sessX \|\| sessX\[i\] !== 0;/,
    "la séance ne se lit plus dans la colonne `sess`. Toute la distinction gardée "
    + "ici repose sur le fait que le moteur tire sa séance d'ailleurs que de la "
    + "fenêtre horaire : si ce n'est plus vrai, cette garde ne garde plus rien.");
});

// ————— ET LES DEUX COMPTES SE LISENT ENSEMBLE, SUR LE MÊME ÉCRAN —————
//
// STATUT · CAUSE ÉTABLIE, RAPPORTÉE PAR L'UTILISATEUR, sur la reprise d'US30 :
// « 0 bougies hors de cette fenêtre » et, dans l'encadré juste au-dessus, « 23 bougies
// hors séance sur 68 sautées ». Les deux nombres sont justes ; les deux populations sont
// DISJOINTES ; rien à l'écran ne le disait.
//
// La garde ci-dessus interdit le mot « séance » sur la fenêtre, et c'était le bon
// interdit — mais il ne suffit pas quand les deux comptes se lisent l'un sous l'autre.
// Le libellé ne nommait que l'EXCLUSION, qui est le mot commun aux deux mécanismes :
// « écartées » d'un côté, « sautées » de l'autre, deux synonymes pour deux choses.
//
// La distinction qui les sépare est un FAIT, pas une nuance : celles de la fenêtre sont
// RETIRÉES de la série — elles n'y entrent jamais, aucun de leurs extrêmes n'est
// mesurable, c'est tout l'objet du compteur `caches` — quand celles de la règle de
// séance y sont PRÉSENTES et seulement sautées à l'évaluation. Les deux mots vivent donc
// dans le texte RENDU, et pas dans les deux infobulles qui le disaient déjà : c'est en
// lisant les deux lignes ensemble qu'on les confond, et une infobulle ne s'ouvre pas
// toute seule.
//
// ANGLE MORT DÉCLARÉ (règle 9) : cette garde tient les deux MOTS, pas la disposition.
// Rapprocher les deux blocs, ou en déplacer un sous l'autre, ne la fera pas tomber —
// et c'est le voisinage qui a produit la confusion.
test("chacun des deux comptes dit OÙ ses bougies se trouvent", () => {
  const i = borne(APP, "      fenetreHeuresInfo: this.diag");
  const fen = APP.slice(i, borne(APP, "      fenetreHeuresAide:", i));
  assert.match(fen, /RETIRÉES de la série/,
    "le compte de la fenêtre horaire ne dit plus que ses bougies sont RETIRÉES de la "
    + "série. « écartées » seul est un synonyme de « sautées », qui décrit l'autre "
    + "population : lus l'un sous l'autre, les deux comptes se fondent en un.");

  const j = borne(APP, "        return { aBtSautes: tot > 0,");
  const sea = APP.slice(j, borne(APP, "      ...(() => {\n        const dispo = !!s._cachesDispo;", j));
  assert.match(sea, /PRÉSENTES dans la série/,
    "le compte de la règle de séance ne dit plus que ses bougies sont PRÉSENTES dans la "
    + "série. C'est le fait qui le sépare du compte de la fenêtre horaire — l'un porte "
    + "sur des bougies qui n'y sont jamais entrées, l'autre sur des bougies qui y sont.");
  // la prise : c'est bien la branche que l'utilisateur a lue — un compte non nul
  assert.match(sea, /Règle de séance : ' \+ nb\(n\)/,
    "la branche qui rend un compte non nul ne nomme plus le mécanisme dont elle parle. "
    + "Les deux autres branches portent « Règle de séance : » ; celle-ci est la seule "
    + "que l'utilisateur voit quand la confusion se produit, et elle commençait par un "
    + "nombre nu.");
});
