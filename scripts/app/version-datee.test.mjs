// ————— LA VERSION AFFICHÉE EST UNE DATE, ET ELLE DIT LA VÉRITÉ —————
//
// `VERSION_APP` n'est pas un ornement du pied de page. Elle part avec chaque rapport
// d'avis et chaque fichier de diagnostic : c'est la seule chose qui dise quelle version
// l'utilisateur avait sous les yeux quand il a vu ce qu'il rapporte. Elle est restée à
// « 260905 » pendant que l'application changeait de fond en comble — la page de vente
// retirée, l'entrée déplacée, le tiroir refait — et chaque rapport reçu entre-temps
// annonçait une version qui n'existait plus.
//
// CE QUE CE TEST TIENT, et rien de plus :
//
//   · le format est une date lisible, pas un compteur qu'il faudrait traduire ;
//   · cette date existe, et n'est pas dans l'avenir ;
//   · l'artefact porte la MÊME que la source.
//
// CE QU'IL NE TIENT PAS, et ne peut pas tenir : que la date soit d'aujourd'hui. Rien
// dans un dépôt ne sait quand la prochaine livraison aura lieu, et un test qui exige
// « aujourd'hui » échouerait chaque lendemain sans qu'une ligne ait bougé. C'est
// `publier-solo.mjs` qui prévient, à la construction, quand la source a été écrite
// après la date qu'elle annonce — un avertissement, parce qu'un clone frais réécrit
// les dates de fichiers et qu'un arrêt y serait un piège.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const RACINE = new URL("../../", import.meta.url);
const lire = (f) => readFileSync(new URL(f, RACINE), "utf8");

/** La version que l'application affiche, telle qu'elle est écrite dans un fichier. */
function version(fichier) {
  const m = /VERSION_APP = '([^']+)'/.exec(lire(fichier));
  assert.ok(m, `${fichier} ne porte pas de VERSION_APP`);
  return m[1];
}

/** La partie DATE d'un numéro, rang éventuel retiré. */
function jourDe(v) { return String(v).split(".")[0]; }

test("la version est une date AAMMJJ, avec un rang seulement si le jour se répète", () => {
  const v = version("Vuna.dc.html");
  // ————— LE RANG SE LIT COMME UN NOMBRE, PAS COMME UN PREMIER CHIFFRE —————
  //
  // Le motif disait `\.[2-9]\d*` pour « un rang commence à 2, la première livraison du
  // jour reste nue ». C'était vrai TANT QUE LE RANG TENAIT SUR UN CHIFFRE : la dixième
  // livraison du jour, « 260913.10 », a été refusée parce que son premier chiffre est 1.
  // Une classe de caractères approchait la condition au lieu de la dire — la règle 1 au
  // niveau d'une expression régulière. On lit donc le nombre, et on le compare.
  const m = /^(\d{6})(?:\.(\d+))?$/.exec(v);
  assert.ok(m, `« ${v} » n’est ni six chiffres, ni six chiffres suivis d’un rang`);
  if (m[2] !== undefined) {
    assert.ok(!/^0/.test(m[2]), `« ${v} » : un rang ne se remplit pas de zéros`);
    assert.ok(Number(m[2]) >= 2,
      `« ${v} » : la PREMIÈRE livraison du jour reste nue, le rang commence donc à 2`);
  }
  const [aa, mm, jj] = [v.slice(0, 2), v.slice(2, 4), v.slice(4, 6)].map(Number);
  assert.ok(mm >= 1 && mm <= 12, `mois ${mm} impossible dans « ${v} »`);
  assert.ok(jj >= 1 && jj <= 31, `jour ${jj} impossible dans « ${v} »`);
  // une date qui existe vraiment : le 31 février se serait glissé sans cette ligne
  const d = new Date(2000 + aa, mm - 1, jj);
  assert.equal(d.getMonth(), mm - 1, `« ${v} » n’est pas une date réelle`);
  assert.equal(d.getDate(), jj, `« ${v} » n’est pas une date réelle`);
});

test("la version n’est pas dans l’avenir", () => {
  // une faute de frappe se voit ici plutôt que dans un rapport d'avis six mois plus
  // tard : « 270912 » pour « 260912 » passerait tous les autres contrôles
  const v = jourDe(version("Vuna.dc.html"));
  const n = new Date();
  const deux = (x) => String(x).padStart(2, "0");
  const aujourdHui = deux(n.getFullYear() % 100) + deux(n.getMonth() + 1) + deux(n.getDate());
  assert.ok(v <= aujourdHui,
    `la version annonce ${v}, or nous sommes le ${aujourdHui} — date postée à l’avance ?`);
});

test("l’artefact porte la même version que la source", () => {
  // `publier-solo.mjs` le vérifie aussi, mais à la construction seulement : un artefact
  // périmé commité dans le dépôt passerait inaperçu jusqu'au prochain déploiement.
  assert.equal(version("Vuna.solo.html"), version("Vuna.dc.html"),
    "Vuna.solo.html annonce une autre version que Vuna.dc.html — relancez npm run app:solo");
});

test("la version de l’application n’est pas celle du moteur", () => {
  // `MOTEUR_V` est une clé de cache : le changer PÉRIME des résultats enregistrés.
  // `VERSION_APP` est une étiquette : la changer ne périme rien. Les confondre ferait
  // recalculer tous les scans de tout le monde à chaque livraison.
  const src = lire("Vuna.dc.html");
  const moteur = /MOTEUR_V = '([^']+)'/.exec(src);
  assert.ok(moteur, "MOTEUR_V a disparu");
  assert.notEqual(moteur[1], version("Vuna.dc.html"), "les deux versions se sont confondues");
  assert.ok(!/signature\([^)]*\)\s*\{[^}]*VERSION_APP/.test(src),
    "VERSION_APP entre dans la signature de cache : une livraison périmerait tous les scans");
});

test("le rang distingue deux livraisons du même jour", async () => {
  // « la journée est la granularité utile » était vrai jusqu'au jour où il a fallu savoir
  // LAQUELLE des livraisons du jour était en ligne. Le premier passage du jour reste nu,
  // pour que le cas courant garde sa lisibilité.
  const { suivante } = await import("./version.mjs");
  assert.equal(suivante("260912", "260913"), "260913", "un jour neuf repart sans rang");
  assert.equal(suivante("", "260913"), "260913", "un numéro illisible repart sans rang");
  assert.equal(suivante("260913", "260913"), "260913.2", "la deuxième du jour prend le rang 2");
  assert.equal(suivante("260913.2", "260913"), "260913.3");
  assert.equal(suivante("260913.9", "260913"), "260913.10", "le rang compte, il ne s’ordonne pas en texte");
});

test("importer le script ne pose AUCUNE version", async () => {
  // `suivante` est exportée pour être éprouvée. Sans garde, la seule LECTURE du module
  // écrivait dans la source : deux imports de vérification ont fait passer le fichier de
  // 260913 à 260913.3 en deux secondes, sans que personne n'ait demandé une livraison.
  const avant = version("Vuna.dc.html");
  await import("./version.mjs?sonde=" + Date.now());
  assert.equal(version("Vuna.dc.html"), avant,
    "le module a daté le fichier en étant simplement importé");
  // et la garde se lit dans le source, pour qu'on ne la retire pas par « simplification »
  const src = readFileSync(new URL("version.mjs", import.meta.url), "utf8");
  assert.match(src, /const APPELE = /, "la garde d’exécution a disparu");
});
