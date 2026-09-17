// ————— AUCUNE SORTIE DE L'EXPORT DE ROBOT NE SE TAIT —————
//
// Sept rapports en trois jours ont dit la même phrase : « Exporter ne produit rien. »
// À chaque fois la cause était ailleurs, et à chaque fois la FORME était la même — un
// chemin qui sort sans écrire un mot. Un geste qui ne répond pas n'est pas un geste
// qui échoue : c'est un geste qu'on ne peut pas déboguer, et l'utilisateur ne peut
// que recliquer.
//
// LA DERNIÈRE OCCURRENCE A NOMMÉ SON DISCRIMINANT, ET CE N'ÉTAIT PAS LE SYMBOLE.
// Trois instruments muets portaient tous « Sous résistance D1 20 (marge 1 %) » ; celui
// qui s'exportait portait « ADX D1(14) > 20 ». Le filtre, pas l'instrument : c'est
// `filtresBloquants` qui refuse, et son refus PARLE — mais il parlait après le clic,
// sur un bouton qui s'était offert plein.
//
// CETTE GARDE EST STRUCTURELLE, ET C'EST VOULU. Elle ne cherche pas un mot dans le
// fichier — chercher « hasardMsg » dans tout `exporterRobotBrut` pour conclure que
// CHAQUE sortie parle serait la règle 1 dans sa forme la plus pure : une intention
// (« le sujet est mentionné ») pour un résultat (« ce chemin-ci écrit »). Elle PARSE
// la méthode (espree) et, pour chaque `return` qui rend un échec, exige qu'une pose de
// message existe AVANT lui dans le même bloc. Un `return false` ajouté demain dans une
// branche neuve la fait tomber, même si le mot « hasardMsg » abonde ailleurs.
//
// ANGLE MORT DÉCLARÉ (règle 9) : elle juge la PRÉSENCE d'une pose de message dans le
// bloc, pas ce que ce message DIT. Un `setState({ hasardMsg: '' })` la satisferait. Ce
// qu'un message dit se mesure au rendu — c'est le rôle de `geste-sans-effet` et de la
// tournée, qui exercent le refus depuis que le semis porte une ligne refusée.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as espree from "espree";
import { existsSync } from "node:fs";
import { POSER_SEMIS, INSTANCE } from "./lib/semis.mjs";

const SOLO = new URL("../../Vena.solo.html", import.meta.url).pathname;
const CHROMIUMS = [
  process.env.VENA_CHROMIUM,
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
].filter(Boolean);

const SRC = readFileSync(new URL("../../Vena.dc.html", import.meta.url), "utf8");

// les <script> en ligne, comme la garde de portée les lit
function blocsScript(src) {
  const blocs = [];
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(src))) {
    if (/\bsrc\s*=/.test(m[1])) continue;
    blocs.push({ code: m[2] });
  }
  return blocs;
}

// tous les nœuds, sans connaître la grammaire : on descend ce qui est objet
function* noeuds(n) {
  if (!n || typeof n !== "object") return;
  if (Array.isArray(n)) { for (const x of n) yield* noeuds(x); return; }
  if (typeof n.type === "string") yield n;
  for (const k of Object.keys(n)) {
    if (k === "parent" || k === "loc" || k === "range") continue;
    yield* noeuds(n[k]);
  }
}

// « ce return rend-il un échec ? » — false, null, undefined, ou rien du tout
function rendUnEchec(r) {
  const a = r.argument;
  if (!a) return true;
  if (a.type === "Literal" && (a.value === false || a.value === null)) return true;
  if (a.type === "Identifier" && a.name === "undefined") return true;
  return false;
}

// ————— « LE MESSAGE EST QUELQUE PART AVANT » N'EST PAS « CE CHEMIN PARLE » —————
//
// Premier jet : on demandait qu'une pose de message existe n'importe où dans le
// SOUS-ARBRE d'une instruction précédente. Éprouvé par mutation — on retire le message
// qui précède `return false` dans la branche des filtres bloquants —, la garde N'EST
// PAS TOMBÉE : le `try { … } catch { setState({ hasardMsg }); return false; }` du haut
// de la méthode est une instruction précédente, et son catch contient bien une pose.
// N'importe quel `return` situé après lui se trouvait couvert par le message d'une
// AUTRE branche.
//
// C'était la règle 1 à l'intérieur même de la garde écrite pour la dénoncer : « le mot
// apparaît plus haut » est une intention, « CETTE sortie écrit » est le résultat. La
// prise est donc resserrée à une instruction FRÈRE : la pose doit être une instruction
// à part entière du bloc du `return` (ou d'un bloc qui l'englobe), placée avant lui.
// Une pose enfouie dans le catch d'un try voisin ne compte plus.
function poseUnMessage(st) {
  if (!st) return false;
  let e = st.type === "ExpressionStatement" ? st.expression : null;
  while (e && e.type === "AwaitExpression") e = e.argument;
  if (!e || e.type !== "CallExpression" || !e.callee) return false;
  const c = e.callee;
  const nom = c.type === "MemberExpression" && c.property && c.property.name;
  if (nom === "journaliserErreur") return true;
  if (nom !== "setState") return false;
  const arg = e.arguments && e.arguments[0];
  if (!arg) return false;
  for (const y of noeuds(arg)) {
    if (y.type === "Property" && y.key && (y.key.name === "hasardMsg" || y.key.value === "hasardMsg")) return true;
  }
  return false;
}

const METHODES = ["exporterRobot", "exporterRobotBrut"];

test("chaque sortie en échec de l'export de robot a posé un message avant de partir", () => {
  const blocs = blocsScript(SRC);
  // ————— LA GARDE DOIT TOMBER EN PERDANT SA PRISE, PAS SE TAIRE —————
  const porteur = blocs.find((b) => b.code.includes("async exporterRobotBrut("));
  assert.ok(porteur, "« async exporterRobotBrut( » n'est plus dans un <script> en ligne "
    + "de Vena.dc.html : cette garde ne lit plus rien. Réancrez-la sur la nouvelle forme "
    + "plutôt que de la laisser verte sur du vide.");

  const ast = espree.parse(porteur.code, { ecmaVersion: 2022, sourceType: "script", loc: true });
  const trouvees = new Map();
  for (const n of noeuds(ast)) {
    if (n.type !== "MethodDefinition" || !n.key) continue;
    if (!METHODES.includes(n.key.name)) continue;
    trouvees.set(n.key.name, n.value);
  }
  assert.deepEqual([...trouvees.keys()].sort(), [...METHODES].sort(),
    "les deux méthodes de l'export de robot ne se retrouvent plus par leur nom : "
    + "trouvée(s) " + [...trouvees.keys()].join(", ") + ". La garde perd sa prise.");

  const muets = [];
  let nRetours = 0;
  for (const [nom, fn] of trouvees) {
    // les blocs de la méthode, du plus intérieur au plus extérieur : un `return` est
    // couvert par un message posé dans SON bloc, ou dans un bloc qui l'englobe et qui
    // le précède. On remonte donc la chaîne plutôt que de juger sur le seul bloc.
    const chaine = [];
    const descendre = (n, pile) => {
      if (!n || typeof n !== "object") return;
      if (Array.isArray(n)) { for (const x of n) descendre(x, pile); return; }
      if (n.type === "FunctionExpression" || n.type === "ArrowFunctionExpression"
        || n.type === "FunctionDeclaration") {
        // une fonction imbriquée a ses propres sorties : un `return` d'un `.map()`
        // n'est pas une sortie de l'export, et l'exiger parlant serait absurde
        if (n !== fn) return;
      }
      if (n.type === "ReturnStatement") { chaine.push({ ret: n, pile: [...pile] }); return; }
      const pile2 = n.type === "BlockStatement" || n.type === "Program" ? [...pile, n] : pile;
      for (const k of Object.keys(n)) {
        if (k === "loc" || k === "range" || k === "parent") continue;
        descendre(n[k], pile2);
      }
    };
    descendre(fn.body, []);
    for (const { ret, pile } of chaine) {
      if (!rendUnEchec(ret)) continue;
      nRetours++;
      const couvert = pile.some((bloc) => (bloc.body || []).some((st) =>
        st.loc.start.line <= ret.loc.start.line && poseUnMessage(st)));
      if (!couvert) muets.push(nom + " ligne " + ret.loc.start.line + " du <script>");
    }
  }
  // ————— UNE GARDE QUI NE COMPTE RIEN NE GARDE RIEN —————
  // Si la forme de la méthode change au point qu'aucune sortie en échec n'est plus
  // reconnue, elle passerait au vert sans avoir rien examiné.
  assert.ok(nRetours >= 3, "seules " + nRetours + " sortie(s) en échec reconnues dans "
    + METHODES.join(" / ") + " : la garde n'a plus de prise sur la forme de ces "
    + "méthodes, et un `return` muet lui échapperait sans qu'elle rougisse.");
  assert.deepEqual(muets, [],
    "sortie(s) en échec sans message posé :\n  " + muets.join("\n  ")
    + "\n\nUn chemin qui sort sans écrire un mot rend « Exporter ne produit rien » — la "
    + "phrase qu'on ne peut pas déboguer, rapportée sept fois en trois jours. Posez "
    + "`this.setState({ hasardMsg: … })` AVANT de sortir, et que le message nomme la "
    + "cause : « le filtre X n'a pas d'équivalent MQL5 » se lit, « le robot n'a pas pu "
    + "être exporté » fait recliquer.");
});

// ————— ET LE REFUS SE SAIT AVANT LE CLIC —————
//
// La garde ci-dessus tient la moitié aval : quoi qu'il arrive, la sortie parle. Celle-ci
// tient l'amont, et c'est le geste que l'utilisateur a demandé en premier : « un bouton
// plein qui refuse est pire qu'un bouton éteint qui explique ». Elle se mesure au RENDU
// parce qu'un bouton grisé n'existe qu'à l'écran — lire `disabled="{{ vl.robBloque }}"`
// dans la source prouverait que l'attribut est écrit, jamais qu'il vaut vrai sur la
// ligne qu'il doit éteindre.
//
// Le semis pose UNE ligne refusée sur trois : la garde exige donc un grisé ET deux
// offerts. Exiger seulement « au moins un grisé » laisserait passer un prédicat qui
// grise tout, ce qui retirerait un geste qui marche — l'erreur symétrique, et la pire
// des deux.
test("le bouton d'export se grise sur la ligne refusée, et son infobulle nomme le filtre",
  { timeout: 180000 }, async () => {
  let chromium;
  try { ({ chromium } = await import("playwright")); }
  catch {
    assert.fail("garde de rendu : playwright est introuvable. Installez-le ou posez "
      + "VENA_CHROMIUM. Elle ne saute pas en silence.");
  }
  const executablePath = CHROMIUMS.find((c) => existsSync(c));
  const nav = await chromium.launch(executablePath ? { executablePath } : {})
    .catch(() => assert.fail("Chromium introuvable : cette garde ne saute pas."));
  try {
    const p = await (await nav.newContext({ acceptDownloads: true })).newPage();
    let telecharges = 0;
    p.on("download", () => { telecharges++; });
    await p.goto("file://" + SOLO);
    await p.waitForFunction(() => document.body && document.body.innerText.length > 400,
      { timeout: 60000 });
    const porte = await p.waitForSelector('button:has-text("J\'ai compris")', { timeout: 15000 })
      .catch(() => null);
    if (porte) {
      await porte.click();
      await p.waitForSelector(".dialog-backdrop", { state: "detached", timeout: 10000 }).catch(() => {});
    }
    // le semis JETTE si sa ligne refusée ne l'est pas : il relit par refusExport()
    await p.evaluate(POSER_SEMIS);
    await p.evaluate("window.__semis.scan(9)");
    await p.evaluate("window.__semis.decisions(3)");
    await p.waitForTimeout(500);
    await p.evaluate((k) => {
      const b = [...document.querySelectorAll("button")].find((x) => x.offsetParent !== null
        && !x.disabled && ((x.textContent || "").trim().replace(/\s+/g, " ").includes(k)));
      if (b) b.click();
    }, "Mes décisions");
    await p.waitForTimeout(500);
    await p.evaluate(() => {
      const b = [...document.querySelectorAll("button")].find((x) => x.offsetParent !== null
        && !x.disabled && (x.textContent || "").trim() === "Portefeuille");
      if (b) b.click();
    });
    await p.waitForTimeout(800);

    const boutons = await p.evaluate(() => [...document.querySelectorAll("button")]
      .filter((x) => x.offsetParent !== null && (x.textContent || "").trim() === "Exporter")
      .map((x) => ({ eteint: x.disabled, titre: x.title || "" })));
    assert.equal(boutons.length, 3, "le portefeuille ne rend plus trois boutons "
      + "« Exporter » (" + boutons.length + ") : la garde ne mesure plus la vue qu'elle "
      + "croit mesurer.");
    const eteints = boutons.filter((b) => b.eteint);
    assert.equal(eteints.length, 1,
      eteints.length + " bouton(s) « Exporter » éteint(s) sur 3, 1 attendu. Le semis pose "
      + "UNE ligne portant « Sous résistance », qui n'a pas d'équivalent MQL5 : zéro "
      + "éteint veut dire qu'un bouton plein va refuser après le clic ; deux ou trois "
      + "veut dire qu'on vient de retirer un geste qui marche.");
    assert.match(eteints[0].titre, /Sous résistance/,
      "l'infobulle du bouton éteint ne NOMME pas le filtre qui bloque — elle dit : « "
      + eteints[0].titre + " ». Une généralité fait recliquer ; le nom du réglage permet "
      + "de choisir une autre configuration, qui est le seul geste utile ici.");
    for (const b of boutons.filter((x) => !x.eteint)) {
      assert.doesNotMatch(b.titre, /non exportable/,
        "un bouton OFFERT porte l'infobulle du refus : les deux états se sont croisés.");
    }

    // ————— ET LE REFUS PARLE ENCORE S'IL EST ATTEINT AUTREMENT —————
    // Le lot (« Exporter les robots ») n'interroge pas le bouton : il appelle la
    // fonction. Griser l'un sans faire parler l'autre laisserait le lot muet.
    const direct = await p.evaluate("(async () => { const l = " + INSTANCE
      + "; const v = l.normValides(l.state.valides).find((x) => l.refusExport(x));"
      + " const rendu = await l.exporterRobot(v);"
      + " return { rendu, msg: String(l.state.hasardMsg || '') }; })()");
    assert.equal(direct.rendu, false, "l'export appelé directement sur la ligne refusée "
      + "rend « " + direct.rendu + " » : il ne refuse plus, et le bouton grisé mentirait.");
    assert.match(direct.msg, /Sous résistance/,
      "l'export appelé directement ne pose pas de message nommant le filtre — il dit : « "
      + direct.msg + " ». C'est le chemin du lot, et il resterait muet.");
    assert.equal(telecharges, 0, telecharges + " fichier(s) téléchargé(s) : une "
      + "configuration refusée a produit un robot, ce qui est pire que le refus — le "
      + "robot ne reproduirait pas la mesure.");
  } finally {
    await nav.close();
  }
});
