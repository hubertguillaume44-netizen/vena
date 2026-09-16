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
// Les TROIS SURFACES qui s'ouvrent par-dessus les pages — le tiroir, l'aide, l'avis —
// sont dans la tournée depuis le second test ci-dessous : elles étaient hors de
// portée, ce qui n'est pas la même chose qu'un angle mort. Un angle mort est un
// endroit où le banc ne PEUT pas aller (un dialogue natif) ; une surface non visitée
// est un endroit où il n'allait pas.
// Et elle ne passe pas au vert sur une page qu'elle n'a pas su ouvrir : une vue
// sans aucun bouton la fait tomber.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { POSER_SEMIS } from "./lib/semis.mjs";
import path from "node:path";

const SOLO = new URL("../../Vena.solo.html", import.meta.url).pathname;
const CHROMIUMS = [
  process.env.VENA_CHROMIUM,
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
].filter(Boolean);
// ————— SEPT VUES, PAS TROIS PAGES —————
//
// Les trois pages portent des SOUS-VUES que la tournée n'ouvrait pas : mesurées,
// elles ajoutent 85 libellés inédits à l'état peuplé — plus que les trois surfaces
// (14) et plus que la moitié de ce que la tournée voyait (78). Six écrans que
// personne n'avait jamais cliqués.
const VUES = [
  ["Mes instruments", null],
  ["Mes scans", "Nouveau scan"], ["Mes scans", "Historique"], ["Mes scans", "Backtest"],
  ["Mes décisions", "Portefeuille"], ["Mes décisions", "Marché"], ["Mes décisions", "Journal"],
];
const PAGES = [...new Set(VUES.map(([p]) => p))];
// ————— LE REGISTRE DES MUETS CONNUS, ET CE QU'IL COÛTE —————
//
// La tournée étendue a trouvé QUATORZE gestes sans réaction visible, dans six
// sous-vues que personne n'avait jamais cliquées. Ils sont inscrits AVANT enquête :
// ce sont des constats, pas des diagnostics.
//
// CE QUE ÇA COÛTE, écrit à côté de la dette parce qu'un chiffre seul se classe tout
// seul en bas de la pile : neuf boutons sur lesquels on clique sans que rien ne
// réponde, et cinq cases qui changent l'état sans le DIRE — la forme « message sans
// surface », celle qui a motivé cette garde. Ce n'est pas du cosmétique : c'est
// « ça ne marche pas », la phrase qu'on ne peut pas déboguer.
//
// DEUX RÉSERVES, parce qu'une liste vendue pour plus sûre qu'elle n'est coûte plus
// cher que pas de liste :
//   · les trois de Backtest demandent peut-être un backtest déjà lancé ; `semis.mjs`
//     ne couvre pas les préconditions de cette vue. Ce serait une limite du SEMIS,
//     pas un défaut du produit — et alors c'est le semis qu'on étend.
//   · les quatre « Sans filtre… » ressemblent à des étiquettes rendues en <button>.
//     Si c'en sont, le défaut est le BALISAGE — un élément inerte qui se présente
//     comme cliquable est un défaut réel, mais d'une autre nature.
//
// LE REGISTRE NE PEUT PAS POURRIR, et c'est ce qui le distingue d'une liste de
// tolérances. Il échoue DANS LES DEUX SENS : un muet qui n'y est pas est une
// régression ; une entrée qui cesse d'être muette est une entrée à retirer, et la
// garde le dit. Sans le second sens il deviendrait une liste d'exemptions que plus
// personne ne relève — verte en ne gardant plus rien.
// SEPT ENTRÉES ONT ÉTÉ RETIRÉES le jour même où elles ont été inscrites, et aucune
// n'était un défaut du produit — c'est le registre lui-même qui l'a exigé, en
// échouant sur leur guérison. Les cinq cases de l'agenda et deux cases de la carte
// des filtres : les premières étaient aveuglées par la borne de 25 mutations de
// l'observateur, les secondes sont des éléments inertes que le produit déclare
// lui-même non cliquables (`curseur: 'default'`) et qui sont désormais comptés
// comme défaut de BALISAGE, séparément.
const MUETS_CONNUS = new Map([
  ["Mes scans › Nouveau scan · « Sans filtreréférence tous les signaux sont pris — la référence à battre »",
    "étiquette ou geste ? rendu en <button> — non enquêté"],
  ["Mes scans › Nouveau scan · « Sécurisation, lecture, durée ×2 »",
    "repli d'un groupe de réglages — non enquêté"],
  ["Mes scans › Nouveau scan · « Exporter (CSV) »",
    "devrait télécharger ; aucun téléchargement ne part — non enquêté"],
  ["Mes scans › Historique · « Ne rien écarter »",
    "btn btn-ghost, PAS actif : devrait remettre le filtre à zéro — non enquêté"],
  ["Mes scans › Backtest · « Sauvegarder ce résultat »",
    "précondition peut-être non semée — non enquêté"],
  ["Mes scans › Backtest · « Mesurer »",
    "btn btn-primary, pas disabled ; précondition non semée ? — non enquêté"],
  ["Mes scans › Backtest · « Comparer »",
    "btn btn-primary, pas disabled ; précondition non semée ? — non enquêté"],
]);

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

// ————— LA TOURNÉE S'EXÉCUTE SUR L'ÉTAT PEUPLÉ, ET C'EST LA RÈGLE 10 —————
//
// Elle tournait sur un navigateur neuf : l'état où la moitié des boutons n'ont pas
// encore de raison d'être. « Tout supprimer », « Écarter », « pousser à 2 000 »,
// les sélecteurs de scan : vingt-et-un gestes qu'un compte vide ne peut PAS
// produire, donc que la tournée ne pouvait pas atteindre. C'était un angle mort
// déclaré — « tout état qui exige des données qu'un navigateur neuf n'a pas » —
// et `semis.mjs` produit exactement ces données, en vérifiant son propre effet.
// Un angle mort qui devient refermable se ferme.
//
// UNE SEULE TOURNÉE, ET SUR LE PEUPLÉ. Mesuré : 142 libellés à vide, 162 peuplé,
// et l'intersection est presque totale — UN SEUL libellé disparaît en semant,
// « Commissions du courtier non renseignées », qui est le MÊME bouton sous son
// autre texte (« … aucun instrument »). Aucun geste n'est perdu : vérifié
// nommément sur les cinq que le vide est censé seul porter — « Coller ma clé »,
// « Voir les séries d'exemple », « Déposer le relevé », « Enregistrer une copie »,
// « Importer mes données », tous PRÉSENTS à l'état peuplé. Deux tournées
// doubleraient le budget pour rien.
//
// UNE SONDE QUI ÉPELLE UNE CHAÎNE DE L'INTERFACE LA NORMALISE. Le contrôle nommé
// ci-dessus a mordu : « Voir les séries d'exemple » ressortait ABSENT parce que la
// sonde épelait l'apostrophe DROITE (U+0027) et l'application la TYPOGRAPHIQUE
// (U+2019). Elle rapportait donc une absence qui n'existait pas — et une absence
// est une conclusion dont on se sert : celle-là aurait fait déclarer une exception
// pour un geste qui n'en avait pas besoin.
//
// La règle vaut pour toute garde qui écrit un libellé de l'interface dans son
// propre source : `normApos` ci-dessous, et jamais une comparaison nue. Le piège
// est invisible à la relecture — les deux caractères se ressemblent dans presque
// toutes les polices, et c'est pourquoi il se désarme par construction et pas par
// vigilance.
export const normApos = (x) => String(x || "").replace(/[\u2019\u02bc\u2018]/g, "'");
async function ouvrir(nav, semer) {
  const ctx = await nav.newContext({ acceptDownloads: true });
  const p = await ctx.newPage();
  await p.goto("file://" + SOLO);
  await p.waitForFunction(() => document.body && document.body.innerText.length > 400, { timeout: 60000 });
  // le banc ne peut pas franchir le dialogue natif : en headless,
  // showSaveFilePicker jette AbortError même sur un vrai clic, et l'export
  // devient un silence. On le neutralise pour éprouver le REPLI téléchargement
  // — la voie que ce banc sait mesurer ; le fil a sa garde (export-au-fil).
  await p.evaluate(() => { window.showSaveFilePicker = undefined; });
  const porte = await p.waitForSelector('button:has-text("J\'ai compris")', { timeout: 15000 }).catch(() => null);
  if (porte) {
    await porte.click();
    await p.waitForSelector(".dialog-backdrop", { state: "detached", timeout: 10000 }).catch(() => {});
  }
  if (semer) {
    // le semis JETTE s'il ne sème rien, et son message nomme le compte demandé et
    // le compte relu par le chemin du produit. On ne l'enveloppe pas : une tournée
    // qui s'exécuterait sur un écran vide en croyant mesurer l'état peuplé serait
    // exactement la panne que ce semis existe pour interdire.
    await p.evaluate(POSER_SEMIS);
    await p.evaluate("window.__semis.scan(9)");
    await p.evaluate("window.__semis.journal(12)");
    await p.evaluate("window.__semis.decisions(3)");
    await p.waitForTimeout(400);
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
      // ————— LA BORNE DE 25 ÉTAIT UNE BORNE DE VÉRITÉ, ET SON COMMENTAIRE DISAIT
      // LE CONTRAIRE —————
      // Elle s'annonçait « borne du coût, pas de la vérité : une seule suffit ». Une
      // seule suffit, oui — encore faut-il la REGARDER. Mesuré sur les cases à cocher
      // de l'agenda : 62 mutations dans le lot, 14 visibles, et la PREMIÈRE visible au
      // 48e rang. L'observateur s'arrêtait au 25e et rapportait « des mutations, aucune
      // visible » sur un geste qui fonctionne parfaitement — cinq faux muets, une
      // seule cause, dans le banc. Un re-rendu de liste émet ses mutations dans
      // l'ordre du DOM, jamais dans l'ordre de la visibilité.
      // On balaie donc tout le lot : le coût réel est un parcours de quelques dizaines
      // d'entrées, et une garde qui économise au point de ne plus voir est une garde
      // aveugle sans rougir.
      for (const m of ms) {
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

// Le clic sur le VOILE (z-index 69) : c'est ce qui ferme le tiroir, et rien d'autre
// ne le ferme — ni Escape, ni un bouton.
async function clicVoile(p) {
  return p.evaluate(() => {
    const v = [...document.querySelectorAll("div")]
      .find((d) => /z-index: ?69/.test(d.getAttribute("style") || ""));
    if (!v) return false;
    v.click();
    return true;
  }).catch(() => false);
}

async function clicParTitre(p, titre) {
  return p.evaluate((t) => {
    const b = [...document.querySelectorAll("button")]
      .find((x) => x.offsetParent !== null && !x.disabled && x.title === t);
    if (!b) return false;
    b.click();
    return true;
  }, titre).catch(() => false);
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
  await clicVoile(p);
  // ET LES TROIS SURFACES, chacune par SON fermeur. Sans ça, l'avis resté ouvert
  // rendait « Donner mon avis » MUET aux yeux de la tournée — deux vues sur sept
  // l'ont rapporté comme un défaut du produit alors que le banc mesurait son propre
  // état. Le fermeur existait déjà, dans la garde des surfaces ; il n'était pas
  // appelé ici. Une même vérité écrite à un endroit et pas à l'autre.
  await clicDom(p, "Fermer");            // l'aide
  await clicParTitre(p, "Fermer");       // l'avis (sa croix)
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

// Un clic par le TITRE (contenance) : la porte du tiroir porte l'état de l'espace
// en libellé — « 3 instruments à vous · ce navigateur » — et ce libellé change avec
// les données. Le titre, lui, décrit la FONCTION : il ne bouge pas avec l'état.
async function clicTitreContient(p, bout) {
  return p.evaluate((t) => {
    const b = [...document.querySelectorAll("button")]
      .find((x) => x.offsetParent !== null && !x.disabled && (x.title || "").includes(t));
    if (!b) return false;
    b.click();
    return true;
  }, bout).catch(() => false);
}

// Fermer les trois, chacune par SON fermeur : ils sont différents, et Escape n'en
// ferme aucune. On passe les trois à chaque fois plutôt que de deviner laquelle est
// ouverte — un clic a pu en fermer une et en ouvrir une autre (« M'écrire »).
async function fermerToutesSurfaces(p, clicVoile, clicTitre) {
  for (let k = 0; k < 3; k++) {
    await clicVoile();                       // le tiroir
    await p.waitForTimeout(120);
    await clicDom(p, "Fermer");              // l'aide
    await p.waitForTimeout(120);
    await clicTitre("Fermer");               // l'avis
    await p.waitForTimeout(120);
  }
}

// Aller à une VUE : la page, PUIS le sous-onglet, avec un rendu entre les deux.
// Les enchaîner dans le même geste cliquerait un sous-onglet qui n'existe pas
// encore — c'est le piège qui a fait conclure « page introuvable » sur une page
// qui s'ouvrait très bien, dans la garde de rendu.
async function allerA(p, page, sous) {
  if (!(await clicDom(p, page))) return false;
  await p.waitForTimeout(sous ? 450 : 350);
  if (!sous) return true;
  return p.evaluate((k) => {
    const b = [...document.querySelectorAll("button")]
      .find((x) => x.offsetParent !== null && !x.disabled && (x.textContent || "").trim() === k);
    if (!b) return false;
    b.click();
    return true;
  }, sous).catch(() => false);
}

test("chaque bouton de chaque vue produit une réaction visible", { timeout: 900000 }, async () => {
  const nav = await lancerNavigateur();
  try {
    const p = await ouvrir(nav, true);
    const t0 = Date.now();
    let mesures = 0;
    let telech = 0, choixFichier = 0;
    p.on("download", () => { telech += 1; });
    p.on("filechooser", () => { choixFichier += 1; });
    const inertes = [];
    // Les éléments inertes rendus en <button> : ce ne sont pas des gestes muets,
    // c'est un défaut de BALISAGE, et il se compte à part pour ne pas se cacher
    // derrière l'autre.
    const fauxBoutons = new Set();
    for (const [page, sous] of VUES) {
      const vue = page + (sous ? " › " + sous : "");
      assert.ok(await allerA(p, page, sous),
        "la vue « " + vue + " » est introuvable : la garde ne clique plus rien dessus — réancrez");
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
        "la vue « " + vue + " » ne présente AUCUN bouton au banc : cette garde ne "
        + "mesurerait rien dessus — une garde qui saute en silence est aveugle sans rougir");
      for (const cle of uniques) {
        // UN BOUTON DE NAVIGATION EST INERTE SUR SA PROPRE DESTINATION, et c'est son
        // état légitime. La règle se DÉDUIT de la vue courante (règle 7) plutôt que
        // de s'énumérer : avec sept vues, une liste écrite à la main aurait sept
        // entrées à tenir, et c'est un périmètre qui se périme au prochain onglet.
        // Chacun reste MESURÉ depuis les six autres vues, où il doit réagir.
        if (cle === page || (sous && cle === sous)) continue;
        if (EXCLUS.has(cle) || EXCLUS_SUR.has(page + " · " + cle)
          || PAGES.includes(cle.replace(/^\d/, ""))) continue;
        await fermerDialogues(p);
        // revenir sur la VUE : un clic précédent a pu changer de page ou de sous-vue
        await allerA(p, page, sous);
        await p.waitForTimeout(120);
        mesures += 1;
        // UN SEGMENT SUR SA PROPRE VALEUR ACTIVE EST INERTE, comme un bouton de
        // navigation sur sa destination : c'est la même règle un cran plus bas.
        // « Haute et basse » (tag tag-accent) et « Ce mois » (jvseg on) sont la valeur
        // DÉJÀ choisie de leur groupe ; les recliquer ne peut rien changer, et c'est
        // leur état légitime. La condition se LIT sur la classe rendue — le résultat —
        // et non sur une liste de libellés, qui se périmerait au prochain segment.
        // Chacun reste MESURÉ dès qu'un autre segment devient actif.
        // ET LA LECTURE SE FAIT ICI, APRÈS le retour à la vue — pas avant. Placée
        // plus haut, elle interrogeait l'écran laissé par le clic PRÉCÉDENT, où le
        // bouton n'existe pas : elle ne trouvait rien, ne sautait rien, et « Ce mois »
        // était rapporté muet alors qu'il est simplement déjà choisi. Une garde qui lit
        // l'état doit le lire au moment où elle agit dessus.
        // le verdict se lit en CLAIR : un ternaire qui rendait 0 pour « segment »
        // avalait le cas, et les deux segments actifs sont revenus dans la liste des
        // muets. Trois issues, trois lignes.
        const nature = await p.evaluate((k) => {
          const b = [...document.querySelectorAll("button")].find((x) =>
            x.offsetParent !== null && !x.disabled
            && ((x.textContent || "").trim().replace(/\s+/g, " ") || x.title) === k);
          if (!b) return false;
          const c = b.className || "";
          if (/\bon\b/.test(c) || /\btag-accent\b/.test(c)) return "segment";
          // ————— ET UN ÉLÉMENT QUE LE PRODUIT DÉCLARE NON ACTIONNABLE —————
          // Les cases « pas encore calculée » de la carte des filtres portent
          // `curseur: 'default'` et un gestionnaire VIDE (`ouvrir: () => {}`) : le
          // produit dit lui-même qu'il n'y a rien à cliquer. La condition se lit sur
          // le style CALCULÉ — le résultat — et non sur une liste de libellés.
          //
          // CE N'EST PAS UNE EXEMPTION GRATUITE : qu'un élément inerte soit rendu en
          // <button> reste un défaut, d'une autre nature — focalisable au clavier,
          // annoncé comme un bouton par un lecteur d'écran. Il est compté à PART
          // plutôt que rangé avec les gestes muets : deux défauts distincts ne se
          // rangent pas sous le même mot, sinon corriger l'un fait disparaître
          // l'autre du compte sans que personne ne l'ait traité.
          if (getComputedStyle(b).cursor === "default") return "inerte";
          return "";
        }, cle).catch(() => "");
        if (nature === "inerte") { fauxBoutons.add(vue + " · « " + cle + " »"); continue; }
        if (nature === "segment") continue;

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
          inertes.push(vue + " · « " + cle + " »"
            + (apres.m > avant.m ? " (des mutations, aucune visible dans la fenêtre)" : " (aucune réaction du tout)"));
        }
        await calmer(p);
      }
    }
    // LE BUDGET EST UNE MESURE, pas une impression : il est rapporté à chaque
    // exécution, avec le nombre de gestes mesurés. Une tournée qui grossit sans
    // qu'on le voie finit par être coupée au hasard le jour où elle gêne.
    console.log("    [gestes] " + mesures + " gestes mesurés sur " + VUES.length
      + " vues en " + Math.round((Date.now() - t0) / 1000) + " s");
    // ————— LE REGISTRE ÉCHOUE DANS LES DEUX SENS —————
    const cleDe = (x) => x.replace(/ \((?:aucune réaction du tout|des mutations[^)]*)\)$/, "");
    const neufs = inertes.filter((x) => !MUETS_CONNUS.has(cleDe(x)));
    const vus = new Set(inertes.map(cleDe));
    const gueris = [...MUETS_CONNUS.keys()].filter((k) => !vus.has(k));
    assert.deepEqual(gueris, [],
      gueris.length + " entrée(s) du registre ne sont PLUS muettes :\n  " + gueris.join("\n  ")
      + "\n\nC'est une bonne nouvelle, et c'est quand même un échec : un registre qu'on "
      + "ne vide pas devient une liste d'exemptions que plus personne ne relève, et la "
      + "garde passe au vert en ne gardant plus rien. Retirez ces lignes de MUETS_CONNUS. "
      + "Si l'entrée a disparu parce que le BOUTON a disparu, dites-le dans le commit : "
      + "un geste retiré n'est pas un geste réparé.");
    assert.deepEqual(neufs, [],
      "Des boutons ne produisent AUCUNE réaction visible, et ils ne sont PAS au registre "
      + "— le défaut de la soirée, sous toutes ses formes (menu vide, export muet, bouton "
      + "MT5, Réautoriser jamais branché, messages sans surface) :\n  " + neufs.join("\n  ")
      + "\n\nChaque geste doit faire quelque chose ET le dire dans la fenêtre, sans "
      + "défiler. Si un bouton est légitimement hors de portée du banc (sélecteur "
      + "natif, état absent d'un navigateur neuf), il s'exclut NOMMÉMENT, avec sa raison. "
      + "S'il est un muet CONNU en attente d'enquête, il rejoint MUETS_CONNUS — qui "
      + "échoue le jour où il guérit, pour qu'il ne devienne pas une liste de tolérances.");
  } finally {
    await nav.close();
  }
});

test("chaque bouton des trois surfaces répond — et chaque surface se referme, vérifié", { timeout: 600000 }, async () => {
  // ————— CE QUI S'OUVRE PAR-DESSUS N'ÉTAIT VISITÉ PAR PERSONNE —————
  //
  // La tournée des pages voit 78 libellés. Trois surfaces s'ouvrent depuis ces
  // pages sans jamais être parcourues : le tiroir, l'aide et l'avis — 14 libellés
  // distincts, mesurés, dont aucun n'avait été cliqué par une garde.
  //
  // LE PIÈGE EST DANS LA FERMETURE, ET IL A MORDU LA SONDE QUI L'A TROUVÉ. Une
  // surface restée ouverte recouvre la suivante : les clics d'après deviennent des
  // no-op et les comptes se cumulent. Trois mesures, et les trois fermeurs sont
  // DIFFÉRENTS — rien ne se devine :
  //     tiroir : le voile (z-index 69) ferme  · Escape NON
  //     aide   : son bouton « Fermer »        · voile NON · Escape NON
  //     avis   : sa croix (title=Fermer)      · voile NON · Escape NON
  // La fermeture n'est donc pas SUPPOSÉE : elle se lit sur le drapeau d'état du
  // produit (`tiroir`, `aideOuverte`, `avisOuvert`), qui est le résultat — pas sur
  // un z-index ni sur la disparition d'un sélecteur, qui sont des proxys.
  //
  // ET LE LIBELLÉ EST UN MAUVAIS ANCRAGE POUR LA FERMETURE : une première sonde
  // cherchait le bouton « × » par son texte et en a trouvé un AUTRE, dont le titre
  // contenait le même caractère. Elle a conclu « la croix de l'avis ne ferme pas »
  // — un faux défaut, rapporté à deux doigts d'être corrigé. La croix se prend
  // donc par texte ET par titre.
  //
  // LES CINQ ÉTOILES NE SE COMPTENT PAS CINQ FOIS. Cinq boutons « ★ » identiques :
  // cliquer les cinq, c'est écrire cinq fois la même assertion. Une seule est
  // cliquée, et ce qu'on exige d'elle est plus fort qu'une mutation du DOM —
  // l'ÉTAT DE NOTATION doit changer, ce qui est le rôle du geste.
  //
  // ANGLE MORT, déclaré (règle 9) : « Demander la protection » et « Réautoriser »
  // ouvrent des dialogues NATIFS, hors de portée de l'automate — ils restent
  // exclus nommément, comme dans la tournée des pages. C'est la seule exclusion :
  // les douze autres libellés sont mesurés.
  const nav = await lancerNavigateur();
  try {
    const p = await ouvrir(nav);
    let telech = 0, choixFichier = 0;
    p.on("download", () => { telech += 1; });
    p.on("filechooser", () => { choixFichier += 1; });
    // le drapeau d'ÉTAT du produit, remonté par la fibre : le résultat, pas un proxy
    const drapeaux = () => p.evaluate(() => {
      const el = document.querySelector("button");
      const fk = Object.keys(el).find((x) => x.startsWith("__reactFiber"));
      let f = el[fk];
      while (f && !(f.stateNode && f.stateNode.constructor
        && f.stateNode.constructor.name === "StreamableComponent")) f = f.return;
      const s = f.stateNode.logic.state;
      return { tiroir: !!s.tiroir, aideOuverte: !!s.aideOuverte, avisOuvert: !!s.avisOuvert };
    });
    const visibles = () => p.evaluate(() =>
      [...document.querySelectorAll("button")]
        .filter((b) => b.offsetParent !== null && !b.disabled)
        .map((b) => (b.textContent || "").trim().replace(/\s+/g, " ") || b.title || "")
        .filter(Boolean));
    const clicVoile = () => p.evaluate(() => {
      const v = [...document.querySelectorAll("div")]
        .find((d) => /z-index: ?69/.test(d.getAttribute("style") || ""));
      if (v) { v.click(); return true; }
      return false;
    });
    const clicTitre = (titre) => p.evaluate((t) => {
      const b = [...document.querySelectorAll("button")]
        .find((x) => x.offsetParent !== null && !x.disabled && x.title === t);
      if (!b) return false;
      b.click();
      return true;
    }, titre);
    const SURFACES = [
      { nom: "le tiroir", drapeau: "tiroir",
        // la porte porte l'état de l'espace en libellé (« 3 instruments à vous · ce
        // navigateur ») : il change avec les données. On la prend par son TITRE, qui
        // décrit la fonction et non l'état.
        ouvrir: () => clicTitreContient(p, "space de donn\u00e9es"),
        fermer: clicVoile,
        commentFermer: "le voile (z-index 69) — Escape ne le ferme pas" },
      { nom: "l'aide", drapeau: "aideOuverte",
        ouvrir: () => clicDom(p, "? Aide"),
        fermer: () => clicDom(p, "Fermer"),
        commentFermer: "son bouton « Fermer » — ni le voile ni Escape ne le ferment" },
      { nom: "l'avis", drapeau: "avisOuvert",
        ouvrir: () => clicDom(p, "Donner mon avis"),
        fermer: () => clicTitre("Fermer"),
        commentFermer: "sa croix (title=Fermer) — ni le voile ni Escape ne la ferment" },
    ];
    const inertes = [];
    for (const surf of SURFACES) {
      // 1 · AU REPOS : rien d'ouvert. Une surface restée ouverte du tour précédent
      // rendrait tous les clics suivants muets sans que rien ne rougisse.
      const repos = await drapeaux();
      assert.deepEqual(repos, { tiroir: false, aideOuverte: false, avisOuvert: false },
        "avant d'ouvrir " + surf.nom + ", une surface est restée ouverte : "
        + JSON.stringify(repos) + ". Elle recouvre ce qui suit, les clics deviennent "
        + "des no-op et les comptes se cumulent — c'est exactement le piège qui a "
        + "faussé la sonde qui a trouvé ces surfaces.");
      // 2 · LA PORTE S'OUVRE, et on le LIT sur le drapeau
      const avantOuv = await visibles();
      assert.ok(await surf.ouvrir(), "la porte de " + surf.nom + " est introuvable — réancrez");
      await p.waitForTimeout(600);
      assert.ok((await drapeaux())[surf.drapeau],
        "la porte de " + surf.nom + " a été cliquée et le drapeau « " + surf.drapeau
        + " » est resté faux : la surface ne s'ouvre pas, et la garde mesurerait la "
        + "page en croyant la parcourir");
      // 3 · CE QUE LA SURFACE AJOUTE — par DIFFÉRENCE, jamais par un sélecteur de
      // conteneur : le balisage des trois surfaces n'a rien en commun, et un
      // sélecteur écrit à la main serait un périmètre (règle 7).
      const apresOuv = await visibles();
      const avant = new Set(avantOuv);
      const propres = [...new Set(apresOuv.filter((x) => !avant.has(x)))];
      assert.ok(propres.length > 0,
        surf.nom + " s'ouvre mais n'ajoute AUCUN bouton à l'écran : la garde ne "
        + "mesurerait rien dessus — une garde qui saute en silence est aveugle sans rougir");
      // 3bis · L'ÉTOILE, UNE FOIS, ET AVANT TOUT LE RESTE.
      //
      // Deux leçons tiennent dans ces quinze lignes, et les deux sont venues d'un
      // échec de CETTE garde, pas d'une relecture.
      //
      // L'ORDRE : mesurée après la boucle, elle trouvait la note à zéro et accusait
      // le produit. Le formulaire d'avis avait simplement été ENVOYÉ par un clic de
      // la boucle, et l'écran de remerciement n'a plus d'étoiles. La garde mesurait
      // un état qu'elle avait elle-même détruit — un piège de capteur, pas un défaut.
      //
      // L'ANCRAGE : « ★ » est le texte des CINQ boutons, et d'autres ailleurs. Un
      // matcher par contenance en attrapait un au hasard. Le TITRE (« 1 sur 5 —
      // inutilisable ») désigne UNE étoile et une seule : on prend ce qui identifie,
      // pas ce qui décore. Vérifié des deux côtés : HTMLElement.click() sur la bonne
      // étoile pose bien la note — le produit répond, c'est le banc qui visait mal.
      if (surf.drapeau === "avisOuvert") {
        const note = () => p.evaluate(() => {
          const el = document.querySelector("button");
          const fk = Object.keys(el).find((x) => x.startsWith("__reactFiber"));
          let f = el[fk];
          while (f && !(f.stateNode && f.stateNode.constructor
            && f.stateNode.constructor.name === "StreamableComponent")) f = f.return;
          return Number(f.stateNode.logic.state.avisNote) || 0;
        });
        const n0 = await note();
        assert.ok(await clicTitreContient(p, "3 sur 5"),
          "aucune étoile de notation dans l'avis (titre « 3 sur 5 ») — réancrez");
        await p.waitForTimeout(350);
        const n1 = await note();
        assert.notEqual(n1, n0,
          "un clic sur la troisième étoile laisse la note à " + n1 + " : le geste ne "
          + "NOTE pas. Cinq boutons « ★ » identiques ne se comptent pas cinq fois — "
          + "une seule assertion, mais sur l'ÉTAT que le geste existe pour changer, pas "
          + "sur une mutation du DOM qu'un survol suffirait à produire.");
        assert.equal(n1, 3,
          "la troisième étoile pose la note à " + n1 + " et non 3 : le rang de l'étoile "
          + "cliquée n'est pas celui qu'elle annonce dans son titre");
      }
      for (const cle of propres) {
        if (EXCLUS.has(cle)) continue;
        // LES CINQ ÉTOILES : une seule, et on exige l'état, pas une mutation
        if (cle === "★") continue;
        // la surface a pu se refermer sur un clic précédent (« M'écrire » ferme
        // l'aide et ouvre l'avis) : on la rétablit avant de mesurer le suivant
        if (!(await drapeaux())[surf.drapeau]) {
          await fermerToutesSurfaces(p, clicVoile, clicTitre);
          await surf.ouvrir();
          await p.waitForTimeout(400);
        }
        const avantM = await p.evaluate(() => ({ m: window.__mut, v: window.__mutVisible }));
        const dAvant = telech, fAvant = choixFichier;
        const clique = await clicDom(p, cle);
        if (!clique) continue;
        const vif = await p.waitForFunction((a) => window.__mutVisible > a, avantM.v,
          { timeout: 700, polling: 60 }).then(() => true).catch(() => false);
        const apresM = await p.evaluate(() => ({ m: window.__mut, v: window.__mutVisible }));
        if (!(vif || apresM.v > avantM.v || telech > dAvant || choixFichier > fAvant)) {
          inertes.push(surf.nom + " · « " + cle + " »"
            + (apresM.m > avantM.m ? " (des mutations, aucune visible dans la fenêtre)"
              : " (aucune réaction du tout)"));
        }
        await calmer(p);
      }
      // 5 · LA FERMETURE EST VÉRIFIÉE, jamais supposée
      await fermerToutesSurfaces(p, clicVoile, clicTitre);
      const apresFerm = await drapeaux();
      // LE COUPABLE SE DÉDUIT DES DRAPEAUX, il ne se suppose pas de la surface en
      // cours. Première version : le message nommait le fermeur de la surface du tour
      // alors qu'une AUTRE était restée ouverte — « M'écrire » ferme l'aide et ouvre
      // l'avis, donc c'est l'avis qui bloque pendant qu'on parcourt l'aide. Le JSON
      // disait vrai, la phrase disait faux, et c'est la phrase qu'on lit : un message
      // qui accuse le mauvais fermeur envoie chercher au mauvais endroit.
      const restees = SURFACES.filter((x) => apresFerm[x.drapeau]);
      assert.deepEqual(apresFerm, { tiroir: false, aideOuverte: false, avisOuvert: false },
        (restees.length ? restees.map((x) => x.nom).join(" et ") : surf.nom)
        + " ne se referme pas, constaté au sortir de " + surf.nom + " : "
        + JSON.stringify(apresFerm) + ". Le fermeur attendu est "
        + (restees.length
          ? restees.map((x) => x.nom + " → " + x.commentFermer).join(" ; ")
          : surf.commentFermer)
        + " — les trois sont DIFFÉRENTS, rien ne se devine, et une surface qui reste "
        + "ouverte rend muet tout ce qui suit. Un clic peut ouvrir une surface AUTRE "
        + "que celle qu'on parcourt : « M'écrire » ferme l'aide et ouvre l'avis.");
    }
    assert.deepEqual(inertes, [],
      "Des boutons des surfaces ne produisent AUCUNE réaction visible :\n  "
      + inertes.join("\n  ")
      + "\n\nCes libellés étaient simplement HORS DE PORTÉE du banc, ce qui n'est pas "
      + "la même chose qu'un angle mort : un angle mort est un endroit où le banc ne "
      + "PEUT pas aller — un dialogue natif. Si l'un d'eux en est un, il s'exclut "
      + "NOMMÉMENT dans EXCLUS, avec sa raison.");
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
    // ————— ET L'ÉTAT SURVIT AU CHANGEMENT DE VUE —————
    // C'est un ÉTAT, pas un message de geste : il est vrai tant que la permission
    // manque, sur toutes les vues. Le 4e temps efface les messages de geste au
    // changement de vue — il doit ÉPARGNER celui-ci (autoAttente le départage),
    // sinon changer de page fait taire un état encore vrai.
    await clicDom(p, "Mes scans");
    await p.waitForTimeout(400);
    const apresVue = await p.evaluate(() => {
      const msg = [...document.querySelectorAll("span,div")].find((x) =>
        x.children.length === 0 && /ne peut plus être retrouvé/.test(x.textContent || ""));
      const r = msg && msg.getBoundingClientRect();
      return !!(r && r.height > 0);
    });
    assert.ok(apresVue,
      "l'état d'attente a été EFFACÉ par le changement de vue : le 4e temps l'a "
      + "traité comme un message de geste — un état reste affiché tant que la "
      + "permission manque, quelle que soit la page");
  } finally {
    await nav.close();
  }
});
