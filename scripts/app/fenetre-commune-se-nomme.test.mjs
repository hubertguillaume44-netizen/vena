// STATUT · CAUSE ÉTABLIE — symptôme RAPPORTÉ (« + 89,7 R / an · sur les 1,0 ans où les
// 14 lignes tournaient ensemble »), mécanisme et correctif MESURÉS DANS LE DÉPÔT.
//
// ————— ANGLE MORT, EN TÊTE (règle 9) —————
// Elle tient QUI borne la fenêtre et CE QUE le geste promet. Elle ne tient pas que le
// seuil de deux ans soit le bon : c'est un arbitrage, pas une mesure, et aucune garde ne
// peut le valider. Ce qu'elle interdit, c'est qu'il devienne implicite — il est nommé,
// et le texte qui l'explique est relu ici.
//
// ————— UNE INTERSECTION EST FIXÉE PAR SA LIGNE LA PLUS COURTE —————
//
// Le correctif de la fenêtre commune était juste, et il a produit un chiffre annualisé
// depuis douze mois d'observation sur quatorze stratégies. Ce n'est pas plus fiable que
// la somme brute — c'est DIFFÉREMMENT peu fiable, et la note ne portait que la seconde
// réserve.
//
// La cause est mécanique et se mesure : douze lignes mesurées sur 6,7 ans voyaient leur
// agrégat réduit à la fenêtre où deux voisines coexistent. Trois choses manquaient, et
// aucune n'est un calcul :
//
//   1. le NOM des deux lignes qui bornent — sans lui le chiffre est subi ;
//   2. le refus d'annualiser sous deux ans — le R cumulé et la fenêtre restent, c'est
//      leur RAPPORT qui est retenu ;
//   3. le GESTE, avec son effet annoncé avant le clic.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { chargerMoteur } from "../mt5/charger-moteur.mjs";
import { borne } from "../lib/tranche.mjs";

const M = await chargerMoteur();
const APP = readFileSync(new URL("../../Vuna.dc.html", import.meta.url), "utf8");
const J = 86400000, AN = 365.25 * J;
const T0 = Date.UTC(2020, 0, 2);

/** `n` lignes larges, plus deux voisines qui ne se recouvrent qu'à peine : la forme
 *  exacte du cas rapporté. Sans les deux courtes, la fenêtre commune ne coupe rien et
 *  tout ce qui suit mesurerait le décor. */
function portefeuille() {
  const large = (nom) => ({ nom, sym: nom,
    fen: { t0: T0, t1: T0 + 6.7 * AN },
    trades: [{ e: T0 + J, s: T0 + 6.6 * AN, r: 1 }] });
  const lignes = [];
  for (let i = 0; i < 12; i++) lignes.push(large("LARGE-" + i));
  // s'arrête tôt : elle fixe la borne HAUTE
  lignes.push({ nom: "AUD", sym: "AUD",
    fen: { t0: T0, t1: T0 + 3.75 * AN },
    trades: [{ e: T0 + J, s: T0 + 3.7 * AN, r: 1 }] });
  // commence tard : elle fixe la borne BASSE
  lignes.push({ nom: "BTC", sym: "BTC",
    fen: { t0: T0 + 2.2 * AN, t1: T0 + 6.6 * AN },
    trades: [{ e: T0 + 2.3 * AN, s: T0 + 6.5 * AN, r: 1 }] });
  return lignes;
}

test("la fenêtre commune NOMME les deux lignes qui la bornent", () => {
  const lignes = portefeuille();
  const fen = M.fenetreCommune(lignes);

  // ————— LA PRISE : la fenêtre doit s'être EFFONDRÉE, sinon on mesure le décor —————
  assert.ok(fen.annees < 2 && fen.annees > 0.5,
    `la fenêtre commune vaut ${fen.annees.toFixed(2)} ans : le semis ne reproduit pas `
    + "l'effondrement rapporté, et les assertions qui suivent passeraient avec ou sans "
    + "le code qu'elles vérifient.");

  assert.ok(fen.borneBas && fen.borneHaut,
    "`fenetreCommune` ne dit plus QUI la borne. Une intersection est fixée par deux "
    + "lignes et une seule suffit à l'effondrer : rendre le chiffre sans le nom le rend "
    + "SUBI, alors qu'avec le nom il devient une décision.");
  assert.equal(fen.borneBas.nom, "BTC",
    "la borne BASSE n'est pas la ligne qui commence le plus tard (" + fen.borneBas.nom + ").");
  assert.equal(fen.borneHaut.nom, "AUD",
    "la borne HAUTE n'est pas la ligne qui s'arrête le plus tôt (" + fen.borneHaut.nom + ").");

  // ————— ET LES ÉCARTER REND LEUR FENÊTRE AUX DOUZE AUTRES —————
  const sans = M.fenetreCommune(lignes.filter((l) => !["AUD", "BTC"].includes(l.nom)));
  assert.ok(sans.annees > 6,
    `sans les deux lignes qui bornent, la fenêtre commune vaut ${sans.annees.toFixed(2)} `
    + "ans au lieu des 6,7 attendus : le geste promettrait un gain qu'il ne rend pas.");
});

test("deux bornes portées par UNE seule ligne ne comptent pas pour deux", () => {
  // Une ligne courte peut borner les deux côtés. Annoncer « écarter les 2 lignes »
  // décrirait un geste qui n'existe pas.
  const lignes = [
    { nom: "A", sym: "A", fen: { t0: T0, t1: T0 + 6 * AN }, trades: [{ e: T0, s: T0 + 6 * AN, r: 1 }] },
    { nom: "B", sym: "B", fen: { t0: T0, t1: T0 + 6 * AN }, trades: [{ e: T0, s: T0 + 6 * AN, r: 1 }] },
    { nom: "COURTE", sym: "COURTE", fen: { t0: T0 + 2 * AN, t1: T0 + 3 * AN },
      trades: [{ e: T0 + 2 * AN, s: T0 + 3 * AN, r: 1 }] },
  ];
  const fen = M.fenetreCommune(lignes);
  assert.equal(fen.borneBas.nom, "COURTE");
  assert.equal(fen.borneHaut.nom, "COURTE");
});

test("sous deux ans, le bandeau n'annualise pas — et il dit pourquoi", () => {
  assert.match(APP, /SEUIL_ANNUALISER = 2;/,
    "le seuil n'est plus une constante nommée : il divergerait du texte qui l'explique.");
  const tete = APP.slice(borne(APP, "  SEUIL_ANNUALISER = 2;") - 1200,
    borne(APP, "  SEUIL_ANNUALISER = 2;"));
  assert.ok(/arbitrage/.test(tete),
    "le seuil ne dit plus que c'en est un. Deux ans est un choix, pas une mesure — le "
    + "taire le ferait lire comme une propriété du calcul.");
  assert.ok(/ne cache RIEN|cumulé/.test(tete),
    "la note du seuil ne dit plus que le R cumulé et la fenêtre restent à l'écran. Un "
    + "refus d'annualiser qui retirerait aussi le chiffre serait un refus de mesurer.");
  assert.match(APP, /const courte = etat === 'plein' && fen\.annees < this\.SEUIL_ANNUALISER;/,
    "le refus ne se décide plus sur la durée de la fenêtre commune.");
  // le grand chiffre bascule, et la raison voyage avec lui
  assert.match(APP, /trop court pour annualiser/,
    "le bandeau ne dit plus POURQUOI il n'annualise pas. Un chiffre qui change de "
    + "nature sans sa raison se lit comme une erreur.");
  // et tout ratio qui divise par le temps hérite de la réserve
  assert.match(APP, /pfCourte: courte,/,
    "la réserve de la fenêtre courte ne sort plus du calcul : le rendement par unité "
    + "de creux divise la même durée et affichait « excellent » sur douze mois.");
});

test("le geste écarte du BILAN, annonce son effet, et se reprend", () => {
  assert.match(APP, /' la fenêtre → '\s*\n?\s*\+ f1\(bornes\.gain, 1\) \+ ' ans'|la fenêtre → ' \+ f1\(bornes\.gain, 1\) \+ ' ans'/,
    "le bouton ne porte plus la fenêtre APRÈS. Un geste qui ne dit pas ce qu'il donne "
    + "demande de parier sur son propre effet.");
  assert.match(APP, /Écarter du BILAN, pas du portefeuille|Écarter du BILAN, pas du portefeuille/,
    "l'infobulle ne distingue plus écarter de retirer. Les confondre ferait détruire "
    + "une ligne pour lire un agrégat.");
  assert.match(APP, /reprendreAuBilan\(syms\)/,
    "le geste inverse a disparu : une porte qui ne s'ouvre que dans un sens fait d'un "
    + "réglage une suppression.");
  // il ne s'offre QUE s'il change quelque chose, et s'il laisse de quoi mesurer
  assert.match(APP, /bornes\.gain > fen\.annees \+ 0\.05\s*\n?\s*&& bornes\.syms\.length && vivantes\.length - bornes\.syms\.length >= 2/,
    "le bouton s'offre alors qu'il n'élargit rien, ou qu'il ne laisserait pas deux "
    + "lignes à croiser. Un geste sans effet est le défaut qu'on a passé la semaine à "
    + "retirer.");
  // ce qui est écarté SE VOIT — c'est ce qui autorise à le restaurer en session
  assert.match(APP, /aPfEcartees: ecartLignes\.length > 0,/,
    "les lignes écartées ne se voient plus. C'est ce qui distingue ce réglage de "
    + "`familleFiltre` : un réglage qui peut tout changer sans se montrer ne se "
    + "réenregistre pas.");
  assert.match(APP, /\n      'pfEcart',\n/,
    "`pfEcart` n'est plus restauré avec la session, ou il l'est sans sa raison écrite.");
});

test("une fenêtre CHOISIE se lit dans le réglage, elle ne se devine pas", () => {
  assert.match(APP, /fenReglee: \(\(\) => \{ const f = this\.fenetreDeLigne\(v\);/,
    "la fenêtre choisie est de nouveau DÉDUITE des dates au lieu d'être lue dans la "
    + "configuration. C'est la règle 1 : une intention (« ces dates ont-elles l'air "
    + "rognées ? ») pour un résultat (« la ligne porte-t-elle une fenêtre de mesure ? ») "
    + "— et l'amorce de 400 jours fausse tout seuil en jours.");
  assert.match(APP, /fenêtre choisie, pas toute la série|fenêtre choisie, pas toute la série/,
    "la ligne ne dit plus qu'elle porte une fenêtre choisie. C'est un RÉGLAGE, pas un "
    + "fait de marché : aujourd'hui il se lisait comme « dernier trade en 2023 », et il "
    + "rend la ligne difficilement comparable aux autres.");
});
