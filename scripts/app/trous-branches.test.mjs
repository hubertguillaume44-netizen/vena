// ————— UN TROU DE GESTIONNAIRE NE ROUGIT PAS : IL NE BRANCHE RIEN —————
//
// Le runtime DC se plaint d'un trou de TEXTE non résolu — « {{ x }} never resolved
// — rendered as empty » — et `rendu-gabarit` en fait un échec. Un trou dans un
// attribut d'ÉVÉNEMENT ne dit rien du tout : il ne branche simplement aucun
// gestionnaire. Le bouton est là, il a l'air cliquable, et il est inerte.
//
// Le cas qui l'a fait naître : les pastilles de placement du portefeuille. Le
// gabarit lisait `cb3.ab` et `cb3.basculer` quand le producteur émettait `nom` et
// `placer`. DEUX trous sur la même rangée, et un seul a rougi — le texte. Le geste,
// lui, était mort chez tout utilisateur ayant un portefeuille, depuis toujours.
//
// C'EST LA GARDE DE PORTÉE, APPLIQUÉE AUX TROUS PLUTÔT QU'AUX VARIABLES.
// `portee-script` vérifie que toute référence d'un script est déclarée quelque part ;
// celle-ci vérifie que tout nom lu par le gabarit est ÉMIS par `renderVals`.
//
// ————— POURQUOI ELLE NE LIT PAS LE SOURCE —————
// La première version comparait les noms du gabarit à ceux qu'on trouve en clair
// dans le fichier. Mesuré : 29 faux positifs, et les 29 sont des clés CALCULÉES —
// `o['basculer' + n]`, `d['bsOuvre' + suf]`, `[p + 'Texte']`. Les inscrire une par
// une aurait été « ajouter le motif suivant », exactement ce que la règle 3 refuse.
// On change donc de forme : on demande à l'OBJET, pas au texte. `renderVals()` rend
// la table réelle, clés calculées comprises, et il n'y a plus rien à apprendre à la
// garde. C'est la même sortie que « la forme la plus pauvre et la plus sûre » — ici,
// la plus pauvre est l'objet lui-même.
//
// ————— ET LA PREUVE N'A PAS LA MÊME FORCE DES DEUX CÔTÉS —————
// Un chemin POINTÉ (`cb3.basculer`) tient un porteur CONCRET : l'objet que le gabarit
// lira vraiment pour cette rangée. S'il n'a pas la clé, rien ne sera branché — c'est
// décisif, et la garde ÉCHOUE. Un nom de PREMIER NIVEAU a pour porteur la table
// entière, dont la forme dépend de la branche de `renderVals` qui a tourné : son
// absence prouve que CET état ne l'émet pas, pas qu'aucun producteur ne l'émet.
//
// Ce n'est pas une prudence de principe, c'est une MESURE : les cinq noms de premier
// niveau que la garde relevait — `resupprimerRevenues`, `garderRevenues`,
// `voirLesLignes`, `mesurerParRegime`, `bcmpCalibrer` — sont TOUS émis, quatre en
// clair et un calculé (`[p + 'Calibrer']`), chacun dans une branche que l'état semé
// n'atteint pas. Cinq faux positifs sur cinq : les faire échouer aurait été la
// règle 1 à l'intérieur d'une garde écrite contre elle.
//
// ON A ESSAYÉ DE FERMER ÇA PAR LE SOURCE, ET C'ÉTAIT UN PIÈGE. Croiser les deux
// lectures — absent au rendu ET absent du fichier — retirait bien les cinq. Mais
// `basculer:` est émis VINGT-QUATRE fois ailleurs dans le fichier : le croisement
// aurait laissé passer le défaut fondateur. Chercher un nom quelque part dans tout un
// fichier pour conclure qu'un producteur PRÉCIS l'émet, c'est la règle 1 exactement —
// la même forme que la garde du tarif gelé, verte parce qu'un autre paragraphe parlait
// de facture. Le porteur concret est la seule prise honnête.
//
// ————— SON ANGLE MORT, AVEC SON CHIFFRE (règle 9) —————
// Deux familles ne sont pas vérifiables, et la garde les COMPTE au lieu de les passer
// sous silence : une boucle VIDE dans l'état du banc ne fournit aucun élément à
// interroger, et une BRANCHE non prise n'émet pas ses clés de premier niveau.
//
// UNE TROISIÈME A ÉTÉ FERMÉE, ET C'ÉTAIT LA PLUS GROSSE : la VUE. `renderVals()`
// appelé dans un seul onglet laissait `toutesRows` à `[]` et emportait vingt
// gestionnaires, comptés « liste vide » — avec un levier annoncé (le semis) qui
// n'était même pas le bon. La garde rend donc une table PAR VUE et ne conclut
// qu'après les avoir toutes essayées : mesuré, 53 non vérifiables sont tombés à 39,
// dont `toutesRows` de 20 à 1. Le compte affiché nomme ses listes : c'est ce qui
// distingue une file d'une fatalité. Ce compte est la mesure de sa propre couverture, et le levier
// pour le réduire est le SEMIS — c'est précisément ce qui a caché le défaut d'origine
// (un portefeuille semé à `syms: []` faisait disparaître toute la section). Le jour
// où ce compte remonte, c'est le semis qu'on étend, pas cette garde qu'on assouplit.
// Et elle ne couvre QUE les attributs d'événement : `title=`, `disabled=`, `value=`
// sont des trous d'attribut eux aussi muets, et ils restent hors de sa portée.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { POSER_SEMIS, INSTANCE } from "./lib/semis.mjs";

const APP = readFileSync(new URL("../../Vena.dc.html", import.meta.url), "utf8");
const SOLO = new URL("../../Vena.solo.html", import.meta.url).pathname;
const CHROMIUMS = [process.env.VENA_CHROMIUM,
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].filter(Boolean);

// ————— LE RELEVÉ DU GABARIT : la pile des `sc-for`, pas une liste de noms —————
// `cb3.basculer` n'a de sens que dans sa chaîne — `pfSections` → `ps.lignes` →
// `vl.cibles`. Sans la pile, un préfixe de boucle serait cherché à la racine et la
// garde rendrait un faux positif par rangée.
function relever(gabarit) {
  const re = /<sc-for\s+list="\{\{\s*([^}]+?)\s*\}\}"\s+as="(\w+)"|<\/sc-for>|\son([A-Z][A-Za-z]+)="\{\{\s*([^}]+?)\s*\}\}"/g;
  const pile = [], out = [];
  let m;
  while ((m = re.exec(gabarit)) !== null) {
    if (m[2]) pile.push({ nom: m[2], liste: m[1] });
    else if (m[0] === "</sc-for>") pile.pop();
    else out.push({ attr: "on" + m[3], chemin: m[4], boucles: pile.slice() });
  }
  return out;
}

const iDeb = APP.indexOf("<x-dc"), iFin = APP.indexOf("</x-dc>");
const TROUS = relever(APP.slice(iDeb, iFin));
// ————— LES VUES SE DÉCOUVRENT, ELLES NE S'ÉNUMÈRENT PAS (règle 7) —————
// `renderVals()` appelé dans UNE vue ne rend pas les producteurs des six autres :
// `toutesRows` sort `[]` hors de « historique », et vingt gestionnaires partaient
// avec. Une liste écrite à la main ici se périmerait au prochain onglet ; on prend
// donc toutes les valeurs que la source affecte à `vue`.
const VUES = [...new Set(APP.match(/vue: '[a-z]+'/g).map((x) => x.slice(6, -1)))].sort();

test("le relevé du gabarit a une prise", () => {
  assert.ok(iDeb > 0 && iFin > iDeb, "le gabarit <x-dc> est introuvable — réancrez");
  assert.ok(TROUS.length > 300,
    "le relevé ne trouve plus que " + TROUS.length + " attributs d'événement : la "
    + "garde ne regarderait plus qu'une fraction du gabarit sans le dire");
  const pts = TROUS.filter((t) => t.chemin.includes("."));
  const orphelins = pts.filter((t) => !t.boucles.some((b) => b.nom === t.chemin.split(".")[0]));
  assert.deepEqual(orphelins.map((t) => t.chemin), [],
    "des chemins pointés n'ont plus de boucle englobante qui lie leur préfixe : la "
    + "pile des `sc-for` ne se lit plus, et chaque rangée rendrait un faux positif");
});

test("tout attribut d'événement du gabarit résout vers un producteur", { timeout: 180000 }, async () => {
  let chromium;
  try { ({ chromium } = await import("playwright")); }
  catch (e) { assert.fail("playwright introuvable — cette garde ne saute pas en silence."); }
  const exe = CHROMIUMS.find((c) => existsSync(c));
  const nav = await chromium.launch(exe ? { executablePath: exe } : {})
    .catch(() => assert.fail("Chromium introuvable : posez VENA_CHROMIUM — cette garde ne saute pas."));
  try {
    const p = await (await nav.newContext()).newPage();
    await p.goto("file://" + SOLO);
    await p.waitForFunction(() => document.body && document.body.innerText.length > 400, { timeout: 60000 });
    const porte = await p.waitForSelector('button:has-text("J\'ai compris")', { timeout: 15000 }).catch(() => null);
    if (porte) {
      await porte.click();
      await p.waitForSelector(".dialog-backdrop", { state: "detached", timeout: 10000 }).catch(() => {});
    }
    // l'état PEUPLÉ, parce qu'une liste vide n'a aucun élément à interroger : le semis
    // est le levier de la couverture de cette garde, pas un décor
    await p.evaluate(POSER_SEMIS);
    await p.evaluate("window.__semis.scan(9)");
    await p.evaluate("window.__semis.journal(12)");
    await p.evaluate("window.__semis.decisions(3)");
    await p.evaluate(`window.__inst = ${INSTANCE}; void 0;`);
    await p.waitForTimeout(600);

    const bilan = await p.evaluate(({ trous, vues }) => {
      // ————— UNE TABLE PAR VUE —————
      // `renderVals()` appelé dans UNE vue ne rend pas les producteurs des six autres :
      // `toutesRows` sort `[]` hors de « historique », et vingt gestionnaires partaient
      // avec, comptés à tort comme « liste vide » — un angle mort dont le levier
      // annoncé (le semis) n'était même pas le bon.
      const tables = [];
      for (const v of vues) {
        try { window.__inst.state.vue = v; tables.push([v, window.__inst.renderVals()]); }
        catch (e) { /* une vue qui jette est le sujet de `rendu-gabarit`, pas d'ici */ }
      }
      if (!tables.length) throw new Error("aucune vue n'a rendu sa table");

      const lire = (chemin, liens, vals) => {
        const bouts = String(chemin).split(".");
        let cur = Object.prototype.hasOwnProperty.call(liens, bouts[0]) ? liens[bouts[0]] : vals[bouts[0]];
        for (let i = 1; i < bouts.length && cur != null; i++) cur = cur[bouts[i]];
        return cur;
      };
      // rend "ok" | "vide:<liste>" | "absent:<porteur>" pour UNE table
      const essayer = (t, vals) => {
        const liens = {};
        for (const b of t.boucles) {
          const l = lire(b.liste, liens, vals);
          // `pfSections` rend `null` pour un portefeuille sans ligne : on saute les
          // trous, on ne les prend pas pour des éléments
          const el = Array.isArray(l) ? l.find((x) => x && typeof x === "object") : null;
          if (!el) return "vide:" + b.liste;
          liens[b.nom] = el;
        }
        const bouts = t.chemin.split(".");
        const cle = bouts[bouts.length - 1];
        const porteur = bouts.length === 1 ? vals : lire(bouts.slice(0, -1).join("."), liens, vals);
        if (porteur && typeof porteur === "object" && (cle in porteur)) return "ok";
        return "absent:" + (bouts.length === 1 ? "(racine)" : bouts.slice(0, -1).join("."));
      };

      const manquants = [], nonVerifiables = [];
      for (const t of trous) {
        // UN TROU RÉSOLU DANS N'IMPORTE QUELLE VUE EST RÉSOLU : le gabarit ne le lit
        // que là où son `sc-if` le rend. On ne conclut donc qu'après les avoir TOUTES
        // essayées — conclure sur la première serait décider avant de mesurer.
        const issues = tables.map(([, vals]) => essayer(t, vals));
        if (issues.includes("ok")) continue;
        const dur = issues.find((x) => x.startsWith("absent:"));
        const bouts = t.chemin.split(".");
        // ————— LA PREUVE N'A PAS LA MÊME FORCE DES DEUX CÔTÉS —————
        // Un chemin POINTÉ tient un porteur CONCRET : l'objet que le gabarit lira
        // vraiment pour cette rangée. S'il n'a pas la clé dans AUCUNE vue, rien ne
        // sera branché — c'est décisif, et ça échoue.
        // Un nom de PREMIER NIVEAU a pour porteur la table entière, dont la forme
        // dépend de la branche qui a tourné : son absence prouve que ces états ne
        // l'émettent pas, pas qu'aucun producteur ne l'émet.
        if (dur && bouts.length > 1) {
          manquants.push(t.attr + '="{{ ' + t.chemin + ' }}" (porteur : ' + dur.slice(7) + ")");
        } else if (dur) {
          nonVerifiables.push(t.attr + '="{{ ' + t.chemin + ' }}" (branche non prise)');
        } else {
          nonVerifiables.push(t.attr + '="{{ ' + t.chemin + ' }}" (liste vide : '
            + issues[0].slice(5) + ")");
        }
      }
      return { manquants, nonVerifiables, nVues: tables.length,
        nCles: Object.keys(tables[0][1]).length };
    }, { trous: TROUS, vues: VUES });

    // LE COMPTE SEUL NE DIT PAS QUOI ÉTENDRE. Il est le levier du semis : sans les
    // listes qui le composent, il se lit comme une fatalité au lieu d'une file.
    const parListe = {};
    for (const x of bilan.nonVerifiables) {
      const m = /\(liste vide : ([^)]+)\)/.exec(x);
      const k = m ? m[1] : "branche non prise";
      parListe[k] = (parListe[k] || 0) + 1;
    }
    const top = Object.entries(parListe).sort((u, v) => v[1] - u[1])
      .map(([k, n]) => k + " ×" + n).join(", ");
    console.log("    [trous] " + TROUS.length + " attributs d'événement · "
      + bilan.nCles + " clés émises par renderVals · "
      + bilan.nonVerifiables.length + " non vérifiables — " + top);
    assert.deepEqual(bilan.manquants, [],
      "Des attributs d'événement lisent un nom que `renderVals` n'émet PAS. Le "
      + "gestionnaire n'est pas branché : le bouton s'affiche, il a l'air cliquable, "
      + "et le clic ne fait rien — sans le moindre avertissement, parce qu'un trou "
      + "d'attribut ne rougit pas comme un trou de texte.\n  "
      + bilan.manquants.join("\n  "));
    // L'ANGLE MORT EST BORNÉ, ET SON PLAFOND EST UNE MESURE. S'il remonte, c'est le
    // SEMIS qu'on étend — une liste vide de plus est un pan du gabarit que plus
    // personne ne vérifie, et c'est exactement la panne d'origine.
    assert.ok(bilan.nonVerifiables.length <= 42,
      bilan.nonVerifiables.length + " attributs d'événement ne sont pas vérifiables "
      + "— boucle VIDE ou branche non prise dans l'état semé, au-dessus du plafond de 42. "
      + "Ce n'est pas cette garde qu'il faut assouplir, c'est `semis.mjs` qu'il faut "
      + "étendre : une liste vide est un pan du gabarit que personne ne regarde, et "
      + "c'est précisément ce qui a laissé les pastilles de placement inertes pendant "
      + "des mois.\n  " + bilan.nonVerifiables.slice(0, 25).join("\n  "));
  } finally { await nav.close(); }
});
