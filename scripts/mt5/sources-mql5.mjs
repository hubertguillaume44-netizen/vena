// ————— LA SURFACE : TOUT SOURCE MQL5 QUI FINIT CHEZ L'UTILISATEUR —————
//
// Deux fois dans la même journée, un correctif a fermé une CLASSE et sa garde a été
// posée sur un LIEU :
//
//   · `ArrayFree` suivi d'un Copy* tue le terminal. Corrigé dans `Export_H1_Vena`,
//     gardé sur « les .mq5 de la racine » — et le robot, qui naît d'un générateur,
//     n'en est pas un. Le trou est resté ouvert jusqu'à ce qu'on le cherche.
//   · une attente qui se répète à l'identique n'est plus une attente, c'est une
//     boucle. Corrigé dans `AttendreHistorique` le matin ; la même forme tournait
//     dans le cache d'agrégation du robot, et personne ne l'y a cherchée.
//
// > **Quand un correctif ferme une classe, la garde se pose sur la CLASSE — pas sur
// > le fichier où elle est apparue.** Et le signal est disponible au moment même du
// > premier correctif : si le correctif a un nom de classe — « aucun ArrayFree »,
// > « aucune boucle sans borne » — alors sa garde ne peut pas avoir un nom de lieu.
// > C'est la règle 8 appliquée aux gardes elles-mêmes.
//
// Ce module est ce nom de classe, rendu exécutable : *tout source MQL5 que
// l'utilisateur peut faire tourner*. Il en existe deux familles, et le piège était
// qu'une seule a la forme d'un fichier :
//
//   · les scripts LIVRÉS — découverts à la racine, jamais énumérés ;
//   · le robot PRODUIT — il n'existe qu'une fois généré, donc on le génère.
//
// Une troisième famille demain (un second générateur, un .mq5 dans un sous-dossier)
// s'ajoute ici, et les gardes de classe la couvrent sans être touchées.
import { readdirSync, readFileSync } from "node:fs";
import { genererMQ5, stampMaintenant } from "../../robot-mt5.js";

const RACINE = new URL("../../", import.meta.url);

// Une configuration quelconque mais COMPLÈTE : on ne mesure pas le robot d'un cas
// particulier, on mesure la forme que le générateur émet toujours.
export function robotEmis(sur = {}) {
  return genererMQ5(
    { sym: "GOLD", periode: 9, sl: 0.5, rr: 1.5, entree: "crois", ligne: "mme",
      filtre: "v1|", filtreNom: "", n: 40, total: 12, ut: "D1",
      heures_entree: { debut: 0, fin: 0 }, ...(sur.cfg || {}) },
    { risquePct: 1, ut: "D1", hasard: "non contrôlé", etat: { ut: "D1" },
      spreadMaxPct: 0.05, stamp: stampMaintenant(), magic: 1, moment: null,
      licence: null, spreadFacteur: 1, mesureVieille: false, heuresSession: null,
      paliers: [], ...(sur.opts || {}) });
}

/** Tout source MQL5 livré ou produit, en [{ nom, src, origine }]. */
export function sourcesMQL5() {
  const livres = readdirSync(RACINE)
    .filter((f) => f.endsWith(".mq5"))
    .map((f) => ({ nom: f, origine: "livré",
      src: readFileSync(new URL(f, RACINE), "utf8") }));
  return [...livres,
    { nom: "robot-mt5.js → .mq5 émis", origine: "produit", src: robotEmis() }];
}
