// ————— CE QU'UN ÉCHEC LAISSE DERRIÈRE LUI —————
//
// La classe qu'aucune garde du dépôt ne couvrait : tout y vérifie ce qu'un geste
// produit quand il RÉUSSIT. Le cas réel : six « vena-sauvegarde.json.crswap »,
// « .9.crswap », « .10.crswap » sur le disque d'un utilisateur qui n'avait rien
// exporté — un par écriture avortée, une par minute, en boucle depuis un jour.
//
// Le mécanisme, MESURÉ sur de vraies poignées (OPFS) : Chrome crée le fragment à
// createWritable() et ne le retire qu'au close() — ou à l'abort(). Une écriture
// qui jette entre les deux le laisse, et la tentative suivante, trouvant le nom
// pris, en crée un numéroté. Trois échecs sans finally laissent trois fragments ;
// les trois mêmes avec abort() n'en laissent aucun. La concurrence est innocente :
// deux createWritable simultanés se referment proprement (mesuré aussi — une
// hypothèse écartée par la mesure, pas par l'argument).
//
// Deux gardes, et elles ne se recouvrent pas : la STRUCTURELLE interdit la forme
// qui ne peut pas fermer (un writable que le finally ne voit pas), celle du
// COMPORTEMENT vérifie qu'abort est réellement appelé et que la relance s'arrête.
//
// ÉPROUVER CES DEUX-LÀ NE SE FAIT PAS AU MÊME ENDROIT, et une mutation l'a
// montré en restant VERTE : la structurelle lit Vena.dc.html, celle du
// comportement charge Vena.solo.html. Muter la source sans régénérer l'artefact
// laisse le banc mesurer l'ancien code — la mutation semble « ne rien casser »
// alors qu'elle n'a rien atteint. Une garde de rendu se mute DANS L'ARTEFACT.
//
// ANGLE MORT, déclaré (règle 9) : le banc n'a pas OPFS en « file:// » — il ne
// compte donc pas les fragments sur un disque, il vérifie l'abort qui les évite.
// Le comptage sur vraies poignées a été fait à la main, hors banc, et c'est lui
// qui a établi le mécanisme ; le jour où le banc sert en http, il se mesure ici.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { borne } from "../lib/tranche.mjs";

const APP = readFileSync(new URL("../../Vena.dc.html", import.meta.url), "utf8");
const SOLO = new URL("../../Vena.solo.html", import.meta.url).pathname;
const CHROMIUMS = [
  process.env.VENA_CHROMIUM,
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
].filter(Boolean);

test("tout writable ouvert a une ISSUE : le finally le voit, et il avorte", () => {
  const sites = [];
  let k = APP.indexOf("createWritable()");
  while (k !== -1) { sites.push(k); k = APP.indexOf("createWritable()", k + 1); }
  assert.ok(sites.length >= 2,
    "les ouvertures de writable ont disparu (" + sites.length + " vue(s)) : la garde "
    + "ne mesure plus rien — réancrez-la sur ce qui ouvre aujourd'hui");
  for (const i of sites) {
    const ligne = APP.slice(0, i).split("\n").length;
    const debutLigne = APP.lastIndexOf("\n", i) + 1;
    const decl = APP.slice(debutLigne, i);
    // LA FORME QUI NE PEUT PAS FERMER : un writable déclaré DANS le try est
    // invisible au finally — c'est exactement le code qui a laissé les fragments.
    assert.ok(!/\b(const|let|var)\s+\w+\s*=\s*await\b/.test(decl),
      "ligne " + ligne + " : le writable est DÉCLARÉ à son ouverture (« "
      + decl.trim() + " ») — déclaré dans le try, il est invisible au finally, "
      + "et une écriture qui jette laisse un fragment .crswap sur le disque de "
      + "l'utilisateur. Déclarez « let w = null; » AVANT le try, affectez ici.");
    // ————— LA FENÊTRE ÉTAIT UN NOMBRE MAGIQUE, ET LA PROSE L'A DÉPASSÉE —————
    // 2 200 caractères après l'ouverture. Le jour où un commentaire a grossi entre
    // l'ouverture et le `finally` — le retrait de la vérification de place, qui
    // explique pourquoi elle ne pouvait pas être juste — la distance est passée à
    // 2 385 et la garde a rougi sur un code qui n'avait pas bougé. Faux positif.
    //
    // La réponse n'est pas 2 600 : ce serait le second rustine sur une borne
    // arbitraire, et la troisième prose la dépasserait. On change de FORME — la
    // portée qui compte n'a jamais été un nombre de caractères, c'est LA MÉTHODE
    // qui contient l'ouverture. `borne` la ferme sur l'accolade de méthode, et
    // elle jette si elle ne la trouve pas plutôt que de s'élargir en silence.
    const suite = APP.slice(i, borne(APP, "\n  }", i));
    assert.ok(/\}\s*finally\s*\{/.test(suite),
      "ligne " + ligne + " : aucun finally ne suit cette ouverture de writable. "
      + "Chrome crée « <nom>.crswap » ici et ne le retire qu'au close() ou à "
      + "l'abort() : sans issue garantie, chaque échec laisse un fichier de plus "
      + "sur le disque — mesuré, un par tentative, numérotés.");
    const apresFinally = suite.slice(suite.search(/\}\s*finally\s*\{/));
    assert.ok(/\.abort\(\)/.test(apresFinally.slice(0, 260)),
      "ligne " + ligne + " : le finally ne fait pas abort(). close() sur un flux "
      + "qui a jeté ne suffit pas — c'est abort() qui retire le fragment.");
  }
});

test("après deux échecs la sauvegarde automatique s'arrête, avorte, et le dit", { timeout: 120000 }, async () => {
  let chromium;
  try { ({ chromium } = await import("playwright")); }
  catch (e) { assert.fail("playwright introuvable — cette garde ne saute pas en silence."); }
  const executablePath = CHROMIUMS.find((c) => existsSync(c));
  const nav = await chromium.launch(executablePath ? { executablePath } : {})
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
    await p.waitForTimeout(300);
    const m = await p.evaluate(async () => {
      const el = document.querySelector("button");
      const fk = Object.keys(el).find((x) => x.startsWith("__reactFiber"));
      let f = el[fk];
      while (f && !(f.stateNode && f.stateNode.constructor
        && f.stateNode.constructor.name === "StreamableComponent")) f = f.return;
      const inst = f.stateNode.logic;
      // une poignée qui accorde tout et dont l'écriture JETTE EN COURS — ce que
      // fait un quota atteint ou une lecture de bloc qui échoue
      const compte = { ouverts: 0, avortes: 0, fermes: 0, tentatives: 0 };
      inst.handleAuto = {
        name: "vena-sauvegarde.json",
        queryPermission: async () => "granted",
        requestPermission: async () => "granted",
        createWritable: async () => {
          compte.ouverts += 1;
          return {
            write: async () => {},
            close: async () => { compte.fermes += 1; },
            abort: async () => { compte.avortes += 1; },
          };
        },
      };
      inst.ecrireExportAu = async (sink) => {
        compte.tentatives += 1;
        await sink.write("{");
        throw new Error("lecture de bloc échouée");
      };
      // six minutes de périodique
      for (let k = 0; k < 6; k++) await inst.sauverAuto();
      const enPause = { ...compte, msg: inst.state.autoMsg || "",
        detail: inst.state.autoDetail || "", verrou: !!inst._autoEcrit };
      // et la REPRISE est un geste, pas une horloge
      await inst.sauverAuto(true);
      enPause.apresGeste = compte.tentatives;
      return enPause;
    });
    assert.equal(m.tentatives, 2,
      "six ticks ont produit " + m.tentatives + " tentative(s) d'écriture : la "
      + "sauvegarde automatique ne s'arrête pas après deux échecs. Elle relit tout "
      + "le stockage chaque minute pour échouer au même endroit — des fragments et "
      + "de la chaleur, en boucle, jusqu'à ce que l'utilisateur ferme l'onglet.");
    assert.equal(m.avortes, m.ouverts,
      m.ouverts + " writable(s) ouvert(s) pour " + m.avortes + " avorté(s) : un "
      + "writable sans issue laisse un « .crswap » sur le disque de l'utilisateur — "
      + "un par tentative, et il ne sait pas que ce ne sont pas ses sauvegardes.");
    assert.ok(!m.verrou, "le verrou de ré-entrance reste posé après un échec : plus aucune écriture ne repartira");
    assert.match(m.msg, /en pause/,
      "l'arrêt ne se dit pas : une sauvegarde automatique qui s'arrête en silence "
      + "laisse croire qu'elle protège — le pire des états (message vu : « " + m.msg.slice(0, 60) + " »)");
    // ————— RÉANCRÉ : L'INFORMATION A CHANGÉ DE PLACE, PAS DISPARU —————
    // Les fragments étaient nommés dans la phrase PERMANENTE, qui faisait cinq
    // lignes et prenait un quart de la fenêtre à chaque seconde. Ils vivent
    // maintenant derrière « Pourquoi › » : nécessaire une fois, pas tout le
    // temps. La garde vérifie donc les DEUX faces — la phrase reste courte, et
    // le détail existe. Sans la seconde, « raccourcir » voudrait dire supprimer.
    assert.match(m.detail, /crswap/,
      "le détail de la pause ne nomme plus les fragments : l'utilisateur les voit "
      + "sur son disque et ne peut pas savoir seul qu'il peut les supprimer sans "
      + "rien perdre — replier une information n'est pas la retirer");
    assert.ok(!/crswap/.test(m.msg),
      "la phrase PERMANENTE a repris le détail des fragments : c'est du mobilier "
      + "qui coûte de l'écran à chaque seconde, sur toutes les pages, pour une "
      + "information nécessaire une fois. Elle appartient au dépliement.");
    assert.ok(m.msg.length < 90,
      "la phrase permanente de la pause fait " + m.msg.length + " caractères : elle "
      + "enveloppe sur plusieurs lignes dans une barre fixe (mesuré : cinq lignes, "
      + "un quart de la fenêtre). Une phrase et sa cause, le reste se déplie.");
    assert.ok(!/Réautoriser|cliquez/i.test(m.msg),
      "le message de pause nomme son propre bouton : il est à côté, permanent — "
      + "le message dit l'état, le bouton dit le geste");
    assert.equal(m.apresGeste, 3,
      "la reprise par le geste (force) ne repart pas : la pause serait définitive, "
      + "et le bouton du pied ne servirait plus à rien");
  } finally {
    await nav.close();
  }
});
