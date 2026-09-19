// ————— UN ÉLÉMENT ANNONCÉ CLIQUABLE DOIT L'ÊTRE —————
//
// La tournée des gestes avait écrit la réserve, sans l'instruire : « les quatre
// “Sans filtre…” ressemblent à des étiquettes rendues en <button>. Si c'en sont, le
// défaut est le BALISAGE — un élément inerte qui se présente comme cliquable est un
// défaut réel, mais d'une autre nature. » Mesuré : c'en étaient.
//
// LE COMPTE DE LA SOURCE N'EST PAS LE COMPTE DE L'ÉCRAN, ET L'ÉCART EST DE 29.
// `Vuna.dc.html` porte 35 affectations d'un gestionnaire vide sur un champ que le
// gabarit lie à un `onClick`. Rendues, dans les sept vues à l'état peuplé, SIX
// seulement atteignent l'utilisateur : les 29 autres vivent dans des branches dont
// l'élément est masqué ou grisé. Une garde de source aurait donc réclamé 35
// corrections dont 29 n'auraient rien réparé — c'est la règle 11, et c'est pourquoi
// cette garde-ci RÉSOUD LE VRAI FICHIER dans un vrai navigateur.
//
// CE QU'ELLE LIT EST UN RÉSULTAT, PAS UNE INTENTION (règle 1). Pas « le producteur
// écrit-il `curseur: 'default'` ? » — un curseur est une déclaration, et la case
// fautive la portait déjà sans que rien n'en tombe. Elle lit le gestionnaire
// RÉELLEMENT lié par React sur l'élément monté, par sa fibre : ce que le clic
// appellerait. Un gestionnaire absent ou vide sur un élément que le DOM annonce
// « bouton » est un élément qui ment — il entre dans l'ordre de tabulation, un
// lecteur d'écran l'annonce cliquable, et il ne répond pas.
//
// ELLE NE GARDE PAS UNE CASE, ELLE GARDE LA CLASSE (règle 8 appliquée aux gardes).
// Le correctif portait un nom de classe — « aucun élément annoncé cliquable ne porte
// un gestionnaire vide » —, donc la garde ne pouvait pas porter un nom de lieu
// (« la carte du balayage », « la case non calculée »). Elle balaie les sept vues et
// nomme ce qu'elle trouve, où qu'il naisse.
//
// ANGLE MORT DÉCLARÉ (règle 9), et il est double :
//   · elle ne voit que ce que les SEPT VUES rendent à l'état semé. Un bouton qui
//     n'apparaît que dans le tiroir, l'aide, l'avis, ou derrière un état que
//     `semis.mjs` ne produit pas, naît hors de sa portée. C'est l'angle mort de la
//     tournée, hérité avec la surface — et il se referme du même geste qu'elle ;
//   · elle ne juge pas un gestionnaire qui s'exécute et ne fait RIEN d'utile (un
//     `if (…) return;` en tête). Ça, c'est la question de `geste-sans-effet` et de
//     la tournée : « réagit-il ? ». Celle-ci pose l'autre moitié : « le DOM dit-il
//     la vérité sur ce qu'il est ? ». Les deux sont nécessaires, aucune ne couvre
//     l'autre.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { POSER_SEMIS, INSTANCE } from "./lib/semis.mjs";
import { VUES, CLIC_CONTIENT, CLIC_EXACT } from "./lib/vues.mjs";

const SOLO = new URL("../../Vuna.solo.html", import.meta.url).pathname;
const CHROMIUMS = [
  process.env.VUNA_CHROMIUM,
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
].filter(Boolean);

// Le relevé vit dans la PAGE : la fibre React n'est lisible que de l'intérieur.
// Un élément GRISÉ est hors du filet, et c'est voulu — `disabled` le retire de
// l'ordre de tabulation et le fait annoncer « indisponible ». Il ne ment pas : il
// dit qu'il ne peut rien faire. C'est même la réparation retenue ailleurs
// (`geste-sans-effet`), et la mettre en défaut ici serait se contredire.
const RELEVE = `(() => {
  const out = [];
  let vus = 0;
  const cibles = [...document.querySelectorAll('button, [role="button"]')];
  for (const el of cibles) {
    if (el.offsetParent === null) continue;
    if (el.disabled) continue;
    vus++;
    const fk = Object.keys(el).find((x) => x.startsWith("__reactProps"));
    const pr = fk ? el[fk] : null;
    const h = pr ? pr.onClick : undefined;
    const s = typeof h === "function" ? String(h).replace(/\\s+/g, " ")
      : (h == null ? "ABSENT" : String(h));
    const vide = s === "ABSENT"
      || /^\\(\\s*\\)\\s*=>\\s*\\{\\s*\\}$/.test(s)
      || /^function\\s*\\(?\\s*\\)?\\s*\\(?\\s*\\)?\\s*\\{\\s*\\}$/.test(s);
    if (!vide) continue;
    out.push({
      txt: (el.textContent || "").trim().replace(/\\s+/g, " ").slice(0, 60) || "(sans texte)",
      geste: s,
      curseur: getComputedStyle(el).cursor,
      classe: String(el.className || ""),
      titre: (el.title || "").slice(0, 80),
    });
  }
  return { vus, inertes: out };
})()`;

test("aucun élément annoncé cliquable ne porte un geste vide", { timeout: 300000 }, async () => {
  let chromium;
  try { ({ chromium } = await import("playwright")); }
  catch {
    assert.fail("Cette garde résout le VRAI fichier dans un VRAI navigateur — playwright "
      + "est introuvable. Installez-le, ou posez VUNA_CHROMIUM sur un exécutable "
      + "Chromium. Elle ne saute PAS en silence : une garde de rendu qui saute est "
      + "une garde aveugle, et c'est le mode de panne qu'on ferme ici.");
  }
  const executablePath = CHROMIUMS.find((c) => existsSync(c));
  const nav = await chromium.launch(executablePath ? { executablePath } : {})
    .catch(() => assert.fail("Chromium introuvable : installez les navigateurs playwright "
      + "ou posez VUNA_CHROMIUM. Cette garde ne saute pas."));
  try {
    const p = await (await nav.newContext()).newPage();
    const exceptions = [];
    p.on("pageerror", (e) => exceptions.push(String((e && e.message) || e)));
    await p.goto("file://" + SOLO);
    await p.waitForFunction(() => document.body && document.body.innerText.length > 400,
      { timeout: 60000 });
    const porte = await p.waitForSelector('button:has-text("J\'ai compris")', { timeout: 15000 })
      .catch(() => null);
    if (porte) {
      await porte.click();
      await p.waitForSelector(".dialog-backdrop", { state: "detached", timeout: 10000 }).catch(() => {});
    }
    // le semis JETTE s'il ne sème rien : la moitié des vues n'a pas d'écran sans
    // données, et les mesurer vides serait mesurer le décor
    await p.evaluate(POSER_SEMIS);
    await p.evaluate("window.__semis.scan(9)");
    await p.evaluate("window.__semis.journal(12)");
    await p.evaluate("window.__semis.decisions(3)");
    await p.waitForTimeout(500);

    const fautifs = [];
    const vides = [];
    const etats = [];
    for (const [page, sous] of VUES) {
      await p.evaluate(`(${CLIC_CONTIENT})(${JSON.stringify(page)})`);
      await p.waitForTimeout(sous ? 500 : 400);
      if (sous) {
        await p.evaluate(`(${CLIC_EXACT})(${JSON.stringify(sous)})`);
        await p.waitForTimeout(600);
      }
      const nom = page + (sous ? " · " + sous : "");
      // ————— UNE SONDE QUI RAPPORTE ZÉRO PROUVE SA PRISE —————
      // Sans ce contrôle, une vue qui ne s'ouvre pas rend « 0 inerte » et la garde
      // passe au vert en n'ayant rien regardé. C'est arrivé à la MESURE qui a mené
      // ici : les sept clics de page échouaient tous — l'onglet porte son rang collé
      // au libellé (« 2Mes scans ») — et les sept vues rapportaient leur verdict sur
      // le même écran d'accueil. Une mesure fausse qui a l'air d'une mesure.
      //
      // ET LA PRISE EST L'ÉTAT, PAS UN COMPTE. Un premier jet exigeait « au moins
      // quinze éléments cliquables par vue » : éprouvé par mutation, il n'est pas
      // tombé — l'écran d'accueil en porte trente-deux, donc sept fois le même écran
      // franchissait le seuil sans qu'une seule vue se soit ouverte. Un seuil est une
      // DISTANCE, et une distance n'est pas une prise. On lit ce que l'application
      // DIT d'elle-même — `state.vue` — et on exige que les sept parcours rendent
      // sept états distincts : une navigation cassée les effondre sur un seul.
      etats.push(await p.evaluate(`(() => { const l = ${INSTANCE}; return String(l.state.vue); })()`));
      const r = await p.evaluate(RELEVE);
      if (r.vus === 0) vides.push(nom);
      for (const x of r.inertes) fautifs.push({ vue: nom, ...x });
    }

    assert.deepEqual(exceptions, [],
      "la page a JETÉ pendant le parcours : renderVals() est UNE fonction, et une "
      + "exception dans un producteur efface tout. Rien d'autre n'est mesurable.");
    assert.equal(new Set(etats).size, VUES.length,
      "les " + VUES.length + " parcours n'ont pas ouvert " + VUES.length + " vues "
      + "distinctes — états relevés : " + etats.join(", ") + ". Une navigation qui "
      + "échoue rend son verdict sept fois sur le même écran, et la garde passerait "
      + "au vert sans avoir rien regardé. Elle tombe ici à la place : un zéro sans "
      + "prise est le pire mode de panne d'un banc.");
    assert.deepEqual(vides, [],
      "vue(s) sans le moindre élément cliquable visible : l'écran ne s'est pas rendu, "
      + "et son verdict ne vaut rien.");
    assert.deepEqual(fautifs, [],
      "élément(s) que le DOM annonce cliquable(s) et dont le geste ne fait RIEN :\n"
      + fautifs.map((f) => "  · [" + f.vue + "] « " + f.txt + " » classe=" + (f.classe || "—")
        + " curseur=" + f.curseur + "\n      geste : " + f.geste
        + (f.titre ? "\n      titre : " + f.titre : "")).join("\n")
      + "\n\nCe n'est pas du cosmétique : un <button> entre dans l'ordre de tabulation "
      + "et s'annonce cliquable à un lecteur d'écran. Deux sorties, et une seule est "
      + "bonne selon le cas :\n"
      + "  · l'élément a une action, et elle manque → branchez-la ;\n"
      + "  · l'élément n'en a pas → CE N'EST PAS UN BOUTON. Rendez-le en <span>, sous "
      + "un `sc-if` frère de celui du bouton, en gardant les mêmes styles en ligne — "
      + "c'est ce qui a été fait pour les cases non calculées de la carte du balayage.\n"
      + "Griser (`disabled`) est la troisième sortie, et elle est légitime quand le "
      + "bouton EXISTE mais ne peut rien faire pour l'instant — il dit alors la vérité, "
      + "et cette garde le laisse passer.");
  } finally {
    await nav.close();
  }
});
