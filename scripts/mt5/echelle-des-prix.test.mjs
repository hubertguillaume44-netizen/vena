// STATUT · ANGLE MORT REFERMÉ, DÉFAUT NON TROUVÉ. Cette garde est née d'un rapport —
// AUDUSD, 423 trades côté MT5 contre 104 côté Véna, et AUDUSD est le premier instrument
// coté SOUS 1 jamais éprouvé. Elle n'a rien attrapé : mesurée, la décision du moteur est
// invariante par changement d'échelle des prix. Elle ferme donc un angle mort réel sans
// expliquer le rapport qui l'a fait écrire, et c'est exactement ce qu'elle affirme.
//
// ————— UNE STRATÉGIE EN POURCENTAGE NE VOIT PAS LE NIVEAU DU PRIX —————
//
// Tout ce que le moteur décide est en % : le stop (`sl`), l'objectif (`rr` fois le
// risque), le plafond de spread. Multiplier tous les prix d'une série par une constante
// ne doit donc RIEN changer au nombre de trades — c'est une propriété, pas une
// préférence, et elle se vérifie.
//
// LE DÉPÔT N'AVAIT ÉPROUVÉ QUE DES PRIX ÉLEVÉS, et c'est mesurable : les dix familles
// d'exemple vont de 1,0850 (VX-EUR) à 61 200 (VX-BTC), aucune sous 1. Les huit
// références MT5 non plus. Un défaut qui ne se réveille que sous 1 avait donc toute la
// place pour vivre.
//
// POURQUOI L'INVARIANCE ET NON « UN INSTRUMENT SOUS 1 ». Le rapport nommait un cas ;
// ajouter 0,65 à un semis aurait fermé ce cas. L'invariance ferme la CLASSE — elle
// attrape aussi bien un défaut à 0,000012 qu'à 0,65, et elle n'a aucune liste à tenir
// à jour (règle 8 appliquée à la garde).
//
// ET LES DIX FAMILLES D'EXEMPLE NE BOUGENT PAS. Descendre l'une d'elles sous 1 aurait
// paru la réponse évidente. Leurs bougies sont engendrées depuis une graine GELÉE et
// VERSIONNÉE : changer un niveau de prix change les bougies, périme les scans
// enregistrés de tout le monde, et se paie en `vena-exemple-v3`. Le prix à payer pour
// éprouver une propriété du moteur n'a pas à être payé par les données des
// utilisateurs — une série de banc coûte zéro octet chez eux.
//
// ANGLE MORT DÉCLARÉ (règle 9) : elle éprouve une série PROPRE, engendrée ici. Elle ne
// dit rien d'un CSV réel abîmé — prix tronqués à l'export, colonne de spread en points
// d'un autre pas, bougies plates par arrondi. Ces trois-là ne se distinguent pas d'une
// vraie série par leur échelle, et c'est une autre garde à écrire le jour où l'une
// d'elles se mesure.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { construireConfig } from "./config.mjs";
import { borne } from "../lib/tranche.mjs";
import { chargerMoteur } from "./charger-moteur.mjs";

const M = await chargerMoteur();

// La MÊME série logique à l'échelle demandée : les rendements sont identiques d'une
// échelle à l'autre (même graine, même suite de tirages), seul le multiplicateur change.
// Le spread est posé en POINTS de façon à valoir `spreadPct` % du cours à CHAQUE
// échelle — sans quoi on mesurerait un spread qui change, pas une échelle qui change.
function serie(px0, decimales, spreadPct, nJours = 1200) {
  let a = 987654321;
  const rnd = () => ((a = (Math.imul(a, 1664525) + 1013904223) >>> 0) / 4294967296);
  const t = [], o = [], h = [], l = [], c = [], v = [], sp = [];
  const pas = Math.pow(10, -decimales);
  const arr = (x) => Number(x.toFixed(decimales));
  let px = px0, ms = Date.UTC(2021, 0, 4);
  for (let j = 0; j < nJours; j++, ms += 86400000) {
    const jour = new Date(ms).getUTCDay();
    if (jour === 0 || jour === 6) continue;
    for (let k = 0; k < 24; k++) {
      const ouv = px;
      const clo = ouv * (1 + (rnd() - 0.5) * 0.008 + 0.00002);
      t.push(ms + k * 3600000);
      o.push(arr(ouv));
      h.push(arr(Math.max(ouv, clo) * (1 + rnd() * 0.002)));
      l.push(arr(Math.min(ouv, clo) * (1 - rnd() * 0.002)));
      c.push(arr(clo));
      v.push(100);
      sp.push(Math.max(1, Math.round((spreadPct / 100) * clo / pas)));
      px = clo;
    }
  }
  return M.nettoyer({ t, o, h, l, c, v, sp, n: t.length });
}

const BASE = { entree: "croisement_ou_rebond", ligne: "mediane", periode: 15,
  sl: 0.5, rr: 2, paliers: [] };
const SP_PCT = 0.012;                        // le spread d'une paire majeure, en % du cours

// prix, décimales — de l'indice au forex sous 1, le pas de cotation suivant le niveau
// comme il le fait chez un vrai courtier.
//
// ————— UNE ÉCHELLE EST ÉCARTÉE, ET C'EST LA SONDE QUI AVAIT TORT —————
// Un premier jeu portait aussi [4.18, 4]. Il rendait 131 trades contre 130 aux trois
// autres — et ce n'était PAS un défaut du moteur : le spread se pose en POINTS, donc en
// ENTIERS, et la grille de cette échelle ne sait pas représenter 0,012 % de plus près
// que 0,01232 %. La sonde comparait donc quatre comptes dont l'un portait un spread 2,7 %
// plus large qu'annoncé.
//
// LA MESURE QUE ÇA DONNE VAUT D'ÊTRE GARDÉE : 2,7 % d'écart de spread valent EXACTEMENT
// un trade sur 130 ici. C'est le plancher de précision de cette sonde — elle ne peut rien
// affirmer sous cette résolution —, et c'est aussi la raison de ne pas « tolérer ±1 » :
// une tolérance aurait caché le jour où le moteur perd réellement un trade, en achetant
// le silence d'un défaut de la sonde avec celui d'un défaut du produit.
//
// Les trois retenues représentent 0,012 % à 0,0001 point de pourcentage près.
const ECHELLES = [[1790, 2], [96, 3], [0.65, 5]];

function compter(px, dec) {
  const df = serie(px, dec, SP_PCT);
  const cfg = { ...construireConfig({ ...BASE, debut: df.t[0] }),
    spread_max_facteur: M.SPREAD_FACTEUR };
  return { n: M.backtesterSuivi(df, cfg, "D1").length, df };
}

test("le nombre de trades ne dépend pas du NIVEAU des prix", () => {
  const vus = ECHELLES.map(([px, dec]) => {
    const { n, df } = compter(px, dec);
    return { px, dec, n, spread: df.spreadPctMoyen, grain: df.grain && df.grain.decimales };
  });
  const dire = () => vus.map((x) => x.px + " (" + x.dec + " déc.) → " + x.n + " trades, "
    + "spread " + (x.spread == null ? "—" : x.spread.toFixed(5)) + " %, grain "
    + x.grain + " déc.").join("\n  ");

  // ————— UNE GARDE QUI COMPTE ZÉRO NE GARDE RIEN —————
  // Une série sans trade rendrait « toutes les échelles sont d'accord » sur du vide.
  assert.ok(vus.every((x) => x.n > 50),
    "au moins une échelle ne produit presque aucun trade — la garde comparerait des "
    + "vides et passerait au vert sans rien mesurer :\n  " + dire());

  // le spread doit être le MÊME à toutes les échelles : c'est ce qui rend la
  // comparaison des comptes honnête. S'il diverge, on ne mesure plus une échelle.
  // le seuil est SERRÉ (0,0001 pp) et il est mesuré, pas choisi : c'est ce que les
  // trois grilles de points retenues savent représenter. Le desserrer réintroduirait
  // l'échelle écartée, et avec elle un écart de compte qui ne dit rien du moteur.
  const sp = vus.map((x) => x.spread);
  assert.ok(sp.every((x) => x != null && Math.abs(x - sp[0]) < 0.0001),
    "le spread relevé n'est plus le même d'une échelle à l'autre : la conversion "
    + "points → pourcentage dépend du niveau du prix, et les comptes ci-dessous ne "
    + "comparent plus ce qu'on croit :\n  " + dire());

  const comptes = [...new Set(vus.map((x) => x.n))];
  assert.equal(comptes.length, 1,
    "le moteur ne prend PAS le même nombre de trades selon le niveau du prix :\n  "
    + dire()
    + "\n\nTout ce que le moteur décide est en pourcentage — stop, objectif, plafond de "
    + "spread. Multiplier les prix par une constante ne peut pas changer une décision. "
    + "Un écart ici veut dire qu'une grandeur ABSOLUE s'est glissée dans le chemin de "
    + "décision : un seuil en prix, un pas de cotation supposé, un arrondi qui aplatit "
    + "les bougies. Le rapport qui a fait écrire cette garde — 423 trades contre 104 sur "
    + "le premier instrument coté sous 1 — est exactement cette forme.");
});

test("les séries d'exemple n'éprouvent aucun prix sous 1, et la garde le dit", () => {
  // ————— LA GARDE MESURE SON PROPRE ANGLE MORT PLUTÔT QUE DE LE SUPPOSER —————
  // Tant que le générateur ne porte aucune famille sous 1, l'invariance ci-dessus est
  // la SEULE chose qui éprouve ce domaine. Le jour où une famille descend sous 1, cette
  // assertion tombe — et c'est voulu : elle redemandera si l'invariance suffit encore.
  const APP = readFileSync(new URL("../../Vena.dc.html", import.meta.url), "utf8");
  // `borne()` et non `indexOf` : un motif introuvable rendrait -1, une borne VALIDE
  // pour slice, et la tranche s'élargirait au fichier entier — la garde lirait alors
  // des nombres pris n'importe où en croyant lire la table des familles. C'est la prise
  // de cette garde, et elle JETTE en nommant l'ancre perdue plutôt que de s'élargir.
  const dep = borne(APP, "['vx-eur',");
  const bloc = APP.slice(dep, borne(APP, "];", dep));
  const prix = [...bloc.matchAll(/,\s*(\d+\.?\d*)\s*,\s*(\d)\s*,\s*0\.\d+/g)]
    .map((m) => Number(m[1]));
  assert.ok(prix.length >= 10, prix.length + " niveaux de prix relevés sur 10 familles : "
    + "la lecture de la table a changé de forme");
  const sousUn = prix.filter((x) => x < 1);
  assert.deepEqual(sousUn, [],
    "une famille d'exemple est désormais cotée sous 1 (" + sousUn.join(", ") + "). "
    + "Ce n'est pas un défaut — c'est que l'angle mort déclaré par cette garde vient de "
    + "se refermer autrement. Relisez sa note : l'invariance d'échelle reste utile, mais "
    + "elle n'est plus la SEULE épreuve de ce domaine, et la graine du générateur a dû "
    + "changer de version.");
});
