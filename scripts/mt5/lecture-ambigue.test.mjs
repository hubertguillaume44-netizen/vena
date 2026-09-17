// STATUT · CAUSE ÉTABLIE, MESURÉE ICI — mais elle N'EXPLIQUE PAS le rapport qui l'a fait
// écrire. Neuf instruments rejoués dans le testeur (rapportés, non reproduits dans le
// dépôt) : quatre divergent, dont trois avec le BON compte de trades et une réussite
// effondrée. L'hypothèse proposée était la résolution intra-bougie — une bougie H1
// contenant à la fois le stop et l'objectif, tranchée par convention.
//
// MESURÉ SUR LES DIX FAMILLES D'EXEMPLE, quatre couples SL/RR (0,5/1,5 · 0,5/2,5 ·
// 0,7/1,5 · 2,5/3,0), ceux des lignes rapportées : ZÉRO bougie ambiguë, et « lecture
// basse » comme « lecture haute » rendent le MÊME résultat à la décimale. Sans palier,
// la bande stop→objectif (1,75 % à 10 % du cours) dépasse l'amplitude d'une H1, donc la
// convention n'est jamais invoquée. L'hypothèse tombe pour ces configurations-là, et on
// ne la garde pas à moitié.
//
// ————— MAIS ELLE DEVIENT DOMINANTE DÈS QU'UN PALIER EST ARMÉ —————
//
// Un simple point mort à 25 % du parcours, même série, même configuration :
//
//   VX-BTC   177 trades →  83 ambigus (47 %) · réussite  6,2 % → 35,0 % · R −41,5 → +86,0
//   VX-TECH  138 trades →  70 ambigus (51 %) · réussite  2,2 % → 31,9 % · R −51,5 → +53,0
//   VX-500   146 trades →  14 ambigus (10 %) · réussite 19,9 % → 23,3 % · R  18,5 → +31,0
//
// La fourchette ne borne pas une incertitude de quelques pour cent : elle CHANGE LE
// SIGNE du résultat. Une bougie qui monte assez pour armer le point mort puis redescend
// le toucher, ou qui touche l'objectif et le stop armé dans la même heure, n'a pas dit
// dans quel ordre. La H1 ne PORTE PAS l'information, et aucun correctif ne l'y mettra.
//
// C'EST LA FAMILLE DU DÉNOMINATEUR DORMANT, sous une autre forme : un chiffre affiché
// sans sa fourchette sur les cas où la donnée ne tranche pas. Ce que cette garde tient,
// c'est la MESURE ; ce qu'elle ne tient pas, c'est le choix d'affichage — il reste à
// faire, et il se décide sur ces nombres.
//
// ANGLE MORT DÉCLARÉ (règle 9) : les séries d'exemple ne portent pas les colonnes
// d'ORDRE des extrêmes (`ah`/`ab`), que l'export MT5 sait écrire et que le moteur lit
// (`ordreConnuA`). Sur une série qui les porte, l'ambiguïté se résout par la donnée et
// ces comptes tombent — de combien, personne ne l'a mesuré. C'est la mesure qui
// manque, et elle demande un CSV exporté avec ces colonnes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { construireConfig } from "./config.mjs";
import { chargerMoteur } from "./charger-moteur.mjs";
import { borne } from "../lib/tranche.mjs";

const M = await chargerMoteur();
const SRC = readFileSync(new URL("../../Vena.dc.html", import.meta.url), "utf8");
const DEB = "// ————— LES DIX SÉRIES D'EXEMPLE SONT ENGENDRÉES, JAMAIS LIVRÉES —————";
const FIN = "// ————— FIN DU GÉNÉRATEUR D'EXEMPLES —————";
const code = SRC.slice(borne(SRC, DEB), borne(SRC, FIN))
  + "\nexport { EXEMPLES, engendrerExemple, facteurMacro };";
const G = await import("data:text/javascript;base64,"
  + Buffer.from(code, "utf8").toString("base64"));

const DEBUT = Date.UTC(2022, 8, 12);
const macro = G.facteurMacro(3 * 365 * 24);

function jouer(id, { sl, rr, paliers, prudent }) {
  const df = G.engendrerExemple(id, DEBUT, macro);
  const cfg = construireConfig({ entree: "croisement_ou_rebond", ligne: "mediane",
    periode: 7, sl, rr, paliers, debut: df.t[0] });
  cfg.sortie.prudent = prudent;
  const tr = M.backtesterSuivi(df, cfg, "D1");
  return { n: tr.length, amb: tr.filter((x) => x.ambigu).length,
    R: tr.reduce((a, x) => a + x.R, 0) };
}

// les quatre couples SL/RR des lignes rapportées comme divergentes
const CAS = [[0.5, 1.5], [0.5, 2.5], [0.7, 1.5], [2.5, 3.0]];

test("sans palier, aucune bougie n'est ambiguë et la LECTURE ne change rien", () => {
  const dits = [];
  for (const [id] of G.EXEMPLES) {
    for (const [sl, rr] of CAS) {
      const b = jouer(id, { sl, rr, paliers: [], prudent: true });
      const h = jouer(id, { sl, rr, paliers: [], prudent: false });
      if (b.n < 20) continue;
      dits.push({ id, sl, rr, n: b.n, amb: b.amb, rb: b.R, rh: h.R });
    }
  }
  assert.ok(dits.length >= 20, dits.length + " configurations mesurées : le générateur "
    + "ou le moteur ne rend plus assez de trades, et la garde comparerait des vides");
  const ambigus = dits.filter((x) => x.amb > 0);
  assert.deepEqual(ambigus, [],
    "des bougies ambiguës apparaissent SANS palier, ce qui n'était pas le cas quand "
    + "cette mesure a été faite : " + JSON.stringify(ambigus.slice(0, 3))
    + ". Le raisonnement du fichier repose sur ce zéro — relisez-le avant de le corriger.");
  const ecarts = dits.filter((x) => Math.abs(x.rb - x.rh) > 1e-9);
  assert.deepEqual(ecarts, [],
    "« lecture basse » et « lecture haute » ne rendent plus le même résultat sans "
    + "palier : " + JSON.stringify(ecarts.slice(0, 3)));
});

test("avec un simple point mort, la lecture décide du SIGNE du résultat", () => {
  // ————— CE QUE LA GARDE TIENT EST LA MAGNITUDE, PAS SON EXISTENCE —————
  // « les deux lectures diffèrent » passerait au vert sur un écart d'un centième de R.
  // Ce qui est en cause est qu'elles ne donnent pas le même SIGNE : la fourchette
  // recouvre la décision d'un utilisateur, pas une marge d'arrondi.
  const vus = [];
  for (const id of ["vx-btc", "vx-tech"]) {
    const o = { sl: 0.5, rr: 2.5, paliers: [[25, 0]] };
    const b = jouer(id, { ...o, prudent: true });
    const h = jouer(id, { ...o, prudent: false });
    vus.push({ id, n: b.n, amb: b.amb, rb: b.R, rh: h.R });
  }
  const dire = () => vus.map((x) => x.id + " : " + x.n + " trades, " + x.amb
    + " ambigus, R " + x.rb.toFixed(1) + " → " + x.rh.toFixed(1)).join("\n  ");

  for (const x of vus) {
    assert.ok(x.amb / x.n > 0.4,
      x.id + " : " + x.amb + " trades ambigus sur " + x.n + " (" 
      + (x.amb / x.n * 100).toFixed(0) + " %), plus de 40 % attendus. Un palier armé "
      + "rend la plupart des bougies ambiguës — si ce n'est plus vrai, la mesure "
      + "écrite en tête de ce fichier est périmée :\n  " + dire());
    assert.ok(x.rb < 0 && x.rh > 0,
      x.id + " : les deux lectures ne straddlent plus zéro (" + x.rb.toFixed(1) + " et "
      + x.rh.toFixed(1) + "). C'est CE fait qui justifie d'afficher une fourchette : "
      + "la convention d'ordre intra-bougie décide du signe du résultat, sur une "
      + "information que la bougie H1 ne porte pas.\n  " + dire());
  }
});
