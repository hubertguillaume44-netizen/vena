// ————— UNE BORNE DE TRANCHE QUI ÉCHOUE DOIT LE DIRE, PAS ÉLARGIR —————
//
// Le piège de langage : -1 est un INDEX VALIDE pour slice. Une recherche qui
// échoue n'émet rien — elle élargit la tranche, jusqu'au fichier entier moins un
// caractère, et toutes les assertions passent sur un texte qu'elles ne visaient
// pas. C'est la troisième garde aveugle d'une même journée (après la garde de
// rendu verte pendant la panne totale, et la garde vacue après une suppression) :
// trois mécanismes, un seul résultat — vert sans rien regarder.
//
// D'où cette forme : toute borne de tranche des gardes passe par `borne()` (ou
// `borneArriere()`), qui JETTE quand le motif est introuvable, en le nommant.
// La garde bornes-de-tranche.test.mjs interdit la forme en ligne
// (un indexOf directement dans les arguments d'un slice), invérifiable par
// construction : il n'y a pas de variable à affirmer.
export function borne(src, motif, depuis = 0) {
  const i = src.indexOf(motif, depuis);
  if (i === -1) {
    throw new Error("borne de tranche introuvable : "
      + JSON.stringify(String(motif).slice(0, 70))
      + " — sans ce refus, indexOf aurait rendu -1, une borne VALIDE pour slice, "
      + "et la tranche se serait élargie en silence. L'ancre a perdu sa prise : réancrez la garde.");
  }
  return i;
}
export function borneArriere(src, motif, depuis) {
  const i = depuis === undefined ? src.lastIndexOf(motif) : src.lastIndexOf(motif, depuis);
  if (i === -1) {
    throw new Error("borne de tranche (arrière) introuvable : "
      + JSON.stringify(String(motif).slice(0, 70)) + " — réancrez la garde.");
  }
  return i;
}
