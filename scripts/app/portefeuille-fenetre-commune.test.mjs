// STATUT · CAUSE ÉTABLIE, RAPPORTÉE pour le défaut d'origine — « + 9,6 + 6,5 + 8,7 + 6,7
// = 31,5 R/an » lu sur l'écran d'un utilisateur, sur quatre lignes couvrant 3,4 / 4,1 /
// 4,9 / 6,5 ans — et MESURÉE DANS LE DÉPÔT pour tout ce que la garde affirme ci-dessous :
// le grand chiffre rendu, l'alignement de la bande en pixels et les trois états se lisent
// dans un vrai navigateur sur le fichier livré.
//
// ————— DEUX DÉFAUTS, ET LE SECOND EST DANS LA FIGURE QUI DÉNONCE LE PREMIER —————
//
// 1. Le bilan ADDITIONNAIT des périodes qui ne se recouvrent pas. L'addition est juste,
//    la phrase est fausse, et la note qui le disait vivait EN PETIT SOUS le chiffre
//    qu'elle contredit. Une supposition écrite sous un chiffre qui la viole n'est pas un
//    avertissement, c'est un aveu. Le grand chiffre est désormais recalculé sur la
//    fenêtre commune ; le brut garde sa place en note, avec sa raison dans la MÊME
//    phrase.
//
// 2. La frise qui rend la fenêtre commune visible portait, dans la maquette, un calque
//    posé sur le CONTENEUR pleine largeur, avec un `left` écrit en pixels. Mesuré par son
//    auteur : 76 px de décalage — la largeur de la colonne des noms. Elle affirmait donc
//    une fenêtre commune FAUSSE, c'est-à-dire exactement le défaut qu'elle existe pour
//    rendre visible. Le calque est maintenant une grille de MÊME gabarit superposée à la
//    grille des barres : sa deuxième colonne EST la piste des barres.
//
// ————— POURQUOI CETTE GARDE MESURE AU RENDU ET PAS DANS LE SOURCE —————
//
// Un alignement est un défaut d'AFFICHAGE : il n'existe que rendu. Deux chaînes
// `grid-template-columns` identiques dans le source ne prouvent pas que les deux boîtes
// tombent au même pixel — une marge, un `gap`, un `padding` hérité suffisent. La garde
// lit donc les rectangles, comme la garde du mot relatif lit l'écran et non le code.
//
// ANGLE MORT DÉCLARÉ (règle 9), en tête et non en note : elle mesure UN portefeuille, à
// UNE largeur de fenêtre, sur trois lignes semées. Elle ne dit rien d'une frise à douze
// lignes, ni d'un écran étroit où la colonne des noms se replierait. Et elle ne peut pas
// vérifier que les CHIFFRES décrivent bien un portefeuille réel — seulement qu'ils
// viennent de la fenêtre commune et pas de la somme.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { POSER_SEMIS, INSTANCE } from "./lib/semis.mjs";

const APP = readFileSync(new URL("../../Vena.dc.html", import.meta.url), "utf8");
const SOLO = new URL("../../Vena.solo.html", import.meta.url).pathname;
const CHROMIUMS = [process.env.VENA_CHROMIUM,
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"].filter(Boolean);

test("le grand chiffre du bilan vient de la fenêtre commune, et le brut n'est qu'une note", () => {
  // ————— STRUCTUREL : LA VALEUR QUI OCCUPE LA GRANDE PLACE —————
  // Muter le gabarit pour y remettre la somme brute doit faire tomber la garde EN
  // NOMMANT LES DEUX VALEURS — sans quoi le prochain lecteur corrigerait au hasard.
  assert.ok(APP.includes('<span style="font-family:var(--font-heading);font-size:38px;line-height:1">{{ ps.pfRAn }}</span>'),
    "la grande place du bilan ne porte plus `ps.pfRAn` — le R par an RECALCULÉ sur la "
    + "fenêtre commune. Si elle porte `ps.pfRAnBrut`, c'est la somme des R par an de "
    + "lignes qui ne couvrent pas la même période : arithmétiquement juste, "
    + "sémantiquement faux, et c'est le défaut d'origine.");
  assert.ok(APP.includes("      pfRAn: etat === 'plein' || etat === 'unique' ? sgn(ag.rAn, 1) + ' R / an'"),
    "`pfRAn` ne vient plus de l'agrégat sur la fenêtre commune.");
  // le brut EXISTE toujours, et il porte sa raison dans la même phrase
  assert.ok(APP.includes("              pfRAnBrut: sg(sommeAn, 1) + ' R / an',"),
    "la somme brute a disparu au lieu d'être reléguée. Elle reste lisible : c'est ce "
    + "que l'utilisateur voyait hier, et l'effacer sans le dire lui ferait chercher un "
    + "chiffre qui a changé sans raison écrite.");
  // ancrée sur un fragment SANS apostrophe : le source porte ici le vrai caractère
  // typographique, et un motif qui épelle son échappement ne le trouverait jamais
  assert.match(APP, /additionne les ' \+ vivantes\.length\s*\n\s*\+ ' fenêtres — mais elles ne se recouvrent pas/,
    "la note a perdu sa RAISON : « + 31,5 R/an » seul se lit comme une variante au "
    + "choix. Le brut et « mais elles ne se recouvrent pas » voyagent dans la même "
    + "phrase, comme la promesse et sa preuve.");
  // la note ne peut pas occuper la grande place : deux tailles, deux rôles
  const iGrand = APP.indexOf("{{ ps.pfRAn }}</span>");
  const iNote = APP.indexOf("{{ ps.pfRAnNote }}");
  assert.ok(iGrand > 0 && iNote > iGrand,
    "la note du brut est passée AVANT le chiffre de la fenêtre commune : c'est "
    + "l'ordre de lecture qui décide lequel des deux est lu comme le résultat.");
});

test("aucun des quatre calculs ne rend un ZÉRO non mesuré", () => {
  // ————— LE TROISIÈME ÉTAT N'EST JAMAIS « ZÉRO » —————
  // Fenêtre commune vide, corrélation non calculable, exposition sur une seule ligne :
  // chacun se DIT. Rendre 0 à leur place disculperait le portefeuille sans qu'aucune
  // mesure ait eu lieu — c'est la règle de la prise, appliquée au produit.
  assert.ok(APP.includes("        : etat === 'disjointes' ? 'aucune fenêtre commune'"),
    "une fenêtre commune vide rend un agrégat au lieu de le refuser. Deux lignes qui "
    + "n'ont jamais tourné ensemble n'ont pas un résultat de zéro : elles n'en ont pas.");
  assert.ok(APP.includes("        : expo.mesurable ? expo.max + ' en même temps' : 'non mesurée',"),
    "l'exposition simultanée rend un chiffre quand rien n'est mesurable.");
  assert.ok(APP.includes("          ? 'une seule ligne mesurable — il n\u2019y a rien à superposer'"),
    "une seule ligne rend « 1 % au pire » comme si c'était une mesure de simultanéité : "
    + "il n'y a rien à superposer, et c'est ça qu'il faut lire.");
  assert.ok(APP.includes("        : etat === 'unique' ? '1 pari' : 'non mesurable',"),
    "le nombre de paris tombe à un chiffre quand la redondance n'est pas calculable. "
    + "Compter les lignes à la place, c'est affirmer qu'elles sont distinctes sans "
    + "l'avoir mesuré.");
  assert.ok(APP.includes("              aide: x.nom + ' / ' + y.nom + ' : non calculable \\u2014 au moins une des deux '"),
    "une case de la matrice rend 0 là où la corrélation n'existe pas. Une variance "
    + "nulle ne donne pas une corrélation de zéro, elle n'en donne aucune.");
});

test("la bande de la fenêtre commune tombe au pixel sur la piste des barres", { timeout: 180000 }, async () => {
  let chromium;
  try { ({ chromium } = await import("playwright")); }
  catch (e) {
    assert.fail("Cette garde mesure un ALIGNEMENT, qui n'existe que rendu — playwright "
      + "est introuvable. Installez-le, ou posez VENA_CHROMIUM. Elle ne saute pas en "
      + "silence : une garde d'alignement qui saute est aveugle sans rougir, et c'est "
      + "le mode de panne que la frise elle-même existe pour dénoncer.");
  }
  const executablePath = CHROMIUMS.find((c) => existsSync(c));
  const nav = await chromium.launch(executablePath ? { executablePath } : {})
    .catch(() => assert.fail("Chromium introuvable : installez les navigateurs playwright "
      + "ou posez VENA_CHROMIUM. Cette garde ne saute pas."));
  try {
    const p = await (await nav.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
    const exceptions = [];
    p.on("pageerror", (e) => exceptions.push(String((e && e.message) || e)));
    await p.goto("file://" + SOLO);
    await p.waitForFunction(() => document.body && document.body.innerText.length > 400, null, { timeout: 60000 });
    // les séries d'exemple sont engendrées après le premier rendu : on attend qu'elles
    // soient dans `dfs`, pas une durée devinée
    await p.waitForFunction(`(() => { try { const i = ${INSTANCE};
      return !!(i.dfs && i.dfs['VX-EUR'] && i.dfs['VX-EUR'].n > 1000); } catch (e) { return false; } })()`,
    null, { timeout: 90000 });
    await p.evaluate(POSER_SEMIS);
    await p.evaluate("window.__semis.portefeuille(3)");
    await p.evaluate(`(() => { const i = ${INSTANCE};
      i.setState({ vue: 'portefeuille', pfOnglet: 1 }); i.forceUpdate(); })()`);
    // `innerText` rend le texte TRANSFORMÉ : ce titre porte `text-transform:uppercase`,
    // et un motif en minuscules ne le trouve jamais — la même famille que l'apostrophe
    // échappée, sur l'autre bout de la chaîne.
    await p.waitForFunction(() => /PÉRIODES RÉELLEMENT MESURÉES/i.test(document.body.innerText),
      null, { timeout: 60000 });

    assert.deepEqual(exceptions, [],
      "la page a JETÉ : renderVals() est une fonction, une exception dans un producteur "
      + "efface tout l'écran. Rien d'autre n'est mesurable après ça.");

    // ————— LA BORNE COUPE, PUIS ON VÉRIFIE CE QU'ELLE A COUPÉ —————
    // Si la fenêtre commune ne coupe rien sur ce semis, le grand chiffre et le brut
    // sont égaux et la garde mesure le DÉCOR. Elle prouve donc d'abord sa prise.
    const mes = await p.evaluate(() => {
      const nombre = (t) => {
        const m = /([+−-]?\s?\d+[,.]?\d*)\s*R/.exec(t || "");
        return m ? Number(m[1].replace(/\s/g, "").replace("−", "-").replace(",", ".")) : null;
      };
      const txt = document.body.innerText;
      const grand = [...document.querySelectorAll("span")]
        .filter((x) => /R \/ an$/.test((x.textContent || "").trim())
          && parseFloat(getComputedStyle(x).fontSize) > 30)
        .map((x) => x.textContent.trim())[0] || "";
      const note = (/[^.]*si l[’']on additionne les \d+ fenêtres[^·]*/.exec(txt) || [""])[0];
      // les rectangles : la bande commune, et la piste d'une barre de la frise
      const elBande = [...document.querySelectorAll("span")]
        .filter((x) => /rgba?\(/.test(getComputedStyle(x).backgroundColor)
          && getComputedStyle(x).opacity === "0.13" && x.offsetParent !== null)[0] || null;
      const bande = elBande ? elBande.getBoundingClientRect() : null;
      // les DEUX pour-cent que le producteur a posés : c'est contre eux qu'on vérifie,
      // pas contre une position devinée
      const pctG = elBande ? parseFloat(elBande.style.left) : null;
      const pctL = elBande ? parseFloat(elBande.style.width) : null;
      const pistes = !bande ? [] : [...document.querySelectorAll("span")]
        .filter((x) => getComputedStyle(x).height === "11px" && x.offsetParent !== null)
        .map((x) => x.getBoundingClientRect())
        // une piste de la frise est celle que la bande RECOUVRE verticalement : un autre
        // élément de onze pixels ailleurs dans la page n'en est pas une, et le prendre
        // pour tel comparerait deux boîtes qui n'ont aucune raison de s'aligner
        .filter((r) => r.top >= bande.top - 2 && r.bottom <= bande.bottom + 2);
      return { grand, grandN: nombre(grand), note, noteN: nombre(note),
        bande: bande && { x: bande.x, w: bande.width }, pctG, pctL,
        pistes: pistes.map((r) => ({ x: r.x, w: r.width })),
        aFrise: /PÉRIODES RÉELLEMENT MESURÉES/i.test(txt),
        corps: txt.slice(0, 20000) };
    });

    assert.ok(mes.aFrise, "la frise n'est pas rendue : il n'y a pas d'alignement à mesurer.");
    assert.ok(mes.pistes.length >= 3,
      "moins de trois pistes de frise rendues (" + mes.pistes.length + ") : la garde "
      + "mesurerait un écran presque vide. Le semis doit poser trois lignes mesurables.");
    assert.ok(mes.grandN !== null,
      "le grand chiffre n'est pas lisible à l'écran : " + JSON.stringify(mes.grand));
    assert.ok(mes.noteN !== null,
      "la note du brut n'est pas rendue — le chiffre d'hier a disparu sans un mot : "
      + JSON.stringify(mes.note));
    assert.ok(Math.abs(mes.grandN - mes.noteN) > 0.05,
      "la fenêtre commune n'a RIEN coupé sur ce semis (" + mes.grandN + " contre "
      + mes.noteN + ") : les deux chiffres sont égaux, et la garde mesurerait le décor. "
      + "Il faut un semis dont les lignes ne couvrent pas la même période — sans quoi "
      + "cette assertion passerait avec ou sans le calcul qu'elle vérifie.");

    // ————— L'ALIGNEMENT, EN PIXELS, CONTRE CE QUE LE PRODUCTEUR A DEMANDÉ —————
    //
    // On ne compare pas la bande à « quelque part dans la piste » : on la compare à la
    // position que ses DEUX pour-cent désignent sur la piste des barres. Une borne large
    // (« elle ne déborde pas ») passerait sur une bande décalée mais étroite — c'est la
    // garde vacue, et le décalage de 76 px de la maquette y aurait survécu.
    assert.ok(mes.bande, "la bande de la fenêtre commune n'est pas rendue.");
    assert.ok(Number.isFinite(mes.pctG) && Number.isFinite(mes.pctL),
      "la bande ne porte plus ses pour-cent en style : il n'y a plus de position "
      + "attendue à laquelle la comparer, et la garde perdrait sa prise.");
    assert.ok(mes.bande.w > 20,
      "la bande fait " + Math.round(mes.bande.w) + " px de large : une bande vide "
      + "satisfait n'importe quelle contrainte de position sans rien affirmer.");
    const piste = mes.pistes[0];
    const attenduX = piste.x + piste.w * mes.pctG / 100;
    const attenduW = piste.w * mes.pctL / 100;
    const dX = mes.bande.x - attenduX, dW = mes.bande.w - attenduW;
    assert.ok(Math.abs(dX) <= 1,
      "la bande de la fenêtre commune est décalée de " + Math.round(dX) + " px par "
      + "rapport à la piste des barres (attendu à " + Math.round(attenduX) + ", rendue à "
      + Math.round(mes.bande.x) + "). Elle est posée sur le CONTENEUR et non sur la même "
      + "grille : elle affirme donc une fenêtre commune fausse — le défaut exact qu'elle "
      + "existe pour rendre visible. Les deux `grid-template-columns` doivent rester "
      + "identiques, gap compris.");
    assert.ok(Math.abs(dW) <= 1,
      "la bande fait " + Math.round(dW) + " px de trop " + (dW > 0 ? "large" : "étroite")
      + " : sa piste n'a pas la même largeur que celle des barres.");

    // ————— ET AUCUN ZÉRO NON MESURÉ À L'ÉCRAN —————
    assert.ok(!/\b0 pari\b/.test(mes.corps),
      "« 0 pari » est rendu : le nombre de paris ne descend jamais à zéro — un "
      + "portefeuille qui porte des lignes porte au moins un pari, et « non mesurable » "
      + "est la seule autre réponse honnête.");
    // ancrée sur un zéro ISOLÉ : « 3,0 % au pire » contient « 0 % au pire », et la
    // première version de cette assertion refusait le cas NORMAL — un faux refus, qui
    // est ce qui tue une garde (règle 16), attrapé à sa première exécution
    assert.ok(!/(^|[^\d,])0 % au pire/.test(mes.corps),
      "« 0 % au pire » est rendu : une exposition simultanée de zéro voudrait dire "
      + "qu'aucune position n'a jamais été ouverte, ce qui contredit les trades mesurés.");
  } finally { await nav.close(); }
});

// ————— UNE TROISIÈME FIGURE QUI AFFIRMAIT UNE FENÊTRE QU'ELLE NE COUVRAIT PAS —————
//
// STATUT · CAUSE ÉTABLIE — symptôme RAPPORTÉ sur `260918.8`, cause relue DANS LE DÉPÔT.
// Le pointillé « acheter et garder » partait de 2022 quand le trait plein partait de
// 2020, et la légende annonçait quand même un total. Les DEUX défauts y étaient à la
// fois, et ils se cachaient l'un l'autre :
//
//   · le prix de base était pris PAR SÉRIE, au premier point disponible de chacune :
//     une série commençant en 2022 apportait son 2022→2026 pendant qu'une autre
//     apportait son 2020→2026. Le total de la légende MÉLANGEAIT des fenêtres ;
//   · les points antérieurs à la série la plus courte étaient sautés, donc le tracé
//     partait plus tard — sans un mot.
//
// C'est la même classe que la frise, par un troisième mécanisme : une figure qui affirme
// une comparaison sur une fenêtre qu'elle ne couvre pas. Et comme la frise, ça ne se voit
// pas dans le source — deux boucles justes, un `continue` qui saute en silence.
//
// ANGLE MORT DÉCLARÉ, en tête : la garde mesure la COORDONNÉE de départ des deux traits
// et le texte de la légende. Elle ne vérifie pas que le pour-cent annoncé est le bon —
// il faudrait une seconde implémentation de la détention, écrite depuis l'énoncé, et
// c'est ce que le dépôt appelle un recompte indépendant. Elle tient que les deux traits
// décrivent la même fenêtre, pas que chacun la décrive juste.
test("les deux traits de la courbe partent du même instant, ou le second n'est pas tracé",
  { timeout: 180000 }, async () => {
    let chromium;
    try { ({ chromium } = await import("playwright")); }
    catch (e) {
      assert.fail("Cette garde compare deux COORDONNÉES rendues — playwright est "
        + "introuvable. Installez-le, ou posez VENA_CHROMIUM. Elle ne saute pas en "
        + "silence : un trait plus court que son voisin est une comparaison que personne "
        + "ne peut faire, et qui a l'air d'en être une.");
    }
    const executablePath = CHROMIUMS.find((c) => existsSync(c));
    const nav = await chromium.launch(executablePath ? { executablePath } : {})
      .catch(() => assert.fail("Chromium introuvable. Cette garde ne saute pas."));
    try {
      const p = await (await nav.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
      const exceptions = [];
      p.on("pageerror", (e) => exceptions.push(String((e && e.message) || e)));
      await p.goto("file://" + SOLO);
      await p.waitForFunction(() => document.body && document.body.innerText.length > 400, null, { timeout: 60000 });
      await p.waitForFunction(`(() => { try { const i = ${INSTANCE};
        return !!(i.dfs && i.dfs['VX-EUR'] && i.dfs['VX-EUR'].n > 1000); } catch (e) { return false; } })()`,
      null, { timeout: 90000 });
      await p.evaluate(POSER_SEMIS);
      await p.evaluate("window.__semis.portefeuille(3)");
      await p.evaluate(`(() => { const i = ${INSTANCE};
        i.setState({ vue: 'portefeuille', pfOnglet: 1 }); i.forceUpdate(); })()`);
      await p.waitForFunction(() => /COURBE DE CAPITAL/i.test(document.body.innerText),
        null, { timeout: 60000 });

      const lire = () => p.evaluate(() => {
        const svg = document.querySelector("svg[viewBox='0 0 1330 160']");
        const x0 = (el) => {
          if (!el) return null;
          const pts = (el.getAttribute("points") || "").trim().split(/\s+/);
          return pts.length && pts[0] ? Number(pts[0].split(",")[0]) : null;
        };
        const lignes = [...(svg ? svg.querySelectorAll("polyline") : [])];
        const det = lignes.find((l) => (l.getAttribute("stroke-dasharray") || "") !== "");
        const strat = lignes.find((l) => l !== det);
        const txt = document.body.innerText;
        return { xStrat: x0(strat), xDet: x0(det), traces: lignes.length,
          legende: (/acheter et garder[^\n]*/.exec(txt) || [""])[0] };
      });

      assert.deepEqual(exceptions, [], "la page a jeté : rien n'est mesurable après ça.");

      // ————— ÉTAT 1 : la référence couvre tout, donc elle est tracée —————
      const plein = await lire();
      assert.equal(plein.traces, 2,
        "la courbe ne porte pas ses DEUX traits sur un portefeuille dont les trois séries "
        + "couvrent toute la période (" + plein.traces + " rendu(s)) : la garde mesurerait "
        + "le décor, et le cas normal ne serait pas exercé.");
      assert.ok(Number.isFinite(plein.xStrat) && Number.isFinite(plein.xDet),
        "un des deux traits n'a pas de premier point lisible.");
      assert.ok(Math.abs(plein.xDet - plein.xStrat) <= 1,
        "le pointillé « acheter et garder » commence à x = " + plein.xDet + " quand la "
        + "stratégie commence à x = " + plein.xStrat + " — " + Math.round(Math.abs(plein.xDet - plein.xStrat))
        + " unités d'écart sur 1330. La figure affirme une comparaison sur une fenêtre "
        + "qu'elle ne couvre pas, et la légende annonce quand même un total : les deux "
        + "chiffres ne se comparent pas. La référence se calcule sur UNE fenêtre, avec le "
        + "même prix de base pour toutes les séries.");
      assert.ok(!/ sur \d{4}/.test(plein.legende),
        "la légende nomme une fenêtre alors que le trait couvre toute la période : elle "
        + "annoncerait une réserve qui n'a pas lieu d'être. Rendu : « " + plein.legende + " »");

      // ————— ÉTAT 2 : une série trop courte — on le DIT, on ne trace pas moins —————
      // La série d'une des trois lignes est tronquée par la fonction du produit qui
      // découpe, `decouper`. Ses trades sont remesurés dessus, mais les deux autres
      // lignes gardent leur axe : la référence ne peut plus couvrir le tracé.
      await p.evaluate(`(() => { const i = ${INSTANCE};
        i.dfs['VX-OR'] = i.M.decouper(i.dfs['VX-OR'], Date.UTC(2025, 5, 1));
        i.forceUpdate(); })()`);
      await new Promise((r) => setTimeout(r, 1200));
      const court = await lire();
      assert.equal(court.traces, 1,
        "une série ne couvre plus la période du tracé, et le pointillé est tracé quand "
        + "même (" + court.traces + " traits) : il serait plus court que celui de la "
        + "stratégie. « Le dire plutôt que tracer moins » — c'est le chiffre qui est "
        + "donné, avec sa fenêtre, pas la figure.");
      assert.match(court.legende, /sur \d{4}–\d{4}/,
        "la légende ne nomme pas la fenêtre sur laquelle la référence EST mesurable. "
        + "Sans elle, le pour-cent annoncé se lit comme s'il couvrait toute la période — "
        + "et c'est exactement le défaut qu'on vient de retirer du tracé. Rendu : « "
        + court.legende + " »");
      assert.match(court.legende, /les seules années/,
        "la légende donne une fenêtre sans dire POURQUOI elle est plus courte. Une "
        + "réserve sans son motif ne dit pas quoi faire pour la lever. Rendu : « "
        + court.legende + " »");
    } finally { await nav.close(); }
  });
