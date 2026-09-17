// STATUT · CAUSE ÉTABLIE, MESURÉE. La chaîne de configuration d'une ligne de
// portefeuille taisait la sécurisation. Deux lignes dont l'une porte un point mort et
// l'autre rien s'affichaient à l'identique — vérifié au rendu, c'est ce que cette garde
// éprouve.
//
// ————— UN RÉGLAGE TU EST UNE ABSENCE DE VOCABULAIRE, PAS UNE ABSENCE DE RÉGLAGE —————
//
// Ce que ça a coûté : en cherchant ce qui distinguait quatre configurations divergentes
// de cinq concordantes face au testeur MT5, on a lu ces chaînes, conclu « pas de
// sécurisation », et cherché ailleurs — pendant des semaines. La règle 1 dans une chaîne
// d'affichage : on a demandé à un LIBELLÉ (« le mot palier y est-il ? ») de prédire un
// ÉTAT (« cette ligne porte-t-elle un palier ? »).
//
// Et le réglage tu était le pire de tous : mesuré sur les dix séries d'exemple, un point
// mort à 25 % rend 22 % des trades indécidables, et sur cinq familles sur dix le
// résultat CHANGE DE SIGNE selon la convention de lecture intra-bougie. Le seul réglage
// capable de renverser le signe était le seul absent de la description.
//
// ELLE SE MESURE AU RENDU, ET C'EST NÉCESSAIRE. Lire dans la source que le producteur
// appelle `secuTexte` prouverait que l'appel est écrit, jamais que deux configurations
// différentes s'affichent différemment — c'est-à-dire précisément ce qui manquait.
//
// ANGLE MORT DÉCLARÉ (règle 9) : elle éprouve la sécurisation, parce que c'est le
// réglage qui a mordu et qu'on sait le faire varier par le semis. Elle n'énumère pas
// « tout ce que `etatDeLigne` résout » — cet état porte des dizaines de champs, dont la
// plupart ne décrivent pas la configuration. Un réglage neuf qui déciderait du résultat
// et resterait tu naîtrait hors de sa portée ; le jour où l'un d'eux se mesure, c'est
// ici qu'il vient.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { POSER_SEMIS, INSTANCE } from "./lib/semis.mjs";
import { CLIC_CONTIENT, CLIC_EXACT } from "./lib/vues.mjs";

const SOLO = new URL("../../Vena.solo.html", import.meta.url).pathname;
const CHROMIUMS = [
  process.env.VENA_CHROMIUM,
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
].filter(Boolean);

test("deux lignes qui ne diffèrent que par leur sécurisation ne s'affichent pas pareil",
  { timeout: 180000 }, async () => {
  let chromium;
  try { ({ chromium } = await import("playwright")); }
  catch { assert.fail("garde de rendu : playwright introuvable. Elle ne saute pas."); }
  const executablePath = CHROMIUMS.find((c) => existsSync(c));
  const nav = await chromium.launch(executablePath ? { executablePath } : {})
    .catch(() => assert.fail("Chromium introuvable : cette garde ne saute pas."));
  try {
    const p = await (await nav.newContext()).newPage();
    await p.goto("file://" + SOLO);
    await p.waitForFunction(() => document.body && document.body.innerText.length > 400,
      { timeout: 60000 });
    const porte = await p.waitForSelector("button:has-text(\"J'ai compris\")", { timeout: 15000 })
      .catch(() => null);
    if (porte) {
      await porte.click();
      await p.waitForSelector(".dialog-backdrop", { state: "detached", timeout: 10000 }).catch(() => {});
    }
    await p.evaluate(POSER_SEMIS);
    await p.evaluate("window.__semis.decisions(3)");
    await p.waitForTimeout(400);

    // Deux lignes IDENTIQUES sauf la sécurisation, posées par le chemin du produit :
    // `_reg` est la photo de réglages que `etatDeLigne` lit en priorité.
    const lu = await p.evaluate("(() => { const l = " + INSTANCE + ";"
      + " const v = l.normValides(l.state.valides)[0];"
      + " const sans = { ...v, _reg: { btBE: false } };"
      + " const avec = { ...v, _reg: { btBE: true, typeSecu: 'be_progressif',"
      + "   beSeuil1: 50, beNiveau1: 0, beSeuil2: 0, beSeuil3: 0 } };"
      + " return { sans: l.secuTexte(sans), avec: l.secuTexte(avec) }; })()");

    assert.notEqual(lu.sans, lu.avec,
      "une ligne AVEC point mort et une ligne SANS rendent la même description de "
      + "sécurisation (« " + lu.sans + " ») : la chaîne de configuration ne distingue "
      + "pas deux lignes dont les résultats peuvent être de signes opposés.");
    assert.match(lu.sans, /Aucune sécurisation/,
      "une ligne sans sécurisation rend « " + lu.sans + " » au lieu de le DIRE. Le "
      + "silence ne suffit pas : un champ qui disparaît quand il vaut zéro est "
      + "indistinguable d'un champ qu'on ne montre pas, et c'est cette confusion-là "
      + "qui a été payée.");
    assert.match(lu.avec, /50.*0/,
      "la ligne AVEC point mort ne nomme pas son seuil ni son niveau : « " + lu.avec
      + " ». « Une sécurisation » sans ses chiffres ne permet pas de comparer deux lignes.");

    // ————— ET LA CHAÎNE RENDUE LA PORTE VRAIMENT —————
    // `secuTexte` peut être juste et n'être appelée nulle part : c'est le trou que
    // l'ancrage par nom ouvre, et il se ferme en lisant l'écran.
    // la vue du portefeuille, seule à rendre ces chaînes — sans ce trajet la garde
    // lirait l'écran d'accueil et conclurait « absente » sur une page qui ne les
    // affiche pas, ce qui est une mesure fausse qui a l'air d'une mesure.
    await p.evaluate(`(${CLIC_CONTIENT})("Mes décisions")`);
    await p.waitForTimeout(500);
    await p.evaluate(`(${CLIC_EXACT})("Portefeuille")`);
    await p.waitForTimeout(800);
    const ouverte = await p.evaluate("(() => { const l = " + INSTANCE + "; return String(l.state.vue); })()");
    assert.equal(ouverte, "portefeuille",
      "la vue du portefeuille ne s'est pas ouverte (vue = " + ouverte + ") : la garde "
      + "aurait rendu son verdict sur un autre écran.");
    const vue = await p.evaluate(() => {
      const t = document.body.innerText;
      return { secu: /Aucune sécurisation|Point mort|Paliers |Stop suiveur/.test(t) };
    });
    assert.ok(vue.secu,
      "aucune description de sécurisation n'apparaît à l'écran du portefeuille : "
      + "`secuTexte` est peut-être juste, mais la chaîne rendue ne la porte pas — "
      + "la garde serait verte sur un texte que personne n'affiche.");
  } finally {
    await nav.close();
  }
});
