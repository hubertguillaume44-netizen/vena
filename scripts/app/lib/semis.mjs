// ————— UN SEMIS QUI NE SÈME RIEN DOIT ÉCHOUER, PAS RAPPORTER ZÉRO —————
//
// Quatre semis ont échoué EN SILENCE cette semaine, et aucun n'a rougi : le champ
// `b` au lieu de `l` pour les bas, l'espace `.perso.ic` quand le compte réel était
// `.client.fxpro`, et deux fois « 0 série » rendu comme une mesure. C'est le pire
// mode de panne d'un diagnostic — une mesure fausse a l'air d'une mesure, et tout
// ce qui suit mesure un écran vide en croyant mesurer un écran plein.
//
// La sortie n'est pas « faire plus attention ». C'est que le semis VÉRIFIE SON
// PROPRE EFFET : il écrit par le chemin du produit, puis RELIT par le chemin du
// produit — `this.lignesScan` pour un scan, `tradesReels()` pour le journal — et
// jette si le compte relu n'est pas celui demandé. Relire par une clé de stockage
// prouverait que l'écriture a eu lieu ; relire par le chemin du produit prouve que
// l'application la VOIT, ce qui est la seule chose qui intéresse une garde de rendu.
//
// C'est la règle 1 appliquée à l'outillage : « j'ai écrit » est une intention,
// « l'application en compte N » est un résultat.
//
// Ce module n'exporte que du TEXTE : la fonction vit dans la page, pas ici. Un
// semis qui tournerait dans Node sèmerait dans Node.

// L'instance de l'application, remontée depuis la fibre React d'un bouton
// quelconque — le même chemin que les autres bancs.
export const INSTANCE = `(() => {
  const el = document.querySelector("button");
  const fk = el && Object.keys(el).find((x) => x.startsWith("__reactFiber"));
  if (!fk) throw new Error("semis : aucune fibre React sur la page — l'application n'est pas montée");
  let f = el[fk];
  while (f && !(f.stateNode && f.stateNode.constructor
    && f.stateNode.constructor.name === "StreamableComponent")) f = f.return;
  if (!f) throw new Error("semis : StreamableComponent introuvable en remontant la fibre");
  return f.stateNode.logic;
})()`;

// Une ligne de scan COMPLÈTE. Chaque champ est lu par une colonne de `COLS` ; en
// laisser un `undefined` ferait rendre « — » LÉGITIMEMENT (c'est le repli déclaré
// des scans antérieurs), et la garde ne pourrait plus distinguer un tiret voulu
// d'une valeur qui n'arrive pas. Le semis les pose donc TOUS.
const LIGNE = `(sym, i) => ({
  sym, periode: 9, sl: 1.5, rr: 2, entree: 'crois', ligne: 'mme',
  filtre: 'v1|adx@14/20', filtreNom: 'ADX 14 > 20',
  n: 40 + i, total: 12.5 + i, brut: 15.1 + i, frais: 2.6,
  rAn: 4.2 + i, esp: 0.31, nGains: 18 + i, nPertes: 17, neutres: 5,
  winRate: 45, pf: 1.42, sommets: 3, exposes: 2, ambigus: 1,
  dd: -6.4, calmar: 1.95, nuits: 0.6, positifs: 4, segTotal: 5,
  oos: 3.8, tenue: 62, t0: Date.UTC(2023, 0, 2), t1: Date.UTC(2026, 8, 11),
})`;

/**
 * Pose `window.__semis` dans la page. Chaque méthode écrit par le chemin du
 * produit, relit par le chemin du produit, et JETTE si le compte ne suit pas.
 */
export const POSER_SEMIS = `(() => {
  const inst = ${INSTANCE};
  const ligneDe = ${LIGNE};
  const exiger = (quoi, voulu, lu) => {
    if (lu !== voulu) throw new Error("semis « " + quoi + " » : " + voulu
      + " demandé(s), " + lu + " relu(s) par le chemin du produit. "
      + "Un semis qui ne sème rien échoue ici plutôt que de laisser la garde "
      + "mesurer un écran vide en croyant mesurer un écran plein.");
    return lu;
  };
  window.__semis = {
    /** Un scan archivé de \`n\` configurations, posé par poserScan — la seule
     *  porte par laquelle un scan arrive à l'écran. Relu par this.lignesScan. */
    scan(n, syms) {
      const S = syms || ['VX-EUR', 'VX-500', 'VX-OR'];
      const id = 'semis-1';
      const scan = [];
      for (let i = 0; i < n; i++) scan.push({ ...ligneDe(S[i % S.length], i), _sid: id });
      const archives = [{ id, nom: 'Scan de semis', date: new Date(Date.UTC(2026, 8, 11)).toISOString(),
        n, produites: n, parInstrument: Math.ceil(n / S.length), syms: S }];
      inst.poserScan(scan, null, { archives, fiche: null, scanVu: id });
      return exiger('scan', n, (inst.lignesScan || []).length);
    },
    /** \`n\` trades CLOS dans le journal live, écrits par ecrireLive — la porte du
     *  produit — et relus par tradesReels(), qui est ce que la page consomme. */
    journal(n) {
      const jj = (d) => '2026.09.' + String(d).padStart(2, '0') + ' 14:30';
      const trades = [];
      for (let i = 0; i < n; i++) trades.push({
        ticket: 90000 + i, sym: 'VX-EUR', sens: i % 2 ? 'sell' : 'buy',
        motif: 'croisement', magic: '4242',
        t0: jj(1 + (i % 9)), t1: jj(2 + (i % 9)),
        r: i % 3 === 0 ? -1 : 1.8, devise: i % 3 === 0 ? -100 : 180, frais: -12 });
      const m = inst.lireLive() || {};
      m['4242'] = { sym: 'VX-EUR', magic: 4242, trades };
      inst.ecrireLive(m);
      // le journal se relit à chaque rendu : rien à réveiller, mais la page doit
      // repasser — forceUpdate est le geste du produit, pas un contournement
      inst.forceUpdate();
      return exiger('journal', n, inst.tradesReels().length);
    },
    /** \`n\` décisions VALIDÉES sans portefeuille — la table « À ranger », la seule
     *  table de Mes décisions. Les lignes reprennent le scan déjà semé (normValides
     *  complète depuis le scan en mémoire), donc scan() doit passer avant.
     *  Relu par le producteur du produit : normValides(state.valides). */
    decisions(n, syms) {
      const S = (syms || ['VX-EUR', 'VX-500', 'VX-OR']).slice(0, n);
      if (S.length !== n) throw new Error("semis « décisions » : " + n
        + " demandée(s) pour " + S.length + " symbole(s) disponible(s) — une décision "
        + "par instrument, la table ne peut pas en porter deux du même");
      const valides = S.map((sym, i) => ({ ...ligneDe(sym, i), sens: 'achat', ut: 'H1' }));
      // LE VERDICT SE SÈME PAR LA CLÉ DU PRODUIT, jamais par des champs devinés.
      // Première version : des hasP/hasN/hasAu posés sur la ligne — inventés,
      // ignorés en silence, et la colonne rendait « contrôler » comme si aucun
      // contrôle n'existait. Le semis comptait 3 décisions et se croyait bon : le
      // compte était juste, le CONTENU muet. C'est pourquoi la vérification porte
      // désormais aussi sur le verdict relu, pas seulement sur le nombre de lignes.
      // Sous 200 tirages 'verdictHasard' traite le contrôle comme absent : 500.
      const faits = { ...(inst.state.hasardFaits || {}) };
      for (const v of valides) faits[inst.prefixeHasard(v) + '|500'] = { tirages: 500, auDessus: 5 };
      inst.setState({ valides, hasardFaits: faits, _hfRev: (inst._hfRev || 0) + 1,
        pfs: [{ nom: 'Portefeuille principal', syms: [] }] });
      inst._idxH = null; inst._idxHT = null;
      inst.forceUpdate();
      const lues = inst.normValides(inst.state.valides);
      exiger('décisions', n, lues.length);
      const sansVerdict = lues.filter((v) => !inst.verdictHasard(v)).length;
      if (sansVerdict) throw new Error("semis « décisions » : " + sansVerdict + " ligne(s) sur "
        + n + " sans verdict du hasard relu par verdictHasard(). Le compte était juste et le "
        + "contenu muet — c'est le mode de panne que ce module existe pour interdire.");
      return n;
    },
  };
  return true;
})()`;
