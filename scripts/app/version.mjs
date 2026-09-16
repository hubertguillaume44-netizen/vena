#!/usr/bin/env node
/**
 * Date le fichier livré : `VERSION_APP` prend la date du jour, au format AAMMJJ.
 *
 *   npm run app:version      # pose la date du jour
 *   npm run app:version -- --voir   # dit ce qui est posé, sans rien écrire
 *
 * ————— POURQUOI CE NUMÉRO COMPTE —————
 *
 * Il ne sert pas à faire joli dans un pied de page. Il part avec CHAQUE rapport d'avis
 * et CHAQUE fichier de diagnostic : c'est la seule chose qui dise quelle version
 * l'utilisateur avait sous les yeux quand il a vu le défaut qu'il rapporte. Figé, il ne
 * se contente pas d'être inutile — il MENT, et un rapport qui ment sur sa version fait
 * chercher un défaut là où il n'est plus.
 *
 * Il est distinct de `MOTEUR_V`, qui dit comment les trades sont calculés et sert de
 * clé de cache. Celui-ci ne conditionne aucun calcul : le changer ne périme rien et
 * n'efface rien. C'est une étiquette, et c'est pour ça qu'on peut la bouger sans
 * précaution — mais aussi pour ça qu'on l'oublie.
 *
 * Le format est une DATE, pas un compteur : « 260912 » se lit tout de suite comme le
 * 12 septembre 2026, alors que « v47 » demande un tableau de correspondance que
 * personne ne tient.
 *
 * ————— ET UN RANG, QUAND LA JOURNÉE NE SUFFIT PLUS —————
 *
 * « la journée est la granularité utile » était vrai jusqu'au jour où il a fallu savoir
 * LAQUELLE des livraisons du jour était en ligne. Une seconde livraison le même jour
 * prend donc « 260913.2 », la troisième « 260913.3 ». Le premier passage du jour reste
 * nu — « 260913 » — pour que le cas courant garde sa lisibilité.
 *
 * Ça ne remplace pas une identification exacte du déploiement, et il faut le savoir :
 * `VERSION_APP` est restée figée à « 260905 » pendant toute une semaine de travail, si
 * bien qu'aucun numéro ne distingue les commits antérieurs au 12 septembre. Un rang ne
 * répare pas le passé, il empêche la suite.
 *
 * Après ce script : `npm run app:solo`, sans quoi l'artefact annonce l'ancienne date et
 * `publier-solo.mjs` refuse de publier — il compare les deux exprès.
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import path from "node:path";

const RACINE = path.resolve(new URL("../../", import.meta.url).pathname);
const SOURCE = path.join(RACINE, "Vena.dc.html");
const MARQUE = /(VERSION_APP = ')([^']+)(')/;

// ————— LES SCRIPTS MT5 PORTENT LA MÊME VALEUR, POSÉE AU MÊME MOMENT —————
//
// Un correctif LIVRÉ est indistinguable d'un correctif NON COMPILÉ : le terminal
// exécute le .ex5 qu'il a, et rien ne dit de quelle source il vient. C'est le
// verrou de publication une strate plus bas — « la construction est verte » n'a
// jamais voulu dire « la version en ligne a changé », et « le correctif est
// livré » ne veut pas dire « le script a été recompilé ». Seul le journal MT5
// peut trancher, à condition qu'il le dise.
//
// DÉCOUVERT, PAS ÉNUMÉRÉ : tout .mq5 de la racine qui porte la marque suit. Un
// troisième script serait daté sans être nommé ici — et s'il ne porte pas la
// marque, la garde (scripts/mt5/version-compilee.test.mjs) le dira.
const MARQUE_MQ5 = /(#define VENA_VERSION ")([^"]+)(")/;
const scriptsMt5 = () => readdirSync(RACINE)
  .filter((f) => f.endsWith(".mq5"))
  .map((f) => path.join(RACINE, f))
  .filter((ch) => MARQUE_MQ5.test(readFileSync(ch, "utf8")));

/** Le numéro qui suit celui-ci : même jour → rang suivant ; autre jour → la date nue. */
export function suivante(posee, jour) {
  const m = /^(\d{6})(?:\.(\d+))?$/.exec(String(posee || ""));
  if (!m || m[1] !== jour) return jour;
  return jour + "." + (Number(m[2] || 1) + 1);
}

/** La date du jour en AAMMJJ, dans le fuseau de la machine — celui de qui livre. */
export function dateDuJour(d = new Date()) {
  const deux = (n) => String(n).padStart(2, "0");
  return deux(d.getFullYear() % 100) + deux(d.getMonth() + 1) + deux(d.getDate());
}

// ————— UN SCRIPT QUI EXPORTE NE DOIT PAS AGIR EN ÉTANT IMPORTÉ —————
//
// `suivante` est exportée pour qu'un test l'éprouve. Sans cette garde, la SEULE lecture
// du module posait une version : deux imports de vérification ont fait passer le fichier
// de 260913 à 260913.3 en deux secondes, sans que personne n'ait demandé une livraison.
// Un module qui agit au chargement n'est pas testable — il n'est même pas lisible.
const APPELE = process.argv[1]
  && import.meta.url === new URL("file://" + path.resolve(process.argv[1])).href;

if (APPELE) {
  const src = readFileSync(SOURCE, "utf8");
  const m = MARQUE.exec(src);
  if (!m) {
    console.error("[version] VERSION_APP est introuvable dans Vena.dc.html.");
    process.exit(1);
  }
  const avant = m[2];
  const jour = dateDuJour();
  const apres = suivante(avant, jour);

  const mq5 = scriptsMt5();
  if (process.argv.includes("--voir")) {
    console.log(`[version] posée : ${avant} · aujourd'hui : ${jour}`
      + (avant === apres ? " — à jour." : ` — prochaine : ${apres}.`));
    // l'écart se DIT : un script resté en arrière est un .ex5 qu'on croit à jour
    for (const ch of mq5) {
      const v = MARQUE_MQ5.exec(readFileSync(ch, "utf8"))[2];
      console.log(`[version] ${path.basename(ch)} : ${v}`
        + (v === avant ? "" : `  ← ÉCART avec VERSION_APP (${avant})`));
    }
  } else {
    writeFileSync(SOURCE, src.replace(MARQUE, `$1${apres}$3`));
    for (const ch of mq5) {
      writeFileSync(ch, readFileSync(ch, "utf8").replace(MARQUE_MQ5, `$1${apres}$3`));
    }
    console.log(`[version] ${avant} → ${apres}`
      + (mq5.length ? ` (et ${mq5.length} script${mq5.length > 1 ? "s" : ""} MT5)` : "")
      + ". Relancez « npm run app:solo » pour dater l'artefact.");
  }
}
