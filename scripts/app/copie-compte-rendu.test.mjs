// ————— LE COMPTE RENDU D'UNE COPIE DÉCRIT CE QUI EST SORTI —————
//
// Le pied annonçait « 10 séries · 0 configuration · 592 Mo » pendant que la page
// montrait 66 séries et 3 961 configurations. Les deux premiers nombres étaient
// lus dans l'ÉTAT — `state.deposes` et `lignesScan` — et l'état n'est pas le
// fichier : dix, ce sont les séries d'EXEMPLE, les seules qui vivent en mémoire ;
// zéro, c'est un scan qui vit dans le stockage et pas dans `lignesScan`. Le
// troisième venait du FLUX, et lui était juste — c'est pourquoi 592 Mo restait
// cohérent avec soixante-six séries, et c'est ce détail qui a permis de deviner
// où était la fuite.
//
// MESURÉ AVANT DE CORRIGER, sur un puits qui capture : douze séries semées dans
// le stockage, douze blocs de séries dans le fichier produit, et le compte rendu
// qui disait « 10 · 0 ». Personne n'avait perdu de données. C'est la seule bonne
// nouvelle, et elle ne se supposait pas — les deux issues demandaient des gestes
// opposés, et l'une d'elles était « l'utilisateur a une copie sans ses données et
// il croit être sauvegardé ».
//
// C'est la classe du `r.ok` sous redirection, en pire : un compte rendu qui décrit
// ce qu'on croit avoir fait au lieu de ce qui est sorti. En pire, parce qu'ici la
// phrase RASSURE au lieu d'alerter.
//
// ANGLE MORT, déclaré (règle 9) : la partie structurelle lit le source, donc un
// compteur écrit dans un autre fichier lui échappe. La partie rendue, elle, mesure
// le VRAI fichier produit — et c'est elle qui couvre ce que la première ne voit pas.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { borne } from "../lib/tranche.mjs";

const APP = readFileSync(new URL("../../Vena.dc.html", import.meta.url), "utf8");
const SOLO = new URL("../../Vena.solo.html", import.meta.url).pathname;
const CHROMIUMS = [
  process.env.VENA_CHROMIUM,
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
].filter(Boolean);
const ligneDe = (i) => APP.slice(0, i).split("\n").length;

test("aucun compteur de copie n'est lu dans l'état — structurel", () => {
  // ANCRÉ SUR CE QUI AGIT (règle 3) : l'ÉCRITURE de la trace, avec ses champs.
  // `state.deposes` et `lignesScan` vivent légitimement partout ailleurs — ce sont
  // les données de travail de l'application. Ce qui est interdit, c'est qu'ils
  // alimentent les champs `nS` et `nC` de la trace d'une copie.
  const fautes = [];
  let k = APP.indexOf("this.CLE_SAUV), JSON.stringify({");
  while (k !== -1) {
    const corps = APP.slice(k, borne(APP, "}))", k));
    if (/nC:\s*\(this\.lignesScan/.test(corps) || /nS:\s*\(this\.state\.deposes/.test(corps)
      || /nC:\s*\(?this\.state\./.test(corps) || /nS:\s*\(?this\.state\./.test(corps)) {
      fautes.push("ligne " + ligneDe(k) + " : " + corps.replace(/\s+/g, " ").slice(0, 130));
    }
    k = APP.indexOf("this.CLE_SAUV), JSON.stringify({", k + 1);
  }
  assert.deepEqual(fautes, [],
    "La trace d'une copie compte depuis l'ÉTAT :\n  " + fautes.join("\n  ")
    + "\n\n`state.deposes` ce sont les séries EN MÉMOIRE — les dix séries d'exemple sur "
    + "un compte neuf — et `lignesScan` est vide dès que le scan vit dans le stockage "
    + "sans avoir été relu. Ni l'un ni l'autre ne décrit le FICHIER. `ecrireExportAu` "
    + "voit passer chaque bloc : `bilan.nS` et `bilan.nC` viennent de là, incrémentés à "
    + "l'écriture. Un compte rendu qui décrit l'intention au lieu du résultat rassure "
    + "sur une copie qu'on n'a peut-être pas.");
  // et la source autorisée EXISTE : sinon cette garde serait une interdiction sans issue
  const iE = APP.indexOf("async ecrireExportAu(sink, entete) {");
  assert.ok(iE > 0, "ecrireExportAu a changé de forme — réancrez, ne laissez pas la garde verte sur du vide");
  const corpsE = APP.slice(iE, borne(APP, "\n  }", iE));
  assert.match(corpsE, /if \(this\.estBlocSerie\(k\)\) nS \+= 1;/,
    "le bilan ne compte plus les blocs de séries À L'ÉCRITURE : d'où viendrait « nS » ?");
  assert.match(corpsE, /nC \+= nCbloc \|\| 0;/,
    "le bilan ne totalise plus les configurations livrées par le générateur : d'où "
    + "viendrait « nC » ?");
  assert.match(corpsE, /return \{ n, octets: [^}]*nS, nC \};/,
    "ecrireExportAu ne rend plus nS et nC : le compte rendu n'a plus de source dérivée");
  // ————— ET LES TROIS NOMBRES ONT LA MÊME SOURCE —————
  // C'est le mélange qui a rendu le défaut invisible : la taille venait du flux et
  // était JUSTE, les deux compteurs venaient de l'état et mentaient. Un compte rendu
  // dont un nombre sur trois est exact se lit comme un compte rendu exact — 592 Mo
  // était cohérent, donc « 10 séries » passait. Trois sources partielles valent moins
  // qu'une seule source complète.
  const traces = [];
  let j = APP.indexOf("this.CLE_SAUV), JSON.stringify({");
  while (j !== -1) { traces.push(APP.slice(j, borne(APP, "}))", j))); j = APP.indexOf("this.CLE_SAUV), JSON.stringify({", j + 1); }
  assert.ok(traces.length >= 2,
    traces.length + " écriture(s) de la trace d'une copie : il en faut au moins 2 (le "
    + "fil et le chiffré). La garde ne mesure plus les deux chemins — réancrez.");
  for (const t of traces) {
    assert.match(t, /o: (?:bilan\.octets|fichierC\.size)/,
      "une trace de copie n'inscrit pas de TAILLE mesurée sur le fichier : « "
      + t.replace(/\s+/g, " ").slice(0, 120) + " ». Le site chiffré n'en avait aucune — "
      + "il était doublement faux, deux compteurs lus dans l'état et pas de taille du "
      + "tout. Les trois nombres viennent du puits.");
    assert.match(t, /nS: (?:bilan|bilanC)\.nS/,
      "une trace de copie ne tire pas son compte de séries du bilan du flux");
    assert.match(t, /nC: (?:bilan|bilanC)\.nC/,
      "une trace de copie ne tire pas son compte de configurations du bilan du flux");
  }
  // les DEUX autres chemins produisent le même fichier, donc le même compte rendu
  assert.ok(APP.includes("return { dump, bilan: { nS, nC } };"),
    "dumpCompletAvecScan ne rend plus son bilan : le chemin chiffré et le repli Blob "
    + "produisent le même fichier que le fil — ils doivent produire le même compte rendu, "
    + "sinon le défaut revient par la porte de service");
});

test("le compte rendu d'une copie est celui du FICHIER — mesuré au rendu", { timeout: 180000 }, async () => {
  // LE CAS VIDE NE POUVAIT PAS LE MONTRER (règle 10) : sur un navigateur neuf,
  // mémoire et stockage disent la même chose, et le compteur fautif tombe juste par
  // accident. Le banc sème donc dans le STOCKAGE, par le chemin du produit, sans
  // passer par la mémoire — c'est très exactement l'état qui a révélé le défaut.
  let chromium;
  try { ({ chromium } = await import("playwright")); }
  catch (e) { assert.fail("playwright introuvable — cette garde ne saute pas en silence."); }
  const executablePath = CHROMIUMS.find((c) => existsSync(c));
  const nav = await chromium.launch(executablePath ? { executablePath } : {})
    .catch(() => assert.fail("Chromium introuvable : posez VENA_CHROMIUM — cette garde ne saute pas."));
  try {
    const p = await (await nav.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
    await p.goto("file://" + SOLO);
    await p.waitForFunction(() => document.body && document.body.innerText.length > 400, { timeout: 60000 });
    const porte = await p.waitForSelector('button:has-text("J\'ai compris")', { timeout: 15000 }).catch(() => null);
    if (porte) {
      await porte.click();
      await p.waitForSelector(".dialog-backdrop", { state: "detached", timeout: 10000 }).catch(() => {});
    }
    await p.waitForTimeout(400);
    const N = 12;
    const m = await p.evaluate(async (n) => {
      const el = document.querySelector("button");
      const fk = Object.keys(el).find((x) => x.startsWith("__reactFiber"));
      let f = el[fk];
      while (f && !(f.stateNode && f.stateNode.constructor
        && f.stateNode.constructor.name === "StreamableComponent")) f = f.return;
      const inst = f.stateNode.logic;
      // semé par le chemin du produit, DANS LE STOCKAGE, jamais dans la mémoire
      for (let s = 0; s < n; s++) {
        const brut = [];
        for (let k = 0; k < 120; k++) {
          brut.push({ t: Date.UTC(2024, 0, 1) + k * 3600000,
            o: 1 + k * 0.001, h: 1.02 + k * 0.001, l: 0.98 + k * 0.001, c: 1.01 + k * 0.001, v: 100 });
        }
        await inst.garderSerie("TEST" + String(s).padStart(2, "0"), brut);
      }
      let txt = "";
      const bilan = await inst.ecrireExportAu({ write: async (x) => { txt += x; } },
        '"outil":"vena","date":"x",');
      let obj = null;
      try { obj = JSON.parse(txt); } catch (e) { return { casse: String(e).slice(0, 120) }; }
      const cles = Object.keys(obj.donnees || {});
      return {
        casse: null,
        // CE QUE LE FICHIER CONTIENT, relu depuis le fichier lui-même
        seriesDansFichier: cles.filter((k) => inst.estBlocSerie(k)).length,
        // CE QUE LE COMPTE RENDU DIT
        nS: bilan.nS, nC: bilan.nC,
        // et l'ÉTAT, qui est la mauvaise source — gardé pour que l'écart se lise
        deposes: (inst.state.deposes || []).length,
        lignesScan: (inst.lignesScan || []).length,
        indexStockage: JSON.parse(localStorage.getItem(inst.cle(inst.CLE_SERIES)) || "[]").length,
      };
    }, N);
    assert.ok(!m.casse, "le fichier produit n'est pas du JSON valide : " + m.casse);
    assert.equal(m.indexStockage, N,
      "le semis n'a pas mis " + N + " séries dans le stockage (" + m.indexStockage + ") : la "
      + "garde mesurerait un écart qu'elle a elle-même manqué de créer");
    // L'ÉTAT DOIT DIFFÉRER DU FICHIER, sinon la garde ne prouve rien : c'est tout
    // l'intérêt de semer dans le stockage sans passer par la mémoire.
    assert.notEqual(m.deposes, m.seriesDansFichier,
      "mémoire et fichier disent la même chose (" + m.deposes + ") : dans cet état, un "
      + "compteur lu dans l'état tombe juste PAR ACCIDENT et la garde passe au vert sur "
      + "le défaut qu'elle prétend interdire. Réancrez le semis.");
    assert.equal(m.nS, m.seriesDansFichier,
      "le compte rendu annonce " + m.nS + " série(s) et le fichier en contient "
      + m.seriesDansFichier + ". L'état, lui, en voit " + m.deposes + " — c'est de là que "
      + "venait le chiffre, et c'est la mémoire de travail, pas la copie. Le compte se "
      + "dérive de ce qui traverse `ecrireExportAu`, incrémenté à l'écriture.");
    assert.equal(m.nC, 0,
      "le compte rendu annonce " + m.nC + " configuration(s) alors qu'aucun scan n'a été "
      + "semé : le total ne vient pas des blocs écrits");
  } finally {
    await nav.close();
  }
});
