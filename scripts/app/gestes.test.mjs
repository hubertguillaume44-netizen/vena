// ————— LA GARDE DES GESTES : CHAQUE BOUTON RÉPOND, VISIBLEMENT —————
//
// Le constat qui l'a fait naître : 474 tests au vert, et en une soirée — page
// blanche totale, menus vides, export impossible, scripts introuvables, messages
// sans surface. Chaque fois un correctif ciblé, chaque fois un défaut voisin
// découvert par l'utilisateur. Les gardes éprouvaient des producteurs ;
// l'utilisateur, lui, CLIQUE. Cette garde clique.
//
// Pour chaque page, chaque bouton (un clic par libellé) doit produire une
// RÉACTION OBSERVABLE : une mutation du DOM qui touche un élément visible dans la
// fenêtre sans défiler, un téléchargement, un sélecteur de fichier, ou un
// dialogue. Un bouton qui ne produit rien est le défaut de la soirée, sous toutes
// ses formes — elle aurait attrapé le menu vide, l'export muet, le bouton MT5,
// reautoriserAuto jamais branché, les messages sans surface : cinq sur six.
//
// ANGLE MORT, déclaré (règle 9) — ce qu'elle N'ATTEINT PAS, pour que personne ne
// la croie complète :
//   · les sélecteurs NATIFS (« Choisir le fichier de sauvegarde », « Réautoriser » :
//     showSaveFilePicker/requestPermission, hors de portée de l'automate) ;
//   · l'état protégé (sauvegarde active) et tout état qui exige des données
//     qu'un navigateur neuf n'a pas (lignes de scan, licence posée) ;
//   · UN clic par libellé : deux boutons de même libellé dont un seul est mort
//     passeraient ; et le glisser-déposer, qui n'est pas un clic ;
//   · « Recharger », qui recharge la page et tuerait la session du banc ;
//   · la SÉQUENCE de gestes (un clic après un autre dans un ordre précis) : elle
//     clique chaque bouton depuis l'état de la page, pas des scénarios.
// Et elle ne passe pas au vert sur une page qu'elle n'a pas su ouvrir : une vue
// sans aucun bouton la fait tomber.
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
const PAGES = ["Mes instruments", "Mes scans", "Mes décisions"];
const EXCLUS = new Map([
  ["J'ai compris", "la porte d'accueil — déjà franchie par le banc"],
  ["Recharger", "recharge la page : tuerait la session du banc"],
  ["Choisir le fichier de sauvegarde", "sélecteur NATIF (showSaveFilePicker) — angle mort déclaré"],
  ["Réautoriser la sauvegarde", "permission native — angle mort déclaré"],
  ["Réautoriser", "permission native — angle mort déclaré"],
]);
// Exclusions PAR PAGE : un bouton de navigation est sans effet sur sa propre
// destination — c'est son état légitime, pas un défaut — et il reste MESURÉ
// depuis toutes les autres pages, où il doit réagir.
const EXCLUS_SUR = new Map([
  ["Mes instruments · VÉNA", "« Revenir à Mes instruments » est sans effet quand on y est ; mesuré depuis les deux autres pages"],
  ["Mes scans · Nouveau scan", "le bouton de la vue déjà active ; mesuré depuis les deux autres pages"],
  ["Mes décisions · Portefeuille", "le bouton de la vue déjà active ; mesuré depuis les deux autres pages"],
]);

async function lancerNavigateur() {
  let chromium;
  try { ({ chromium } = await import("playwright")); }
  catch (e) { assert.fail("playwright introuvable — cette garde ne saute pas en silence."); }
  const executablePath = CHROMIUMS.find((c) => existsSync(c));
  return chromium.launch(executablePath ? { executablePath } : {})
    .catch(() => assert.fail("Chromium introuvable : posez VENA_CHROMIUM — cette garde ne saute pas."));
}

async function ouvrir(nav) {
  const ctx = await nav.newContext({ acceptDownloads: true });
  const p = await ctx.newPage();
  await p.goto("file://" + SOLO);
  await p.waitForFunction(() => document.body && document.body.innerText.length > 400, { timeout: 60000 });
  const porte = await p.waitForSelector('button:has-text("J\'ai compris")', { timeout: 15000 }).catch(() => null);
  if (porte) {
    await porte.click();
    await p.waitForSelector(".dialog-backdrop", { state: "detached", timeout: 10000 }).catch(() => {});
  }
  // l'observateur : compte les mutations, et note si l'une touche un élément
  // visible DANS la fenêtre — « quelque chose est dit, sans défiler »
  await p.evaluate(() => {
    window.__mut = 0; window.__mutVisible = 0;
    const visible = (n) => {
      const el = n.nodeType === 1 ? n : n.parentElement;
      if (!el || !el.getBoundingClientRect) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight;
    };
    new MutationObserver((ms) => {
      window.__mut += ms.length;
      let vus = 0;
      for (const m of ms) {
        if (vus++ > 25) break; // borne du coût, pas de la vérité : une seule suffit
        if (visible(m.target) || [...m.addedNodes].some(visible)) { window.__mutVisible += 1; return; }
      }
    }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true });
  });
  return p;
}

// un clic légitime peut lancer un VRAI calcul (balayage, contrôle du hasard) qui
// sature les cœurs pour tout le reste de la tournée : chaque évaluation devient
// lente, et la garde déborde son budget en mesurant des boutons sains. On arrête
// donc le travail lourd après chaque clic — les boutons « Arrêter » sont faits
// pour ça, et ils seront cliqués pour eux-mêmes à leur tour dans l'énumération.
async function calmer(p) {
  const arrete = await p.evaluate(() => {
    let n = 0;
    for (const b of document.querySelectorAll("button")) {
      if (b.offsetParent !== null && !b.disabled && /^Arrêter/.test((b.textContent || "").trim())) { b.click(); n += 1; }
    }
    return n;
  }).catch(() => 0);
  if (arrete) await p.waitForTimeout(200);
}

async function fermerDialogues(p) {
  // Escape D'ABORD, et sans condition : le TIROIR n'est pas un .dialog-backdrop,
  // et ouvert il recouvre la barre des onglets — un clic Playwright sur l'onglet
  // attendait alors 30 s d'actionnabilité avant de jeter, et la tournée entière
  // débordait son budget en payant ce délai à chaque libellé. Mesuré : chaque
  // itération après l'ouverture du tiroir coûtait 30,1 s au lieu de 0,2.
  await p.keyboard.press("Escape").catch(() => {});
  // Et Escape ne ferme PAS le tiroir (il ne ferme que les panneaux bs*/panScan) :
  // laissé ouvert, chaque bouton « ouvrir » suivant devient un no-op — mesuré,
  // tous les faux muets de la première tournée avaient le tiroir ouvert au moment
  // du clic. Son voile (position:fixed, z-index:69) porte fermerTiroir : on clique
  // dessus, comme un utilisateur qui clique à côté.
  await p.evaluate(() => {
    const voile = [...document.querySelectorAll("div")].find((d) => {
      const s = d.getAttribute("style") || "";
      return s.includes("z-index:69") || s.includes("z-index: 69");
    });
    if (voile) voile.click();
  }).catch(() => {});
  for (let k = 0; k < 3 && await p.$(".dialog-backdrop"); k++) {
    await p.keyboard.press("Escape").catch(() => {});
    await p.waitForTimeout(150);
    if (!await p.$(".dialog-backdrop")) return;
    const doux = await p.$$(".dialog-backdrop button");
    for (const b of doux) {
      const t = ((await b.textContent()) || "").trim();
      if (/annul|fermer|compris|plus tard|garder|non merci|^✕$|^non$/i.test(t)) {
        await b.click().catch(() => {}); await p.waitForTimeout(150); break;
      }
    }
  }
}

// clic DOM, sans attente d'actionnabilité : la garde mesure la RÉACTION du
// produit, pas la cliquabilité géométrique — et un recouvrement passager
// (tiroir, dialogue) ne doit pas lui coûter 30 s de délai Playwright
async function clicDom(p, libelle) {
  return p.evaluate((k) => {
    const b = [...document.querySelectorAll("button")].find((x) =>
      x.offsetParent !== null && !x.disabled
      && ((x.textContent || "").trim().replace(/\s+/g, " ").includes(k)));
    if (!b) return false;
    b.click();
    return true;
  }, libelle).catch(() => false);
}

test("chaque bouton de chaque page produit une réaction visible", { timeout: 600000 }, async () => {
  const nav = await lancerNavigateur();
  try {
    const p = await ouvrir(nav);
    let telech = 0, choixFichier = 0;
    p.on("download", () => { telech += 1; });
    p.on("filechooser", () => { choixFichier += 1; });
    const inertes = [];
    for (const page of PAGES) {
      assert.ok(await clicDom(p, page),
        "la page « " + page + " » est introuvable : la garde ne clique plus rien dessus — réancrez");
      await p.waitForTimeout(400);
      // tout se déplie : les gestes repliés sont des gestes quand même
      await p.evaluate(() => {
        for (const b of document.querySelectorAll("button"))
          if (b.offsetParent !== null && /déplier/.test(b.textContent || "")) b.click();
      });
      await p.waitForTimeout(200);
      const cles = await p.evaluate(() =>
        [...document.querySelectorAll("button")]
          .filter((b) => b.offsetParent !== null && !b.disabled && !b.closest(".dialog-backdrop"))
          .map((b) => (b.textContent || "").trim().replace(/\s+/g, " ") || b.title || "")
          .filter(Boolean));
      const uniques = [...new Set(cles)];
      assert.ok(uniques.length > 0,
        "la page « " + page + " » ne présente AUCUN bouton au banc : cette garde ne "
        + "mesurerait rien dessus — une garde qui saute en silence est aveugle sans rougir");
      for (const cle of uniques) {
        if (EXCLUS.has(cle) || EXCLUS_SUR.has(page + " · " + cle)
          || PAGES.includes(cle.replace(/^\d/, ""))) continue;
        await fermerDialogues(p);
        // revenir sur la page : un clic précédent a pu changer de vue
        await clicDom(p, page);
        await p.waitForTimeout(120);
        const avant = await p.evaluate(() => { const m = { m: window.__mut, v: window.__mutVisible }; return m; });
        // les VALEURS des champs sont des propriétés, pas des attributs : un bouton
        // qui remplit un champ (« Voir les séries d'exemple » pose « VX- » dans la
        // recherche) est invisible au MutationObserver — angle mort du capteur, pas
        // du produit. On relève donc les valeurs avant/après.
        const champsAvant = await p.evaluate(() =>
          [...document.querySelectorAll("input,select,textarea")].map((e) => e.value).join(""));
        const dAvant = telech, fAvant = choixFichier;
        const clique = await p.evaluate((k) => {
          const b = [...document.querySelectorAll("button")].find((x) =>
            x.offsetParent !== null && !x.disabled && !x.closest(".dialog-backdrop")
            && (((x.textContent || "").trim().replace(/\s+/g, " ") || x.title) === k));
          if (!b) return false;
          b.scrollIntoView({ block: "center" });
          b.click();
          return true;
        }, cle);
        if (!clique) continue; // disparu depuis l'énumération : l'état a bougé, c'est une réaction d'un clic d'avant
        // attente ADAPTATIVE : la plupart des boutons réagissent en quelques
        // millisecondes — attendre 350 ms fixes pour chacun, c'est payer le prix
        // du plus lent cent fois. On rend la main à la première réaction visible,
        // et on ne va au bout du délai que pour les boutons qui se taisent.
        const vif = await p.waitForFunction((a) => window.__mutVisible > a, avant.v,
          { timeout: 700, polling: 60 }).then(() => true).catch(() => false);
        const apres = await p.evaluate(() => ({ m: window.__mut, v: window.__mutVisible }));
        const champsApres = await p.evaluate(() =>
          [...document.querySelectorAll("input,select,textarea")].map((e) => e.value).join(""));
        const reagi = vif || apres.v > avant.v || telech > dAvant || choixFichier > fAvant
          || champsApres !== champsAvant;
        if (!reagi) {
          inertes.push(page + " · « " + cle + " »"
            + (apres.m > avant.m ? " (des mutations, aucune visible dans la fenêtre)" : " (aucune réaction du tout)"));
        }
        await calmer(p);
      }
    }
    assert.deepEqual(inertes, [],
      "Des boutons ne produisent AUCUNE réaction visible — le défaut de la soirée, "
      + "sous toutes ses formes (menu vide, export muet, bouton MT5, Réautoriser "
      + "jamais branché, messages sans surface) :\n  " + inertes.join("\n  ")
      + "\n\nChaque geste doit faire quelque chose ET le dire dans la fenêtre, sans "
      + "défiler. Si un bouton est légitimement hors de portée du banc (sélecteur "
      + "natif, état absent d'un navigateur neuf), il s'exclut NOMMÉMENT, avec sa raison.");
  } finally {
    await nav.close();
  }
});

test("le dépôt d'un relevé enregistre, dit, et se voit — trois échecs distincts", { timeout: 180000 }, async () => {
  // ————— LE PREMIER CLIENT DE LA GARDE DES GESTES —————
  // « Ça ne marche pas » peut vouloir dire trois choses : le barème n'est pas
  // enregistré ; aucun message n'est produit ; le message existe mais n'est pas
  // visible sans défiler. Les trois se mesurent séparément — seule la troisième
  // explique un « ça ne marche pas » quand tout fonctionne.
  const nav = await lancerNavigateur();
  try {
    const p = await ouvrir(nav);
    const ong = await p.$('button:has-text("Mes instruments")');
    if (ong) { await ong.click(); await p.waitForTimeout(300); }
    for (const ch of await p.$$('button:has-text("déplier")')) await ch.click().catch(() => {});
    await p.waitForTimeout(200);
    const champ = await p.$("#champReleve");
    assert.ok(champ, "le champ du relevé (#champReleve) est introuvable : réancrez cette garde");
    const fichier = path.join(tmpdir(), "releve.csv");
    writeFileSync(fichier, "Symbol;Point;Spread;ContractSize;SwapLong;SwapShort;SwapMode;Bid;Ask;StopsLevel\n"
      + "EURUSD;0.00001;12;100000;-5.5;1.2;1;1.0850;1.0851;20\n"
      + "XAUUSD;0.01;25;100;-18.2;9.1;1;2350.10;2350.35;30\n");
    // l'utilisateur regarde le champ au moment du dépôt : « sans défiler » se
    // mesure depuis là, pas depuis le haut de page où l'automate est resté
    await champ.scrollIntoViewIfNeeded();
    await champ.setInputFiles(fichier);
    // la confirmation n'est PAS un dialogue : c'est un bloc rendu EN PLACE, dans
    // le cadre du dépôt (« est-ce le bon ? »). La première version de cette garde
    // attendait un .dialog-backdrop et concluait « le geste est muet » sur un
    // geste qui marchait — règle 5 : la sonde mesurait le mauvais endroit, et une
    // mesure fausse a l'air d'une mesure.
    const conf = await p.waitForSelector("text=est-ce le bon", { timeout: 10000 })
      .catch(() => p.waitForSelector("text=Remplacer le relevé de", { timeout: 1000 }).catch(() => null));
    assert.ok(conf, "le dépôt du relevé n'a rendu AUCUNE confirmation en place : le geste est muet");
    // et elle VIENT au geste : rendue sous le cadre entier, elle tombait ~450 px
    // sous la fenêtre — un dépôt qui marchait se lisait « ça ne marche pas ».
    // accepterBareme la fait défiler dans la vue ; on lui laisse le temps du défilement.
    const confVisible = await p.waitForFunction(() => {
      const el = document.getElementById("confirmBareme");
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return r.height > 0 && r.bottom > 0 && r.top < innerHeight;
    }, { timeout: 3000 }).then(() => true).catch(() => false);
    assert.ok(confVisible,
      "la confirmation du dépôt existe mais reste HORS de la fenêtre : le défilement "
      + "vers le geste (accepterBareme → scrollIntoView) ne se fait plus");
    const oui = await p.$('button:has-text("Déposer sur"), button:has-text("Remplacer le relevé")');
    assert.ok(oui, "la confirmation est rendue mais son bouton d'accord est introuvable");
    await oui.click();
    await p.waitForTimeout(500);
    // 1 · enregistré — le stockage porte le barème, avec les symboles déposés
    const enregistre = await p.evaluate(() => {
      for (let k = 0; k < localStorage.length; k++) {
        const c = localStorage.key(k);
        if (/bareme/i.test(c) && (localStorage.getItem(c) || "").includes("EURUSD")) return c;
      }
      return null;
    });
    assert.ok(enregistre, "le relevé déposé n'est PAS enregistré : le barème ne porte pas EURUSD");
    // 2 · dit — le message du geste existe
    const msg = await p.evaluate(() => {
      const el = [...document.querySelectorAll("span,div,p")]
        .find((x) => /symboles? lus? pour/.test(x.textContent || "") && x.children.length === 0);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { txt: el.textContent.trim().slice(0, 60), haut: r.top, bas: r.bottom, hFen: innerHeight, visible: r.height > 0 && r.bottom > 0 && r.top < innerHeight };
    });
    assert.ok(msg, "le relevé est enregistré mais AUCUN message ne le dit : l'utilisateur relira « ça ne marche pas »");
    // 3 · visible — sans défiler, dans la fenêtre où le geste a été fait
    assert.ok(msg.visible,
      "le message du relevé existe (« " + msg.txt + " ») mais il est HORS de la fenêtre "
      + "(à " + Math.round(msg.haut) + "px pour " + msg.hFen + "px de fenêtre) : posé, "
      + "rendu… et invisible sans défiler — la troisième façon d'échouer, celle qui "
      + "explique « ça ne marche pas » quand tout fonctionne.");
  } finally {
    await nav.close();
  }
});

test("« Réautoriser » sans poignée dit ce qui se passe et offre le choix", { timeout: 120000 }, async () => {
  // ————— L'ANGLE MORT DÉCLARÉ, FERMÉ POUR SA PARTIE TESTABLE —————
  // Le dialogue natif reste hors de portée du banc. Mais l'état de la capture —
  // le nom du fichier affiché, la poignée morte (IndexedDB vidée, autre profil) —
  // se SÈME sans dialogue : autoNom posé, handleAuto nul. Le clic sur
  // « Réautoriser » y cliquait dans le vide ; il doit produire un message ET
  // faire basculer le bouton vers « Choisir le fichier de sauvegarde », parce
  // qu'après une poignée morte c'est le seul geste qui rouvre la porte.
  const nav = await lancerNavigateur();
  try {
    const p = await ouvrir(nav);
    // semer l'état de la capture par l'instance (la fibre du premier bouton)
    await p.evaluate(() => {
      const el = document.querySelector("button");
      const fk = Object.keys(el).find((x) => x.startsWith("__reactFiber"));
      let f = el[fk];
      while (f && !(f.stateNode && f.stateNode.constructor
        && f.stateNode.constructor.name === "StreamableComponent")) f = f.return;
      const inst = f.stateNode.logic;
      inst.handleAuto = null;
      inst.setState({ autoNom: "vena-sauvegarde.json", autoAttente: true,
        autoMsg: "Sauvegarde automatique en attente : cliquez « Réautoriser »." });
    });
    await p.waitForTimeout(300);
    const clique = await p.evaluate(() => {
      const b = [...document.querySelectorAll("button")].find((x) =>
        x.offsetParent !== null && /^Réautoriser/.test((x.textContent || "").trim()));
      if (!b) return false;
      b.click();
      return true;
    });
    assert.ok(clique,
      "aucun bouton « Réautoriser » visible après le semis : l'état de la capture "
      + "n'est plus atteignable ainsi — réancrez le semis, ne laissez pas la garde verte");
    await p.waitForTimeout(500);
    const apres = await p.evaluate(() => {
      const msg = [...document.querySelectorAll("span,div")].find((x) =>
        x.children.length === 0 && /ne peut plus être retrouvé/.test(x.textContent || ""));
      const r = msg && msg.getBoundingClientRect();
      const choisir = [...document.querySelectorAll("button")].find((x) =>
        x.offsetParent !== null && /Choisir le fichier de sauvegarde/.test(x.textContent || ""));
      const reste = [...document.querySelectorAll("button")].find((x) =>
        x.offsetParent !== null && /^Réautoriser/.test((x.textContent || "").trim()));
      return { message: msg ? msg.textContent.trim().slice(0, 80) : null,
        messageVisible: !!(r && r.height > 0 && r.bottom > 0 && r.top < innerHeight),
        boutonChoisir: !!choisir, boutonReautoriserReste: !!reste };
    });
    assert.ok(apres.message,
      "le clic sur « Réautoriser » avec une poignée morte est resté MUET : aucun "
      + "message ne dit que le fichier ne peut plus être retrouvé — c'est le "
      + "silence de la capture, le bouton qui ne fait rien et ne dit rien");
    assert.ok(apres.messageVisible, "le message existe mais n'est pas visible dans la fenêtre");
    assert.ok(apres.boutonChoisir,
      "le message demande de rechoisir le fichier mais AUCUN bouton « Choisir le "
      + "fichier de sauvegarde » n'est offert : un message qui prescrit un geste "
      + "introuvable est le défaut d'origine, déplacé d'un cran");
    assert.ok(!apres.boutonReautoriserReste,
      "« Réautoriser » reste affiché à côté du choix : deux boutons pour la même "
      + "intention, dont un qui re-perd le geste en silence — le défaut A3");
  } finally {
    await nav.close();
  }
});
