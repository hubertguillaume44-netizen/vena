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
  const l = f.stateNode.logic;
  // ————— UNE SONDE VÉRIFIE SA PRISE —————
  // La remontée peut s'arrêter sur un composant du bon NOM dont le \`logic\` n'est pas
  // encore l'instance de l'application : sous charge, le banc de l'export au fil a
  // rendu « inst.cle is not a function » — une TypeError à l'intérieur de la page,
  // qui ne nomme ni la sonde ni ce qu'elle a attrapé. On éprouve donc la prise sur
  // un membre que SEULE l'application porte, et l'échec dit ce qui a été trouvé.
  if (!l || typeof l.cle !== "function") {
    throw new Error("semis : la fibre a rendu " + (l ? ("un objet " + (l.constructor && l.constructor.name))
      : String(l)) + " sans \`cle()\` — ce n'est pas l'instance de l'application. "
      + "La page n'était probablement pas finie de monter : attendez-la avant de sonder.");
  }
  return l;
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
      // ————— LE BANC N'EXPORTAIT QUE CE QU'IL CONNAISSAIT DÉJÀ —————
      // Trois robots ont été rapportés non exportables : CHINA50, AUDJPY, DOW30 — deux
      // indices et une croisée en yen, aucune majeure en dollar. Le semis ne posait que
      // des VX- : des tickers inventés, courts, sans chiffres collés ni devise de
      // cotation exotique. Le banc exerçait donc exactement la forme de nom qui ne pose
      // pas de problème. Les trois entrent ici : ce ne sont plus des cas rapportés, ce
      // sont des cas mesurés à chaque exécution.
      const S = syms || ['VX-EUR', 'VX-500', 'VX-OR', 'CHINA50', 'AUDJPY', 'DOW30'];
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
      const S = (syms || ['VX-EUR', 'VX-500', 'VX-OR', 'CHINA50', 'AUDJPY', 'DOW30']).slice(0, n);
      if (S.length !== n) throw new Error("semis « décisions » : " + n
        + " demandée(s) pour " + S.length + " symbole(s) disponible(s) — une décision "
        + "par instrument, la table ne peut pas en porter deux du même");
      // ————— LE BANC N'EXERÇAIT QUE LE SUCCÈS —————
      // Sept rapports « Exporter ne produit rien » en trois jours, et le départage a
      // fini par être le FILTRE : « Sous résistance » n'a pas d'équivalent MQL5, le
      // générateur le refuse. Le semis ne posait que des lignes à filtre ADX — toutes
      // exportables — donc la tournée cliquait « Exporter » et voyait un fichier
      // descendre, à chaque fois, sur le seul cas qui marche.
      //
      // C'est la règle 10 dans l'outillage : le cas éprouvé était celui où le défaut ne
      // peut pas se produire. UNE ligne refusée suffit à faire exister le refus, et
      // c'est le minimum pour qu'un bouton grisé, une infobulle et un message aient
      // quelque chose à garder.
      //
      // Elle porte sa photo de réglages (_reg) plutôt qu'un intitulé : etatDeLigne lit
      // _reg en priorité, et c'est par là que la vraie application transporte les
      // réglages d'une ligne validée. Poser un filtreNom seul aurait semé l'APPARENCE
      // du filtre sans le filtre — une mesure fausse qui a l'air d'une mesure.
      //
      // (Pas d'accent grave dans ces commentaires : ils vivent DANS un littéral
      // gabarit, et le premier en fermerait la chaîne. Le module a déjà été cassé
      // deux fois par là.)
      const valides = S.map((sym, i) => ({ ...ligneDe(sym, i), sens: 'achat', ut: 'H1',
        ...(i === 0 ? { _reg: { fResist: true, utResist: 'D1', resistLookback: 20, resistMarge: 1 },
          filtreNom: 'Sous résistance D1 20 (marge 1 %)' } : {}) }));
      // LE VERDICT SE SÈME PAR LA CLÉ DU PRODUIT, jamais par des champs devinés.
      // Première version : des hasP/hasN/hasAu posés sur la ligne — inventés,
      // ignorés en silence, et la colonne rendait « contrôler » comme si aucun
      // contrôle n'existait. Le semis comptait 3 décisions et se croyait bon : le
      // compte était juste, le CONTENU muet. C'est pourquoi la vérification porte
      // désormais aussi sur le verdict relu, pas seulement sur le nombre de lignes.
      // Sous 200 tirages 'verdictHasard' traite le contrôle comme absent : 500.
      const faits = { ...(inst.state.hasardFaits || {}) };
      for (const v of valides) faits[inst.prefixeHasard(v) + '|500'] = { tirages: 500, auDessus: 5 };
      // ————— LE PORTEFEUILLE ÉTAIT UNE COQUILLE VIDE, ET ÇA CACHAIT TROIS GESTES —————
      // \`syms: []\` créait un portefeuille qui ne porte aucune ligne. Or \`pfSections\`
      // rend \`null\` pour un portefeuille sans ligne : la section entière disparaît, et
      // avec elle « Exporter » (un par ligne) et « Exporter les robots ». La tournée des
      // gestes passait donc sur cette vue sans jamais VOIR ces boutons — elle était
      // verte parce qu'ils n'existaient pas, pas parce qu'ils répondaient.
      //
      // C'est la règle 10 dans l'outillage même qui existe pour la fermer : le semis
      // s'était arrêté au cas où la moitié des défauts ne peuvent pas se produire.
      inst.setState({ valides, hasardFaits: faits, _hfRev: (inst._hfRev || 0) + 1,
        pfs: [{ nom: 'Portefeuille principal', syms: S }] });
      inst._idxH = null; inst._idxHT = null;
      inst.forceUpdate();
      const lues = inst.normValides(inst.state.valides);
      exiger('décisions', n, lues.length);
      // le portefeuille est relu par le chemin du produit : \`symsSuivis\` dérive de
      // \`pfs\`, et c'est lui que l'application interroge. ANGLE MORT DÉCLARÉ : il prouve
      // que les instruments sont SUIVIS, pas que la section rend ses rangées — cette
      // dernière étape n'est lisible qu'une fois la vue ouverte, et c'est la tournée
      // des gestes qui la mesure, en énumérant « Exporter » sur le Portefeuille.
      const suivis = inst.symsSuivis || [];
      const absents = S.filter((sym) => !suivis.includes(sym));
      if (absents.length) throw new Error("semis « décisions » : " + absents.length
        + " instrument(s) semé(s) au portefeuille ne ressortent pas de \`symsSuivis\` ("
        + absents.join(', ') + "). Un portefeuille qui ne porte aucune ligne fait "
        + "disparaître sa section entière, et avec elle les boutons d'export de robot : "
        + "la tournée serait verte en ne les voyant pas.");
      // la ligne refusée est RELUE par le chemin du produit : \`refusExport\` est la
      // fonction que le bouton et le refus interrogent tous les deux. Sans ce contrôle,
      // une photo de réglages mal formée sèmerait une ligne parfaitement exportable et
      // la tournée exercerait de nouveau le seul succès — sans se plaindre.
      const refusee = lues.filter((v) => inst.refusExport && inst.refusExport(v));
      if (refusee.length !== 1) throw new Error("semis « décisions » : " + refusee.length
        + " ligne(s) refusée(s) à l'export de robot, 1 attendue. La ligne porteuse de "
        + "\`fResist\` ne ressort pas de \`refusExport()\` : le banc n'exercerait de nouveau "
        + "que le chemin qui réussit, et c'est précisément ce qui a laissé passer sept "
        + "rapports « Exporter ne produit rien ».");
      const sansVerdict = lues.filter((v) => !inst.verdictHasard(v)).length;
      if (sansVerdict) throw new Error("semis « décisions » : " + sansVerdict + " ligne(s) sur "
        + n + " sans verdict du hasard relu par verdictHasard(). Le compte était juste et le "
        + "contenu muet — c'est le mode de panne que ce module existe pour interdire.");
      return n;
    },
    /** ————— UN PORTEFEUILLE DONT LES LIGNES SONT RÉELLEMENT MESURABLES —————
     *
     *  \`decisions\` sème des lignes validées, et la page les affiche — mais aucune
     *  n'est REJOUABLE : \`cfgDeLigne\` cherche la configuration de la variante dans
     *  \`_cfgVar\`, que seule la boucle d'un vrai scan remplit. Les quatre calculs du
     *  portefeuille (fenêtre commune, exposition simultanée, redondance, paris)
     *  tombaient donc tous les quatre dans leur état « non mesurable », et une garde
     *  de rendu posée là aurait mesuré le DÉCOR — la borne n'aurait rien coupé.
     *
     *  Ce semis pose la table par la fonction du produit qui la construit, puis relit
     *  par \`pfTrades\` — la porte unique par laquelle les quatre calculs reçoivent
     *  leurs trades — et jette si elle ne rend pas des trades pour chaque ligne.
     *
     *  Les instruments par défaut sont trois séries d'EXEMPLE : elles sont engendrées
     *  en mémoire à l'ouverture, donc présentes dans \`dfs\` sans rien déposer, et
     *  leurs fenêtres diffèrent assez pour que la fenêtre commune coupe. */
    portefeuille(n, syms) {
      const S = (syms || ['VX-EUR', 'VX-500', 'VX-OR']).slice(0, n);
      if (S.length !== n) throw new Error("semis « portefeuille » : " + n
        + " demandée(s) pour " + S.length + " symbole(s) disponible(s)");
      // ————— LA DERNIÈRE LIGNE PORTE UN RÉGLAGE DIFFÉRENT, ET C'EST VOULU —————
      // Trois lignes de configuration IDENTIQUE ne font exister qu'un seul des deux états
      // de la note de réglages communs : tout serait hissé en en-tête, et rien ne
      // redescendrait sur une rangée. La garde mesurerait alors la moitié de ce qu'elle
      // croit tenir. Une période différente sur la dernière suffit à faire exister les
      // deux — c'est la règle 10 : le cas qu'on sème spontanément est celui où la moitié
      // du mécanisme ne peut pas se produire.
      const valides = S.map((sym, i) => ({ ...ligneDe(sym, i), sens: 'achat', ut: 'H1',
        ...(i === S.length - 1 && S.length > 1 ? { periode: 20 } : {}) }));
      // la table des configurations de variante, écrite par la fonction du produit qui
      // la construit — pas par un objet deviné, qui sèmerait l'APPARENCE d'une
      // configuration sans la configuration
      const table = { ...(inst._cfgVar || {}) };
      for (const v of valides) {
        table[inst.cleCfgVar(v.filtre, v.sym, v.entree, v.ligne)] =
          inst.cfgCourante(v.sym, v.periode, v.sl, v.rr, undefined,
            { entree: v.entree, ligne: v.ligne, sens: 'achat' });
      }
      inst._cfgVar = table;
      inst.setState({ valides, pfOnglet: 1,
        pfs: [{ nom: 'Portefeuille principal', syms: S }] });
      inst.forceUpdate();
      const lues = inst.normValides(inst.state.valides);
      exiger('portefeuille', n, lues.length);
      // ————— LA SONDE PROUVE SA PRISE —————
      // \`pfTrades\` rend \`trades: null\` quand la série n'est pas chargée ou la
      // configuration introuvable : sans ce contrôle, la garde lirait « rien à
      // agréger » et le prendrait pour une mesure.
      const src = inst.pfTrades(lues);
      const muettes = src.filter((x) => !(x.trades && x.trades.length));
      if (muettes.length) throw new Error("semis « portefeuille » : " + muettes.length
        + " ligne(s) sur " + n + " ne rendent aucun trade ("
        + muettes.map((x) => x.sym + ' : ' + x.motif).join(' ; ')
        + "). Les quatre calculs tomberaient tous dans leur état « non mesurable » et "
        + "la garde mesurerait le décor.");
      return n;
    },
  };
  return true;
})()`;
