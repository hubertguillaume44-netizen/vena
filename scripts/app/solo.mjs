#!/usr/bin/env node
/**
 * Fabrique `Vuna.solo.html` : l'application ENTIÈRE dans un seul fichier.
 *
 * `Vuna.dc.html` importe quatre modules voisins et démarre un worker sur un
 * cinquième. C'est la bonne structure pour travailler — une seule source par module,
 * pas de copie qui dérive — mais elle interdit de déposer l'application quelque part
 * qui n'accepte qu'un fichier, et elle échoue en `file://` sans le moindre message.
 *
 * Ce script ne DUPLIQUE rien : il lit les mêmes fichiers que la page, les enveloppe en
 * Blob URL dans l'ordre de leurs dépendances, et remplace textuellement les quelques
 * spécificateurs d'import par ces URL. Le fichier produit est un ARTEFACT — jamais
 * édité à la main, refait à chaque fois que la source change. Le modifier directement
 * recréerait exactement la divergence que tout le reste du dépôt s'emploie à éviter.
 *
 *   node scripts/app/solo.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { borne } from "../lib/tranche.mjs";

const RACINE = path.resolve(new URL("../../", import.meta.url).pathname);
const lire = (f) => readFileSync(path.join(RACINE, f), "utf8");

// Chaque remplacement est vérifié : un spécificateur qui aurait changé de forme dans la
// page ne serait pas patché, l'import échouerait à l'exécution, et le fichier produit
// serait cassé en silence. On préfère échouer ici, à la construction.
function remplacer(src, cherche, par, quoi) {
  if (!src.includes(cherche)) {
    console.error(`\nIntrouvable dans ${quoi} :\n  ${cherche}\n`
      + "La page a changé de forme. Corrigez ce script plutôt que le fichier produit.");
    process.exit(1);
  }
  return src.split(cherche).join(par);
}

const modules = {
  moteur: lire("moteur.js"),
  scanNoyau: lire("scan-noyau.js"),
  robot: lire("robot-mt5.js"),
  conf: lire("conformite-noyau.js"),
  worker: lire("scan-worker.js"),
};

// Les deux modules qui en importent un autre voient leur spécificateur relatif remplacé
// par un jeton, que le préambule échange contre l'URL réelle une fois le module parent
// créé. Un module servi en Blob URL ne peut pas résoudre « ./moteur.js » : sa base n'est
// plus la page.
modules.scanNoyau = remplacer(modules.scanNoyau, "'./moteur.js'", "'__URL_MOTEUR__'", "scan-noyau.js");
modules.worker = remplacer(modules.worker, "'./scan-noyau.js'", "'__URL_SCANNOYAU__'", "scan-worker.js");

let html = lire("Vuna.dc.html");

// ————— LE SYSTÈME DE DESIGN VOYAGE DANS LE FICHIER —————
// La feuille et le paquet étaient les DERNIERS voisins : ouvert en « file:// » — le
// mode recommandé, celui qui marche dans un avion — aucun jeton ne résolvait, et la
// page rendait sans aucune forme : le bouton plein du pied devenait du texte nu
// pendant que les filets gardaient un liseré — une hiérarchie inversée, mesurée au
// rendu. La feuille part en data: avec ses polices inlinées (woff2, base64) ; le
// paquet part comme support.js. ~280 Ko : le prix d'un fichier qui se suffit.
const DS_DIR = "public/_ds/industry-cbc1f2df-2f0f-4cb9-a754-a8a64e9401b6";
let dsCss = lire(DS_DIR + "/styles.css");
dsCss = dsCss.replace(/url\((fonts\/[^)]+)\)/g, (tout, f) =>
  "url(data:font/woff2;base64,"
    + readFileSync(path.join(RACINE, DS_DIR, f)).toString("base64") + ")");
if (dsCss.includes("url(fonts/")) {
  console.error("solo.mjs : une police de la feuille n'a pas été inlinée — la forme des url() a changé.");
  process.exit(1);
}
html = remplacer(html,
  '<link rel="stylesheet" href="_ds/industry-cbc1f2df-2f0f-4cb9-a754-a8a64e9401b6/styles.css">',
  '<link rel="stylesheet" href="data:text/css;base64,' + Buffer.from(dsCss, "utf8").toString("base64") + '">',
  "Vuna.dc.html");
html = remplacer(html,
  '<script src="_ds/industry-cbc1f2df-2f0f-4cb9-a754-a8a64e9401b6/_ds_bundle.js"></script>',
  '<script src="data:text/javascript;base64,'
    + Buffer.from(lire(DS_DIR + "/_ds_bundle.js"), "utf8").toString("base64") + '"></script>',
  "Vuna.dc.html");

// `support.js` — le runtime DC — est chargé par une balise voisine : on l'intègre.
//
// En base64, PAS en clair. Recopié tel quel entre deux balises, il refermait la
// balise dès la première occurrence de « </script » qu'il contient — et le navigateur
// affichait le runtime en texte au milieu de la page au lieu de l'exécuter. Une URL
// `data:` en `src` s'exécute au même moment qu'un fichier voisin, dans l'ordre du
// document, et n'a aucun caractère à échapper.
html = remplacer(html, '<script src="./support.js"></script>',
  '<script src="data:text/javascript;base64,'
    + Buffer.from(lire("support.js"), "utf8").toString("base64") + '"></script>',
  "Vuna.dc.html");

// ————— REACT VOYAGE DANS LE FICHIER —————
// La source pointe `window.__resources` vers `./vendor/…` : des chemins voisins, qui ne
// résolvent ni en « file:// » ni sous /app. Le fichier unique les remplace par des
// Blob URL construites au chargement, à partir des sources intégrées en base64.
// À partir de là il ne reste plus une seule requête vers un tiers.
const REACT = {
  "https://unpkg.com/react@18.3.1/umd/react.production.min.js": "vendor/react-18.3.1/react.production.min.js",
  "https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js": "vendor/react-18.3.1/react-dom.production.min.js",
};
const reactB64 = {};
for (const [url, f] of Object.entries(REACT)) reactB64[url] = Buffer.from(lire(f), "utf8").toString("base64");

// borne() JETTE si l'ancre a disparu : un indexOf à -1 est une borne valide pour
// slice, et la tranche élargie serait partie dans le fichier LIVRÉ
const iRes = borne(html, "  window.__resources = {");
const vieuxResources = html.slice(iRes, borne(html, "};", iRes) + 3);
if (!vieuxResources.includes("unpkg.com/react")) {
  throw new Error("solo.mjs : le bloc window.__resources de Vuna.dc.html a changé de forme");
}
html = remplacer(html, vieuxResources, `  var __R = ${JSON.stringify(reactB64)};
  window.__resources = {};
  for (var __u in __R) {
    window.__resources[__u] = URL.createObjectURL(new Blob(
      [Uint8Array.from(atob(__R[__u]), function (c) { return c.charCodeAt(0); })],
      { type: "text/javascript" }));
  }`, "Vuna.dc.html");

// Les cinq motifs par lesquels la page nomme un fichier voisin — SIX occurrences :
// `robot-mt5.js` est nommé deux fois, à l'export et au préchargement du juge du
// refus. `remplacer` remplace TOUTES les occurrences (split/join), donc les deux
// sont réécrites ; compter les motifs et non les points l'avait fait croire unique.
html = remplacer(html,
  "await import('./robot-mt5.js?v=' + (window.__vunaRobotV || Date.now()))",
  "await import(window.__siv.robot)", "Vuna.dc.html");
html = remplacer(html, "import('./conformite-noyau.js')", "import(window.__siv.conf)", "Vuna.dc.html");
html = remplacer(html, "await import('./moteur.js')", "await import(window.__siv.moteur)", "Vuna.dc.html");
html = remplacer(html, "await import('./scan-noyau.js')", "await import(window.__siv.scanNoyau)", "Vuna.dc.html");
html = remplacer(html, "new URL('./scan-worker.js', location.href)", "window.__siv.worker", "Vuna.dc.html");

// Le préambule, en tête de <head> : il crée les Blob URL AVANT que quoi que ce soit ne
// démarre. L'ordre compte — le moteur d'abord, puisque scan-noyau en dépend, et
// scan-noyau avant le worker.
const b64 = {};
for (const [k, v] of Object.entries(modules)) b64[k] = Buffer.from(v, "utf8").toString("base64");

// Les deux scripts MT5 que le tiroir offre au téléchargement. Énumérés — leur seule
// autre source serait la prose du gabarit, et chercher un nom dans de la prose serait
// la règle 1 ; un TROISIÈME script naîtrait hors de portée de cette liste, et la garde
// le dit dans son message.
const scriptsMt5 = {};
for (const f of ["Vuna_Releve.mq5", "Export_H1_Vuna.mq5"]) {
  scriptsMt5[f] = Buffer.from(lire(f), "utf8").toString("base64");
}

const preambule = `<script>
// Construit par scripts/app/solo.mjs — ne pas modifier ce fichier, modifier la source.
(function () {
  // Les sources voyagent en base64 pour la même raison que le runtime : une balise
  // fermante de script apparaît dans le générateur MQL5 et refermerait celle-ci.
  // Ce commentaire non plus ne doit pas en contenir — c'est ainsi que ce préambule a
  // été mis hors service une première fois, en expliquant le piège avec le piège.
  // On décode en UTF-8, pas en latin1 : les commentaires du moteur sont en français.
  var B = ${JSON.stringify(b64)};
  var dec = new TextDecoder("utf-8");
  var S = {};
  for (var k in B) {
    S[k] = dec.decode(Uint8Array.from(atob(B[k]), function (c) { return c.charCodeAt(0); }));
  }
  var url = function (src) {
    return URL.createObjectURL(new Blob([src], { type: "text/javascript" }));
  };
  var siv = {};
  siv.moteur = url(S.moteur);
  siv.scanNoyau = url(S.scanNoyau.split("__URL_MOTEUR__").join(siv.moteur));
  siv.robot = url(S.robot);
  siv.conf = url(S.conf);
  // Le worker ne reçoit ni la page ni sa base : son import doit être ABSOLU.
  siv.worker = url(S.worker.split("__URL_SCANNOYAU__").join(siv.scanNoyau));
  window.__siv = siv;
})();
</script>
<script>
// Le journal des livraisons voyage avec le fichier unique : servi en voisin, il serait
// absent d'une page ouverte en « file:// », et la page des nouveautés resterait vide.
window.__sivNouv = ${JSON.stringify(JSON.parse(lire("nouveautes.json")))};
// Les explications extraites à la construction voyagent de même : sans elles le panneau
// d'aide serait vide dans le fichier unique.
window.__sivAide = ${JSON.stringify(JSON.parse(lire("aide-index.json")))};
// Les deux scripts MT5 voyagent de même, en base64 : une requête de voisin est
// bloquée en « file:// » et rend 404 sous /app — le bouton « Les deux scripts MT5 »
// lit cette table et n'émet plus aucune requête. Octets identiques aux fichiers du
// dépôt, vérifiés par scripts/app/scripts-mt5-embarques.test.mjs.
window.__vunaScripts = ${JSON.stringify(scriptsMt5)};
</script>
`;
html = remplacer(html, "<head>", "<head>\n" + preambule, "Vuna.dc.html");

const sortie = path.join(RACINE, "Vuna.solo.html");
writeFileSync(sortie, html);
console.log(`Vuna.solo.html écrit — ${(html.length / 1048576).toFixed(2)} Mo, un seul fichier, `
  + "aucun voisin requis.");
