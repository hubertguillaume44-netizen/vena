// ————— CE QUE LE PALIER GRATUIT DONNE VRAIMENT —————
//
// La colonne « 0 € » de l'accueil disait « Trois instruments à vous ». Exact, et
// incomplet : le gratuit donne AUSSI les dix séries d'exemple, et ce sont elles qui
// permettent d'essayer l'outil sans rien avoir exporté. Quelqu'un qui arrive sans
// données lisait qu'il devait d'abord installer MT5, compiler un script et exporter un
// CSV pour voir à quoi ressemble le produit. Les séries existent précisément pour qu'il
// n'ait pas à le faire — c'est l'argument le plus fort de la colonne, et il n'y était pas.
//
// ————— LE MOT EST CELUI DU PRODUIT, ON N'EN INVENTE PAS UN SECOND —————
//
// L'application les appelle « séries d'exemple » partout : la pastille, le filtre de
// provenance, le bandeau, la colonne. Écrire « fictives » ou « fausses » sur le site
// créerait un second vocabulaire pour la même chose, et deux vocabulaires divergent —
// c'est la divergence muette, appliquée à un nom au lieu d'un fichier.
//
// ————— ET LE COMPTE NE S'ÉCRIT PAS DEUX FOIS SANS GARDE —————
//
// Sa vérité vit dans l'application, dans `SYM_EXEMPLES` — que le site ne peut pas
// importer : deux applications, deux paquets, aucun module commun. Le nombre est donc
// écrit ici UNE fois, et `scripts/app/palier-gratuit-nomme-ce-quil-donne.test.mjs` lie
// les deux bouts : le défaut ne serait dans aucun des deux pris isolément, il serait
// dans leur DÉSACCORD. Passer à douze séries fait tomber la garde en nommant les deux
// nombres, au lieu de laisser « dix » sur la page de vente.
export const NB_EXEMPLES = 10;

// Les phrases vivent dans des littéraux PLEINS, sans interpolation : les gardes de
// promesse ne savent lire que les chaînes, et une phrase coupée par un `${…}` leur
// serait illisible sans qu'elles échouent. C'est la garde de la garde, appliquée ici.
// ————— ET CE QUE LE GRATUIT DONNE VIT ICI, PAS DANS DEUX PAGES —————
//
// « Trois instruments à vous » était écrit deux fois : en texte JSX NU sur l'accueil,
// en littéral sur /tarifs. Le texte nu est invisible aux gardes de promesse — elles ne
// savent lire que les chaînes, et elles passaient au vert en ne regardant plus rien
// (mesuré : la garde du palier le trouvait dans le COMMENTAIRE de ce module, pas dans
// la page). Les quatre phrases sont donc des littéraux nommés, lus par les deux routes.
export const GRATUIT_INSTRUMENTS = "Trois instruments à vous";
export const GRATUIT_EXEMPLES = "Plus dix séries d’exemple, prêtes à scanner";
export const GRATUIT_EXEMPLES_TARIFS = "Dix séries d’exemple, sans limite";
