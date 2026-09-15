// Un cœur de calcul. Reçoit un jeu de bougies puis des lots de variantes à mesurer,
// et renvoie les lignes de résultat. Aucune logique métier ici : tout vient du noyau,
// le même que celui du fil principal.
import { mesurerVariante, controleCorrige } from './scan-noyau.js';

let df = null;

self.onmessage = (e) => {
  const m = e.data || {};
  if (m.type === 'bougies') {
    // le jeu de bougies est envoyé une fois par instrument, pas par variante
    df = m.df;
    self.postMessage({ type: 'pret', sym: m.sym });
    return;
  }
  if (m.type === 'lot') {
    if (!df) { self.postMessage({ type: 'lot', id: m.id, out: [], echecs: ['bougies absentes'] }); return; }
    const out = [];
    const echecs = [];
    for (const v of m.variantes) {
      const r = mesurerVariante(df, v, m.periodes, m.sls, m.rrs);
      for (const x of r.out) out.push(x);
      for (const x of r.echecs) echecs.push(x);
    }
    self.postMessage({ type: 'lot', id: m.id, out, echecs });
    return;
  }
  if (m.type === 'controle') {
    // le contrôle du hasard corrigé, sur une PLAGE de tirages : chaque case
    // (tête, tirage) est réamorcée par sa graine, donc les plages s'ajoutent
    if (!df) { self.postMessage({ type: 'controle', id: m.id, echec: 'bougies absentes' }); return; }
    let r;
    try { r = controleCorrige(df, m.tetes, m.depart, m.fin, m.graine); }
    catch (e) { self.postMessage({ type: 'controle', id: m.id, echec: String((e && e.message) || e) }); return; }
    self.postMessage({ type: 'controle', id: m.id, ...r });
  }
};
