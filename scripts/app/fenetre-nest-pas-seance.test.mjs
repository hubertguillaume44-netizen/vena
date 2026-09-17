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
