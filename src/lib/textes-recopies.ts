// ————— LES TEXTES QUI ENGAGENT ET QUE LA GARDE NE PEUT PAS ATTEINDRE —————
//
// C'EST LA DÉFINITION DU MODULE, et elle est plus large que son premier jet. Il a failli
// s'appeler « les textes de Revolut » : c'était nommer un LIEU au lieu d'une PROPRIÉTÉ, et
// la moitié du sujet serait restée dehors. Ce qui les réunit n'est pas l'endroit, c'est que
// chacun ENGAGE et qu'aucun n'est atteignable par une garde — parce qu'il est RECOPIÉ À LA
// MAIN, dans un tableau de bord ou dans une boîte de courrier.
//
// La garde des promesses de vente lit maintenant tout `src/` et l'application : plus
// aucune hypothèse implicite sur l'endroit où une promesse peut naître — À L'INTÉRIEUR DU
// DÉPÔT. Or les phrases qui engagent le plus n'y seront pas. Elles habiteront le tableau
// de bord du prestataire de paiement. LA VENTE, d'abord :
//
//   · le LIBELLÉ DE L'ARTICLE de chaque lien de paiement — c'est lui, et lui seul, qui
//     porte le renoncement au droit de rétractation. Pas la case de l'application, qui
//     fait consentir sans rien prouver ; pas un paramètre d'adresse, fabricable par
//     l'acheteur. Le libellé part dans une facture émise par un tiers et conservée dix
//     ans : payer, c'est accepter ce qui y est décrit ;
//   · la DESCRIPTION portée par la facture ;
//   · le COURRIEL DE CONFIRMATION, qui porte aussi le lien de gestion de l'abonnement —
//     c'est-à-dire le seul endroit d'où la résiliation part réellement, et /tarifs comme
//     l'accueil le promettent désormais par écrit.
//
// L'APRÈS-VENTE ensuite, et c'est le plus exposé des deux : le renvoi d'une clé perdue et
// la réponse à une demande de remboursement, réécrits à la main à chaque fois. Voir plus
// bas — ils n'ont ni version, ni diff, ni relecture.
//
// AUCUNE GARDE NE LES ATTEINDRA JAMAIS LÀ-BAS. Pas d'API, pas de lecture, pas de
// vérification possible — et ce sont les plus engageants de tous. C'est la surface qui
// déborde du dépôt, et la règle 7 s'y arrête net.
//
// LE REMÈDE N'EST PAS UNE GARDE, C'EST UN DÉPLACEMENT DE LA SOURCE. Ces textes sont écrits
// ICI, et le tableau de bord n'en est que le MIROIR RECOPIÉ. La garde les voit alors comme
// les autres — ils sont dans `src/`, dans des chaînes, comme tout le reste — et une
// divergence devient une erreur visible au lieu d'être muette. On ne peut pas vérifier ce
// qu'il y a chez le prestataire ; on peut faire en sorte qu'il n'y ait rien à inventer
// quand on l'y colle.
//
// ————— LE MODULE EST VIDE, ET IL EST MARQUÉ —————
//
// Il attend le statut de la société, exactement comme `RENONCE_TXT` dans l'application, et
// pour la même raison : la formule du renoncement, la forme de la facture et l'identité du
// vendeur dépendent d'un arbitrage juridique en cours. Écrire ici une formule plausible
// serait pire que ne rien écrire — elle aurait l'autorité du dépôt sans avoir été relue.
//
// LA MARQUE EST RELIÉE À SA CONDITION (règle 6). Une garde lit `RENONCE_TXT` : tant qu'il
// porte son « À COMPLÉTER », elle exige que ces textes portent le leur ; LE JOUR OÙ IL NE
// LE PORTE PLUS, ELLE ÉCHOUE et redemande de remplir ceux-ci. Écrire la marque est la
// moitié du geste ; écrire ce qui la retirera est l'autre.

/**
 * La marque. Tant qu'un texte la porte, il n'a pas été relu et ne doit être recopié nulle
 * part. Ce n'est pas un texte de repli : c'est l'absence de texte, rendue visible.
 */
export const EN_ATTENTE_DU_STATUT = "À COMPLÉTER — en attente de la création de la société";

export type TexteRecopie = {
  /** Où il se colle, mot pour mot. Un seul endroit, nommé sans ambiguïté. */
  ou: string;
  /** Ce qu'il engage — la raison pour laquelle il est ici plutôt que là-bas seulement. */
  engage: string;
  /** Le texte. LE DÉPÔT FAIT FOI ; le tableau de bord en est la copie. */
  texte: string;
};

// ————— LES QUATRE LIBELLÉS D'ARTICLE, UN PAR PLAN —————
//
// La vente tient quatre plans — lancement/normal × mensuel/annuel. Il faut donc QUATRE
// libellés, pas un : un plan sans son libellé est un plan qui se vend sans porter le
// renoncement. La garde dérive les noms attendus : les DURÉES payantes des formules de
// /tarifs (une troisième durée exigerait ses libellés toute seule), les PHASES de la
// matrice ci-dessous — depuis que la page de vente a quitté l'application, cette
// matrice est leur seule source machine-lisible dans le dépôt. ANGLE MORT, déclaré
// (règle 9) : une phase inventée directement chez le prestataire, sans passer par
// ici, échapperait — comme le cinquième texte d'après-vente plus bas.
export const PHASES_TARIF = ["lancement", "normal"] as const;


export const ARTICLE_LANCEMENT_MOIS: TexteRecopie = {
  ou: "Revolut · plan « lancement / mensuel » · libellé de l’article",
  engage: "porte le renoncement au droit de rétractation, et part dans la facture",
  texte: EN_ATTENTE_DU_STATUT,
};

export const ARTICLE_LANCEMENT_AN: TexteRecopie = {
  ou: "Revolut · plan « lancement / annuel » · libellé de l’article",
  engage: "porte le renoncement au droit de rétractation, et part dans la facture",
  texte: EN_ATTENTE_DU_STATUT,
};

export const ARTICLE_NORMAL_MOIS: TexteRecopie = {
  ou: "Revolut · plan « normal / mensuel » · libellé de l’article",
  engage: "porte le renoncement au droit de rétractation, et part dans la facture",
  texte: EN_ATTENTE_DU_STATUT,
};

export const ARTICLE_NORMAL_AN: TexteRecopie = {
  ou: "Revolut · plan « normal / annuel » · libellé de l’article",
  engage: "porte le renoncement au droit de rétractation, et part dans la facture",
  texte: EN_ATTENTE_DU_STATUT,
};

/**
 * La description portée par la facture. C'est la pièce qui PROUVE — conservée dix ans,
 * non réécrivable — et c'est aussi elle qui doit porter LE PRIX PAYÉ, sans quoi la
 * promesse « le tarif ne remonte pas » reste verbale.
 */
export const DESCRIPTION_FACTURE: TexteRecopie = {
  ou: "Revolut · modèle de facture · description de l’article",
  engage: "prouve ce qui a été vendu, à quel prix, et à quelles conditions",
  texte: EN_ATTENTE_DU_STATUT,
};

/**
 * Le courriel de confirmation. Il porte le lien de gestion de l'abonnement : c'est le
 * seul endroit d'où la résiliation part réellement, et le site le promet par écrit.
 */
export const COURRIEL_CONFIRMATION: TexteRecopie = {
  ou: "Revolut · courriel de confirmation de paiement",
  engage: "porte le lien de gestion, seul chemin de résiliation promis par le site",
  texte: EN_ATTENTE_DU_STATUT,
};

// ————— ET L'APRÈS-VENTE, QUI EST LE PLUS EXPOSÉ DES DEUX —————
//
// LE MODULE N'EST PAS « LES TEXTES DE REVOLUT ». C'est « les textes qui engagent et que la
// garde ne peut pas atteindre ». Les six précédents sont recopiés une fois dans un tableau
// de bord et n'y bougent plus. Ceux-ci sont RÉÉCRITS À CHAQUE FOIS, à la main, dans une
// boîte de courrier, par quelqu'un qui ne relira pas ce qu'il avait écrit la fois d'avant.
//
// C'est la dérive la plus silencieuse qui soit : pas de version, pas de diff, pas de
// relecture, et chaque envoi un peu différent du précédent. Personne ne s'en aperçoit —
// jusqu'au jour où deux clients comparent ce qu'on leur a répondu.
//
// Les deux engagent pour de bon :
//
//   · le RENVOI DE CLÉ est la contrepartie de ce que /tarifs promet noir sur blanc — le
//     registre des ventes existe précisément pour ça, et c'est ce qui rend acceptable
//     qu'une facture soit conservée. La promesse est écrite ; la réponse ne l'est pas ;
//   · la RÉPONSE À UNE DEMANDE DE REMBOURSEMENT doit dire que LA CLÉ RESTE OUVERTE. Une
//     clé est délivrée à la seconde du paiement et ne se révoque jamais : rembourser ne
//     reprend rien. Le dire est une obligation, et l'improviser au cas par cas est le
//     meilleur moyen de finir par ne pas le dire.

/**
 * Le courriel qui renvoie une clé perdue, retrouvée dans le registre des ventes par
 * l'adresse de l'achat. C'est la promesse que /tarifs tient explicitement.
 */
export const RENVOI_DE_CLE: TexteRecopie = {
  ou: "à la main, depuis la boîte de contact — à chaque demande",
  engage: "tient la promesse de /tarifs : le registre permet de renvoyer une clé perdue",
  texte: EN_ATTENTE_DU_STATUT,
};

/**
 * La réponse à une demande de remboursement. Elle doit dire que la clé reste ouverte :
 * rembourser ne reprend rien, et le passer sous silence serait tromper.
 */
export const REPONSE_REMBOURSEMENT: TexteRecopie = {
  ou: "à la main, depuis la boîte de contact — à chaque demande",
  engage: "dit que la clé reste ouverte après remboursement, puisqu’elle ne se révoque pas",
  texte: EN_ATTENTE_DU_STATUT,
};

/** Tous, à plat. Un texte déclaré et non inscrit ici serait invisible : la garde le refuse. */
export const TEXTES_RECOPIES: readonly TexteRecopie[] = [
  ARTICLE_LANCEMENT_MOIS,
  ARTICLE_LANCEMENT_AN,
  ARTICLE_NORMAL_MOIS,
  ARTICLE_NORMAL_AN,
  DESCRIPTION_FACTURE,
  COURRIEL_CONFIRMATION,
  RENVOI_DE_CLE,
  REPONSE_REMBOURSEMENT,
];

/** Vrai tant que rien n'a été relu. Aucun de ces textes ne se recopie avant que ce soit faux. */
export const enAttente = () => TEXTES_RECOPIES.some((t) => t.texte === EN_ATTENTE_DU_STATUT);
