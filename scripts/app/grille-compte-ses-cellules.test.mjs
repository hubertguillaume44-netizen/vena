// STATUT · CAUSE ÉTABLIE, MESURÉE DANS LE DÉPÔT. Rapporté sur `260918.7` : « Retirer »
// occupait la colonne « Période à tester », qui se tassait à gauche. Relu ici : l'en-tête
// déclarait SEPT pistes, le corps HUIT. Les deux gabarits étaient écrits à la main, l'un
// en face de l'autre, et ils ont divergé le jour où la colonne « Part » a été retirée —
// « Retirer » vivait à côté d'elle, il est resté, et il s'est décalé d'un cran.
//
// ————— POURQUOI LA GARDE MESURE AU RENDU —————
//
// Deux gabarits identiques dans le source ne prouvent pas deux grilles identiques à
// l'écran : c'est la grille CALCULÉE qui décale, et elle dépend de la largeur du parent,
// du `gap`, du contenu d'une piste `max-content`. La garde lit donc les pistes résolues
// de l'en-tête et de chaque rangée, en pixels, et les compare.
//
// ————— ET LE TIRET QUI NE DIT RIEN —————
//
// Même rapport, même écran : les deux dates rendaient « — » sur toutes les lignes. Un
// tiret couvre trois causes — bornes non enregistrées, bougies non chargées,
// configuration introuvable — donc il disculpe sans avoir regardé. C'est la règle des
// trois états, celle des quatre calculs du portefeuille, appliquée à une date.
//
// ANGLE MORT DÉCLARÉ, en tête : la garde mesure la grille des LIGNES du portefeuille, à
// une largeur de fenêtre, sur trois rangées. Elle ne dit rien des autres tableaux du
// fichier, dont plusieurs portent aussi deux gabarits écrits en face l'un de l'autre —
// c'est relevé, pas fermé.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { POSER_SEMIS, INSTANCE } from "./lib/semis.mjs";

const APP = readFileSync(new URL("../../Vuna.dc.html", import.meta.url), "utf8");
const SOLO = new URL("../../Vuna.solo.html", import.meta.url).pathname;
const CHROMIUMS = [process.env.VUNA_CHROMIUM,
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].filter(Boolean);

test("le gabarit de la grille des lignes est écrit UNE fois", () => {
  assert.match(APP, /grilleLigne: '14px minmax\(0,1fr\) 80px 84px 88px 100px 112px 74px',/,
    "le gabarit nommé a disparu : chaque grille redevient une vérité à tenir d'accord "
    + "avec l'autre, et la divergence ne se voit qu'à l'écran.");
  assert.equal(APP.split("grid-template-columns:{{ grilleLigne }}").length - 1, 2,
    "le gabarit nommé n'est plus lu par EXACTEMENT deux grilles — l'en-tête et la "
    + "rangée. S'il n'en reste qu'une, l'autre a été réécrite à la main.");
  // et l'infobulle du dépli ne vit plus sur la rangée entière
  assert.ok(!APP.includes('onClick="{{ vl.deplier }}" title="{{ vl.deplierAide }}"'),
    "l'infobulle du dépli est revenue sur la rangée ENTIÈRE : elle s'ouvre alors sous le "
    + "curseur où qu'il soit, y compris au-dessus du bouton « Exporter » de la rangée "
    + "suivante, qu'elle recouvre. Une infobulle qui recouvre une action est une action "
    + "perdue tant qu'elle est ouverte. Elle vit sur le chevron.");
});

test("l'en-tête et chaque rangée ont les MÊMES pistes, mesurées", { timeout: 180000 }, async () => {
  let chromium;
  try { ({ chromium } = await import("playwright")); }
  catch (e) {
    assert.fail("Cette garde compare deux grilles CALCULÉES — playwright est introuvable. "
      + "Installez-le, ou posez VUNA_CHROMIUM. Elle ne saute pas en silence : deux "
      + "gabarits identiques dans le source ne prouvent pas deux grilles identiques.");
  }
  const executablePath = CHROMIUMS.find((c) => existsSync(c));
  const nav = await chromium.launch(executablePath ? { executablePath } : {})
    .catch(() => assert.fail("Chromium introuvable. Cette garde ne saute pas."));
  try {
    const p = await (await nav.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
    await p.goto("file://" + SOLO);
    await p.waitForFunction(() => document.body && document.body.innerText.length > 400, null, { timeout: 60000 });
    await p.waitForFunction(`(() => { try { const i = ${INSTANCE};
      return !!(i.dfs && i.dfs['VX-EUR'] && i.dfs['VX-EUR'].n > 1000); } catch (e) { return false; } })()`,
    null, { timeout: 90000 });
    await p.evaluate(POSER_SEMIS);
    await p.evaluate("window.__semis.portefeuille(3)");
    await p.evaluate(`(() => { const i = ${INSTANCE};
      i.setState({ vue: 'portefeuille', pfOnglet: 1 }); i.forceUpdate(); })()`);
    await p.waitForFunction(() => document.querySelectorAll(".rang").length >= 3,
      null, { timeout: 60000 });

    const mes = await p.evaluate(() => {
      const tete = [...document.querySelectorAll("span")].find((x) =>
        getComputedStyle(x).display === "grid" && (x.textContent || "").includes("Instrument"));
      const rangs = [...document.querySelectorAll(".rang")];
      return {
        tete: tete ? { pistes: getComputedStyle(tete).gridTemplateColumns,
          cellules: tete.children.length } : null,
        rangs: rangs.map((r) => ({ pistes: getComputedStyle(r).gridTemplateColumns,
          cellules: r.children.length,
          periode: ((r.children[6] || {}).innerText || "").replace(/\s+/g, " ").trim(),
          retirer: ((r.children[7] || {}).innerText || "").trim() })),
      };
    });

    // ————— LA PRISE, AVANT LE VERDICT —————
    assert.ok(mes.tete, "l'en-tête du tableau des lignes n'est pas rendu : la garde "
      + "mesurerait le décor.");
    assert.ok(mes.rangs.length >= 3,
      "moins de trois rangées rendues (" + mes.rangs.length + ").");

    for (const r of mes.rangs) {
      assert.equal(r.cellules, mes.tete.cellules,
        "une rangée porte " + r.cellules + " cellules quand l'en-tête en déclare "
        + mes.tete.cellules + ". Le corps a une cellule que l'en-tête n'a pas : toutes "
        + "les colonnes après l'écart se décalent d'un cran, et deux d'entre elles se "
        + "partagent une piste. Une grille dont le nombre de colonnes porte du sens "
        + "compte ses cellules.");
      assert.equal(r.pistes, mes.tete.pistes,
        "les pistes CALCULÉES diffèrent — en-tête « " + mes.tete.pistes + " » contre "
        + "rangée « " + r.pistes + " ». Le même gabarit peut se résoudre différemment "
        + "sous deux parents ; c'est la grille résolue qui décale les colonnes, pas la "
        + "déclaration.");
    }

    // ————— ET LA PÉRIODE DIT QUELQUE CHOSE —————
    for (const r of mes.rangs) {
      assert.ok(r.periode && r.periode !== "—" && r.periode !== "— —",
        "la colonne « Période à tester » rend un tiret muet : « " + r.periode + " ». Un "
        + "tiret couvre trois causes — bornes non enregistrées, bougies non chargées, "
        + "configuration introuvable — et n'en nomme aucune : il disculpe sans avoir "
        + "regardé. Chacune des trois se dit en toutes lettres.");
      assert.match(r.periode, /^\d{4}\.\d{2}\.\d{2} \d{4}\.\d{2}\.\d{2}$/,
        "sur un portefeuille dont les trois lignes SONT mesurables, la période doit "
        + "rendre les deux dates au format du testeur. Rendu : « " + r.periode + " ». "
        + "Si c'est un message d'état, le semis ne sème plus des lignes mesurables et "
        + "la garde ne mesure plus le cas normal.");
      assert.equal(r.retirer, "Retirer",
        "la dernière colonne ne porte plus le retrait de la ligne : « " + r.retirer
        + " ». C'est la cellule que l'en-tête avait en trop, et sa disparition "
        + "réintroduit l'écart de comptes.");
    }
  } finally { await nav.close(); }
});
