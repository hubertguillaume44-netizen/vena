// STATUT · CAUSE ÉTABLIE, MESURÉE DANS LE DÉPÔT. Les deux faits ci-dessous ont été
// mesurés ici, pas rapportés : l'archéologie de `MOTEUR_V` par `git log`, et le
// différentiel de versions par exécution.
//
// ————— UNE CLÉ DE CACHE QUE PERSONNE N'A JAMAIS TOURNÉE —————
//
// `MOTEUR_V` existe pour une seule raison, écrite à côté de sa déclaration : forcer le
// recalcul quand la règle du moteur change. Mesuré le 18 septembre 2026 :
//
//   git log --all -S"MOTEUR_V = 'e1'"  → rien
//   git log --all -S"MOTEUR_V = 'e2'"  → rien
//   git log --all -S"MOTEUR_V = 'e3'"  → rien
//   git log --all -S"MOTEUR_V = 'e4'"  → le commit de passation, et lui seul
//
// La clé vaut `e4` depuis le premier jour de ce dépôt et n'a JAMAIS été tournée, pendant
// que seize commits touchaient `moteur.js`.
//
// ET LE DRAPEAU QUI A SAUVÉ L'UTILISATEUR N'ÉTAIT PAS UNE COMPARAISON DE VERSIONS : il
// lit `(v._mv || 'e1') !== MOTEUR_V`, donc une ligne SANS estampille tombe sur un défaut
// qui ne peut jamais correspondre. Ce qui a signalé les chiffres périmés est l'ABSENCE
// d'estampille, pas un changement de règle — le bon comportement par accident.
//
// ————— ET LE MOTEUR, LUI, A BIEN CHANGÉ —————
//
// Chaque version de `moteur.js` depuis la passation, rejouée sur le MÊME décor et la
// MÊME configuration (le banc ci-dessous, 125 trades) :
//
//   chemin du HARNAIS      (nettoyer seul)         toutes les versions : 14,93 R
//   chemin de l'APPLICATION (nettoyer + decouper)  avant 4220ea0 :        4,00 R
//                                                  depuis :              14,93 R
//
// Dix R d'écart sur 125 trades, à compte de trades IDENTIQUE — la décision n'a pas
// bougé, la résolution des sorties si. Et l'écart n'existe QUE sur le chemin de
// l'application, ce qui isole `decouper`. `MOTEUR_V` n'a pas bougé ce jour-là, donc tout
// résultat enregistré avant est relu comme s'il venait de la règle actuelle.
//
// ET C'EST LA COLONNE DE SÉANCE QUI PORTE L'ÉCART, PAS LES EXTRÊMES DE LA MINUTE.
// Le commit s'intitule « les colonnes de la minute » et c'est ce qu'on a cru d'abord.
// Mesuré par mutation : forcer `exH`/`exL` sur la H1 — donc annuler les extrêmes M1 —
// ne bouge pas un centième de R sur ce banc, parce que l'écart eh−h y vaut 0,04 % quand
// le stop est à 0,5 % : aucun niveau ne tombe dans cette bande. Annuler `aSess`, en
// revanche, fait tomber la garde. Ce que `decouper` reperdait et qui comptait, c'est la
// SÉANCE : sans elle, `releve()` laisse tout passer et le moteur éprouve stop et
// objectif sur des heures où le courtier n'exécute rien.
//
// LA DIRECTION NE VA PAS DANS LE SENS DES CHIFFRES PÉRIMÉS DE L'UTILISATEUR, et il faut
// le dire : restaurer la séance rend Véna PLUS optimiste ici (4,00 → 14,93 R), alors que
// ses cinq lignes ont CHUTÉ à la remesure. Ce commit change donc les chiffres — c'est
// établi — mais il n'est PAS établi comme la cause de leur baisse. Ce qui est établi est
// la classe : le moteur a changé de règle sans que la clé de cache le dise.
//
// ————— CE QUE CETTE GARDE FAIT, ET POURQUOI SOUS CETTE FORME —————
//
// Une empreinte TEXTUELLE de `moteur.js` tomberait à chaque commentaire — et ce dépôt en
// écrit beaucoup. Une garde qui refuse le cas normal se fait désactiver (règle 16). La
// prise est donc BEHAVIORALE : on rejoue le banc et on compare les chiffres. Un
// commentaire ne les bouge pas ; une accélération « aux mêmes chiffres » non plus —
// vérifié, les quatre commits de performance passent. Une correction de règle, si.
//
// Elle échoue DANS LES DEUX SENS : les chiffres changent sans que `MOTEUR_V` bouge, ou
// `MOTEUR_V` bouge sans que les chiffres changent. Dans les deux cas quelqu'un doit
// décider et l'écrire ici.
//
// ANGLE MORT DÉCLARÉ (règle 9), et il est large — dont un morceau mesuré : le banc exerce
// UNE configuration sur UN décor, et les extrêmes de la MINUTE n'y décident rien (la
// mutation qui les annule ne fait pas tomber la garde, vérifié). Ce qu'elle tient, c'est
// la séance et le compte de trades. Une correction qui ne touche ni cette entrée, ni ces sorties, ni ces
// colonnes passera sans être vue — et périmera quand même des résultats enregistrés.
// Cette garde attrape la classe la plus coûteuse (le chemin de l'application diverge du
// harnais), pas toutes les corrections. L'élargir veut dire ajouter des lignes au
// tableau ATTENDU, pas changer la forme.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as M from "../../moteur.js";
import { construireConfig } from "../mt5/config.mjs";
import { borne } from "../lib/tranche.mjs";

const APP = readFileSync(new URL("../../Vena.dc.html", import.meta.url), "utf8");

// Le décor est GELÉ : graine écrite, colonnes de la minute et séance présentes. Les
// colonnes sont ce qui distingue les deux chemins — sans elles, `decouper` n'a rien à
// perdre et la garde ne mesurerait rien.
function brut(nJours = 1200) {
  let a = 987654321;
  const rnd = () => ((a = (Math.imul(a, 1664525) + 1013904223) >>> 0) / 4294967296);
  const t = [], o = [], h = [], l = [], c = [], v = [], sp = [];
  const mh = [], mb = [], eh = [], eb = [], ah = [], ab = [], sess = [];
  let px = 1790, ms = Date.UTC(2021, 0, 4);
  for (let j = 0; j < nJours; j++, ms += 86400000) {
    const jour = new Date(ms).getUTCDay();
    if (jour === 0 || jour === 6) continue;
    for (let k = 0; k < 24; k++) {
      const ouv = px, clo = ouv * (1 + (rnd() - 0.5) * 0.008 + 0.00002);
      const hh = Math.max(ouv, clo) * (1 + rnd() * 0.002);
      const ll = Math.min(ouv, clo) * (1 - rnd() * 0.002);
      t.push(ms + k * 3600000); o.push(ouv); h.push(hh); l.push(ll); c.push(clo); v.push(100);
      sp.push(Math.max(1, Math.round((0.012 / 100) * clo / 0.01)));
      mh.push(Math.floor(rnd() * 60)); mb.push(Math.floor(rnd() * 60));
      eh.push(hh * (1 + rnd() * 0.0004)); eb.push(ll * (1 - rnd() * 0.0004));
      ah.push(hh * (1 - rnd() * 0.0008)); ab.push(ll * (1 + rnd() * 0.0008));
      sess.push(k >= 7 && k <= 21 ? 1 : 0);
      px = clo;
    }
  }
  return { t, o, h, l, c, v, sp, mh, mb, eh, eb, ah, ab, sess, n: t.length };
}

const CFG = () => construireConfig({ entree: "croisement_ou_rebond", ligne: "mediane",
  periode: 15, sl: 0.5, rr: 2, paliers: [], debut: brut().t[0] });

function jouer(viaDecouper) {
  const propre = M.nettoyer(brut());
  const df = viaDecouper ? M.decouper(propre, propre.t[0]) : propre;
  const tr = M.backtesterSuivi(df, CFG(), "D1");
  return { n: tr.length, R: tr.reduce((s, x) => s + (x.R_net ?? x.R ?? 0), 0) };
}

// ————— LE TABLEAU ATTENDU, ET LA CLÉ QUI LUI CORRESPOND —————
// Mesuré le 18 septembre 2026 sur `260917.15`. Si ces chiffres changent, la règle du
// moteur a changé : soit on tourne `MOTEUR_V` (les résultats enregistrés de tout le
// monde sont périmés, et c'est le but), soit on écrit ICI pourquoi le changement est
// sans effet sur ce que les utilisateurs ont déjà.
const CLE_ATTENDUE = "e4";
const ATTENDU = {
  harnais: { n: 125, R: 14.93 },
  application: { n: 125, R: 14.93 },
};

test("la clé de cache est celle sous laquelle les chiffres ont été relevés", () => {
  const tete = "  MOTEUR_V = '";
  const i = borne(APP, tete) + tete.length;
  const cle = APP.slice(i, borne(APP, "'", i));
  assert.equal(cle, CLE_ATTENDUE,
    `MOTEUR_V est passé de « ${CLE_ATTENDUE} » à « ${cle} ». Si c'est délibéré — une `
    + "correction du moteur qui périme les résultats enregistrés — remettez à jour "
    + "CLE_ATTENDUE et le tableau ATTENDU ci-dessus, dans le même geste, en écrivant "
    + "ce qui a changé. Si ce n'est pas délibéré, la clé vient de périmer les scans de "
    + "tout le monde sans que personne l'ait demandé.");
});

for (const [voie, viaDecouper] of [["harnais", false], ["application", true]]) {
  test(`le moteur rend les mêmes chiffres qu'au relevé — chemin ${voie}`, () => {
    const vu = jouer(viaDecouper);
    // la prise d'abord : deux versions d'accord sur du vide sont d'accord sur rien
    assert.ok(vu.n >= 50 && Number.isFinite(vu.R) && vu.R !== 0,
      `la sonde n'a pas de prise : ${vu.n} trades, ${vu.R} R. Un premier jet a rendu `
      + "« 5 trades, 0,00 R » deux fois — décor trop lisse, puis champ `r` au lieu de "
      + "`R` — et aurait déclaré toutes les versions d'accord.");
    const att = ATTENDU[voie];
    assert.equal(vu.n, att.n,
      `le NOMBRE de trades a changé sur le chemin ${voie} : ${att.n} → ${vu.n}. C'est la `
      + "DÉCISION du moteur qui a bougé, donc tout résultat enregistré désigne d'autres "
      + "trades que ceux d'aujourd'hui. Tournez MOTEUR_V.");
    assert.ok(Math.abs(vu.R - att.R) < 0.01,
      `le RÉSULTAT a changé sur le chemin ${voie} : ${att.R} R → ${vu.R.toFixed(2)} R, à `
      + `${vu.n} trades. La décision n'a pas bougé, la résolution des sorties si — c'est `
      + "exactement la forme du 4 septembre, où le chemin de l'application a gagné dix R "
      + "sans que la clé de cache ne bouge, laissant les lignes enregistrées afficher un "
      + "chiffre que le moteur ne calcule plus. Tournez MOTEUR_V, ou écrivez ici "
      + "pourquoi ce changement ne périme rien.");
  });
}

test("les deux chemins s'accordent — c'est cet accord qui avait été perdu", () => {
  // ————— LA GARDE QUI AURAIT ATTRAPÉ LE DÉFAUT DE SEPTEMBRE —————
  // Avant le 4 septembre, `decouper` perdait les colonnes de la minute : le harnais
  // rendait 14,93 R et l'application 4,00 R sur le même décor. Personne ne comparait les
  // deux, donc personne ne le voyait — et les tests, qui appellent `nettoyer`
  // directement, passaient tous.
  const h = jouer(false), a = jouer(true);
  assert.equal(h.n, a.n,
    `le harnais et l'application ne comptent plus les mêmes trades (${h.n} contre ${a.n}) : `
    + "une colonne se perd entre `nettoyer` et `decouper`, et le moteur de la page ne "
    + "mesure plus ce que les tests mesurent.");
  assert.ok(Math.abs(h.R - a.R) < 0.01,
    `le harnais rend ${h.R.toFixed(2)} R et l'application ${a.R.toFixed(2)} R sur le même `
    + "décor. Une colonne se perd dans `decouper` — c'est le défaut du 4 septembre, et "
    + "il est invisible à tout test qui n'emprunte qu'un seul des deux chemins.");
});
