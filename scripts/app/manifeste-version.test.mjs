// STATUT · CAUSE ÉTABLIE, MESURÉE DANS LE DÉPÔT. RAPPORTÉ : /version.json → 404. Mesuré ici :
// TROIS manifestes sur trois étaient inatteignables, et pour DEUX raisons différentes.
//
// ————— TOUT CE QUE L'APPLICATION VA CHERCHER ÉTAIT MUET, EN SILENCE —————
//
//   version.json      publié dans dist/app/, demandé par un chemin RELATIF → /version.json
//   aide-index.json   régénéré à la racine, PUBLIÉ NULLE PART, demandé → /aide-index.json
//   nouveautes.json   idem
//
// Le chemin relatif : `fetch('version.json')` résout contre l'URL du DOCUMENT, et
// `netlify.toml` sert /app par une RÉÉCRITURE (`status = 200`), pas une redirection —
// l'URL affichée reste « /app », sans barre finale, donc la base est « / ». C'est la
// règle 12 appliquée à une URL : un chemin relatif emprunte son sens à un point fixe,
// et un document servi sous deux formes n'en a pas.
//
// La publication manquante : `aide-index.json` est régénéré par `npm run app:aide` à
// chaque changement de `title=` — une consigne que le dépôt répète — et n'était ni dans
// `public/` (donc Vite ne le recopiait pas) ni copié par `publier-solo`. La recherche
// d'aide était vide pour tout le monde.
//
// CE QUI A TOUT CACHÉ EST UN BON CHOIX : les trois lectures se TAISENT en cas d'échec,
// pour que le mode hors ligne — l'usage recommandé — ne produise pas d'avertissement
// permanent. Le choix est juste. Sa conséquence est qu'un chemin faux ou un fichier
// absent est indistinguable d'un utilisateur à jour.
//
// > **Une sonde dont l'échec est silencieux par conception doit être gardée ailleurs.**
//
// LA GARDE DÉCOUVRE, ELLE N'ÉNUMÈRE PAS (règle 7). Elle ne connaît pas la liste des
// manifestes : elle relève CHAQUE appel `fetch(…, { cache: 'no-store' })` de
// l'application et exige de chacun qu'il soit absolu sous /app/ et que `publier-solo`
// dépose un fichier à ce chemin. Un quatrième manifeste ajouté demain entre dans sa
// portée sans que rien ne soit écrit ici.
//
// ANGLE MORT DÉCLARÉ (règle 9) : elle lit des chaînes et l'arborescence construite, pas
// une requête HTTP. Elle ne prouve pas que le serveur répond 200 — seul un déploiement
// le dirait, et le manifeste de version n'existe justement que pour mesurer ce que le
// déploiement sert. Ce qu'elle ferme : le chemin relatif, et le manifeste demandé mais
// jamais publié.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const RACINE = new URL("../../", import.meta.url);
const R = (f) => readFileSync(new URL(f, RACINE), "utf8");
const APP = R("Vena.dc.html");
const PUB = R("scripts/app/publier-solo.mjs");
const TOML = R("netlify.toml");

// ancré sur l'APPEL, avec ses arguments : `'version.json'` seul vit dans la prose qui
// explique le correctif, juste au-dessus. Un appel complet, non.
// Les DEUX formes : un littéral dans l'appel, ou une variable dont les deux valeurs
// possibles sont écrites juste au-dessus (le manifeste de version sert deux
// référentiels — le site et le fichier ouvert en file://).
const demandes = [
  ...[...APP.matchAll(/fetch\(\s*'([^']+)'\s*,\s*\{\s*cache:\s*'no-store'\s*\}\s*\)/g)]
    .map((m) => m[1]),
  ...[...APP.matchAll(/location\.protocol === 'file:' \? '([^']+)' : '([^']+)'/g)]
    .map((m) => m[2]),
];

// ————— UN REPLI DERRIÈRE UNE TABLE EMBARQUÉE N'EST PAS UNE REQUÊTE —————
// `chargerAide` lit `window.__sivAide` AVANT de tenter un fetch, et `solo.mjs` pose
// cette table dans le fichier livré : la branche réseau n'est jamais prise. Les exiger
// absolus et publiés ferait corriger un chemin qui ne part pas, et publier un fichier
// que personne ne demande — ce qui a failli arriver.
//
// LE CRITÈRE SE LIT DANS `solo.mjs`, pas dans une distance au-dessus de l'appel : une
// garde dont la prise est un nombre de caractères n'a pas de prise. On relève ce que
// le générateur du fichier unique EMBARQUE, et on exige des autres seulement.
const SOLO_SRC = R("scripts/app/solo.mjs");
const EMBARQUES = [...SOLO_SRC.matchAll(/window\.__siv\w+ = \$\{JSON\.stringify\(JSON\.parse\(lire\("([^"]+)"\)\)\)\}/g)]
  .map((m) => m[1]);

test("le fichier unique embarque bien les tables dont le fetch n'est qu'un repli", () => {
  assert.ok(EMBARQUES.length >= 2,
    EMBARQUES.length + " table(s) embarquée(s) relevée(s) dans solo.mjs, au moins 2 "
    + "attendues. Si le fichier unique cesse d'embarquer l'aide ou les nouveautés, leurs "
    + "`fetch` cessent d'être des replis et redeviennent des requêtes voisines — qui "
    + "échouent en file:// sans rien dire. La garde suivante les exempte sur la foi de "
    + "cette liste : elle tombe ici d'abord.");
});

test("chaque manifeste demandé par l'application est absolu et publié", () => {
  assert.ok(demandes.length >= 3,
    demandes.length + " appel(s) `fetch(…, { cache: 'no-store' })` trouvé(s) dans "
    + "Vena.dc.html, au moins 3 attendus. La garde a perdu sa prise sur la forme de ces "
    + "appels : réancrez-la plutôt que de la laisser verte sur du vide.");

  const vivantes = demandes.filter((d) => !EMBARQUES.some((e) => d.endsWith(e)));
  const relatifs = vivantes.filter((x) => !x.startsWith("/"));
  assert.deepEqual(relatifs, [],
    "manifeste(s) demandé(s) par un chemin RELATIF : " + relatifs.join(", ")
    + ". netlify.toml sert /app par une réécriture (status 200), donc l'URL du document "
    + "reste « /app » sans barre finale : la base est « / » et la requête part à la "
    + "racine du site — 404. Et la lecture ratée se tait par conception, donc rien ne le "
    + "dira. Écrivez le chemin absolu, celui où publier-solo dépose le fichier.");

  for (const d of vivantes) {
    assert.ok(d.startsWith("/app/"),
      "« " + d + " » n'est pas servi à côté de l'artefact. Tout ce que l'application "
      + "accompagne vit sous /app/ : un second endroit serait un second chemin à tenir "
      + "d'accord, et c'est ce désaccord qui vient d'être payé trois fois.");
  }

  // publié : l'arborescence construite fait foi quand elle existe — c'est le RÉSULTAT,
  // pas l'intention d'avoir écrit une ligne de copie.
  const dist = new URL("dist/app/", RACINE);
  if (existsSync(dist)) {
    const absents = vivantes.filter((d) => !existsSync(new URL(d.slice(5), dist)));
    assert.deepEqual(absents, [],
      "fichier(s) demandé(s) par l'application et ABSENT(S) de dist/app/ après "
      + "construction : " + absents.join(", ") + ". Ils rendront 404 en silence.");
  } else {
    // pas de build ici : on se rabat sur la source de la publication, en le DISANT —
    // une garde qui saute sans le dire est une garde aveugle.
    for (const d of vivantes) {
      const nom = d.slice(5);
      assert.ok(PUB.includes('"' + nom + '"'),
        "dist/app/ n'existe pas (aucune construction dans cet arbre), et publier-solo ne "
        + "nomme pas « " + nom + " » : rien ne le déposera à côté de l'artefact. "
        + "Lancez `npm run build` pour que cette garde mesure le résultat plutôt que "
        + "l'intention.");
    }
  }

  // servi sans cache : quelques octets relus à chaque chargement, contre un artefact de
  // 2,9 Mo qui ne peut pas se le permettre. Sans cette règle, la page relirait sa propre
  // version pendant des heures et le témoin dirait « à jour » sur une version périmée.
  const sansCache = [...TOML.matchAll(/for = "([^"]*\.json)"/g)].map((m) => m[1]);
  const nonServis = vivantes.filter((d) => !sansCache.includes(d));
  assert.deepEqual(nonServis, [],
    "manifeste(s) sans règle d'en-tête dans netlify.toml : " + nonServis.join(", ")
    + ". Ils seraient servis avec le cache du site.");
});
