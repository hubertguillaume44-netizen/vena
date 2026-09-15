/**
 * LE CONTRÔLE DU HASARD CORRIGÉ DE LA SÉLECTION — les gardes du brief, chacune
 * éprouvée par mutation (voir en bas de chaque test la mutation qui la fait tomber).
 *
 * Le défaut corrigé : le champion d'une carte est le meilleur de N configurations,
 * et son ancien chiffre le comparait à des tirages faits sur lui seul — un maximum
 * contre une moyenne. Le verdict corrigé compare DEUX MAXIMA, sur un ordre d'entrées
 * partagé par tirage (scan-noyau.js, controleCorrige).
 *
 * ANGLE MORT, déclaré et MESURÉ (scratchpad angle-mort.mjs, 2 400 combinaisons ×
 * 200 tirages) : les têtes sont l'ensemble dont un champion peut sortir, pas la
 * grille entière — le maximum nul sur ~20 têtes sous-estime celui de la grille.
 * La magnitude mesurée vit dans le texte de l'écran (ANGLE_MORT_COR) ; ce test
 * vérifie que la déclaration est RENDUE, pas seulement écrite.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { generateDemo } from "../mt5/serie-demo.mjs";
import { construireConfig } from "../mt5/config.mjs";
import { backtester } from "../../moteur.js";
import { controleCorrige, CRITERES_HASARD, scoreHasard, valeursHasard } from "../../scan-noyau.js";
import { borne, borneArriere } from "../lib/tranche.mjs";

const APP = readFileSync(new URL("../../Vena.dc.html", import.meta.url), "utf8");
const NOYAU = readFileSync(new URL("../../scan-noyau.js", import.meta.url), "utf8");

// ————— le décor fonctionnel : la vraie série de démonstration, le vrai moteur —————
const df = generateDemo({ id: "DEMO-TECH", start: 42, regimes: [
  { from: Date.UTC(2019, 0, 1), drift: 0.00012, vol: 0.0032 },
  { from: Date.UTC(2020, 1, 20), drift: -0.0004, vol: 0.007 },
  { from: Date.UTC(2020, 3, 15), drift: 0.0002, vol: 0.0038 },
  { from: Date.UTC(2022, 0, 1), drift: -0.00014, vol: 0.0046 },
  { from: Date.UTC(2023, 0, 1), drift: 0.00016, vol: 0.0034 } ] });
const cfgA = construireConfig({ sens: "achat", entree: "croisement_prix", ligne: "ma",
  periode: 20, sl: 0.7, rr: 1.5, spread: 0.02, swap: -3 });
const cfgB = construireConfig({ sens: "achat", entree: "croisement_prix", ligne: "ema",
  periode: 30, sl: 1, rr: 2, spread: 0.02, swap: -3 });
const tete = (cfg) => {
  const trades = backtester(df, cfg);
  return { cle: JSON.stringify(cfg.entree), cfg, n: trades.length, ut: "H1",
    reels: valeursHasard(trades) };
};
const tA = tete(cfgA), tB = tete(cfgB);

test("le chiffre corrigé est calculé sur le critère du classement actif", () => {
  // ce qui AGIT : l'affectation qui choisit le critère, puis la lecture au[c]
  assert.ok(APP.includes("const c = N && N.CRITERES_HASARD.includes(tri) ? tri : 'total';"),
    "la carte doit dériver son critère du classement actif — mutation : le figer sur 'total'");
  assert.ok(APP.includes("const au = (e.au && e.au[c]) || 0;"),
    "le compte lu doit être celui du critère actif, pas toujours le R net");
  // et le noyau produit bien un compte PAR critère
  const r = controleCorrige(df, [tA, tB], 0, 12, 4242);
  for (const c of CRITERES_HASARD) assert.ok(Number.isFinite(r.au[c]), "compte absent : " + c);
});

test("le + 1 du numérateur : jamais battu veut dire « moins d'une fois sur N+1 »", () => {
  // ce qui AGIT : les trois endroits qui transforment un compte en p
  for (const forme of ["((e.au[c] || 0) + 1) / (e.tirages + 1)",
    "(au + 1) / (e.tirages + 1)",
    "(f.auDessus + 1) / (f.tirages + 1)"]) {
    assert.ok(APP.includes(forme),
      "le + 1 du numérateur a disparu de : " + forme + " — un 0 / 500 redeviendrait une certitude");
  }
});

test("le nombre de tirages est une valeur de PAGE : aucun contrôle par carte", () => {
  // ce qui AGIT : les appels à calculerCor — le scan et le fond de page, rien d'autre.
  // Un troisième appel serait un contrôle par carte : exactement ce que le maximum
  // partagé vient de fermer (pousser le seul instrument qui a failli passer).
  const appels = (APP.match(/this\.calculerCor\(/g) || []).length;
  assert.equal(appels, 2,
    "calculerCor doit être appelé du scan et du calcul de fond seulement, vu " + appels);
  // et pousser écrit le réglage de PAGE, jamais celui d'une carte
  assert.ok(APP.includes("this.setState({ nTirages: n }, () => { this.ecrireSession(); this.completerCor(n); });"),
    "pousserCor doit régler la page entière");
});

test("pousser AJOUTE : deux plages valent un seul passage, à l'identique", () => {
  const g = 90909;
  const seul = controleCorrige(df, [tA, tB], 0, 30, g);
  const a = controleCorrige(df, [tA, tB], 0, 12, g);
  const b = controleCorrige(df, [tA, tB], 12, 30, g);
  for (const c of CRITERES_HASARD) {
    assert.equal(a.au[c] + b.au[c], seul.au[c], "au divergent sur " + c
      + " : la graine par tirage a été réamorcée, pousser recommencerait au lieu d'ajouter");
    assert.ok(Math.abs(a.som[c] + b.som[c] - seul.som[c]) < 1e-9, "som divergent sur " + c);
  }
  assert.equal(a.tirages + b.tirages, seul.tirages);
});

test("le maximum est pris sur un ordre d'entrées PARTAGÉ par tirage", () => {
  // ce qui AGIT : le flux réamorcé PAR TÊTE, dans la boucle des têtes du noyau
  const iBoucle = NOYAU.indexOf("for (let i = 0; i < tetes.length; i++) {");
  const iFlux = NOYAU.indexOf("const rnd = M.fluxHasard(M.graineTirage(graine, k));");
  assert.ok(iBoucle > 0 && iFlux > iBoucle,
    "le flux doit être réamorcé DANS la boucle des têtes : un flux consommé en séquence "
    + "donnerait des dates différentes à chaque tête — un mélange par configuration, "
    + "le défaut d'origine en plus cher");
  // la preuve fonctionnelle : deux têtes IDENTIQUES tirent les mêmes dates, donc
  // rendent le même résultat à chaque tirage — leurs comptes individuels sont égaux
  const r = controleCorrige(df, [tA, { ...tA, cle: "jumeau" }], 0, 15, 777);
  for (const c of CRITERES_HASARD) {
    assert.equal(r.auTetes[0][c], r.auTetes[1][c],
      "deux têtes identiques divergent sur " + c + " : l'ordre n'est pas partagé");
  }
});

test("aucun état « pas encore contrôlé » ne subsiste : le bouton est parti", () => {
  // ce qui AGISSAIT : les déclencheurs — le bouton du lot, le bouton par carte, et
  // le message « Déjà contrôlées ». Mutation : remettre l'un d'eux fait tomber ici.
  assert.ok(!APP.includes('onClick="{{ lancerLot }}"'),
    "le bouton de contrôle en lot est revenu : le contrôle se calcule pendant le scan");
  assert.ok(!APP.includes('onClick="{{ tr2.lancerHasard }}"'),
    "le bouton de contrôle par carte est revenu");
  assert.ok(!APP.includes("Déjà contrôlées à"),
    "l'état « déjà contrôlées à N tirages » est revenu : il n'a plus de sens sans bouton");
  // ce qui reste : le calcul pendant le scan, et le fond pour les scans d'avant
  assert.ok(APP.includes("await this.calculerCor(sym, Math.max(200, Number(this.state.nTirages) || 500),"),
    "le contrôle pendant le scan a disparu");
  assert.ok(APP.includes("this.completerCor();"),
    "le calcul de fond des scans antérieurs a disparu");
});

test("l'épinglée à la main porte un p NON corrigé, nommé comme tel", () => {
  // Une configuration épinglée par « Voir » a été choisie à l'œil parmi des
  // centaines : AUCUN N ne décrit cette sélection, donc aucune correction honnête
  // n'existe pour elle (règle 9 : l'angle mort infermable se déclare).
  const iCarte = APP.indexOf("champsCorCarte(sym, tete) {");
  const corps = APP.slice(iCarte, borne(APP, "\n  }", borne(APP, "hasardPhrase: au +", iCarte)));
  const iGarde = corps.indexOf("if (!estTete) {");
  const iEtiquette = corps.indexOf("'Verdict · NON corrigé — épinglée à la main'");
  const iCorrige = corps.indexOf("const au = (e.au && e.au[c]) || 0;");
  assert.ok(iGarde > 0 && iEtiquette > iGarde,
    "la branche épinglée doit exister et se NOMMER non corrigée");
  assert.ok(iCorrige > iGarde,
    "le chiffre corrigé (e.au) ne doit être lu qu'APRÈS la garde d'épinglée — "
    + "mutation : faire porter le chiffre corrigé à l'épinglée fait tomber ici");
  // et la branche épinglée ne lit jamais les comptes corrigés de l'instrument
  const brancheEpinglee = corps.slice(iGarde, iCorrige);
  assert.ok(!brancheEpinglee.includes("e.au["),
    "l'épinglée lit les comptes corrigés de l'instrument : elle porterait un chiffre "
    + "qui prétend corriger une sélection que personne ne connaît");
});

test("la phrase de lecture de la carte décide son verbe sur le verdict du hasard", () => {
  // « est la seule qui apporte vraiment » a désigné un gagnant dans un tableau dont
  // aucune case ne se distinguait du hasard — le défaut que tout ce chantier visait,
  // revenu par une ligne de commentaire automatique. Le chiffre était bon, le verbe
  // débordait. Ce qui AGIT : la lecture du verdict de la gagnante, et le verbe
  // conditionné dessus. Mutation : pousser « apporte vraiment » sans lire db.fort
  // (ou retirer la lecture de decisionDe) fait tomber ce test.
  const i = APP.indexOf("const db = gain.rb ? this.decisionDe(gain.rb) : null;");
  assert.ok(i > 0,
    "la phrase de lecture ne lit plus le verdict du hasard de la configuration "
    + "gagnante : elle redésignerait un gagnant dans un champ de bruit — et elle "
    + "parlerait pareil sur un univers réel dont rien ne tient");
  const bloc = APP.slice(i, i + 2200);
  const iCond = bloc.indexOf("lectures.push(db && db.fort");
  const iVerbe = bloc.indexOf("apporte vraiment");
  assert.ok(iCond > 0 && iVerbe > iCond,
    "« apporte vraiment » doit vivre DERRIÈRE db.fort : le verbe n'est mérité que si "
    + "le contrôle du hasard retient la gagnante");
  assert.ok(bloc.includes("un écart de R net, pas un enseignement."),
    "la branche non retenue doit dire ce qu'elle compare — un écart de R net — au "
    + "lieu de se taire : le silence effacerait une mesure juste");
});

test("l'angle mort de la grille est déclaré, ET rendu à l'écran", () => {
  // « une dette déclarée sans sa gravité se classe toute seule en bas de la pile » :
  // la déclaration vit dans une constante nommée, et la garde vérifie qu'elle est
  // RENDUE (dans l'aide du verdict), pas seulement écrite dans un commentaire
  assert.ok(APP.includes("ANGLE_MORT_COR = "),
    "la déclaration de l'angle mort a disparu");
  assert.ok(APP.includes("+ this.ANGLE_MORT_COR;"),
    "l'angle mort n'est plus rendu dans l'aide du verdict : déclaré sans être montré, "
    + "il n'existe pas pour l'utilisateur");
  // la magnitude mesurée (~13 R à 2 400, loi en log) a décidé de l'ENDROIT : au-dessus
  // du seuil, la restriction vit dans le verdict lui-même, pas dans l'infobulle
  assert.ok(APP.includes("+ (p <= 0.05 ? ' — des têtes rejouées' : '')"),
    "un « se distingue » nu est revenu : la restriction doit vivre dans le verdict");
});
