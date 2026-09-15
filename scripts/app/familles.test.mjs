// ————— LE BANDEAU DE FAMILLES REGROUPE, ET IL NE MANGE PAS L'ÉCRAN —————
//
// Le cas réel : 176 instruments, 176 pastilles, toutes à « 0 / 1 ». Le dernier
// segment de SYMBOL_PATH est le symbole lui-même — MT5 l'écrit ainsi, profond
// (« Stocks\US\Tech\AAPL.O ») comme plat (« Forex\EURUSD ») — et la dérivation
// prenait les deux premiers segments : sur un chemin plat, le deuxième EST le
// symbole, et chaque instrument devenait sa propre famille. Un filtre dont
// chaque valeur sélectionne une ligne n'est pas un filtre, c'est la liste en
// double. Et douze rangées de pastilles (~470 px) poussaient la liste SOUS la
// fenêtre : le contenu existait, il n'était pas atteignable — le défaut de la
// confirmation de dépôt, une surface plus haut.
//
// Ce banc dépose un VRAI relevé par le vrai chemin (champReleve → confirmation),
// avec des chemins plats partagés ET une centaine de dossiers singuliers — assez
// pour que la borne de hauteur ait quelque chose à borner. Trois propriétés :
//
// 1. AUCUN nom de pastille ne contient un symbole du relevé : la feuille du
//    chemin ne fuit plus dans le nom de famille. C'est la propriété, pas le
//    compte — une famille singleton légitime existe (un dossier à un instrument),
//    mais un nom de famille qui porte le symbole est toujours le défaut.
// 2. Le bandeau est BORNÉ : au plus ~un quart de la fenêtre, le surplus défile à
//    l'intérieur. Le regroupement règle le cas courant ; un courtier à cent
//    dossiers légitimes referait le défaut sans la borne.
// 3. La première ligne de la liste est visible sans défiler — nommée quand elle
//    est masquée, parce que « la liste est figée » se diagnostique par ce qu'on
//    ne voit pas.
//
// ANGLE MORT, déclaré (règle 9) : le banc mesure l'artefact dans UN viewport
// (1280×720). Une fenêtre plus basse resserre la borne (elle est en vh, elle
// suit), mais le banc ne le mesure pas.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const SOLO = new URL("../../Vena.solo.html", import.meta.url).pathname;
const CHROMIUMS = [
  process.env.VENA_CHROMIUM,
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
].filter(Boolean);

function releveFixture() {
  const lignes = [];
  const l = (dossier, sym) => lignes.push(
    sym + ";" + sym + " descr;" + dossier + "\\" + sym
    + ";0.00001;5;1.1000;1.1001;12;100000;1;-5.5;1.2;20;0;USD");
  // six dossiers PARTAGÉS, aux formes du terrain — plat, espace, barre verticale
  for (const s of ["EURUSD", "GBPUSD", "USDJPY", "AUDCAD", "EURGBP", "USDCHF"]) l("Forex", s);
  for (const s of ["EURCZK", "USDTRY", "EURPLN", "USDZAR"]) l("Exotics", s);
  for (const s of ["GER40.cash", "US500.cash", "UK100.cash", "JP225.cash"]) l("Cash CFD", s);
  for (const s of ["AAPL", "TSLA", "MSFT", "NVDA", "AMZN"]) l("Equities | CFD", s);
  for (const s of ["GOLD", "SILVER"]) l("Metals", s);
  for (const s of ["BTCUSD", "ETHUSD"]) l("Crypto", s);
  // et cent dossiers d'un seul instrument : des familles singleton LÉGITIMES, dont
  // le seul rôle est de forcer plusieurs rangées de pastilles — sans elles, la
  // mutation « borne retirée » ne changerait rien et la garde serait vacue
  const syms = [];
  for (let k = 0; k < 100; k++) {
    const s = "SEC" + String(k).padStart(3, "0");
    l("Secteur " + String(k).padStart(3, "0"), s);
    syms.push(s);
  }
  const tete = "Symbol;Description;Path;Point;Digits;Bid;Ask;Spread;ContractSize;"
    + "SwapMode;SwapLong;SwapShort;StopsLevel;FreezeLevel;CurrencyProfit";
  return { csv: tete + "\n" + lignes.join("\n") + "\n",
    symboles: ["EURUSD", "GBPUSD", "USDJPY", "AUDCAD", "EURGBP", "USDCHF", "EURCZK",
      "USDTRY", "EURPLN", "USDZAR", "GER40.cash", "US500.cash", "UK100.cash",
      "JP225.cash", "AAPL", "TSLA", "MSFT", "NVDA", "AMZN", "GOLD", "SILVER",
      "BTCUSD", "ETHUSD", ...syms] };
}

test("les familles regroupent, le bandeau est borné, la liste reste visible", { timeout: 180000 }, async () => {
  let chromium;
  try { ({ chromium } = await import("playwright")); }
  catch (e) { assert.fail("playwright introuvable — cette garde ne saute pas en silence."); }
  const executablePath = CHROMIUMS.find((c) => existsSync(c));
  const nav = await chromium.launch(executablePath ? { executablePath } : {})
    .catch(() => assert.fail("Chromium introuvable : posez VENA_CHROMIUM — cette garde ne saute pas."));
  try {
    const ctx = await nav.newContext();
    const p = await ctx.newPage();
    await p.goto("file://" + SOLO);
    await p.waitForFunction(() => document.body && document.body.innerText.length > 400, { timeout: 60000 });
    const porte = await p.waitForSelector('button:has-text("J\'ai compris")', { timeout: 15000 }).catch(() => null);
    if (porte) {
      await porte.click();
      await p.waitForSelector(".dialog-backdrop", { state: "detached", timeout: 10000 }).catch(() => {});
    }
    // le dépôt passe par le VRAI chemin — champ, confirmation en place, accord
    const ong = await p.$('button:has-text("Mes instruments")');
    if (ong) { await ong.click(); await p.waitForTimeout(300); }
    await p.evaluate(() => {
      for (const b of document.querySelectorAll("button"))
        if (b.offsetParent !== null && /déplier/.test(b.textContent || "")) b.click();
    });
    await p.waitForTimeout(200);
    const fixture = releveFixture();
    const fichier = path.join(tmpdir(), "releve-familles.csv");
    writeFileSync(fichier, fixture.csv);
    const champ = await p.$("#champReleve");
    assert.ok(champ, "le champ du relevé (#champReleve) est introuvable : réancrez cette garde");
    await champ.scrollIntoViewIfNeeded();
    await champ.setInputFiles(fichier);
    const oui = await p.waitForSelector('button:has-text("Déposer sur"), button:has-text("Remplacer le relevé")',
      { timeout: 10000 });
    await oui.click();
    await p.waitForTimeout(600);
    // rechargement : l'état NATUREL de quelqu'un qui a déjà son relevé — cadre MT5
    // replié, la page telle qu'elle s'ouvre chaque matin. C'est cet état-là que la
    // capture de l'utilisateur montrait.
    await p.reload();
    // le barème se charge en ASYNCHRONE après le premier rendu : attendre la
    // population complète, pas la première pastille — mesurer l'état intermédiaire
    // ferait tomber la garde sur un écran que personne ne regarde plus d'un instant
    await p.waitForFunction(() => document.querySelectorAll("button.pg").length > 50, { timeout: 30000 });
    await p.waitForTimeout(400);
    // l'état de la capture : le cadre des gestes MT5 REPLIÉ. Sans bougies déposées,
    // le banc l'a déplié par défaut, et c'est lui qui pousse la liste — la garde
    // mesure le bandeau des familles, pas le cadre pédagogique.
    await p.evaluate(() => {
      for (const b2 of document.querySelectorAll("button"))
        if (b2.offsetParent !== null && /replier/i.test(b2.textContent || "")) b2.click();
    });
    await p.waitForTimeout(300);

    const mesure = await p.evaluate((symboles) => {
      const pastilles = [...document.querySelectorAll("button.pg")];
      const noms = pastilles.map((x) => {
        const n = x.querySelector(".nom");
        return ((n ? n.textContent : x.textContent) || "").trim();
      });
      const bandeau = pastilles[0] ? pastilles[0].parentElement : null;
      const rb = bandeau ? bandeau.getBoundingClientRect() : null;
      const rang = document.querySelector("table.table tbody tr, .table tbody tr");
      const rr = rang ? rang.getBoundingClientRect() : null;
      return {
        nPastilles: pastilles.length, noms,
        fuites: noms.filter((n2) => symboles.some((s) => n2.includes(s))),
        hBandeau: rb ? Math.round(rb.height) : null,
        deborde: bandeau ? bandeau.scrollHeight > bandeau.clientHeight + 4 : false,
        fenetre: innerHeight,
        ligne1: rr ? { haut: Math.round(rr.top), texte: (rang.textContent || "").trim().slice(0, 60) } : null,
      };
    }, fixture.symboles);

    // 1 · la feuille ne fuit plus dans le nom de famille
    assert.ok(mesure.nPastilles > 50,
      "le banc attendait ~106 familles et en voit " + mesure.nPastilles
      + " : le relevé n'est pas arrivé jusqu'au bandeau — la garde ne mesure rien");
    assert.deepEqual(mesure.fuites, [],
      "Des noms de famille CONTIENNENT un symbole du relevé :\n  " + mesure.fuites.join("\n  ")
      + "\n\nLe dernier segment de SYMBOL_PATH est le symbole lui-même : une dérivation "
      + "qui le garde fait de chaque instrument sa propre famille — 176 pastilles "
      + "« 0 / 1 », un filtre qui est la liste en double. La feuille se retire quand "
      + "elle est le symbole (familleCheminSeule).");
    // …et les dossiers partagés restent UN groupe chacun : six noms attendus, exacts
    for (const attendu of ["Forex", "Exotics", "Cash CFD", "Equities | CFD"]) {
      assert.ok(mesure.noms.includes(attendu),
        "le dossier partagé « " + attendu + " » n'est pas une pastille : le "
        + "regroupement ne regroupe plus, ou la langue du courtier a été remplacée "
        + "sans décision — pastilles vues : " + mesure.noms.slice(0, 12).join(", "));
    }

    // 2 · la borne : au plus ~un quart de la fenêtre, et le surplus défile DEDANS
    const borne = Math.round(mesure.fenetre * 0.26);
    assert.ok(mesure.hBandeau !== null && mesure.hBandeau <= borne,
      "le bandeau des familles fait " + mesure.hBandeau + " px pour " + mesure.fenetre
      + " px de fenêtre (borne ~" + borne + ") : sans borne de hauteur, cent dossiers "
      + "légitimes poussent la liste sous la fenêtre — le contenu existe, il n'est "
      + "pas atteignable");
    assert.ok(mesure.deborde,
      "le bandeau ne défile pas à l'intérieur alors que le banc lui a donné plus de "
      + "familles qu'il n'en montre : les pastilles au-delà de la borne seraient "
      + "INATTEIGNABLES — la borne sans le défilement est pire que pas de borne");

    // 3 · la première ligne de la liste est visible sans défiler — nommée sinon
    assert.ok(mesure.ligne1,
      "aucune ligne d'instrument n'est rendue : la liste est vide ou sa table a "
      + "changé de forme — réancrez le sélecteur");
    assert.ok(mesure.ligne1.haut < mesure.fenetre,
      "la première ligne de la liste (« " + mesure.ligne1.texte + " ») commence à "
      + mesure.ligne1.haut + " px pour " + mesure.fenetre + " px de fenêtre : elle est "
      + "SOUS la fenêtre — « la liste est figée, on ne voit rien » est exactement ce "
      + "défaut, vu de l'utilisateur");
  } finally {
    await nav.close();
  }
});
