// STATUT · CAUSE ÉTABLIE, MESURÉE. Rapporté sur cinq lignes du portefeuille : rouvertes
// en Backtest, les cinq panneaux affichaient « filtres · aucun actif sur 10 » et
// « Conditions : sans filtre » alors que les cinq lignes nomment chacune un filtre. Les
// compteurs, eux, correspondaient — donc les chiffres venaient de la mesure enregistrée,
// pas des réglages montrés à côté.
//
// ————— LA FIDÉLITÉ D'UNE REPRISE SE JUGE SUR CE QU'ELLE A RESTITUÉ —————
//
// `varianteRatee` demandait « une source a-t-elle été trouvée ? » pour prédire « le
// panneau montre-t-il les réglages de la ligne ? ». Encore la règle 1 : les deux
// divergent dès qu'une source est trouvée mais INCOMPLÈTE. Et le chemin de la photo
// `_reg` était pire — il posait le drapeau à `false` d'office puis annonçait
// « Configuration de la ligne restaurée à l'identique », une affirmation que rien ne
// vérifiait.
//
// `repriseEcart` compare CE QUI VA TOURNER (`cfgCourante` sur l'état résultant) à CE QUE
// LA LIGNE ÉTAIT (`cfgDeLigne`) : filtres, sécurisation, durée maximale, sens, lecture.
// Décider après, pas avant.
//
// ET LE MESSAGE NOMME CE QUI MANQUE. « CHIFFRES PÉRIMÉS » et « réglages modifiés »
// étaient affichés, et aucun lecteur ne les décode comme « ces réglages ne sont pas ceux
// qui ont produit ce chiffre » — c'est la différence entre signaler un écart et
// l'expliquer, et elle a coûté cinq mesures invalidées.
//
// ANGLE MORT DÉCLARÉ (règle 9) : elle éprouve la DÉTECTION, pas la restitution. Une
// reprise qui restituerait mal sans que `cfgDeLigne` puisse le voir — parce que le
// modèle de la ligne est lui-même faux — passerait. Ce qui fermerait ce trou est une
// comparaison au journal du scan d'origine, qui n'est pas conservé.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { POSER_SEMIS, INSTANCE } from "./lib/semis.mjs";

const SOLO = new URL("../../Vena.solo.html", import.meta.url).pathname;
const CHROMIUMS = [
  process.env.VENA_CHROMIUM,
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
].filter(Boolean);

test("une reprise qui ne restitue pas la condition de la ligne le DIT",
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
    await p.evaluate("window.__semis.scan(9)");
    await p.evaluate("window.__semis.decisions(3)");
    await p.waitForTimeout(400);

    // Une ligne qui ANNONCE un filtre dont la variante n'est retrouvable nulle part :
    // exactement l'état des cinq lignes rapportées. La reprise doit le dire.
    const lu = await p.evaluate("(() => { const l = " + INSTANCE + ";"
      + " const v = l.normValides(l.state.valides)[0];"
      + " const orpheline = { ...v, filtre: 'achat|adx@14/20|aucune|jamais|prudente',"
      + "   filtreNom: 'ADX D1(14) > 20 · lecture basse', _reg: { btBE: false } };"
      + " l.versBacktest(orpheline);"
      + " return { manques: l.state.repriseManques, incertaine: !!l.state.repriseIncertaine,"
      + "   ratee: !!l.state.varianteRatee }; })()");

    assert.ok(lu.manques || lu.incertaine || lu.ratee,
      "une ligne portant une condition que la reprise ne restitue PAS n'a produit aucun "
      + "signal : ni `repriseManques`, ni `repriseIncertaine`, ni `varianteRatee`. Le "
      + "panneau affichera « sans filtre » en silence, et un clic sur « Mesurer » "
      + "mesurera une autre stratégie sous le même nom — le défaut rapporté sur cinq "
      + "lignes sur cinq.");

    // ————— ET LE SIGNAL DOIT ÊTRE LISIBLE, PAS SEULEMENT PRÉSENT —————
    // Un drapeau posé dans l'état ne vaut rien s'il ne devient pas une phrase : c'est
    // la leçon des deux étiquettes que personne ne décodait.
    await p.waitForTimeout(600);
    const ecran = await p.evaluate(() => document.body.innerText);
    assert.match(ecran, /Reprise INCOMPLÈTE|Reprise non vérifiable|Condition de la ligne NON restaurée/,
      "le signal est posé dans l'état mais n'apparaît pas à l'écran : un drapeau que "
      + "personne ne lit est le défaut qu'on vient de retirer, pas sa correction.");
  } finally {
    await nav.close();
  }
});
