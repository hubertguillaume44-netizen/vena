// STATUT · INSTRUMENTATION, AUCUNE CAUSE PRÉTENDUE. Ces quatre calculs ne réparent rien
// et n'expliquent rien : ils rendent décidable ce que la page affirmait sans l'avoir
// regardé. Ce que la garde tient, c'est leur ARITHMÉTIQUE et leurs trois états — pas que
// les chiffres obtenus décrivent bien un portefeuille réel, ce qu'aucun test ne peut dire.
//
// ————— CE QU'ELLE FERME, ET CE QU'ELLE NE FERME PAS —————
//
// Elle ferme : la fenêtre commune est bien [max(début), min(fin)] ; l'agrégat ne retient
// que les trades entièrement dedans ; l'exposition simultanée compte le MAXIMUM et le
// nombre de jours où il tient ; la corrélation mensuelle rend `null` — et jamais zéro —
// quand une ligne n'a rien fait sur la fenêtre ; le regroupement au-delà de 0,70 est
// transitif.
//
// Elle ne ferme PAS le choix du grain : que la redondance se mesure sur des rendements
// MENSUELS et non hebdomadaires ou trimestriels est un choix de produit. Un portefeuille
// dont les lignes prennent trois trades par an sera mesuré sur des mois presque tous
// vides, et la corrélation y vaudra surtout le calendrier des rares mois travaillés.
// C'est écrit ici parce que rien dans le code ne le dit.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as M from "../../moteur.js";

const J = 86400000;
const d = (s) => Date.parse(s + "T12:00:00Z");
const t = (a, b, r) => ({ e: d(a), s: d(b), r });

test("la fenêtre commune est [max(début), min(fin)], et ses trois états se distinguent", () => {
  const A = { nom: "A", trades: [t("2021-01-04", "2021-01-10", 1), t("2024-03-01", "2024-03-05", -1)] };
  const B = { nom: "B", trades: [t("2020-06-01", "2020-06-03", 2), t("2026-03-02", "2026-03-08", 1.5)] };
  const f = M.fenetreCommune([A, B]);
  assert.equal(f.t0, d("2021-01-04"), "le début commun est le PLUS TARD des débuts.");
  assert.equal(f.t1, d("2024-03-05"), "la fin commune est la PLUS TÔT des fins.");
  assert.equal(f.vide, false);

  // deux lignes disjointes : il n'y a pas de fenêtre, et ce n'est pas une fenêtre de zéro
  const C = { nom: "C", trades: [t("2019-01-01", "2019-02-01", 1)] };
  const D = { nom: "D", trades: [t("2024-01-01", "2024-02-01", 1)] };
  assert.equal(M.fenetreCommune([C, D]).vide, true,
    "deux lignes qui n'ont jamais tourné ensemble rendent une fenêtre VIDE. Rendre un "
    + "agrégat sur une fenêtre inexistante afficherait un chiffre que personne n'a vécu.");

  // une seule ligne : sa fenêtre EST la fenêtre commune, et l'état le dit
  const u = M.fenetreCommune([A]);
  assert.equal(u.unique, true);
  assert.equal(u.vide, false);
  assert.equal(u.t0, d("2021-01-04"));

  // aucune ligne mesurable : ni fenêtre, ni zéro
  const z = M.fenetreCommune([{ nom: "Z", trades: [] }]);
  assert.equal(z.vide, true);
  assert.equal(z.mesurables, 0,
    "une ligne sans trade ne compte pas comme mesurée à zéro : elle n'est pas mesurée.");
});

test("l'agrégat ne retient que les trades ENTIÈREMENT dans la fenêtre", () => {
  const A = { nom: "A", trades: [
    t("2021-01-01", "2021-01-10", 5),   // avant la fenêtre
    t("2022-01-01", "2022-01-10", 3),   // dedans
    t("2023-12-28", "2024-01-06", 7)] }; // à cheval sur la fin
  const ag = M.agregerFenetre([A], d("2021-06-01"), d("2024-01-01"));
  assert.equal(ag.n, 1, "un trade à cheval sur une borne n'a pas été vécu par le "
    + "portefeuille entier : le retenir remettrait dans le total ce que la fenêtre "
    + "commune vient d'en retirer.");
  assert.equal(ag.total, 3);
  assert.ok(Math.abs(ag.annees - 2.58) < 0.02, "les années sont celles de la fenêtre.");
  assert.ok(Math.abs(ag.rAn - 3 / ag.annees) < 1e-9);
});

test("l'exposition simultanée rend le MAXIMUM et le nombre de jours où il tient", () => {
  // trois lignes, toutes ouvertes du 5 au 7 mars, et une seule fois
  const l = [
    { nom: "A", trades: [t("2022-03-01", "2022-03-07", 1)] },
    { nom: "B", trades: [t("2022-03-05", "2022-03-20", 1)] },
    { nom: "C", trades: [t("2022-03-05", "2022-03-09", 1)] },
  ];
  const e = M.expositionMax(l);
  assert.equal(e.mesurable, true);
  assert.equal(e.max, 3, "les trois lignes sont ouvertes en même temps du 5 au 7.");
  assert.equal(e.portantes, 3);
  assert.equal(e.jours, 3, "5, 6 et 7 mars — trois jours. Un pire cas atteint UNE fois "
    + "est un accident ; atteint onze jours, c'est la façon dont le portefeuille "
    + "fonctionne, et le compte est ce qui les sépare.");

  // une fermeture et une ouverture au même instant ne sont pas un chevauchement
  const relais = [
    { nom: "A", trades: [t("2022-03-01", "2022-03-05", 1)] },
    { nom: "B", trades: [t("2022-03-05", "2022-03-09", 1)] },
  ];
  assert.equal(M.expositionMax(relais).max, 1,
    "une position qui passe le relais à une autre au même instant n'expose pas deux fois.");

  // aucune ligne : « non mesurée », pas « zéro exposition »
  const rien = M.expositionMax([{ nom: "A", trades: [] }]);
  assert.equal(rien.mesurable, false);
  assert.equal(rien.portantes, 0);
});

test("la corrélation mensuelle rend null — jamais zéro — quand il n'y a rien à corréler", () => {
  const mois = (an, m, r) => t(an + "-" + String(m).padStart(2, "0") + "-05",
    an + "-" + String(m).padStart(2, "0") + "-06", r);
  const A = { nom: "A", trades: [] }, B = { nom: "B", trades: [] };
  for (let m = 1; m <= 12; m++) {
    A.trades.push(mois("2022", m, m % 2 ? 2 : -1));
    B.trades.push(mois("2022", m, m % 2 ? 3 : -2));
  }
  const t0 = d("2022-01-01"), t1 = d("2022-12-31");
  const c = M.correlMensuelle([A, B], t0, t1);
  assert.equal(c.assez, true);
  assert.equal(c.mois, 12);
  assert.ok(c.paires[0].c > 0.99, "deux lignes qui montent et descendent les mêmes mois "
    + "sont corrélées, et la mesure le dit.");

  // une ligne sans aucun trade sur la fenêtre : variance nulle, donc PAS de corrélation
  const vide = { nom: "V", trades: [] };
  const c2 = M.correlMensuelle([A, vide], t0, t1);
  assert.equal(c2.paires[0].c, null,
    "une variance nulle ne donne pas une corrélation de zéro : elle n'en donne aucune. "
    + "Rendre 0 ferait lire « paris distincts » là où rien n'a été mesuré.");

  // moins de mois que le minimum : la raison se dit
  const court = M.correlMensuelle([A, B], d("2022-01-01"), d("2022-03-01"));
  assert.equal(court.assez, false);
  assert.match(court.raison, /mois/);

  // une seule ligne : ce n'est pas « zéro corrélation », c'est une question qui ne se pose pas
  const seule = M.correlMensuelle([A], t0, t1);
  assert.equal(seule.assez, false);
  assert.match(seule.raison, /une seule ligne/);

  // un mois SANS position vaut zéro, pas « pas de donnée » : sans ça, deux lignes ne se
  // compareraient que sur les mois où elles ont toutes deux travaillé — la question
  // qu'on ne pose justement pas
  const creuse = { nom: "C", trades: [mois("2022", 1, 5), mois("2022", 12, 5)] };
  const c3 = M.correlMensuelle([A, creuse], t0, t1);
  assert.equal(c3.mois, 12, "les douze mois de la fenêtre comptent, y compris les vides.");
  assert.ok(c3.paires[0].c !== null);
});

test("le regroupement en paris est transitif, et n'avale pas une paire non calculable", () => {
  const paires = [
    { ia: 0, ib: 1, c: 0.82 },
    { ia: 1, ib: 2, c: 0.75 },
    { ia: 0, ib: 3, c: 0.11 },
  ];
  const g = M.grouperParis(4, paires, 0.7);
  assert.equal(g.paris, 2, "0-1 et 1-2 au-delà du seuil : les trois ne font qu'un pari, "
    + "plus la quatrième ligne. Un portefeuille de huit lignes dont six corrèlent est un "
    + "portefeuille de deux.");
  const nul = M.grouperParis(2, [{ ia: 0, ib: 1, c: null }], 0.7);
  assert.equal(nul.paris, 2,
    "une paire non calculable ne regroupe pas : on ne fusionne pas sur une absence de mesure.");
});

test("pearson refuse de répondre plutôt que de rendre zéro", () => {
  assert.equal(M.pearson([1, 1, 1], [1, 2, 3]), null, "variance nulle d'un côté.");
  assert.equal(M.pearson([1], [1]), null, "un seul point ne corrèle rien.");
  assert.ok(Math.abs(M.pearson([1, 2, 3], [2, 4, 6]) - 1) < 1e-12);
  assert.ok(Math.abs(M.pearson([1, 2, 3], [3, 2, 1]) + 1) < 1e-12);
});
