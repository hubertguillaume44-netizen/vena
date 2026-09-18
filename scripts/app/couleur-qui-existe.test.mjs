// STATUT · PANNE OBSERVÉE (RAPPORTÉE), MÉCANISME MESURÉ DANS LE DÉPÔT. L'utilisateur
// rapporte avoir perdu la structure entière d'une page — tous les cadres disparus —
// « sans une seule erreur de console », pour un `var(--color-border)` qui n'existe pas
// dans le système lié. Le mécanisme se relit ici : une propriété personnalisée non
// résolue rend la déclaration invalide, et `border-style` retombe à `none`. Le dépôt
// n'en portait aucune occurrence au moment d'écrire cette garde — elle ferme la CLASSE
// avant le premier cas, ce qui est le seul moment où c'est gratuit.
//
// ————— DEUX FAÇONS DE NE RIEN PEINDRE, ET AUCUNE NE SE PLAINT —————
//
// 1. Le jeton N'EXISTE PAS. `var(--color-border)` : la déclaration entière est jetée,
//    silencieusement. C'est le cas rapporté.
// 2. Le jeton existe et vaut la MÊME COULEUR que ce sur quoi il se pose. Mesuré ici :
//    `--color-neutral-100` vaut #f5f5f8, le fond de carte `--color-bg` vaut #f2f2f3 —
//    le « bandeau teinté » de la maquette est TROIS UNITÉS PLUS CLAIR que sa carte. Il
//    ne teinte rien. C'est le même mode de panne un cran plus loin : la déclaration est
//    valide, elle est appliquée, et elle ne produit aucune bande.
//
// Le premier se garde sur le SOURCE — un nom se lit. Le second ne se garde qu'au RENDU :
// il faut connaître la valeur du jeton ET celle du fond, et les deux viennent d'une
// feuille que le dépôt ne contrôle pas ligne à ligne.
//
// ANGLE MORT DÉCLARÉ, en tête. La première garde lit les `var(--…)` ÉCRITS : un nom de
// propriété assemblé à l'exécution lui échappe, et rien ici ne le referme — le dépôt n'en
// contient pas, et le jour où il en contiendra, cette note dit quoi remplacer. La seconde
// ne mesure QUE les trois bandeaux d'en-tête du portefeuille : les treize autres fonds
// posés en `--color-neutral-100` ailleurs dans l'application ne sont pas dans sa portée,
// et plusieurs sont dans le même cas — c'est relevé, pas corrigé.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { POSER_SEMIS, INSTANCE } from "./lib/semis.mjs";
import { borne } from "../lib/tranche.mjs";

const RACINE = new URL("../../", import.meta.url);
const APP = readFileSync(new URL("Vena.dc.html", RACINE), "utf8");
const SOLO_CHEMIN = new URL("Vena.solo.html", RACINE).pathname;
const SOLO = readFileSync(SOLO_CHEMIN, "utf8");
const CHROMIUMS = [process.env.VENA_CHROMIUM,
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].filter(Boolean);

const utilisees = (src) => [...new Set([...src.matchAll(/var\(\s*(--[A-Za-z0-9_-]+)/g)]
  .map((m) => m[1]))];
const definies = (src) => new Set([...src.matchAll(/(--[A-Za-z0-9_-]+)\s*:/g)].map((m) => m[1]));
// `borne` et non un `indexOf` en ligne : un motif introuvable rend −1, qui est une borne
// VALIDE pour `slice` — la tranche s'élargirait en silence et le numéro de ligne rapporté
// serait celui de la fin du fichier. La convention du dépôt, et sa garde m'a rattrapé.
const ligneDe = (src, motif) => src.slice(0, borne(src, motif)).split("\n").length;

test("chaque propriété de couleur lue est définie quelque part", () => {
  // la feuille du système de design, telle qu'elle est VENDORÉE — pas telle qu'on croit
  // qu'elle est : c'est elle qui décide, et elle peut changer sous l'application
  const dsDir = new URL("public/_ds/", RACINE).pathname;
  const dossier = readdirSync(dsDir).find((x) => x.startsWith("industry-"));
  assert.ok(dossier, "la feuille du système de design n'est plus sous `public/_ds/` : "
    + "cette garde n'a plus de référentiel et passerait au vert sans rien comparer.");
  const ds = definies(readFileSync(dsDir + dossier + "/styles.css", "utf8"));
  assert.ok(ds.size >= 25, "seulement " + ds.size + " propriétés relevées dans la feuille : "
    + "le relevé a perdu sa prise, et tout paraîtrait défini.");

  const propres = definies(APP);
  const lues = utilisees(APP);
  assert.ok(lues.length >= 15, "seulement " + lues.length + " `var(--…)` relevés dans la "
    + "source : le motif ne mord plus, et la garde ne regarde plus rien.");

  const orphelines = lues.filter((v) => !ds.has(v) && !propres.has(v));
  assert.deepEqual(orphelines.map((v) => v + " (ligne " + ligneDe(APP, "var(" + v) + ")"), [],
    "des propriétés de couleur lues ne sont définies NULLE PART. Une propriété "
    + "personnalisée non résolue rend sa déclaration invalide : `border-style` retombe à "
    + "`none`, et la page perd ses cadres sans une seule erreur de console. Le cas "
    + "rapporté est `--color-border`, qui n'existe pas dans ce système — pour un filet, "
    + "c'est `--color-divider` ; pour un trait plein, `--color-neutral-300` ; pour un "
    + "fond de bandeau, `--color-surface`.");

  // ————— ET CE QUI EST LIVRÉ PORTE SES DÉFINITIONS, VÉRIFIÉ SUR LA FEUILLE RÉELLE —————
  // La feuille ne voyage PAS en clair dans le fichier unique : elle part en `data:` base64
  // pour que le solo se suffise en « file:// ». Un relevé à plat du solo n'y trouve donc
  // AUCUNE définition et déclarerait les vingt-trois propriétés orphelines — une garde
  // qui accuse tout n'accuse rien. On décode la feuille livrée, et c'est elle qu'on lit.
  const m = /href="data:text\/css;base64,([A-Za-z0-9+/=]+)"/.exec(SOLO);
  assert.ok(m, "la feuille du système ne voyage plus en `data:text/css` dans le fichier "
    + "livré : la garde a perdu sa prise sur ce qui est RÉELLEMENT servi.");
  const feuilleLivree = Buffer.from(m[1], "base64").toString("utf8");
  const defSolo = new Set([...definies(feuilleLivree), ...definies(SOLO)]);
  assert.ok(defSolo.size >= 25, "seulement " + defSolo.size + " propriétés dans la feuille "
    + "livrée : le décodage a rendu autre chose qu'une feuille de style.");
  const orphSolo = utilisees(SOLO).filter((v) => !defSolo.has(v));
  assert.deepEqual(orphSolo, [],
    "le fichier LIVRÉ lit des propriétés que sa feuille incorporée ne définit pas. Si le "
    + "système vendoré cesse de porter un jeton, la source reste verte et c'est "
    + "l'utilisateur qui perd les cadres, sans une erreur.");
});

test("un bandeau d'en-tête est plus SOMBRE que ce sur quoi il se pose", { timeout: 180000 }, async () => {
  let chromium;
  try { ({ chromium } = await import("playwright")); }
  catch (e) {
    assert.fail("Cette garde compare deux couleurs RENDUES — playwright est introuvable. "
      + "Installez-le, ou posez VENA_CHROMIUM. Elle ne saute pas en silence : une bande "
      + "qui ne teinte pas est indistinguable d'une bande absente, et c'est justement "
      + "le défaut qu'elle mesure.");
  }
  const executablePath = CHROMIUMS.find((c) => existsSync(c));
  const nav = await chromium.launch(executablePath ? { executablePath } : {})
    .catch(() => assert.fail("Chromium introuvable. Cette garde ne saute pas."));
  try {
    const p = await (await nav.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
    await p.goto("file://" + SOLO_CHEMIN);
    await p.waitForFunction(() => document.body && document.body.innerText.length > 400, null, { timeout: 60000 });
    await p.waitForFunction(`(() => { try { const i = ${INSTANCE};
      return !!(i.dfs && i.dfs['VX-EUR'] && i.dfs['VX-EUR'].n > 1000); } catch (e) { return false; } })()`,
    null, { timeout: 90000 });
    await p.evaluate(POSER_SEMIS);
    await p.evaluate("window.__semis.portefeuille(3)");
    await p.evaluate(`(() => { const i = ${INSTANCE};
      i.setState({ vue: 'portefeuille', pfOnglet: 1 }); i.forceUpdate(); })()`);
    await p.waitForFunction(() => document.querySelectorAll("button.tete.carte").length >= 3,
      null, { timeout: 60000 });

    const mes = await p.evaluate(() => {
      const lum = (c) => {
        const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(c || "");
        return m ? (Number(m[1]) + Number(m[2]) + Number(m[3])) / 3 : null;
      };
      // ce sur quoi la bande se pose, c'est la première couleur DIFFÉRENTE d'elle en
      // remontant : un parent de la même teinte fait partie de la même bande — l'en-tête
      // d'une section porte parfois sa rangée, et se comparer à elle rendrait toujours
      // zéro, c'est-à-dire un verdict sur le décor
      const derriere = (el, sienne) => { let e = el.parentElement;
        while (e) { const c = getComputedStyle(e).backgroundColor;
          if (c && c !== "rgba(0, 0, 0, 0)" && c !== "transparent" && c !== sienne) return c;
          e = e.parentElement; }
        return null; };
      return [...document.querySelectorAll("button.tete.carte")].map((b) => {
        const sienne = getComputedStyle(b).backgroundColor;
        return { titre: (b.innerText || "").replace(/\s+/g, " ").trim().slice(0, 46),
          bande: lum(sienne), fond: lum(derriere(b, sienne)) };
      });
    });

    assert.ok(mes.length >= 3,
      "moins de trois en-têtes de carte rendus (" + mes.length + ") : la garde "
      + "mesurerait le décor.");
    for (const x of mes) {
      assert.ok(x.bande !== null && x.fond !== null,
        "le bandeau ou son fond n'a pas de couleur lisible sur « " + x.titre + " » : "
        + "un fond transparent veut dire qu'aucune bande n'est peinte.");
      const ecart = x.fond - x.bande;
      assert.ok(ecart >= 5,
        "le bandeau de « " + x.titre + " » est à " + Math.round(ecart) + " unité(s) de "
        + "ce sur quoi il se pose (" + Math.round(x.bande) + " contre "
        + Math.round(x.fond) + ") : il ne teinte rien, et un en-tête de carte qui ne se "
        + "distingue pas d'une note est une note. Mesuré : `--color-neutral-100` est "
        + "PLUS CLAIR que `--color-bg` dans ce système — le jeton qui porte ce rôle est "
        + "`--color-surface`. Un écart négatif veut dire que la bande est plus claire "
        + "que sa carte.");
    }
  } finally { await nav.close(); }
});
