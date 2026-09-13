# Véna — conventions du dépôt

## Le nom, et sa règle d'écriture

**« Véna » partout où un humain lit.** Avec l'accent, y compris en capitales : **VÉNA**.
La marque, la page de vente, l'en-tête de l'application, les mails, les libellés de
paiement, le titre de fenêtre, les mentions de licence, les infobulles, les commentaires
du code.

**`vena` partout où une machine lit.** Sans accent, sans majuscule. Noms de fichiers,
clés de stockage, bases IndexedDB, noms de robots MQL5, identifiants dans le code, noms
de fichiers exportés, chemins de dossiers.

> **Pourquoi la séparation.** Un accent dans un nom de fichier ou une clé casse au premier
> transfert entre Windows et macOS : les deux systèmes ne normalisent pas le « é » de la
> même façon (NFC contre NFD), et le fichier devient introuvable. Le générateur de robots
> l'illustre : `nomRobot` efface tout caractère non alphanumérique, et « Véna » y
> deviendrait « V_na ».

L'adresse du site est **venapp.fr**. Le suffixe est technique : il n'entre ni dans le
logo, ni dans l'en-tête, ni dans les mails.

Ne pas confondre avec les mots français **simulateur**, **simulation**, **simuler** :
ce ne sont pas la marque, ils restent tels quels.

## Ce qui ne change JAMAIS de nom

Trois familles sont gelées. Les renommer casserait des données déjà chez l'utilisateur.

| Constante | Où | Pourquoi elle est gelée |
|---|---|---|
| Le **numéro magique** (`magicDe`) | robot MQL5, journal | Il identifie les positions ouvertes chez le courtier. Un robot qui perd son magique perd la trace de ses propres positions. Il ne hache que la configuration et le compte — le nom de l'application n'y entre pas, et ne doit jamais y entrer. |
| **`SIV_`** : `SIV_trades_`, `SIV_NIV_`, `SIV_PAN_`, la marque d'ordre `SIV_<stamp>` | protocole MT5 | Étiquettes écrites par les robots **déjà compilés** et lues par l'application. Les basculer remplirait `Common\Files` de deux orthographes du même fichier — le symptôme même qu'on corrige — et couperait la trace des robots en place. |
| Les **signatures de journal** | Journal, reproductibilité | Une signature enregistrée sous l'ancien nom doit rester valide et recalculable. |

## Ce qui accepte les deux noms, sans date limite

- **L'import d'une sauvegarde** : `outil: "vena"` et `outil: "simula"`, `vena_chiffre` et
  `sivula_chiffre`, l'extension `.vena` et `.sivula`. Quelqu'un réimportera dans deux ans
  un fichier exporté aujourd'hui. **À l'export : le nouveau nom seulement.**
- **Le relais d'usage** (`netlify/functions/usage.mjs`) : une version ancienne encore
  ouverte dans un onglet continue d'envoyer l'ancien marqueur.
- **Le script `Export_H1_Vena.mq5`** : il cherche `vena\symboles.txt`, puis retombe sur
  `Sivula\symboles.txt` si le premier est absent, en le disant dans le journal MT5.

## La migration du stockage

Elle vit **en tête de `Vena.dc.html`, avant la classe** — donc avant la moindre lecture.
Un renommage sans migration efface tout le travail de l'utilisateur au premier
chargement, silencieusement : c'est le seul geste irréversible de l'opération.

Sa règle : **la clé neuve fait foi**. Si elle existe, on la garde ; sinon, si l'ancienne
existe, on la recopie. **Rien n'est supprimé** — l'ancien jeu reste au moins une version,
le temps d'être certain que la copie a réussi et que l'utilisateur a exporté une fois
depuis.

L'ordre compte : **les données d'abord** (séries, scans, portefeuilles, journal — ce qui
est irremplaçable), **les réglages ensuite**, **la trace en dernier**. Une interruption au
milieu laisse la trace absente : le chargement suivant reprend depuis le début, et les
clés déjà copiées sont sautées. Chaque espace étanche (`.essai`, `.client`, `.perso`) et
chaque compte migrent séparément, puisque le suffixe fait partie de la clé.

**Le site ne stocke plus rien.** Il avait ses propres clés et sa propre base
(`src/lib/store.ts`, `src/lib/uploads.ts`) pour une démonstration en React, à côté de
celle que l'application porte déjà. Les deux fichiers sont partis avec elle : le seul
stockage du navigateur est désormais celui de l'application, et la migration ci-dessus
est la seule à tenir.

Les balayages de clés (`estCleApp`) comptent **les deux jeux** tant que l'ancien n'est pas
supprimé : l'occupation réelle du navigateur est bien celle des deux.

## Fichiers

| Nom | Rôle |
|---|---|
| `Vena.dc.html` | **la source**, un seul fichier |
| `Vena.solo.html` | **artefact**, régénéré par `npm run app:solo` — ne jamais l'éditer à la main |
| `Export_H1_Vena.mq5`, `Vena_Releve.mq5` | scripts MT5 téléchargés par l'utilisateur |
| `aide-index.json` | **artefact**, régénéré par `npm run app:aide` après tout changement de `title=` |
| `src/lib/textes-recopies.ts` | **la source** des textes qui engagent et qu'aucune garde n'atteint — vente et après-vente, recopiés à la main ; vide et marquée tant que le statut n'est pas tranché |

À chaque livraison : `npm run app:version` avant `npm run app:solo` — voir « La version
affichée est une date » plus bas.

Le dépôt GitHub s'appelle `hubertguillaume44-netizen/vena`. Il a été renommé depuis
GitHub, et les deux liens qui le citent (`README.md`, `PASSATION.md`) ont suivi. GitHub
redirige l'ancienne adresse, mais un lien écrit dans le dépôt doit nommer la vraie :
une redirection se retire le jour où quelqu'un recrée un dépôt sous l'ancien nom.

## Déploiement — la configuration vit dans le dépôt

`netlify.toml` porte les trois réglages : commande de construction, `publish = "dist"`,
répertoire de fonctions. **Il fait foi contre l'interface Netlify — sur ces trois-là.**

**UNE RÈGLE DIT OÙ ELLE S'ARRÊTE, SINON ELLE SE LIT COMME UNE GARANTIE GÉNÉRALE.** C'est
la même famille que la garde qui éprouvait le producteur au lieu du consommateur : une
consigne vraie sur son domaine, prise pour vraie partout. Ce fichier ne couvre **pas** la
branche construite, ni l'activation des constructions, ni **le verrou de publication** —
ni les variables d'environnement. Quatre réglages qui vivent dans l'interface, que rien
dans le dépôt ne peut contredire. Voir « Ce que `netlify.toml` ne tient pas » plus bas.

Un réglage posé dans
une interface ne se relit pas, ne se révise pas en revue, et personne ne sait qu'il existe
jusqu'au jour où il casse — c'est arrivé : l'interface annonçait `dist/client` et le dépôt
construisait pour Vercel, deux sorties dont aucune n'existait.

`vite.config.ts` construit avec `nitro({ preset: "netlify" })`. Le préréglage dépose les
fichiers statiques dans `dist/` et le serveur SSR dans `.netlify/functions-internal/`,
que Netlify déploie **en plus** du répertoire `netlify/functions`.

**Les deux fonctions écrites à la main** (`licence.mjs`, `usage.mjs`) déclarent leurs
chemins `/api/licence` et `/api/usage`. Le serveur SSR déclare `path: "/*"` et n'exclut
que `/.netlify/*` : les deux se recouvrent. `netlify.toml` tranche par deux redirections
`force = true` vers `/.netlify/functions/…`, cible hors de portée du fourre-tout SSR — on
ne parie pas sur une préséance non documentée quand une licence qui tombe sur le SSR rend
404 au webhook de paiement.

`scripts/deploiement-netlify.test.mjs` lie ces réglages entre eux : préréglage, répertoire
publié, présence des deux fonctions, et une redirection forcée par chemin déclaré.

### Ce que `netlify.toml` NE tient pas, et qui a déjà fait défaut

**Ni la branche, ni l'activation des constructions, ni le VERROU DE PUBLICATION.**
`netlify.toml` porte la commande, le répertoire publié et les fonctions. Ces trois-là sont
des réglages d'interface, et rien dans le dépôt ne peut les contredire — exactement le trou
que la section ci-dessus dénonce, une strate plus bas.

**LE VERROU DE PUBLICATION EST LE PLUS SOURNOIS DES TROIS, et c'est lui qui a mordu.** Un
déploiement est resté figé deux jours : sept constructions étaient parties, et **toutes
avaient réussi** — c'est la publication automatique qui était verrouillée. La version en
ligne restait sur `main@eeca9d5` pendant que les suivantes s'empilaient en réserve.

Retenir la forme, parce qu'elle se reproduira : **tout est vert, et rien n'arrive.** Une
construction verte ne prouve pas une mise en ligne. C'est la règle 1 déguisée en tableau
de bord — « la construction a-t-elle réussi ? » est une intention, « la version en ligne
a-t-elle changé ? » est le résultat.

> **Le journal qu'on regarde n'est pas celui qui répond à la question.**

Un journal de constructions réussies n'est pas un journal de publications, et il est
d'autant plus trompeur qu'il est vert : on y lit une confirmation là où il n'y a qu'une
étape. La seule preuve est **ce que sert l'adresse publique** — sur cette application, le
numéro du pied de page.

C'est ce qui donne rétroactivement sa valeur au **rang de version** : `260913.8` désigne
une livraison, `260905` ne désignait qu'une semaine. Un numéro qui ne distingue pas deux
mises en ligne ne peut pas servir de preuve qu'une mise en ligne a eu lieu.

Ce que le dépôt prouvait alors, et qui reste la façon de trancher — en sachant désormais
qu'aucune de ces vérifications n'atteint le verrou :

| Vérification | Commande |
|---|---|
| la branche par défaut est bien `main` | `git ls-remote --symref origin HEAD` |
| `main` porte le travail | `git log origin/main --oneline -5` |
| aucune branche périmée ne traîne | `git ls-remote --heads origin` |
| la construction passe de bout en bout | `npm run build` |

**Une branche périmée qui reste sur le dépôt est un piège**, pas un souvenir :
`claude/sivula-mt5-discrepancy-25ktd5` porte encore `Sivula.dc.html` et
`VERSION_APP = '260905'`. Une interface qui pointerait là construirait un fichier que
`publier-solo.mjs` ne trouve même plus, et le site resterait figé sans qu'aucune
construction n'échoue bruyamment.

**Elle est à supprimer, et elle ne perd rien** : vérifié, son sommet est un ancêtre de
`main` et elle ne porte **aucun** commit propre — `git log origin/main..<branche>` rend
zéro. La supprimer retire un pointeur, pas un historique.

```
git push origin --delete claude/sivula-mt5-discrepancy-25ktd5
```

Depuis une session Claude Code, cette commande ne passe pas : le mandataire git accepte la
poussée et **laisse tomber le refspec de suppression** — elle rend « Everything
up-to-date » et la branche reste. Trois tentatives, même résultat. C'est un geste à faire
depuis un poste, ou depuis l'interface GitHub.

## Deux entrées, deux promesses

| Adresse | Ce que c'est | Ce qu'elle promet |
|---|---|---|
| **`/app`** | `Vena.solo.html` servi tel quel, hors du routeur du site | « ouvrir mon outil » — cinq pages, le moteur complet, vos données |
| **`/tarifs`** | une page du site, en React | « combien ça coûte » — trois formules, un comparatif, six objections |

**Il n'y a plus qu'une démonstration, et c'est celle de l'outil.** Le site portait la
sienne en React, sur `/simuler`, à côté de celle que l'application porte déjà avec le
moteur entier : deux moteurs à tenir d'accord, et le jour où ils divergent c'est la
vitrine qui ment sur le produit. Les séries de démonstration s'ouvrent dans `/app`.

**Le site vend, l'application travaille.** Le prix vit sur `/tarifs` et nulle part
ailleurs ; l'accueil n'en garde qu'un résumé de trois montants. Dans l'outil, le prix
n'est jamais écrit — il est POINTÉ, par un lien discret en bas de la section licence du
tiroir. Une seconde page de vente serait une seconde vérité à tenir à jour.

`/app` n'étant pas une route du routeur, on y va par un `<a href>` : un `<Link>`
tenterait une navigation interne vers une route qui n'existe pas.

**Le repère d'arrivée est `/app#licence`, et c'est le seul.** Les colonnes payantes de
`/tarifs` le portent ; il ouvre le tiroir de l'application sur la section Licence,
curseur dans le champ du courriel. Un **fragment** et non un paramètre : il ne part
jamais au serveur, donc il ne croise pas la redirection `/app` → `/app/index.html`.

`repereLicence()` le **nettoie** (`history.replaceState`) dès qu'il l'a lu, avant toute
décision — sans quoi un rechargement, ou un favori posé sur cette adresse, rouvrirait le
tiroir indéfiniment. Il n'est lu qu'APRÈS la revérification de la licence, qui est
asynchrone : le lire plus tôt ouvrirait le tiroir au nez de quelqu'un qui a déjà sa clé.
Il ne s'enregistre nulle part — ni session, ni drapeau « déjà vu ».

**Un seul champ de clé dans toute l'application**, celui du tiroir. Le bandeau de compte
vide y MÈNE, il ne le copie pas : deux champs seraient deux états à tenir d'accord.
`scripts/app/ou-poser-sa-cle.test.mjs` tient les trois points — un seul champ, le repère
nettoyé, et le bandeau qui s'efface dès qu'une clé est posée.

**La construction REFAIT l'application avant de la publier.** `npm run build` appelle
`scripts/app/publier-solo.mjs`, qui relance `solo.mjs`, vérifie que la version de
l'artefact est celle de `Vena.dc.html`, puis copie dans `dist/app/index.html`. Publier le
`Vena.solo.html` du dépôt aurait servi, un jour ou l'autre, une version figée divergeant
de la source — la même panne que le préréglage de déploiement, une strate plus haut.

**`_ds/` EST dans le dépôt depuis, et cette section disait le contraire.** Quinze fichiers
sous `public/_ds/industry-…/` — feuille, paquet, manifeste, polices — suivis par git et
recopiés dans `dist/` par Vite. `publier-solo.mjs` avertit s'ils manquent, et il
n'avertit plus. La phrase « `_ds/` n'est pas dans le dépôt » est restée après que le
problème eut été réglé : une consigne périmée envoie chercher une panne qui n'existe
plus, ce qui coûte plus cher que pas de consigne du tout.

**React et React-DOM viennent d'unpkg.com**, chargés par le runtime DC au démarrage. Un
réseau qui bloque unpkg laisse l'application vide.

## L'application ne dépend de rien d'extérieur

Une fois `/app` chargé, **aucune requête ne part vers un tiers**. Trois dépendances le
mettaient en défaut ; les trois sont dans le dépôt.

| Ce qui partait dehors | Où c'est maintenant |
|---|---|
| React et React-DOM, depuis unpkg.com | `vendor/react-18.3.1/` |
| La feuille et le paquet du système de design | `public/_ds/industry-…/` |
| Barlow et Barlow Condensed, importées par cette feuille | `public/_ds/industry-…/fonts/` |

**React.** `support.js` porte « do not edit » ; on ne le modifie pas. Son
`cdnScriptFor` lit `window.__resources` avant de retomber sur l'URL distante :
`Vena.dc.html` pose cette table **avant** la balise du runtime, et `solo.mjs` la remplace
par des Blob URL pour que le fichier unique reste autonome. Les deux URL unpkg qui
subsistent dans le fichier livré sont les **clés** de cette table — ce que le runtime
cherche, jamais ce qu'il charge.

**Les versions sont épinglées à 18.3.1, pas à une plage.** Un produit qui se met à jour
tout seul quand un tiers publie casse un matin sans qu'on ait rien touché. Les fichiers
vendorés sont vérifiés **identiques aux empreintes SRI** que `support.js` attendrait du
CDN : ce n'est pas « une version de React », c'est la même, octet pour octet.

**Les polices** sont vendorées en latin et latin-ext seulement — l'application est en
français. `node scripts/app/vendorer-polices.mjs` les rafraîchit à la main ; il ne tourne
pas à la construction, qui ne doit pas dépendre d'un service tiers pour réussir.

**Les seules adresses externes tolérées** dans le fichier livré sont les portes ouvertes
sur demande : `finnhub.io` (actualités) et `api.mymemory.translated.net` (traduction).
Elles ne partent qu'avec une clé posée par l'utilisateur, et le tiroir Intendance les
affiche une par une.

`scripts/app/autonomie.test.mjs` tient tout cela : empreintes SRI, ordre de la
substitution, absence de chargement de tiers dans le fichier livré, présence des polices,
et correspondance entre le chemin que l'application déclare et celui où le fichier est
publié.

## Protection temporaire du site (à retirer au lancement)

Le site entier est derrière une authentification de base, déclarée dans `netlify.toml`
par un bloc `[[edge_functions]]` de trois lignes. **Supprimer ces trois lignes l'enlève**
— voir PASSATION.md, « La protection temporaire du site ».

Le mot de passe vit dans la variable d'environnement **`VENA_ACCES`** posée dans Netlify,
au format `identifiant:motdepasse`, jamais dans le dépôt. La fonction **ferme** quand la
variable manque : une protection qui disparaît avec sa configuration ne protège rien.

Elle couvre `/api/licence` : **le webhook Revolut recevra 401 tant qu'elle est en place**.
À traiter le jour où le paiement s'ouvre, avec la liste `OUVERTS` de `protection.js`.

## La version affichée est une date, et elle part avec les rapports

`VERSION_APP` n'est pas un ornement du pied de page. Elle voyage avec **chaque rapport
d'avis** et **chaque fichier de diagnostic** : c'est la seule chose qui dise quelle
version l'utilisateur avait sous les yeux quand il a vu ce qu'il rapporte. Restée à
`260905` pendant que l'application changeait de fond en comble, elle ne se contentait
pas d'être inutile — elle **mentait**, et un rapport qui ment sur sa version fait
chercher un défaut là où il n'est plus.

**À chaque livraison :** `npm run app:version` (pose la date du jour, format AAMMJJ),
puis `npm run app:solo`. `npm run app:version -- --voir` dit ce qui est posé sans rien
écrire.

**Et un RANG quand la journée ne suffit plus.** « La journée est la granularité utile »
était vrai jusqu'au jour où il a fallu savoir *laquelle* des livraisons du jour était en
ligne. Une seconde livraison le même jour prend `260913.2`, la troisième `260913.3` ; la
première du jour reste nue, pour que le cas courant garde sa lisibilité.

**Un rang ne répare pas le passé.** `VERSION_APP` est restée figée à `260905` pendant une
semaine entière : aucun numéro ne distingue les commits antérieurs au 12 septembre, et
lire « 260905 » dans un pied de page ne dit rien de plus que « avant le 12 ». C'est la
raison d'être du rang, et la limite de ce qu'il peut.

**Le script n'agit plus en étant importé.** `suivante()` est exportée pour être éprouvée ;
sans garde, la seule *lecture* du module posait une version — deux imports de vérification
ont fait passer le fichier de `260913` à `260913.3` en deux secondes, sans que personne
n'ait demandé une livraison. Un module qui agit au chargement n'est pas testable.

**Ne pas la confondre avec `MOTEUR_V`.** Celle-là est une clé de cache : la changer
PÉRIME les résultats enregistrés de tout le monde. `VERSION_APP` est une étiquette, elle
ne conditionne aucun calcul — c'est pour ça qu'on peut la bouger sans précaution, et
aussi pour ça qu'on l'oublie. `scripts/app/version-datee.test.mjs` interdit qu'elles se
confondent, et vérifie que la date existe, qu'elle n'est pas dans l'avenir, et que
l'artefact porte la même que la source.

**L'oubli se voit à la construction.** `publier-solo.mjs` avertit quand `Vena.dc.html` a
été écrit après la date qu'il annonce. C'est un avertissement et non un arrêt : un clone
frais réécrit les dates de fichiers, et refuser de construire un dépôt fraîchement cloné
serait un piège pire que l'oubli qu'on prévient.

## Les séries d'exemple sont engendrées, jamais livrées

**Aucune série d'exemple n'est un fichier.** Tout vient d'un générateur déterministe à
graine fixe, en tête de `Vena.dc.html` : quelques kilooctets de code, zéro octet de
données, les mêmes séries pour tout le monde. **Rien des exports d'un utilisateur n'entre
dans le produit** — ce qui était le cas des quatre séries `DEMO-*` livrées en CSV, dont
personne ne pouvait plus dire d'où venaient les prix.

**La graine est gelée, versionnée — jamais choisie : `vena-exemple-v2`.**

*Gelée* : un scan enregistré hier doit se relire sur les mêmes bougies. *Versionnée* : le
jour où le générateur change, les bougies changent, et le numéro suit. La `v2` date du
lissage et de la dispersion des régimes ; la `v1` était l'escalier commun aux dix
familles. Le test échoue à chaque changement du générateur, exprès — il oblige à décider
si les bougies ont bougé, et à le dire, plutôt qu'à s'en apercevoir le jour où un scan
enregistré ne se relit plus.

*Jamais choisie*, et c'est la partie qui demande de l'attention. On a proposé de
rechoisir la graine sur un critère de **présentation** — que la dernière clôture de
chaque famille tombe dans les 80 % centraux de son amplitude — au motif qu'un tel critère
ne parle pas de performance. **Mesuré sur vingt-quatre graines : deux le satisfont.** Une
propriété rare n'est pas un cadrage. Une clôture au bord de l'amplitude est la signature
d'une tendance qui a tenu jusqu'au bout ; exiger que les dix l'évitent retient les univers
où les tendances meurent avant la fin — exactement ce qu'un balayage de croisements de
moyennes est censé trouver, ou ne pas trouver. Le critère a l'air d'un cadrage, c'est un
réglage du marché.

## Le compte de découverte n'existe plus

Il était le **sixième compte** d'un sélecteur qui en offre cinq, avec ses bougies écrites
dans le navigateur, son relevé de frais à lui et un semis versionné. Trois défauts, et
aucun n'était cosmétique : il occupait une place de compte ; ses bougies pesaient dans la
jauge et partaient dans « Exporter mes données » ; et **ses frais appartenaient au
compte**, si bien que le spread d'une série changeait selon l'onglet depuis lequel on la
regardait.

Les dix séries d'exemple vivent maintenant **en mémoire**, visibles depuis n'importe quel
compte, et leur relevé vient de la table du générateur — deux colonnes, spread en pour-cent
du notionnel et swap annuel. Écrit en points, il restait « coût non chiffrable » jusqu'à ce
qu'une conversion de prix passe : le relevé d'exemple est donc marqué `mt4: false` et
`chiffre: true`, c'est-à-dire **déjà retraité**.

**`compteActif` est une liste blanche.** Une session enregistrée désigne peut-être encore
`ongCourtier: 'demo'`. Une liste noire ne protège que du cas qu'on a pensé ; la prochaine
clé morte viderait l'écran sans un mot, exactement comme le jour où la page d'accueil a été
retirée sans garder la porte.

**La couverture des séries d'exemple se calcule et ne s'enregistre pas.** Elle est lue en
surcouche de la carte et **retirée à l'écriture** : la carte lue est celle qu'on réécrit,
donc sans ce filtre elles se seraient enregistrées au premier relevé d'une vraie série.

**`retirerCompteDemo()` est le seul geste irréversible de l'opération**, et il n'efface que
des données engendrées. Il est idempotent **par une marque** — juger à « il ne reste rien à
faire » rebalaie tout le stockage à chaque chargement. Il ne prend que les clés se
terminant par `.demo` : un suffixe, jamais un fragment, sans quoi un compte que l'utilisateur
aurait nommé « demo-perso » partirait avec. Et il lit les index de séries **avant** de les
effacer, sinon leurs blocs de bougies restent inatteignables — la panne qui a déjà laissé
147 séries et 97 Mo derrière elle.

**Masquer n'est pas supprimer.** L'interrupteur du tiroir retire les dix de la vue et les
repose ; il n'efface rien, parce qu'il n'y a rien d'écrit. Un bouton « supprimer » mentirait
sur ce qu'il fait. Seul le choix est enregistré, un booléen dans la session.

**Le filtre de provenance est une deuxième question**, pas une variante de « avec bougies » :
l'une demande ce qui est mesurable, l'autre d'où ça vient. Les fondre en un segment rendrait
impossible « mes instruments qui ont des bougies », qui est la vue de travail.

**Ni le palier gratuit ni le bandeau d'arrivée ne les comptent.** Le premier fermerait la
mesure à quelqu'un qui n'a rien déposé ; le second disparaîtrait au premier chargement, et
avec lui la seule porte visible vers le champ de clé.

## Ce qu'on conserve porte deux promesses, et c'est ce qui les rend vraies

« **Rien n'est conservé sur vous, pas même votre achat** » a longtemps été écrit sur la page
de vente. C'était faux **et** illégal : une facture se conserve dix ans. La promesse vraie
porte sur les **données** — prix, scans, portefeuilles ne quittent pas le navigateur — et
elle est vérifiable. C'est la même figure que la limite de `netlify.toml` : *une règle dit
où elle s'arrête, sinon elle se lit comme une garantie générale.*

Une fois le domaine nommé, le registre des ventes cesse d'être une gêne et devient **ce qui
tient deux promesses** :

| La promesse | Ce qui la rend vraie |
|---|---|
| « votre clé vous est renvoyée autant de fois qu'il le faut » | le registre prouve que le demandeur a acheté |
| « le tarif ne remonte jamais pour ceux qui en bénéficient » | **le prix payé**, inscrit sur la facture et conservé avec elle |

La seconde ligne est une **ligne de plus dans ce qu'on conserve**, et sans elle la promesse
reste verbale — exactement le défaut qu'on venait de purger ailleurs.

**Ce qui prouve est ce qu'un tiers a écrit et conserve.** Le renoncement au droit de
rétractation suit la même règle : il doit vivre dans le **libellé de l'article** du lien de
paiement, donc dans la facture, et non à côté. Une première version le faisait voyager dans
l'adresse de paiement (`?renonce=<horodatage>`) : fausse preuve deux fois — un paramètre
d'URL est fabricable par l'acheteur, et son absence ne prouve rien non plus, alors que la
charge de la preuve pèse sur le **vendeur**. La case à cocher reste, et sa fonction reste
entière : elle fait **consentir**. C'est la facture qui **prouve**.

## Les neuf règles, dans l'ordre où elles se servent

Elles viennent toutes d'un défaut réel de ce dépôt, et chacune est détaillée plus bas.

1. **Demander une intention pour prédire un résultat** — décider après, pas avant.
2. **Toute garde de frontière se vérifie par mutation** — une sonde qui ne tombe jamais ne
   prouve rien.
3. **On interdit le code, pas le récit du code.**
4. **Quand l'explication contredit l'étiquette, c'est l'étiquette qui est le défaut.**
5. **Une affirmation sur un fichier se relit avant d'être rapportée.**
6. **Une marque temporaire est reliée à la condition qui la justifie** — sinon elle devient
   un commentaire permanent que plus personne ne lit.
7. **La surface se découvre, elle ne s'énumère pas** — un périmètre écrit à la main porte
   toujours une hypothèse implicite.
8. **Un nom de LIEU fixe un périmètre ; un nom de PROPRIÉTÉ en découvre un** — c'est la
   règle 7 vue depuis l'amont, au moment où l'on nomme.
9. **Un angle mort qu'on ne peut pas fermer se déclare dans la garde elle-même** — sinon la
   garde suivante hérite d'une confiance qu'elle n'a pas méritée.

Les quatre dernières sont nées le même jour, sur la même garde. Elles ferment par
**construction** ce que les cinq premières ne fermaient que par **vigilance** — ou, quand
rien ne peut le fermer, elles l'écrivent.

## Le défaut a un nom : demander une INTENTION pour prédire un RÉSULTAT

**C'est la règle qui sert le plus, et de loin.** Cinq fois la même forme en deux séances,
et toujours le même geste pour en sortir : **décider après, pas avant.**

| Où | L'intention demandée | Le résultat voulu |
|---|---|---|
| Garde d'étanchéité | « le générateur écrit-il ? » | « quelque chose d'engendré entre-t-il dans le stockage ? » |
| `this.essai` | « a-t-il payé ? » | « y a-t-il quelque chose à mesurer ? » |
| `aMoi` | « a-t-il déposé ? » | idem |
| La sonde accrochée à `const OUVERTS = [];` | « la liste est-elle encore vide ? » | « où la déclaration se trouve-t-elle ? » |
| Le semis de mesure | « l'espace est-il `.essai` ? » | « quel espace l'application vient-elle d'écrire ? » |
| La garde du tarif gelé | « le mot *facture* existe-t-il quelque part ? » | « les deux phrases sont-elles ensemble ? » |

La dernière est une variante discrète : chercher un mot dans **tout un fichier** pour
conclure que deux phrases voyagent ensemble, c'est encore mesurer une intention pour un
résultat. Elle passait au vert sur une promesse nue, parce qu'une autre phrase, sur tout
autre chose, parlait de facture. Corrigée, elle a immédiatement trouvé un vrai défaut :
`mentionLancement` était écrite en trois littéraux, la promesse séparée de sa preuve.

À chaque fois l'intention était un **proxy plausible** du résultat, et à chaque fois elle
divergeait dans un cas que personne n'avait listé. Les deux du milieu sont les plus
instructives parce qu'elles n'ont rien cassé bruyamment : la sonde échouait en annonçant
« /merci : attendu 200 », un message qui ne désigne pas la cause ; et le semis de mesure
écrivait dans le mauvais espace en rapportant **« 0 série » sans se plaindre** — une
mesure fausse qui a l'air d'une mesure.

### Sa variante par effet de bord : un module qui AGIT au lieu d'OFFRIR

**Un module qui agit au chargement transforme toute lecture en écriture.** `version.mjs`
datait la source à l'import : deux imports de vérification ont livré deux versions en deux
secondes. Le lecteur demandait « que fait cette fonction ? », le module a répondu en le
faisant.

C'est la même erreur vue de l'autre bout : au lieu de prendre une intention pour un
résultat, le module prend une lecture pour un ordre. **Un script exporte, ou il agit — s'il
fait les deux, sa partie active vit derrière un test d'appel direct.**

Et une **consigne périmée** relève de la même famille : elle a l'autorité des vraies et
envoie chercher une panne qui n'existe plus — « `_ds/` n'est pas dans le dépôt » l'a fait,
des deux côtés de la conversation. La règle 5 vaut pour les consignes autant que pour le
code : une affirmation sur un fichier se relit sur le disque, qu'elle vienne d'un script,
d'un document, ou de quelqu'un qui cite le document.

**Quand le résultat est observable, observez-le.** Il l'est presque toujours : il suffit
d'accepter de le faire plus tard dans le code.

## Une garde d'étanchéité se pose à la frontière d'ÉCRITURE

C'est la leçon d'un aller-retour, et elle vaut au-delà de ce chantier. La première garde
vérifiait que le **générateur** n'écrit nulle part : elle passait, et la fuite était chez
le **consommateur** — `ecrireCouv` réécrivait la carte de couverture qu'il venait de lire,
séries d'exemple comprises. *La carte lue est celle qu'on réécrit.* Un producteur propre
ne prouve rien sur ce que le reste du programme fait de ce qu'il produit.

Le refus vit donc **au seul endroit par lequel une série entre dans le stockage** —
`garderSerie`, avant que la clé ne soit construite — et à la seconde frontière qu'est
`noterCouv`. Posé là, il vaut pour les trois espaces étanches (`.perso`, `.client`,
`.essai`) et les cinq comptes sans qu'on ait à les énumérer.

`scripts/app/etancheite-exemples.test.mjs` fait tourner **le vrai code** contre un faux
stockage, dans les trois espaces.

**La sonde d'idempotence** passe la migration **deux fois** et compare le stockage entier
entre les deux passages : le second ne doit rien retravailler, ni rebalayer les blocs de
bougies. Une troisième sonde pose la marque d'avance et vérifie que la migration n'entre
même pas — elle a fait son office une fois, elle ne surveille pas le stockage à vie.

> **Une garde doit échouer quand son HYPOTHÈSE cesse d'être vraie, pas seulement quand le
> code est faux.** Une garde qui perd sa prise doit tomber, pas passer au vert : sinon
> elle devient aveugle sans rougir, et c'est le pire mode de panne — on croit être
> couvert par une garde qui ne regarde plus rien.

**Toute garde qui protège une frontière se vérifie par MUTATION.** On l'écrit, puis on
casse le code exprès et on vérifie qu'elle tombe. Sans ça, on a écrit un commentaire
exécutable — c'est précisément pourquoi la garde du générateur passait pendant que la
couverture fuyait. Vérifié ici : désancrer la sélection des clés, retirer la lecture de la
marque, retirer le refus de `garderSerie`, ou décider du repli de l'indicateur avant le
relevé font tomber chacun le test correspondant.

### On interdit le code, pas le récit du code

C'est le piège de **toute garde qui lit du source**, et il s'est présenté trois fois en une
séance : l'analyseur de gabarit empilait un `<select>` cité dans un commentaire ; une garde
sur `calcRegime` échouait sur son propre commentaire, celui qui nomme `this.essai` pour
raconter l'erreur ; et la garde d'écriture du générateur tombait sur le nom d'une fonction
cité dans une note.

Le commentaire qui raconte une garde précédente la **nomme** — c'est son travail.

**LA CONCLUSION N'EST PAS « AJOUTER LE MOTIF SUIVANT ».** Le remède naïf est de dépouiller
les commentaires par expression régulière, puis d'en ajouter une à chaque échec : `//`,
puis `/* */`, puis `{/* */}`. Chaque langage apportera sa syntaxe, et la course est perdue
d'avance — on ne découvre le motif manquant qu'en tombant dessus.

**Une garde qui lit du source s'ancre sur une forme que la prose ne peut pas imiter** : une
structure, un marqueur explicite, un compte de nœuds. Pas un motif de commentaire.

Et on peut se tromper de forme une fois de plus. Un analyseur qui suivait les balises JSX
a paru être la réponse — jusqu'à ce qu'il faille lui apprendre qu'un `a < b` n'est pas une
balise, puis qu'un `=>` dans un attribut n'est pas la fin d'une balise. La même course, un
étage plus haut. **La forme retenue est la plus pauvre et la plus sûre : la chaîne de
caractères.** Un commentaire n'en est jamais une, quelle que soit sa syntaxe, et
reconnaître une chaîne ne demande de comprendre aucun langage.

> **Quand une garde demande un correctif de plus, changer de forme — pas ajouter un
> motif.** Le deuxième rustine est le signal ; le troisième est déjà trop tard.

### Une grille dont le nombre de colonnes porte du sens s'ÉCRIT, elle ne se calcule pas

Les quatre gestes MT5 se lisent **par rangs** : deux et deux. Confiés à `auto-fit`, ils ont
été placés en **trois** colonnes sur un écran large — le navigateur a fait son travail, il
ne pouvait pas savoir que le nombre portait du sens.

C'est la même famille que déléguer une décision à un motif : un algorithme de placement
optimise l'occupation, pas la lecture. Quand le compte de colonnes dit quelque chose, il
s'écrit (`repeat(2, …)`), et le repli en une colonne se demande explicitement par une
requête de média. `auto-fit` reste le bon outil quand le nombre n'a **pas** de sens — une
liste de cartes équivalentes.

**Et une forme pauvre a un angle mort qu'il faut garder, pas taire.** Le texte écrit en
clair entre deux balises JSX n'est pas une chaîne : les gardes ne le verraient pas, et
elles ne le diraient pas — le pire mode de panne. Une garde supplémentaire vérifie donc que
la copie commerciale vit bien dans des littéraux, et **échoue à la place des autres** le
jour où ce ne sera plus vrai.

**Une garde de convention doit ENSEIGNER la convention, pas signaler un écart.** Celle-là
impose une façon d'écrire : quelqu'un rendra `<p>Texte</p>` de bonne foi et la verra tomber
sans comprendre. Son message dit donc, en toutes lettres, ce qui vient d'arriver, *pourquoi
ça compte* — les six autres gardes deviendraient aveugles sans rougir — et *quoi écrire à
la place*. Une garde de convention dont le message n'enseigne rien est un piège pour le
prochain.

### Une phrase qui ENGAGE s'ancre sur un nom, pas sur son texte

C'est la conclusion de la règle 3 poussée d'un cran : une forme que **ni la prose ni le
balisage** ne peuvent défaire.

Une garde de proximité — *là où le tarif est promis gelé, la pièce qui le prouve doit être
nommée* — a été défaite deux fois sans mauvaise foi : par le **formatage**, un `<strong>`
au milieu fragmentant la phrase ; et par la **tournure**, « ne jamais remonter votre
tarif » ne correspondant pas au motif « ne remonte pas ». Les phrases qui engagent vivent
donc dans une **constante nommée** (`TARIF_GELE`, `mentionLancement`), que la garde lit par
son nom. Le rendu peut être mis en forme comme on veut autour.

**Avec un trou que l'ancrage par nom ouvre, et qu'il faut fermer** : recopier la phrase en
clair dans le rendu en laissant la constante derrière laisserait la garde verte sur un
texte que plus personne n'affiche. Elle vérifie donc aussi que la constante **est rendue**.

#### La fragmentation en littéraux est revenue deux fois — et la sortie est écrite d'avance

`parNom` lit **le premier littéral** de la déclaration, et rien de plus. Une phrase écrite
en morceaux concaténés lui livre donc son début et lui cache sa fin — c'est-à-dire, deux
fois sur deux, **la preuve, qui vient après la promesse** :

| | Ce que la garde lisait | Ce qui lui restait invisible |
|---|---|---|
| `mentionLancement` | « Tarif de lancement — garanti tant que… » | « …inscrit sur votre facture » |
| `SANS_COMPTE` | « …aucun compte à créer. » | « …il reste la facture et son registre » |

Les deux fois, le remède a été de **réécrire la phrase en un seul littéral** — aujourd'hui
avec un `// prettier-ignore`, parce que la ligne dépasse la largeur du formateur.

**Ça tient par discipline, et il faut le savoir.** Rien n'empêche quelqu'un de couper la
phrase de bonne foi : un formateur, une relecture, une insertion. **Si le cas revient une
troisième fois, la conclusion n'est pas un troisième `prettier-ignore` — c'est que `parNom`
doit concaténer les littéraux adjacents avant de lire.** C'est encore *changer de forme
plutôt qu'ajouter un motif* : la prise cesse d'être « le premier littéral » pour devenir
« tout ce que la déclaration produit », et la façon dont elle est coupée cesse d'exister
pour la garde.

On ne le fait pas avant, parce que deux occurrences se réparent moins cher qu'elles ne se
généralisent — mais le seuil est posé, et il se reconnaîtra.

### Une affirmation sur un fichier se relit avant d'être rapportée

Un commentaire a été annoncé comme écrit alors que le script qui le posait s'était arrêté
sur une substitution précédente **sans rien enregistrer**. Le rapport décrivait un fichier
qui n'existait pas.

« Les tests ne pouvaient pas l'attraper » n'est pas le bon diagnostic. **Une affirmation
sur le contenu d'un fichier est une affirmation sur le disque**, et elle se revérifie par
une lecture — jamais sur l'intention d'avoir écrit. Un script qui enchaîne des
substitutions et s'arrête au milieu ne laisse aucune trace : il faut relire ce qu'on
prétend avoir posé, avant de le dire.

### Quand l'explication doit contredire l'étiquette, c'est l'étiquette qui est le défaut

Une étiquette est **actionnable par construction**. « Périmée » veut dire *refais ton
export* ; sur une série d'exemple il n'y a pas d'action, et à partir du 27 octobre 2026 il
y en aurait eu dix, sur le premier écran, pour toujours — toute capture faite après cette
date montrant dix alertes que personne ne peut lever. Un premier correctif avait gardé le
mot en ajoutant « il n'y a rien à réexporter » juste en dessous : c'était le signal.

Le verdict devient donc **« fenêtre fixe »**, qui enseigne la même chose avec les dates à
côté — qu'une série a une fenêtre et qu'un scan s'arrête à sa fin. Ce qu'un export oublié a
de particulier, c'est qu'on peut le **refaire**, et c'est précisément ce que l'exemple ne
partage pas. Le seuil, lui, n'est **pas** exempté : `vieux` ne pilote que l'étiquette, une
phrase et deux encres — aucun comportement — donc c'est le verdict qui change, pas la
mesure. Les deux encres d'alerte suivent le verdict (`vieux && !estExemple(sel)`), sans
quoi les dix porteraient la couleur d'alerte sans porter le mot.

### Une marque temporaire est reliée à la condition qui la justifie

Une marque — « À COMPLÉTER », « à trancher », « provisoire » — dit *ne me prends pas pour
du texte relu*. Elle est vraie le jour où on l'écrit. Elle ne le reste que tant que la
raison de son existence tient, et **rien, dans son écriture, ne la fait tomber quand cette
raison disparaît**. Elle devient alors une consigne périmée : elle a l'autorité des vraies
et n'a plus de contenu.

C'est **la même famille que « `_ds/` n'est pas dans le dépôt »**, restée en place après que
le problème eut été réglé, et qui envoyait chercher une panne qui n'existait plus. La
différence tient en un mot : là c'était de la **vigilance** — quelqu'un devait penser à
relire —, ici c'est de la **construction**.

Le cas réel : l'accueil annonce quatorze jours de rétractation ; le chemin de paiement fait
renoncer l'acheteur à ce droit. Laquelle cède dépend d'un arbitrage juridique en cours. La
phrase de l'accueil est donc marquée par son nom — `RETRACTATION_A_TRANCHER` — comme le
libellé du renoncement l'est par son texte, `RENONCE_TXT = 'À COMPLÉTER…'`.

**Et les deux marques sont liées par une garde.** Elle lit `RENONCE_TXT` : tant qu'il porte
son « À COMPLÉTER », elle exige la marque de l'accueil ; **le jour où il ne le porte plus,
elle échoue** et redemande de trancher la phrase de l'accueil. La condition qui justifie la
marque est devenue la condition qui la tient en vie.

> **Une marque temporaire qu'aucune garde ne relie à sa condition est un commentaire
> permanent.** Écrire la marque est la moitié du geste ; écrire ce qui la retirera est
> l'autre.

Le piège que ça fermerait mal se voit dans la garde elle-même : la branche « la condition a
disparu » ne passe pas en silence, elle appelle `assert.fail` avec les deux issues
possibles écrites en toutes lettres. Une garde qui deviendrait vide se tairait ; celle-là
parle.

### La surface se découvre, elle ne s'énumère pas

Une garde a un **périmètre** : les fichiers qu'elle lit. Écrit à la main, ce périmètre est
une hypothèse — et comme elle n'est écrite nulle part, personne ne la révise. Le jour où
elle cesse d'être vraie, **la garde ne tombe pas : elle reste verte en ne regardant plus
qu'une partie de la surface.** C'est la règle 2 appliquée au périmètre plutôt qu'au code.

La même garde l'a fait **deux fois de suite**, et c'est ce qui rend le cas instructif :

| Périmètre | L'hypothèse, jamais écrite | Ce qui lui échappait |
|---|---|---|
| `tarifs.tsx` | « les promesses de vente vivent sur la page de vente » | l'accueil, qui garde un résumé des trois formules, promettait encore « rien n'est conservé sur vous, pas même votre achat » |
| `src/routes/` | « les promesses vivent dans les routes » | `SiteFooter`, dans `src/components/`, porte l'avertissement de risque — **rendu sur toutes les pages du site** |

**Corriger le premier périmètre en en écrivant un second, c'est déplacer le défaut, pas le
fermer** — exactement ce que `this.essai` → `aMoi` avait fait un chantier plus tôt. La
sortie n'est pas de remonter d'un cran : c'est de **retirer le périmètre**. Tout `src/` est
lu, récursivement. Le code moteur n'a aucune raison de porter une promesse commerciale, et
s'il finit par en porter une, c'est précisément ce qu'on veut voir.

**La preuve qu'il fallait est une mutation qui n'énumère rien** : on crée une route neuve
portant une promesse absolue, et la garde l'attrape sans que ce fichier ait été nommé nulle
part. Une garde par liste ne peut pas passer cette épreuve — c'est ce qui distingue une
découverte d'un périmètre simplement plus large.

**Et la découverte se garde elle-même.** Elle vérifie qu'elle atteint toujours les deux
fichiers d'où le défaut est venu ; si elle ne les atteint plus, c'est qu'un périmètre est
revenu, et elle le dit.

#### Et la surface déborde du dépôt — on déplace la source, on n'invente pas une garde

La découverte atteint tout ce qui est versionné. **Les phrases qui engagent le plus n'y
seront pas**, et elles se répartissent en deux familles que rien ne distingue du point de
vue d'une garde :

| | Ce que c'est | Ce qui les rend dangereuses |
|---|---|---|
| **La vente** | le libellé de l'article de chaque lien de paiement — celui qui porte le renoncement —, la description de la facture, le courriel de confirmation qui porte le lien de gestion | recopiées **une fois** dans un tableau de bord, puis plus jamais relues |
| **L'après-vente** | le renvoi d'une clé perdue, la réponse à une demande de remboursement | **réécrites à chaque demande**, à la main, sans version ni diff ni relecture |

**Le module a failli s'appeler « les textes de Revolut », et c'était nommer un LIEU au lieu
d'une PROPRIÉTÉ** — la moitié du sujet serait restée dehors. Ce qui les réunit, c'est que
chacun **engage** et qu'aucun n'est **atteignable par une garde**, parce qu'il est recopié à
la main. La seconde famille est la plus exposée des deux : une dérive y est invisible
jusqu'au jour où deux clients comparent ce qu'on leur a répondu.

**Le remède n'est pas une garde, c'est un déplacement de la source.** Ces textes sont
écrits dans le dépôt — `src/lib/textes-recopies.ts` — et le tableau de bord comme la boîte
de courrier n'en sont que le **miroir recopié**. Ils redeviennent alors lisibles comme
n'importe quelle autre phrase : ils sont dans `src/`, dans des chaînes, et les gardes les
voient sans qu'on ait rien à leur apprendre. Une divergence cesse d'être muette.

> **Ce qu'on ne peut pas vérifier, on fait en sorte qu'il n'y ait rien à inventer quand on
> le recopie.**

**Le module est vide, et il est marqué** (`EN_ATTENTE_DU_STATUT`) : la formule du
renoncement, la forme de la facture et l'identité du vendeur dépendent de l'arbitrage en
cours. Y écrire une formule plausible serait **pire que ne rien écrire** — elle aurait
l'autorité du dépôt sans avoir été relue, et serait recopiée telle quelle. **La case vide
est plus honnête que la case vraisemblable**, et un test la tient.

Quatre choses le tiennent :

- **un libellé par plan**, et les plans sont **lus dans l'application** : ajouter un
  cinquième plan là-bas fait tomber le test ici, en nommant la constante qui manque ;
- **tout texte déclaré est inscrit dans la liste à plat** — sinon il échappe à la marque et
  aux gardes, et partirait sans avoir été relu ;
- **la marque est reliée à sa condition** (règle 6) — tant que `RENONCE_TXT` porte son
  « À COMPLÉTER », les textes portent le leur ; le jour où il ne le porte plus, le test
  échoue, dit quoi remplir et où le recopier ;
- **le module est dans la surface découverte** : une promesse fausse écrite dedans est
  attrapée par les gardes ordinaires, sans que ce fichier soit nommé nulle part.

**Et la consigne de recopie ne vit qu'ici.** Elle n'est pas doublée dans PASSATION.md :
deux copies divergent, et la divergence est muette. Portée par la garde, elle arrive au
seul moment où elle sert — quand la marque tombe — et **elle ne peut pas être périmée,
puisqu'elle n'existe qu'au moment d'agir**.

**La partie énumérée est nommée comme telle.** Les quatre libellés d'article se dérivent ;
les quatre autres textes n'ont aucune source dont les dériver — chercher un mot dans la
prose de `/tarifs` pour conclure qu'un texte existe serait la règle 1 exactement. Ils sont
donc listés, et le test **écrit son propre angle mort** : un cinquième texte d'après-vente
naîtrait hors de portée de cette liste — voir la règle 9, qui est née là.

### Un nom de LIEU fixe un périmètre ; un nom de PROPRIÉTÉ en découvre un

C'est **la règle 7 vue depuis l'amont** — non plus au moment où l'on écrit le périmètre,
mais au moment où l'on **nomme la chose**. Et c'est elle qui explique pourquoi les deux
premières tentatives étaient des impasses : `tarifs.tsx` puis `src/routes/` sont **deux
lieux**. Un lieu se déplace ; il ne se généralise pas. Aucune des deux corrections ne
pouvait mener ailleurs qu'à un troisième lieu.

Le même mouvement s'est rejoué sur le module des textes hors dépôt, et **le nom était le
symptôme** : il a failli s'appeler « les textes de Revolut ». Revolut est un lieu, et la
moitié du sujet — l'après-vente, réécrite à la main dans une boîte de courrier — serait
restée dehors sans que rien ne le signale. Nommé par sa **propriété** — *ce qui engage et
qu'aucune garde n'atteint, parce que c'est recopié à la main* —, le module a immédiatement
désigné ce qui lui manquait.

> **Quand un nom désigne un endroit, demandez ce que les choses qui y vivent ont en
> commun.** La réponse est le vrai nom, et elle découvre ce que l'endroit cachait.

Le test se fait à voix haute : un nom de propriété permet de dire « ceci en est un / ceci
n'en est pas un » sans regarder où la chose se trouve. Un nom de lieu ne le permet jamais.

### Un angle mort qu'on ne peut pas fermer se déclare dans la garde elle-même

Les quatre libellés d'article se **dérivent** des plans de l'application : aucune liste,
donc aucune hypothèse. Les quatre autres textes n'ont **aucune source dont les dériver** —
la promesse de renvoi de clé vit en prose sur `/tarifs`, et chercher un mot dans de la
prose pour conclure qu'un texte existe serait la **règle 1** exactement, une intention pour
un résultat. Il fallait donc les énumérer, et une énumération a toujours un angle mort : un
cinquième texte d'après-vente naîtrait hors de portée.

**On ne pouvait pas le fermer sans commettre la règle 1. On l'a donc écrit** — dans le
commentaire de la garde, avec ce qu'il coûte et pourquoi il n'est pas refermable.

C'est la même exigence que l'angle mort déjà déclaré pour la forme « chaîne de caractères »
(le texte JSX nu, qu'une garde supplémentaire signale à la place des autres). Sans cette
déclaration, la prochaine personne lira une garde qui liste et croira lire une garde qui
découvre : **elle héritera d'une confiance qu'aucune mesure n'a méritée**, et c'est le pire
mode de panne — être couvert par une garde qui ne regarde plus ce qu'on croit.

> **Une garde qui énumère sans le dire finit par se lire comme une garde qui découvre.**

Et la conséquence pratique : un angle mort déclaré est un angle mort qui a une **date de
péremption**. Le jour où une source dont dériver apparaît, la note dit exactement quoi
remplacer. Un angle mort passé sous silence ne se rouvre jamais, parce que personne ne sait
qu'il est là.

## Le démarrage se chronomètre — mesurer à vide ne mesure personne

Un chargement lent a d'abord été attribué au **poids du fichier**. Mesuré : 2,46 Mo bruts,
**554 Ko transférés** en brotli (4,4×), et sur un navigateur VIDE le premier rendu tient
en 0,4 s — 4,9 s dans le pire cas fabriqué, processeur ÷6 **et** 3G. Mais un navigateur
vide n'est la condition de personne.

**Deux jalons, et ils ne se comportent pas pareil.**

| | page affichée | **données là** | restauration |
|---|---|---|---|
| CPU ÷1 · vide | 463 ms | 768 ms | 185 ms |
| CPU ÷1 · 2,8 Mo | 405 ms | 980 ms | 424 ms |
| CPU ÷1 · 13,5 Mo | 409 ms | 1 199 ms | 675 ms |
| CPU ÷4 · vide | 1 761 ms | 3 062 ms | 721 ms |
| CPU ÷4 · 2,8 Mo | 1 705 ms | 3 964 ms | 1 844 ms |
| CPU ÷4 · 13,5 Mo | 1 899 ms | 5 317 ms | 3 027 ms |

Le moment où la **page** s'affiche **ne dépend pas des données** — 405 ms à vide comme
avec 13,5 Mo. Donc tout chantier sur le poids du fichier ne touche que ce jalon-là, celui
qui est déjà rapide : **déshabiller le gabarit rapporte un cinquième** (mesuré : 2 433 →
1 938 Ko, rendu −20 % à ÷4, −23 % à ÷6) et ne peut rien pour l'autre.

Le moment où les **données** sont là grandit avec le stockage. Mais à **CPU ÷1 le pire cas
mesuré est 1,2 s** : sur une machine normale, rien de ce qui est mesuré ici n'approche dix
secondes. Les lignes ÷4 et ÷6 donnent la **loi d'échelle**, pas le cas de quelqu'un.

**Trois marques sont posées dans le produit**, et se lisent d'une ligne sans outil :

```js
performance.getEntriesByType('measure').filter((m) => m.name.startsWith('vena:'))
```

`reprendreSeries` (avec le nombre de séries), `lireScanComplet` et `reprendreScan` (avec
les lignes et les archives). **Deux marques pour le scan et non une**, parce que ce sont
deux coûts sans rapport : une lecture de base d'un côté, du calcul de fil principal de
l'autre — les confondre dirait « 4 s » sans dire s'il faut décoder plus tard ou calculer
autrement. Les sorties anticipées sont mesurées elles aussi : sans ça, le cas « rien en
mémoire » ne laisserait aucune trace, et c'est précisément celui auquel on compare.

**Avant tout nombre, savoir ce qui a été chronométré.** Le tableau ci-dessus écarte les
deux jalons de 405 ms à 5 317 ms — un facteur treize selon la définition. « Page blanche »
et « page visible, liste vide » mènent à deux chantiers différents.

## Aucun mot relatif sur une fenêtre figée

L'indicateur de régime, mesuré sur les séries d'exemple, travaille sur une fenêtre écrite
dans le générateur. « hier » y désigne la veille de **cette** date, pas la veille
d'aujourd'hui, et l'écart grandit à chaque jour qui passe : au bout de six mois, « hier »
annoncerait une veille vieille de six mois. Le régime porte donc `surExemples`, et les
trois chiffres de la veille comme la frise se datent **en toutes lettres** — « au 11
septembre 2026 » — pendant que `zBougie` ajoute « séries d'exemple, fenêtre fixe ». Sur
des bougies à soi, fraîches par construction, « hier » reste juste et se lit mieux.

**Deux « périmées » différentes, et il faut les distinguer.** Le filtre des 48 h de
`calcRegime` n'écarte JAMAIS les séries d'exemple : `tFin` est la dernière bougie du lot
mesuré, donc leur propre dernière bougie. Mais la fiche d'instrument porte un AUTRE test,
le seul date-contre-aujourd'hui du fichier — `Date.now() - cv.t1 > 45 jours`, dans le
producteur de la fiche — et **celui-là s'applique bien à elles** : elles passeront
« périmées » quarante-cinq jours après leur dernière bougie.

**Mais elles n'en portent pas le MOT** : le verdict est « fenêtre fixe » — voir « Quand
l'explication doit contredire l'étiquette » plus haut. Ce paragraphe a d'abord dit
l'inverse (« c'est voulu, ce n'est pas un défaut à corriger ») et il avait tort : le seuil
est bien voulu, l'étiquette ne l'était pas.

Ne pas confondre non plus avec les deux autres « périmé » du fichier : les « chiffres
périmés » (réglages changés, `perime()`) et `aScansPerimes` (un scan antérieur à une
livraison). **Trois mécanismes, un seul mot.**

## L'indicateur choisit son univers sur un RÉSULTAT, jamais sur une intention

Deux corrections successives au même endroit, et **la première déplaçait le défaut au lieu
de le fermer** — il portait même le nom.

| Garde | Ce qu'elle cassait |
|---|---|
| `this.essai` | Payer sans rien importer donnait l'univers réel, dont **aucune série n'est livrée** : zéro mesure, indicateur muet, pendant que le non-payant en voyait un. **Payer donnait moins.** |
| « ai-je des séries à moi » | Vrai dès **un** dépôt, même d'un instrument absent de la carte sectorielle. L'indicateur se taisait pour quelqu'un qui en avait un la veille. **Déposer donnait moins** — et la régression venait du geste qu'on lui demande de faire. |

Les deux demandaient une **intention** (as-tu payé, as-tu déposé) pour prédire un
**résultat** (y aura-t-il quelque chose à mesurer). On relève donc l'univers réel, et
**seulement s'il ne rend rien** on retombe sur les dix séries d'exemple, `surExemples` à
vrai. La page dit alors « séries d'exemple, fenêtre fixe » — ça se lit ; un écran vide ne
se lit pas.

C'est le même déplacement que celui de la garde d'étanchéité : **décider après, pas
avant.**

## Cet univers d'exemple monte, et l'application le dit

Sur ces trois ans, la médiane des dix familles finit à **+39 %**, quatre au-dessus de
+100 %. Un balayage y trouvera facilement un résultat flatteur, et l'utilisateur
l'attribuera à son idée.

**Ce n'est pas un défaut de conception, et ça ne se corrige pas dans les données.** La
dérive attendue par la table des régimes vaut 14,3 % × σ — négligeable devant σ√3. C'est un
tirage du facteur commun, pas un biais : rééquilibrer la table des dérives serait un remède
faux sur une cause inexistante, et rechoisir la graine un réglage du marché (voir plus
haut).

**Ce qui reste est un devoir de dire.** La phrase vit à deux endroits de l'interface, là où
les séries s'expliquent — le bandeau des données de démonstration et l'infobulle du filtre
de provenance. C'est l'éthique de l'outil : **il mesure, il ne promet pas.** Et c'est moins
cher que n'importe quelle correction de données.

**On n'écrit rien.** Elles vivent en mémoire, engendrées à la demande, une famille à la
fois. Jamais dans le stockage de l'utilisateur, jamais dans « Exporter mes données »,
jamais dans la jauge. C'est ce qui les distingue d'un compte : un compte porte des
données, celles-ci n'en sont pas.

Les dix familles, avec leur séance, leur volatilité annuelle, leur bêta au facteur macro
commun, et leurs frais — qui suivent l'instrument, jamais le compte :

| Ticker | Groupe | Séance | Vol./an | β | Spread | Swap/an |
|---|---|---|---|---|---|---|
| VX-EUR | Devises | 24 h, lun–ven | 8 % | 0,3 | 0,012 % | −1,2 % |
| VX-YEN | Devises | 24 h, lun–ven | 10 % | 0,4 | 0,013 % | −1,8 % |
| VX-40 | Indices | 14 h, lun–ven | 17 % | 0,9 | 0,018 % | −3,4 % |
| VX-500 | Indices | 23 h, lun–ven | 15 % | 1,0 | 0,015 % | −3,1 % |
| VX-2000 | Indices | 23 h, lun–ven | 22 % | 1,2 | 0,030 % | −3,8 % |
| VX-OR | Métaux | 23 h, lun–ven | 14 % | −0,2 | 0,022 % | −3,6 % |
| VX-CU | Métaux | 23 h, lun–ven | 22 % | 0,8 | 0,045 % | −4,2 % |
| VX-TECH | Actions | 7 h, jours de bourse | 40 % | 1,4 | 0,035 % | −2,8 % |
| VX-CONSO | Actions | 7 h, jours de bourse | 15 % | 0,6 | 0,030 % | −2,6 % |
| VX-BTC | Crypto | 24 h, 7 j | 60 % | 1,1 | 0,080 % | −8,0 % |

Identifiant machine en minuscules sans accent (`vx-eur`), libellé humain en capitales —
la règle du nom, appliquée aux séries. Le ticker est manifestement inventé : personne ne
doit confondre « VX-500 » avec un indice réel.

**Un facteur macro COMMUN**, pondéré par le bêta, plus un bruit propre. Sans lui, un
portefeuille de dix lignes paraîtrait dix fois moins risqué qu'il ne l'est. VX-OR porte
un bêta négatif pour qu'une famille aille à contre-courant.

**Cinq régimes au calendrier fixe** — calme haussier, choc baissier, reprise, range,
tendance accélérée. Datés et non tirés au hasard : un backtest doit avoir quelque chose
à trouver et quelque chose à perdre, et la même histoire pour tout le monde rend une
capture d'écran discutable.

**Ils arrivent en rampe, et pas le même jour pour tous.** Le profil de régime était un
escalier COMMUN : à une heure connue d'avance, la même pour tout le monde à jamais, la
volatilité des dix familles triplait d'un coup. Un balayage de sortie de volatilité —
l'usage même de l'outil — se serait déclenché là, sur une propriété du générateur.

Deux corrections, qui ne font pas la même chose. Le profil est **lissé** : convolution
exacte de l'escalier par un cosinus surélevé sur ±trois semaines, donc aucun angle ni au
début ni à la fin de la rampe — la volatilité met six semaines à tripler, ce qu'une crise
met réellement. Et son entrée est **dispersée** : chaque famille démarre sa rampe avec son
propre décalage, de zéro à soixante jours, tiré de sa graine. C'est la dispersion qui
compte. Un vrai marché a des crises communes ; il n'a pas le maximum absolu de variance de
chaque instrument le même jour du calendrier. Le facteur macro n'est pas touché : les
corrélations de rendements (0,54 entre les deux indices) et le contre-courant de VX-OR
restent entiers.

**La dérive d'un régime se mesure en volatilités, pas en pour-cent.** La table est écrite
pour une référence à 15 % de volatilité annuelle, et chaque famille l'encaisse au prorata
de la sienne. Appliquée telle quelle, elle retirait 35 % par an à une devise annoncée à
8 % comme à une action annoncée à 40 % : la devise creusait 3,9 fois sa volatilité
annuelle quand les neuf autres tenaient entre 0,7 et 2,6 fois la leur. Le calcul passe par
le **logarithme** — −35 % multipliés par quatre donneraient −140 %, un prix négatif, et
des `NaN` dans toute la série.

`scripts/app/series-exemple.test.mjs` fait tourner LE VRAI générateur, extrait de la
source. **La garde qui compte est l'absence d'artefact exploitable** : |autocorrélation|
des rendements horaires < 0,08 à tous les retards de 1 à 48. Un motif répétable donnerait
à un balayage un « signal » qui n'existe que dans le générateur, et le premier
utilisateur qui le voit croirait que son idée fonctionne. Les autres gardes protègent le
produit ; celle-ci protège l'honnêteté de la démonstration.

**Et la garde jumelle, sur la variance.** L'autocorrélation mesure une dépendance dans la
MOYENNE des rendements : un changement de VARIANCE lui est invisible — 0,049 passait
pendant que l'escalier était là. La volatilité annoncée ne le voit pas non plus, c'est une
moyenne sur trois ans. La onzième garde mesure donc, toutes les douze bougies, le rapport
des volatilités réalisées sur les 240 bougies suivantes et les 240 précédentes, et exige
que **les dates des dix maxima s'étalent sur au moins trente jours** — 47,8 aujourd'hui,
deux sur l'escalier. Elle porte sur l'étalement et non sur la hauteur du rapport : un
seuil sur la hauteur interdirait la fonction (un régime de volatilité existe, c'est voulu)
en croyant interdire le défaut (qu'il soit synchrone). 240 bougies valent dix jours pour
une devise et trente-quatre pour une action — cette fenêtre compare deux régimes entiers,
et reste au-dessus de 1,8 quel que soit le lissage, mesuré sur cinq largeurs de fondu.

**Ce défaut ne se voit pas à l'œil, et on a perdu un tour à essayer.** Des fondus de 15,
45 et 75 jours donnaient des tracés indiscernables ; on en avait conclu qu'il n'y avait
rien. C'était mesurer la mauvaise grandeur : deux courbes indiscernables peuvent porter
des profils de variance opposés. La forme n'est pas la statistique.

## Le test qui tient la convention

`scripts/app/nom-vena.test.mjs` échoue si l'ancien nom réapparaît ailleurs que dans la
migration et l'import de sauvegarde, si un accent se glisse dans un chemin, une clé ou un
nom de fichier, ou si un fichier du dépôt reprend l'ancien nom.
