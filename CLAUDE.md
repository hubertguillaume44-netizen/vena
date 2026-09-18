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
| **`SIV_trades_`**, **`SIV_NIV_`** (et le repli `SIVTRADE;` du même journal) | protocole MT5 | Étiquettes écrites par les robots **déjà compilés** et RELUES — le fichier par l'application, les objets par le robot. Les basculer remplirait `Common\Files` de deux orthographes du même fichier — le symptôme même qu'on corrige — et couperait la trace des robots en place. |

La marque d'ordre `SIV_<stamp>` et le préfixe de panneau `SIV_PAN_` ont été **dégelés**
(livraison 260914.2) sur une raison MESURÉE, pas déclarée : la marque n'est jamais relue
(les appariements passent tous par `POSITION_MAGIC`/`DEAL_MAGIC`, aucun
`POSITION_COMMENT` dans le robot) et le préfixe de panneau n'est relu que par le robot
qui l'écrit. Ils s'écrivent `VNA_<stamp>` et `VNA_PAN_`, avec un **balayage unique** de
l'ancien `SIV_PAN_` à `OnInit` — un terminal fermé brutalement laisse les objets de
l'ancien robot sous le panneau neuf. `scripts/mt5/nom-genere.test.mjs` remesure tout
cela sur le source émis, et tient l'exception des gelés.
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

## Une barre d'état ne promet que les tâches qu'elle sait poser

Elle disait « tout est à jour ». Elle sait poser SES tâches — relevé manquant, bougies
absentes, scan jamais lancé, estampille absente. Elle ne sait pas si les chiffres
enregistrés sont ceux que le moteur calcule aujourd'hui, et l'estampille ne le sait pas
non plus. La phrase a donc été lue comme une réponse à la question des chiffres périmés,
à côté d'une pastille qui disait le contraire.

C'est la famille de `netlify.toml` : **une règle dit où elle s'arrête, sinon elle se lit
comme une garantie générale.** Elle dit maintenant « aucune tâche en attente », qui est
vrai et qui ne promet que son domaine.

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

### Aucune famille n'est cotée sous 1 — et ce n'est pas au générateur de le corriger

Un rapport a nommé l'angle mort : 423 trades côté MT5 contre 104 côté Véna sur **le
premier instrument coté sous 1** jamais éprouvé (0,65 ; les cinq autres, tous d'accord à
quelques unités, sont à 96, 99, 1790, 29000). Mesuré ici : les dix familles vont de
**1,0850** (VX-EUR) à 61 200 (VX-BTC), et les huit références MT5 non plus ne descendent
sous 1. Un défaut qui ne se réveille que là avait toute la place pour vivre.

**Descendre une famille sous 1 paraissait la réponse, et c'est la mauvaise.** Changer un
niveau de prix change les bougies, donc périme les scans enregistrés de tout le monde, et
se paie en `vena-exemple-v3` — voir la graine gelée plus haut. *Le prix d'éprouver une
propriété du moteur n'a pas à être payé par les données des utilisateurs.* Une série de
banc coûte zéro octet chez eux.

**La propriété se garde donc directement**, dans `scripts/mt5/echelle-des-prix.test.mjs` :
tout ce que le moteur décide est en pourcentage — stop, objectif, plafond de spread —,
donc multiplier tous les prix par une constante ne peut pas changer le nombre de trades.
Trois échelles, 1790 / 96 / 0,65, spread tenu à 0,012 % du cours à chacune. **C'est la
CLASSE et non le cas** : elle attrape un défaut à 0,000012 aussi bien qu'à 0,65, et elle
n'a aucune liste d'instruments à tenir à jour (règle 8 appliquée à la garde).

**Elle n'a rien attrapé, et son statut le dit** : 130 trades aux trois échelles. Deux
choses en sortent quand même, et elles rétrécissent la recherche :

| Ce qui a été éprouvé | Ce que ça élimine |
|---|---|
| grain forcé à 2 décimales (mutation) : spread relevé 0,012 % → **12,02 %** sur l'instrument à 0,65 | le compte passe de 130 à 130. **Le plafond de spread ne peut pas produire un écart de comptes** — même faux d'un facteur mille |
| le stop, l'objectif et les paliers lus dans le source émis | `prix × (1 ± STOP_PCT/100)` : aucun point, aucun `Digits`, aucune constante absolue. Le refus « stop sous le minimum courtier » RETIRE des entrées, il n'en ajoute pas |

**Ce qu'aucune des deux ne couvre, et qui reste le suspect** : un CSV réel abîmé — prix
tronqués à l'export, colonne de spread en points d'un autre pas, bougies plates par
arrondi. Ces trois-là ne se distinguent pas d'une série saine par leur ÉCHELLE, donc
l'invariance ne les voit pas, et c'est écrit dans l'angle mort de la garde.

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

## Les seize règles, dans l'ordre où elles se servent

Elles viennent toutes d'un défaut réel de ce dépôt, et chacune est détaillée plus bas.

1. **Demander une intention pour prédire un résultat** — décider après, pas avant ; et
   une intention qui se TROUVAIT vraie devient fausse au premier chemin d'interruption
   qu'on ouvre, sans qu'aucune mutation ait pu l'annoncer.
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
   règle 7 vue depuis l'amont, au moment où l'on nomme ; et elle vaut pour les GARDES
   elles-mêmes : un correctif qui ferme une classe ne se garde pas sur un fichier.
9. **Un angle mort qu'on ne peut pas fermer se déclare dans la garde elle-même** — sinon la
   garde suivante hérite d'une confiance qu'elle n'a pas méritée ; et il se déclare **DANS
   l'affirmation, en tête**, jamais dans une note en dessous : entre les deux, c'est la
   voix confiante qu'on lit.
10. **Le cas VIDE est le plus faible des tests** — c'est celui où la moitié des bugs
    d'état ne peuvent pas se produire, et c'est celui qu'on écrit spontanément.
11. **Seul le rendu prouve que la valeur arrive** — une garde de source voit ce qui est
    envoyé, jamais ce qui est reçu ; et un avertissement de runtime est une mesure, pas
    du bruit.
12. **Un mot relatif n'est vrai que depuis un référentiel stable** — un élément engendré,
    figé ou collant n'a ni « depuis quand » ni « depuis où » ; et un CHEMIN relatif non
    plus, sous un document servi par réécriture.
13. **Une mutation se défait par le mécanisme qui l'a faite** — jamais par une
    restauration de dépôt, qui ne distingue pas la mutation du travail en cours.
14. **Une suppression se cartographie avant de se faire** — chaque garde accrochée à ce
    qui part a une fin dite : elle part avec le geste, se réancre sur ce qui reste, ou
    s'ancre sur l'absence. Jamais en silence — et la prose se cartographie DANS LES DEUX
    SENS : celle qui reste autour se relit, et celle qu'on **ajoute** pour expliquer le
    retrait est du contenu neuf, qui entre dans le champ des gardes.

15. **Une sonde dont l'échec est SILENCIEUX PAR CONCEPTION se garde ailleurs** — le
    silence peut être le bon choix, et il rend alors le défaut indistinguable du cas
    normal. Le témoin ne peut pas être son propre témoin.

16. **Une garde se juge aussi sur ses FAUX REFUS** — une garde correcte peut être
    annulée par son propre taux de faux positifs. Le coût d'un faux refus n'est pas
    une gêne : c'est la DÉSACTIVATION, et la désactivation est permanente quand le
    faux refus était ponctuel.

Les règles 6 à 9 sont nées le même jour, sur la même garde. Elles ferment par
**construction** ce que les cinq premières ne fermaient que par **vigilance** — ou, quand
rien ne peut le fermer, elles l'écrivent. La onzième est née de la panne la plus large du
dépôt : toutes les tables vides, tous les tests verts. La douzième unifie deux corrections
d'affichage nées à un jour d'écart — « hier » sur une fenêtre figée, « ci-dessous » depuis
une barre collante. La treizième est née d'un incident évité de justesse : un
`git checkout --` posé pour défaire une mutation aurait emporté le correctif même qu'elle
éprouvait. La quatorzième est née de l'élagage des trois familles mortes : six gardes
s'accrochaient à ce qui partait — dont une dont personne ne savait qu'elle empruntait sa
source à l'affaire supprimée — et chacune a eu une fin dite. La seizième est née en une
soirée : une garde livrée le matin refusait le cas NORMAL — le « # » que ce courtier met
devant ses indices — et l'utilisateur l'a désactivée le soir, comme il fallait pour
travailler. Elle a immédiatement laissé passer ce qu'elle venait d'interdire.

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

### Sa forme la plus coûteuse : le geste de RÉPARATION gaté sur l'intention

Les six premières occurrences faussaient un CHIFFRE. La huitième a fermé le seul
chemin de réparation qui existait, et personne ne l'a vue parce qu'elle ne produit
aucun message : un bouton absent ne se plaint pas.

« Remesurer les 12 lignes » a été livré gaté sur `(v._mv || 'e1') !== MOTEUR_V` —
l'estampille du moteur portée par la ligne. Mesuré au rendu, dans un navigateur, sur
le fichier livré :

| l'état de la ligne | ce que l'écran porte |
|---|---|
| sans `_mv` | « Remesurer les 3 lignes » + la tâche de la barre |
| `_mv = 'e4'` | **rien** |

Or `MOTEUR_V` vaut `e4` depuis le premier jour du dépôt et n'a **jamais** été tournée,
pendant que le moteur changeait de règle (4,00 R → 14,93 R sur la même configuration).
Toute ligne validée depuis la passation porte donc `e4` : le bouton était
**structurellement invisible sur le seul parc qui existe**, et les cinq gardes de
source qui le tenaient étaient vertes — elles prouvaient que la boucle, le refus et
l'écriture par ligne étaient justes, aucune ne pouvait voir la VALEUR du prédicat.

> **Gater un geste de réparation sur un prédicat de péremption, c'est refuser la
> réparation à ceux que le prédicat ne sait pas détecter.** Et c'est exactement eux
> qui en ont besoin : si le prédicat les voyait, ils ne seraient pas le cas difficile.

L'intention était « l'estampille est-elle vieille ? » — quelqu'un a-t-il pensé à
tourner la clé. Le résultat est « le chiffre a-t-il bougé ? », et il est **observable
par le geste lui-même** : il suffit de remesurer et de comparer. Le geste reprend
donc TOUTES les lignes et **nomme celles qui ont changé** ; le bilan rend aussi
« aucun chiffre n'a changé », parce qu'un zéro tu laisserait croire que rien n'a été
vérifié.

**Et le prédicat, lui, reste — pour ce qu'il sait dire.** Il compte les lignes SANS
estampille, ce qui est une information vraie, et il garde sa tâche de barre d'état,
qui peut se vider. Ce qu'on lui retire, c'est le droit d'éteindre le geste.

**La leçon d'outillage est la même que celle de la règle 11, un cran plus loin.** Le
banc de rendu partait d'un profil NEUF, sans ligne validée : il n'exerçait aucun des
deux états, et il est resté vert pendant toute la livraison. C'est la règle 10 —
le cas vide est celui où le défaut ne peut pas se produire — appliquée au banc qui
existe pour fermer la règle 11.

### Sa forme dormante : une intention qui se TROUVAIT vraie

Les six premières occurrences étaient des intentions qui se **trompaient** : on demandait
« a-t-il payé » pour « y a-t-il quelque chose à mesurer », et les deux divergeaient déjà.
La septième ne se trompait pas. `fusionCor` inscrivait `tirages: fin` — la CIBLE du
contrôle au lieu du compte réellement tiré — et c'était **juste**, aussi longtemps que
rien ne pouvait interrompre un calcul. Cible et compte joué coïncidaient par
construction ; l'intention était un proxy EXACT du résultat, pas un proxy plausible.

Elle est devenue fausse à la minute où un chemin d'arrêt a été ouvert dans la boucle de
tirage — dans le correctif de la même heure. Et `tirages` est le **dénominateur** de
`p = (au + 1) / (tirages + 1)` : 500 inscrit pour 120 tirages joués rend un p quatre
fois trop petit, sur une carte qui affirme « se distingue du hasard ».

> **Une garde de mutation ne peut pas attraper celle-là**, et c'est ce qui la distingue
> des six autres : elle ne devient fausse que sous un changement qui n'existait pas
> encore le jour où on l'aurait écrite. Muter le code de la veille l'aurait trouvée
> correcte, parce qu'elle l'était.

Le signal disponible n'est donc pas une garde, c'est une **question au moment d'ouvrir
le chemin** : *quelles valeurs cessent d'être vraies parce qu'elles ne pouvaient pas
être fausses ?* Un dénominateur de p en est une ; un compte de blocs écrits en est une
autre. Ce sont les valeurs qu'on a laissé dériver d'une BORNE (`fin`, `total`, `cible`)
parce que la borne était toujours atteinte — et un chemin d'interruption, de reprise ou
de repli est exactement ce qui retire cette garantie.

**L'intervalle est le bon indicateur, et il était d'une heure.** La valeur n'a jamais
menti dans une version livrée : elle est partie dans le commit qui l'activait. Mais ce
délai était celui d'une relecture, pas celui d'une garde — et une relecture ne se
reproduit pas à la demande.

## Une garde se juge aussi sur ses faux refus

**Les quinze premières règles parlent de gardes qui ne voient pas assez.** Celle-ci parle
d'une garde qui voyait juste et qui a été **annulée** — non par un défaut de son critère,
mais par son taux de faux refus. Elle a vécu une journée.

> **Le coût d'un faux refus n'est pas une gêne, c'est la DÉSACTIVATION.** Et la
> désactivation est permanente quand le faux refus était ponctuel. Une garde qu'il faut
> désactiver pour travailler ne garde rien — et elle est pire que pas de garde, parce
> qu'on la croit là.

Le refus comparait les chaînes **brutes**. Chez ce courtier, les indices s'écrivent
`#HongKong50` là où la mesure porte `HongKong50` : le refus tombait sur **le même
instrument**, à chaque lancement. La seule sortie offerte était `InpSymboleLibre`, qui
désarme la garde **entièrement** — et le soir même, elle a laissé passer un robot
HongKong50 sur les données d'un autre instrument. Exactement ce qu'elle venait d'être
écrite pour empêcher.

C'est une parente de la règle 1 : on avait demandé « les deux chaînes sont-elles
identiques ? » (une intention — *le courtier écrit-il le nom comme nous ?*) pour décider
« est-ce le même instrument ? » (le résultat). La comparaison porte donc sur le **noyau** :
capitales, tout caractère non alphanumérique retiré, et l'un des deux noms doit être
**préfixe ou suffixe** de l'autre. Aucune liste de courtiers, aucun tableau de préfixes
connus — `#` et `.` disparaissent d'eux-mêmes, `GOLD.r` garde `GOLD` en préfixe,
`FX_EURUSD` garde `EURUSD` en suffixe.

**La règle est mesurée, pas déclarée.** `robot-tient-son-symbole.test.mjs` porte un port
fidèle et onze cas nommés — dont les deux accidents réels, qui doivent refuser — et un
test distinct vérifie que le source émis **appelle** la règle, sans quoi le port
mesurerait une règle que personne n'exécute. L'angle mort est écrit : `GOLD` contre
`GOLDMINI` passe ; ils partagent leurs prix et le dimensionnement lit la taille de
contrat du symbole courant, donc le cas est supportable — il n'est pas prouvé inoffensif,
et chaque acceptation non exacte s'imprime au journal avec les deux noms.

### Et le geste qui en sort : une propriété, pas une énumération

La question à poser en écrivant une garde n'est donc plus seulement « qu'est-ce qu'elle
laisse passer ? » mais **« sur quels cas légitimes va-t-elle tomber ? »** — et si la
réponse est « le cas courant chez un utilisateur », la garde est déjà morte. Une porte de
sortie n'y suffit pas : c'est elle qu'on prendra, une fois, définitivement.

La sortie est la même que pour la règle 8 : remplacer l'égalité littérale par la
**propriété** qu'on voulait vraiment tester. Ici, « les deux chaînes sont-elles
identiques ? » est devenu « les deux noms désignent-ils le même instrument ? », et la
porte `InpSymboleLibre` est redevenue ce qu'elle aurait toujours dû être : un dernier
recours que personne n'a de raison d'actionner.

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

**Troisième occurrence, et c'est elle qui donne son nom à la figure : `deposes`.** Le
correctif d'un chemin — `reprendreSeries` cessant d'emporter les dix séries d'exemple —
laissait **cinq autres écritures** libres de refaire la même faute, et l'une d'elles la
faisait déjà : une purge de place remettait `deposes` à vide, alors que ces séries ne sont
écrites nulle part et ne libèrent pas un octet. La garde écrite pour l'occasion, « les
exemples survivent à une série à soi », éprouvait **le chemin réparé**.

> **Une garde sur un chemin ferme un CAS ; une porte unique ferme la CLASSE.**

Les six écritures passent donc par `deposesApres`, et la porte **décide sur un résultat** :
elle ne demande à personne « faut-il garder les exemples ? » — un drapeau rouvrirait le trou
au premier appelant qui l'oublie — elle regarde ce qui est vrai, les séries d'exemple
effectivement posées dans `this.dfs`. `poserExemples` les y met avant d'appeler ;
`retirerExemples` les en retire avant d'appeler ; les quatre autres n'ont rien à savoir.

La seule écriture qui ne passe pas par elle, `ETAT_DERIVE` au changement de compte, est
**déclarée comme exception et vérifiée** : le test lit que `reprendreSeries()` la suit et
repose les dix, plutôt que de le croire.

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

### La mutation ÉPROUVE ; ce qui CONSTRUIT, c'est « la borne coupe, puis on vérifie ce qu'elle a coupé »

Ce n'est pas une règle de plus : c'est la règle 2 vue depuis l'écriture au lieu de la
vérification. La mutation dit *après coup* qu'une garde est aveugle ; cette formule-ci
l'empêche *pendant* qu'on l'écrit.

**Trois formes de garde aveugle en un seul chantier, et c'est ce qui les réunit qui
compte** — dans les trois, une assertion passait sans que rien ne soit regardé :

| La forme | Comment elle devient aveugle | Ce qui la ferme |
|---|---|---|
| **la tranche à −1** | `indexOf` rend −1, qui est une borne VALIDE pour `slice` : le motif disparaît et la tranche s'élargit en silence, jusqu'au fichier entier | `borne()`/`borneArriere()`, qui **jettent** en nommant le motif perdu |
| **la garde vacue** | son sujet a été supprimé ; elle reste verte en ne gardant plus rien | la règle 14 : partir avec le geste, se réancrer, ou s'ancrer sur l'absence |
| **l'assertion creuse** | sa condition ne MORD pas sur le décor : elle passe avec ou sans le code qu'elle vérifie | prouver que la condition mord, **avant** de vérifier son effet |

La troisième est la plus récente, et elle est passée sous mutation. Elle bornait une
découpe au 1ᵉʳ janvier 2021 ; l'amorce de 400 jours reculait la borne à novembre 2019,
donc **aucune bougie n'était coupée** et l'assertion sur ce qui restait passait dans les
deux sens. Corrigée sur une borne de fin, elle exige maintenant d'abord que la coupe ait
lieu — `d3.ecT.length > 0 && d3.ecT.length < df.ecT.length` — et seulement ensuite que ce
qui reste soit du bon côté.

> **La borne coupe, PUIS on vérifie ce qu'elle a coupé.** Et l'énoncé vaut au-delà des
> dates : toute assertion qui décrit l'effet d'une condition doit d'abord établir que la
> condition s'est appliquée. Sans ce premier temps, on mesure le décor.

**Le dépôt en portait déjà des instances sans les avoir reliées** — c'est en les relisant
ensemble qu'on voit qu'elles disent une seule chose :

- `echelle-des-prix` exige `n > 50` trades à chaque échelle avant de comparer les
  comptes — « une garde qui compte zéro ne garde rien » ;
- la tournée des gestes tombe sous quinze éléments cliquables par vue, plutôt que de
  laisser passer un zéro qui n'a rien regardé ;
- `sautesVues` est la prise du zéro de `sautesSortie`, et `cachesVues` celle de
  `cachesStop` — un compteur à zéro sans dénominateur a deux sens ;
- `cachesDispo` distingue « mesuré à zéro » de « pas mesurable sur cette série ».

Les quatre premières vivent dans des tests, la dernière dans le produit. **C'est la même
exigence des deux côtés, et c'est ce qui la rend générale** : une sonde prouve sa prise
avant de rapporter, qu'elle rapporte à un test ou à un utilisateur.

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

#### Deuxième compteur de délimiteurs écrit à la main, deuxième échec

L'analyseur JSX avait déjà montré la limite : il fallait lui apprendre qu'un `a < b`
n'est pas une balise, puis qu'un `=>` dans un attribut n'est pas une fin de balise.
`bornes-de-tranche` a refait la même chose avec les parenthèses — et cette fois le coût
n'était pas un motif de plus, c'était un **faux refus sur le cas normal**.

Son repérage comptait les `(` et les `)` pour délimiter les arguments d'un `slice(`.
Il comptait aussi ceux qui vivent **dans une chaîne**. La borne
`borne(COMPARER, "export function euroParR(")` — parfaitement correcte, et la forme même
que la garde recommande — porte une parenthèse ouvrante non refermée dans un littéral :
le compteur partait en vrille, avalait les lignes suivantes, y trouvait un `indexOf` sans
rapport, et **accusait la convention qu'il existe pour imposer**.

> **Un compteur de délimiteurs écrit à la main ne sait pas ce qu'est une chaîne, et la
> prochaine chaîne portera le délimiteur.** C'est la règle 3 retournée : la garde
> échouait là où la prose ne l'avait pas trompée — c'est du CODE qui l'a trompée, parce
> qu'elle n'en comprenait pas assez.

La sortie est celle qui est écrite depuis le début — **changer de forme, pas ajouter un
motif** —, et le seuil de la règle 16 la rendait non négociable : une garde qui refuse la
forme qu'elle prescrit se fait désactiver. La prise est désormais l'**AST** (espree),
celle de `portee-script` et de `refus-export-parle` : un appel `.slice(…)` dont un
argument contient un appel `.indexOf(…)`. Une parenthèse dans une chaîne n'existe plus
pour elle, et il n'y a plus de grammaire à réapprendre au coup par coup — l'analyseur la
connaît déjà. Vérifié par mutation : une borne remise en `indexOf` en ligne la fait
tomber, en nommant le fichier et la ligne.

**Et elle ne saute pas quand elle ne sait pas lire.** Un fichier qu'espree refuse lève,
avec la raison — le taire la rendrait aveugle sur ce fichier sans rougir, ce qui est
exactement le mode de panne que ce fichier existe pour interdire. Un shebang devient un
commentaire de **même longueur**, pour que les numéros de ligne rapportés restent ceux du
fichier.

#### Cinq morsures plus tard : le point commun n'est pas le motif, c'est la PREMIÈRE OCCURRENCE

Le seuil disait « le deuxième rustine est le signal » — on en est à la cinquième morsure,
et chaque remède a été local : dépouiller `//`, puis `/* */`, puis `{/* */}`, changer de
forme pour la chaîne de caractères, puis réancrer la garde du manifeste. Relues ensemble,
elles partagent autre chose que la syntaxe des commentaires : **quatre sur cinq
cherchaient « la première apparition de X »** — et la première apparition de X est
presque toujours dans le commentaire qui explique X, **parce qu'un correctif s'explique
au-dessus du code qu'il corrige**. La note de `champsSession` citait `'familleFiltre'`
qu'elle venait de retirer ; le commentaire de `publier-solo` citait « 260913.x » au-dessus
de l'écriture du manifeste. La prose précède le code par construction : chercher la
première occurrence, c'est chercher la prose.

> **Une garde qui lit du source s'ancre sur ce qui AGIT — un appel, une affectation, une
> déclaration — jamais sur un nom de fichier ou une chaîne qui peut vivre dans de la
> prose.** `writeFileSync(path.join(path.dirname(SORTIE), "version.json")` ne peut pas
> apparaître dans une explication sans être du code ; `'version.json'` seul, si.

Ce n'est pas une règle de plus, c'est le critère d'ancrage de celle-ci : la forme que la
prose ne peut pas imiter était déjà l'énoncé — un appel complet, avec ses parenthèses et
ses arguments, est la plus courante de ces formes, et la plus courte à écrire.

**Sixième morsure, et le critère d'ancrage ne pouvait pas la couvrir** : la découverte de
`nom-vena` a attrapé `nom-genere.test.mjs` — la garde qui cherche l'ancien nom dans le
source émis, et qui doit donc l'épeler pour le chercher. La prose n'était pas un
commentaire, c'était le **motif de recherche lui-même**. C'est la limite de la règle :
**une garde qui cherche une chaîne interdite s'exclut elle-même de la découverte,
explicitement et avec sa raison** — comme `stockage-plein.test.mjs`, qui sème l'ancien
préfixe pour éprouver la migration. L'exclusion nominative n'est pas un périmètre qui
revient : elle ne retire qu'un fichier dont l'interdit est le sujet.

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

#### Une découverte lit ce qui EST son sujet, pas un voisin commode

C'est une précision au critère de la règle 7, de la même forme que le critère d'ancrage
ajouté à la règle 3 : la règle était juste, c'est le **point d'attache** qui manquait de
critère. La dérivation des libellés d'article découvrait bien — aucune liste, un
cinquième plan attrapé tout seul — mais elle lisait `const LIENS`, une structure qui
appartenait à **l'achat**, pas à la facturation. Une source empruntée à une autre
affaire : supprimer l'achat lui a retiré ses dents **sans qu'une ligne d'énumération
n'ait bougé**.

> **Une découverte qui lit un voisin commode hérite silencieusement de la durée de vie
> de ce voisin.**

Et la garde a eu la bonne fin — elle est **tombée** au moment où son hypothèse a cessé
d'être vraie, au lieu de passer au vert sur du vide : c'est la démonstration que les
règles 2 et 7 marchent ensemble. Réancrée depuis sur ce qui EST son sujet : les durées
payantes viennent de ce qui vend (`/tarifs`), les phases de la matrice du module des
textes — leur seule source restante, l'angle mort déclaré sur place.

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

#### Et la règle 8 s'applique aux GARDES : une classe fermée, une garde de classe

Deux fois dans la même journée, un correctif a fermé une **classe** et sa garde a été
posée sur un **lieu** :

| Le correctif, et ce qu'il fermait | La garde, et ce qu'elle gardait | Ce qui est resté ouvert |
|---|---|---|
| « aucun `ArrayFree` suivi d'un Copy* » | « les `.mq5` de la racine » | le robot, qui naît d'un générateur |
| « aucune attente qui se répète à l'identique » | `Export_H1_Vena` | le cache d'agrégation du robot |

Les deux trous ont été trouvés par l'utilisateur, des heures plus tard, sur des pannes
coûteuses — un terminal mort, puis un cœur saturé pendant deux heures. Et les deux
auraient été fermés par le même geste, au moment du **premier** correctif.

> **Quand un correctif ferme une classe, la garde se pose sur la CLASSE — pas sur le
> fichier où elle est apparue.**

**Le signal est disponible au moment où l'on écrit la garde, et il tient en une
question : le correctif a-t-il un nom de classe ?** « Aucun `ArrayFree` », « aucune
boucle sans borne » sont des noms de classe. Alors la garde ne peut pas avoir un nom de
lieu — « les fichiers de la racine », « ce script-ci ». C'est la règle 8 retournée vers
l'outillage : on ne demande plus seulement « ce nom désigne-t-il un endroit ? » de ce
qu'on garde, mais de **la garde elle-même**.

La surface s'écrit alors une fois et se partage : `scripts/mt5/sources-mql5.mjs` rend
*tout source MQL5 que l'utilisateur peut faire tourner* — les scripts **livrés**,
découverts, et le robot **produit**, généré pour l'occasion. Le piège était qu'une
seule des deux familles a la forme d'un fichier : une découverte par extension ne
pouvait pas voir l'autre, et elle ne le disait pas.

**ET LA RÈGLE JOUE DANS LES DEUX SENS, ce qui s'est vérifié tout de suite.** Élargir la
surface a fait tomber une troisième garde du même fichier — celle qui interdit une
plage inversée (`t1 - 1 < t0`) — sur deux appels parfaitement sains du robot, qui lit
par NOMBRE et non par plage. Cet invariant-là n'est pas une classe : il ne vaut que
pour les lectures par plage. **Un invariant de lieu garde son lieu** — mais on ne le dit
pas non plus par un nom de fichier : on le dit par la propriété qui le rend applicable
(« l'appel passe-t-il deux dates ? »). Sinon on répare une énumération par une autre.

**Quand la classe ne se prouve pas par un critère, elle se tient par un REGISTRE.**
« Borné » n'est pas une propriété du texte : l'attente fautive bouclait sur
`while(GetTickCount() < fin && !IsStopped())`, bornée par le temps et défectueuse quand
même. `boucles-mql5.test.mjs` inscrit donc **chaque** boucle de la surface avec la
raison pour laquelle elle se termine, écrite en toutes lettres, et échoue **dans les
deux sens** — une boucle neuve jusqu'à ce que quelqu'un dise ce qui l'arrête, une entrée
dont la boucle a disparu pour que le registre ne devienne pas une liste de tolérances.
Son angle mort est déclaré : il relève les `while`, et la pire des deux pannes n'avait
**aucune boucle** — c'était une répétition par appel, tenue à part sur l'invariant
« la tentative est mémorisée ».

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

#### La déclaration vit EN TÊTE de l'affirmation, pas en note sous elle

La règle ci-dessus a été appliquée à la lettre et n'a rien empêché. `init-sans-crash`
portait, dans sa note de règle 9 : « elle ne PROUVE pas le diagnostic et ne le prétend
pas ». Trois paragraphes plus haut, elle affirmait « CE QUI RESTE EST UNE INCOHÉRENCE
ENTRE DEUX FONCTIONS DU MÊME FICHIER ». La cause était fausse, la réserve était juste, et
c'est la cause qu'on a lue — pendant trois jours, jusqu'à ce que le journal du terminal
dise « disque plein ».

> **Une réserve placée sous une affirmation ne la tempère pas : elle la suit.** Ce qu'on
> retient d'un bloc de prose, c'est sa première phrase et son ton, pas sa dernière
> nuance. Déclarer l'angle mort quelque part dans la garde satisfait la règle 9 et rate
> ce qu'elle voulait.

**La forme retenue est une ligne de STATUT, première ligne du fichier, avant le titre.**
Deux valeurs, et elles se lisent d'un coup d'œil :

| La ligne | Ce qu'elle promet |
|---|---|
| `STATUT · CAUSE ÉTABLIE, MESURÉE` | la panne a été observée avant d'être corrigée — invariant ET cause tiennent |
| `STATUT · CORRECTIF DE FORME, CAUSE NON ÉTABLIE` | l'invariant vaut par lui-même ; la cause qu'on lui prêtait n'est pas prouvée |
| `STATUT · PANNE OBSERVÉE, MÉCANISME NON PROUVÉ` | la panne est un fait mesuré ; l'explication qu'on en donne est une hypothèse |
| `STATUT · INSTRUMENTATION, AUCUNE CAUSE PRÉTENDUE` | ça ne répare rien et n'explique rien — ça rend quelque chose décidable |

Les gardes du chantier MQL5 la portent, et c'est là qu'elle se lit le mieux :
`attente-sans-fin` et `boucles-mql5` en établie, `init-sans-crash` en forme,
`lecture-sans-crash` en panne observée, les six jalons du robot en instrumentation. Le
distinguo était dans les têtes de trois personnes ; il est dans les fichiers.

**LA TROISIÈME VALEUR EST NÉE EN APPLIQUANT LES DEUX PREMIÈRES**, et c'est la meilleure
preuve qu'il fallait l'écrire. Le schéma était binaire — mesurée ou devinée. En marquant
`lecture-sans-crash`, aucune des deux ne convenait : la mort du terminal est un FAIT
(journal de l'utilisateur, access violation sur US2000.cash) et c'est le MÉCANISME
(ArrayFree laisse un tampon que CopyRates réutilise) qui reste une hypothèse. La classer
« établie » aurait promis un mécanisme prouvé ; « correctif de forme » aurait nié une
panne réelle. Un schéma qu'on applique découvre ses manques ; un schéma qu'on énonce ne
les découvre jamais.

**LA PORTÉE S'ARRÊTE ICI, ET C'EST DÉLIBÉRÉ.** Les autres gardes du dépôt ne portent pas
de statut. Le leur poser demanderait de reconstituer de mémoire comment chacune est née —
c'est-à-dire d'écrire dans le dépôt des affirmations qu'aucune mesure ne soutient, ce que
la règle 5 interdit précisément. **Une ligne de statut fausse est pire que pas de ligne
du tout** : elle a la forme d'une provenance vérifiée. La convention s'applique donc là où
la distinction a été gagnée, et à toute garde neuve, dont la provenance est connue au
moment où on l'écrit.

**ELLE NE TENAIT QUE PAR DISCIPLINE, ET LE SEUIL ÉCRIT D'AVANCE A ÉTÉ FRANCHI.** Aucune
garde ne vérifiait qu'un statut est présent ni qu'il est honnête : une ligne de statut est
de la prose, et la règle 3 interdit d'ancrer une garde sur de la prose. Le seuil était
posé : *le jour où une garde livrée portera un statut « cause établie » sur un diagnostic
qui se révèle faux.* Ce jour est le 18 septembre 2026.

`remesurer-les-lignes` a été livré portant « CAUSE ÉTABLIE, MESURÉE — le compte vient de
l'utilisateur : douze lignes sur douze portaient un chiffre antérieur à la règle actuelle
du moteur ». **Le geste posé dans le même commit a réfuté sa propre justification** :
« 12 lignes remesurées · aucun chiffre n'a changé. » Les lignes n'étaient pas périmées ;
le symptôme venait d'un autre défaut, fermé la veille.

**Et la contradiction était DANS la ligne.** Elle dit « MESURÉE » et, dans la même phrase,
« le compte vient de l'utilisateur ». Ce n'est pas un mensonge, c'est une **omission** : le
mot a deux sens — mesurée *ici*, mesurée *quelque part* — et rien n'obligeait à choisir.

La prise construite est donc celle-là, et rien de plus : **`MESURÉE` doit être qualifiée.**
Le statut dit `DANS LE DÉPÔT` — et un test peut relire la trace — ou il dit `RAPPORTÉ` — et
personne ne le prendra pour une mesure reproductible. Jamais `MESURÉE` nue. Les deux
coexistent dans le cas courant : un symptôme rapporté dont la cause est relue dans le
source. `scripts/statut-dit-sa-provenance.test.mjs` découvre tous les statuts du dépôt et
échoue sur chaque « cause établie » sans provenance ; les douze qui existaient ont été
qualifiés depuis leur propre prose, pas de mémoire.

> **Elle rend l'OMISSION impossible et laisse le MENSONGE possible.** C'est écrit dans sa
> tête, parce que c'est exactement ce qu'elle ne ferme pas — et une omission suffisait à
> produire le cas fondateur. Son coût en faux refus est nul (règle 16) : la réponse
> attendue est toujours l'un des deux mots, et le message dit lequel écrire.

**Et elle s'est fait mordre par la règle 3 à sa PREMIÈRE EXÉCUTION.** Elle cherchait
« CAUSE ÉTABLIE » dans tout le paragraphe et a accusé `remesurer-les-lignes`, dont le
statut est désormais INSTRUMENTATION et dont la prose **raconte** le statut réfuté — c'est
même le sujet du fichier. Septième morsure, et la sortie était déjà écrite : la ligne
`// STATUT · …` est ce qui **agit**, le paragraphe qui la suit est du récit. La classe se
lit donc sur la ligne, la provenance dans tout le paragraphe.

### Le cas VIDE est le plus faible des tests, et c'est celui qu'on écrit

`reprendreSeries` remplaçait `deposes` par le seul index du compte et emportait les dix
séries d'exemple qu'elle venait d'y mettre. Le défaut a vécu des mois sans se montrer, pour
une raison qui vaut mieux qu'une anecdote : **à zéro série, la sortie anticipée passe AVANT
l'écriture fautive.** Le seul cas éprouvé était celui où le bug ne peut pas se produire.

Ce n'est pas un hasard de ce fichier-là. **Un état vide est, par construction, celui où la
moitié des bugs d'état ne peuvent pas arriver** : pas de fusion, pas de remplacement, pas de
collision, pas d'ordre entre deux écritures. Et c'est le test qu'on écrit spontanément —
c'est le plus court à mettre en place, il ne demande aucun semis, et il passe du premier
coup. Tout y invite.

> **Un test à vide prouve qu'un chemin s'exécute. Il ne prouve presque rien sur ce qu'il
> fait aux données qui étaient déjà là.**

Le seuil, ici, n'était même pas 55 séries : **une** suffisait. Une éprouve peuplée ne
demande donc pas un gros semis — elle demande qu'il y ait **un** élément d'avance, ce qui
est le minimum pour qu'une fusion, un remplacement ou un ordre existent.

La même forme se relit dans « mesurer à vide ne mesure personne » plus bas : un navigateur
vide n'est la condition de personne, et un état vide n'est pas le cas d'usage. Les deux
disent qu'un décor sans contenu ne mesure que le décor.

### Seul le rendu prouve que la valeur arrive — et le runtime le criait déjà

Chaque table de données de l'application a rendu **une rangée vide, pour tout le monde,
pendant des semaines** — instruments, fiche des courtiers, scans, journal. Le producteur
calculait juste, le gabarit était écrit juste, et 436 tests de source passaient au vert :
**aucun d'eux ne pouvait voir que la valeur ne rejoignait jamais son trou.** Un test qui
lit le code écrit sait ce qui est envoyé ; seul le rendu sait ce qui est reçu.

La chaîne causale, parce qu'elle resservira :

1. l'analyseur HTML **repose hors de la table** tout élément qui n'est pas de la famille
   table — `<sc-for>` en tête. Vérifié d'une ligne : `<table><tbody><sc-for><tr>…`
   devient `<sc-for></sc-for><table><tbody><tr>…` — la boucle vidée, la rangée-gabarit
   orpheline dans le tbody, ses trous à jamais irrésolubles ;
2. le runtime porte la parade (`RAW_WRAP` renomme les balises de table pour traverser
   l'analyse) — mais elle ne protège que ce qui n'est pas **déjà** abîmé, et `boot()` lit
   `dc.innerHTML`, le DOM après dégâts ;
3. le chemin de réparation — relire le texte brut — vit derrière `if (!window.__resources)`,
   et **le vendorage de React rend cette condition toujours fausse**. Une intention (« les
   ressources sont fournies ») lue comme un résultat (« le gabarit du DOM est sain ») : la
   règle 1, dans le runtime.

**Le correctif vit dans la source** : les tables du gabarit s'écrivent en `sc-raw-table`,
`sc-raw-tr`, `sc-raw-td`… — l'analyseur ne les connaît pas, donc ne les déplace pas, et
`RAW_UNWRAP` rend les vrais éléments, même CSS, même comportement. Deux gardes le
tiennent : l'interdiction de balise de table réelle dans le gabarit (le geste, avec le
numéro de ligne), et **la garde de rendu** — `rendu-gabarit.test.mjs` charge le vrai
fichier livré dans un vrai navigateur et échoue sur tout `never resolved`, avec le nom du
trou. Elle exige Chromium et tombe s'il manque : une garde qui saute en silence est une
garde aveugle sans rougir.

Trois leçons, dans l'ordre où elles ont coûté :

- **Le runtime le disait, sept fois, à chaque chargement, chez chaque utilisateur** —
  `{{ ir.nom }} never resolved`, en console. Un avertissement de runtime est une mesure,
  pas du bruit : celle-là désignait le trou par son nom depuis le premier jour.
- **Une dette déclarée sans sa gravité se classe toute seule en bas de la pile.** Le
  cliquet de `gabarit-contenu-restreint` avait MESURÉ les 37 balises reposées hors de
  leur table et écrit « à traiter en une passe dédiée ». « Dix-sept tableaux » se lisait
  comme du cosmétique ; ça voulait dire « aucune table ne rend ». La conséquence d'une
  dette s'écrit à côté de la dette, sinon le chiffre seul décide de l'urgence.
- **Une mesure qu'on explique au lieu de l'expliquer est une mesure perdue.** La sonde du
  chantier précédent affichait `lignes: 1` sur une liste annoncée à dix : c'était CE
  défaut, sous les yeux, et il a été rangé d'une phrase — « sans doute une autre table ».
  Le premier utilisateur, lui aussi, avait été cru sur la mauvaise cause : son filtre à
  0/4 était une coïncidence, sa liste était vide comme celle de tout le monde.

#### Le banc d'essai a un analyseur, et c'est un domaine — les `<select>` l'ont prouvé

L'ancien mode « in select » **supprime** toute balise étrangère (la boucle n'est pas
déplacée comme dans une table : elle n'existe plus — un menu à une option blanche) ;
l'analyse assouplie de Chromium ≥ 134 **garde** tout. Mesuré des deux côtés : sc-for
disparu sur le poste de l'utilisateur, 24/24 conservés sur le Chromium du banc. Vingt-
quatre menus muets sur le terrain, tous verts en CI — « ce Chromium les garde », la
note du cliquet, était une garantie vraie sur son domaine lue comme générale, la
famille de `netlify.toml`. Les vingt-quatre s'écrivent en `sc-raw-select` (les
`<option>` réelles restent : elles survivent dans les deux mondes ; PAS de
`sc-raw-option`, RAW_WRAP ne le connaît pas). Deux gardes : la structurelle
(`gabarit-contenu-restreint`) attrape le geste indépendamment de l'analyseur ; celle de
rendu attrape le symptôme, quelle qu'en soit la cause, et **déclare** que sur ce banc
la mutation d'analyseur ne peut pas la faire tomber — l'angle mort du banc est un
angle mort comme les autres : il se déclare dans la garde.

#### Le rendu ne prouve que les chemins qu'il exerce — la portée, elle, se prouve statiquement

La panne la plus grave du dépôt en une ligne : **« inedit is not defined » dans un
producteur, et la page entière est blanche** — `renderVals()` est UNE fonction, une
exception dans un producteur efface tout, y compris ce qui n'a rien à voir. Trois
locales (`inedit`, `plusFin`, `tDem`) avaient survécu à la suppression de leur
déclaration : leurs lecteurs vivaient plus bas dans `ligne()`, leur déclaration dans
un AUTRE producteur. 457 tests au vert pendant la panne totale, garde de rendu
comprise : le banc part d'un navigateur neuf, sans lignes de scan, donc `ligne()`
n'y tourne jamais. Une lecture hors de sa portée ne jette que si sa branche
s'exécute — mais elle est **parfaitement visible statiquement**.

Deux gardes ferment la classe, chacune déclarant ce que l'autre couvre :

- **`portee-script.test.mjs`** parse chaque `<script>` en ligne (espree) et résout
  les portées (eslint-scope) : toute référence qui n'est ni déclarée dans un bloc du
  fichier, ni un nom d'environnement navigateur (le paquet `globals`, rien d'énuméré
  à la main), ni une exception déclarée avec sa raison (`DCLogic`, support.js), est
  un échec nommé avec sa ligne. Sa première exécution a trouvé la panne — **et une
  deuxième de la même classe, endormie dans `testerAilleurs`** (`entrees[0]`… lus
  d'une portée qui n'existait pas : le repli d'un instrument inchargeable jetait).
- **`rendu-gabarit.test.mjs`** échoue sur toute `pageerror` : une exception y est
  plus grave qu'un trou, elle efface tout — mais seulement sur les chemins que le
  banc exerce.

Et le remède du fond n'est pas la garde, c'est **une seule vérité** : l'état du
tirage (`inedit`, `pousser`, `tirages`) vit dans `decisionDe` — `dec.inedit`,
`dec.pousser` (le mot dit ce que le bouton fait ; l'ancien `plusFin` portait deux
sens selon l'endroit, et c'est ce double sens qui a caché l'orpheline),
`dec.tirages` — et les trois producteurs lisent `dec` au lieu de recalculer chacun
sa copie. Re-déclarer sur place aurait réparé le symptôme en gardant la cause :
quatre copies du même calcul, dont n'importe laquelle pouvait diverger la prochaine
fois.

#### Et l'inverse : le compte de la SOURCE n'est pas le compte de l'ÉCRAN

La panne fondatrice de cette règle allait dans un sens : la source était juste, le rendu
était vide. Le cas miroir s'est présenté sur le BALISAGE, et il coûte l'inverse — une
garde de source aurait réclamé vingt-neuf corrections qui ne réparent rien.

Mesuré : `Vena.dc.html` porte **trente-cinq** affectations d'un gestionnaire vide
(`x: () => {}`) sur un champ que le gabarit lie à un `onClick`. Rendues — le fichier
livré, les sept vues, l'état semé — **six** atteignent l'utilisateur. Les vingt-neuf
autres vivent dans des branches dont l'élément est masqué ou grisé : elles ne mentent à
personne. Les corriger aurait touché vingt-neuf branches que personne ne peut voir, ce
qui est la façon ordinaire dont un correctif introduit un défaut.

> **Une garde de source compte les occurrences ; une garde de rendu compte les
> utilisateurs.**

Et les six qui restaient étaient un défaut de BALISAGE, pas de comportement : un
`<button>` portant `cursor: default` et un gestionnaire vide entre dans l'ordre de
tabulation et s'annonce cliquable à un lecteur d'écran, pour ne pas répondre au clic.
C'est la règle 4 — l'explication (« le curseur dit que ce n'est pas cliquable »)
contredisait l'étiquette (`<button>`), et c'est l'étiquette qui était le défaut. La case
non calculée est un `<span>` depuis ; le curseur est parti avec la balise, n'ayant jamais
eu d'autre travail que de la démentir. `scripts/app/balisage-inerte.test.mjs` tient la
classe — *aucun élément annoncé cliquable ne porte un geste vide* — et non le lieu où
elle est apparue.

**Trois questions, trois bancs, et aucun ne couvre les autres** : « le gestionnaire
est-il branché ? » (`trous-branches`, qui lit les clés émises), « réagit-il ? » (la
tournée des gestes), « le DOM dit-il la vérité sur ce que c'est ? » (le balisage). Un
`<span>` inerte répond non à la deuxième et oui à la troisième, et il a raison des deux
fois. Les deux bancs de rendu parcourent désormais la **même** surface, écrite une fois
dans `scripts/app/lib/vues.mjs` : deux copies d'une liste d'écrans divergent, et la
divergence est muette.

**Et la mesure elle-même a rapporté zéro avant de rapporter six.** Les sept clics de
navigation échouaient tous — l'onglet porte son rang collé au libellé, « 2Mes scans » —
et les sept vues rendaient leur verdict sur le même écran d'accueil. Encore une mesure
fausse qui a l'air d'une mesure. La sonde vérifie donc sa prise : moins de quinze
éléments cliquables sur une vue la fait tomber, plutôt que de laisser passer un zéro qui
n'a rien regardé.

### Un motif qui dépend de l'ORDRE désigne l'environnement, pas le code

Trois jours de chantier MQL5 sur un symptôme dont la cause était hors du programme :
l'agent du testeur mourait après la synchro d'historique, sans une ligne de test. Le
journal du terminal portait la réponse — `file write error [112]`, disque plein ; 704 Mo
libres sur 95,8 Go, dont 72 Go dans trois dossiers de terminal. L'agent mourait **avant
d'exécuter une ligne du robot**.

**Le signal était disponible dès le premier rapport, et il a été lu à l'envers.** « GOLD,
Germany40 et USNDAQ100 échouent, BRENT et COPPER passent » se lisait comme une propriété
des instruments — profondeur d'historique, devise de cotation —, et deux hypothèses de
code en sont sorties. C'était une propriété du **rang** : le premier passé avait son cache
écrit, les suivants devaient en écrire, et la place manquait.

> **Un défaut du code ne dépend pas de qui est passé avant lui.** Quand le départage est
> « le premier marche, les suivants non », le suspect est une ressource partagée et
> consommable — disque, mémoire, descripteurs, quota — pas une ligne du programme.

Le test se fait comme celui des noms de lieu, à voix haute : *ce qui distingue les cas
qui échouent, est-ce ce qu'ils SONT ou quand ils sont passés ?* Le second ne peut pas
être une propriété du source.

#### Un correctif raisonné depuis une panne invisible garde son invariant et perd sa cause

Quatre correctifs ont été posés pendant ces trois jours, et ils ne se valent pas :

| D'où il venait | Ce qu'il en reste |
|---|---|
| la boucle de 1 800 s par symbole — **mesurée**, journal à l'appui | vrai, et la cause était la bonne |
| le cache d'agrégation, 2 h 12 de processeur à 100 % — **mesuré** | vrai, et la cause était la bonne |
| le plafonnement de `SpOuvAmorcer` — **raisonné** depuis une panne que personne ici ne pouvait observer | **l'invariant tient, la cause était fausse** |
| les six jalons d'initialisation | c'est eux qui ont rendu la mesure décisive |

Les deux premiers sont nés d'un symptôme qu'on pouvait relire ; le troisième d'un
symptôme qu'il fallait deviner. **Ce n'est pas une raison de ne pas le poser** — la forme
défensive vaut par elle-même, et le dépôt avait déjà vu ce geste faire cesser de répondre
un terminal. C'est une raison d'écrire son **statut** dans la garde : « l'invariant se
tient sur ses propres mérites », jamais « ce qui reste est ».

**Et l'angle mort était déjà déclaré, trois paragraphes plus bas.** La garde disait, dans
sa note de règle 9 : « elle ne PROUVE pas le diagnostic et ne le prétend pas ». Ça n'a
servi à rien — au-dessus, un paragraphe affirmait « CE QUI RESTE EST UNE INCOHÉRENCE ENTRE
DEUX FONCTIONS », et c'est la voix confiante qu'on lit.

> **Un angle mort déclaré ne rattrape pas une affirmation confiante écrite au-dessus de
> lui.** La règle 9 demande que l'angle mort soit dit ; elle ne dispense pas la phrase
> elle-même de porter son degré de certitude, à l'endroit où elle est écrite.

#### Une instrumentation qui n'imprime RIEN est une mesure, et elle pointe dehors

Les six jalons `VENA INIT n/6` n'ont jamais rien imprimé, et c'est ce qui a tranché.
**Une initialisation muette sur six jalons posés dit « le programme n'a pas démarré » ;
une initialisation muette sans jalons ne disait rien du tout** — ni où elle s'était
arrêtée, ni si elle avait commencé. L'absence de trace n'est interprétable que si la trace
était garantie présente.

C'est le pendant de « le runtime le disait, sept fois, à chaque chargement » : là une
mesure existante était lue comme du bruit, ici une mesure absente est devenue lisible
parce qu'on savait ce qui aurait dû s'écrire. **Les deux disent qu'une instrumentation
vaut par ce qu'elle rend DÉCIDABLE, y compris quand elle ne rend rien.**

### Une grandeur qui CLASSE bien les cas n'est pas pour autant la grandeur du mécanisme

C'est la voisine de la règle précédente — là, un motif qui dépend du RANG désigne
l'environnement ; ici, un motif qui suit une VARIABLE désigne peut-être une autre
variable, cachée derrière celle qu'on regarde.

Deux instances mesurées, à deux jours d'écart, sur le même chantier :

| La grandeur qui classait | Ce qu'on en concluait | Pourquoi elle classait quand même |
|---|---|---|
| la **largeur de bande** entre les deux lectures | « les configurations larges divergent du testeur » | elle suit la volatilité, qui suit tout le reste — et deux exceptions l'ont cassée |
| le **nombre de barres H1** | « moins de barres, plus d'écart : Véna en jette » | il suit la largeur de séance, la politique de cotation du courtier ET la profondeur d'historique. Ce que Véna jette n'en est qu'un terme parmi quatre |

**Le nombre de barres est l'exemple parfait parce que l'ordre était PARFAIT** : cinq
instruments, aucune exception, du plus large au plus étroit. Et c'est justement ce qui
aurait dû alerter.

> **Un ordre trop propre est un indice FAIBLE, pas fort.** Une variable composite —
> en aval de plusieurs mécanismes à la fois — classe mieux que la vraie cause, parce
> qu'elle en agrège les effets et en lisse le bruit. La vraie cause, elle, a presque
> toujours des exceptions : un instrument où le mécanisme joue et ne coûte rien.

Le test se fait avant de croire l'ordre, et il tient en deux questions :

1. **La grandeur du mécanisme a-t-elle son propre nom ?** Ici oui — ce n'est pas « le
   nombre de barres », c'est « le nombre de bougies que `fenetreHomogene` écarte ».
2. **Est-elle mesurable SÉPARÉMENT ?** Ici oui, et c'est ce qui referme le cas sans
   rien coûter : `ecartees` est stocké avec chaque série et affiché sur le panneau.

Quand les deux réponses sont oui, on ne discute pas l'ordre — on lit l'autre chiffre.
Quand la seconde est non, l'ordre reste une piste et se dit comme telle.

**Et la confusion a une source récurrente : on lit la grandeur DISPONIBLE au lieu de la
grandeur VOULUE**, parce que la disponible est déjà à l'écran. C'est la même racine que
« un champ qui nomme mal ce qu'il porte », vue depuis le lecteur au lieu du libellé : là
le mot mentait sur le nombre, ici le nombre est juste et c'est la question qu'on lui pose
qui ne lui appartient pas.

### Un mot relatif n'est vrai que depuis un référentiel stable

Deux corrections à un jour d'écart, et c'était deux instances d'un seul énoncé :

| Le mot | Son référentiel supposé | Ce qui l'avait perdu |
|---|---|---|
| « hier » (couverture des exemples) | aujourd'hui, qui avance | une série **engendrée**, dont la dernière bougie est figée |
| « ci-dessous » (phrase de reprise du scan) | ma position dans la page | un pied **collant**, lu depuis n'importe quel point de défilement |

**Un mot relatif — de temps ou de lieu — emprunte son sens à un point fixe : « depuis
quand », « depuis où ». Un élément engendré, figé ou collant n'en a pas.** « Hier » était
vrai le jour de la génération et mentait dès le lendemain ; « ci-dessous » était vrai
depuis le cadre dans le flux et mentait depuis la barre qui suit l'écran.

Le test se fait à voix haute, comme celui des noms de lieu : **ce mot suppose-t-il un
« depuis où » ou un « depuis quand » ? Si oui, l'élément qui le porte doit prouver qu'il
a ce point fixe.** Une série à soi, fraîche par construction, a le sien — « hier » y
reste juste et se lit mieux ; un texte dans le flux du document a le sien — « ci-dessous »
y désigne bien ce qui suit. C'est l'élément qui perd le référentiel, jamais le mot qui
est interdit.

Le domaine est plus large que ces deux cas, et il se reconnaît au même test :
« récemment », « le mois dernier », « plus haut », « à droite », « le premier de la
liste ». Tout ce qui se déplace ou se fige les invalide — une liste retriée déplace « le
premier », une colonne repliée déplace « à droite », une capture d'écran fige
« récemment ».

Le remède est toujours le même : **remplacer le référentiel perdu par une valeur
absolue** — la date en toutes lettres, le nom de la chose (« la carte du balayage »), le
libellé de l'élément plutôt que sa position. Voir « Aucun mot relatif sur une fenêtre
figée » plus bas pour l'instance fondatrice, et sa garde de rendu dans
`rendu-gabarit.test.mjs` — qui lit l'écran, pas le code, parce qu'un mot relatif est un
défaut d'AFFICHAGE : il n'existe que rendu.

### Une mutation se défait par le mécanisme qui l'a faite

Le cas réel, évité de justesse : pour éprouver la garde du verbe de la carte, une
mutation avait été posée dans `Vena.dc.html` par échange de chaîne — et la restauration
prévue était `git checkout -- Vena.dc.html`. Le fichier portait aussi, **non committé**,
le correctif même que la garde éprouvait : la restauration l'aurait emporté avec la
mutation, silencieusement. Le garde-fou de l'environnement a refusé la commande ; il
n'était pas garanti.

C'est la règle 1 sous une forme neuve : `git checkout --` dit « remets ce fichier comme
il était au dernier commit ». **L'intention est « annule ma mutation » ; le résultat est
« annule tout ce que je n'ai pas committé ».** Les deux coïncident tant qu'on travaille
sur du code committé, et divergent exactement dans le cas où on éprouve son propre
correctif — c'est-à-dire le cas normal de la règle 2, puisqu'une garde neuve se vérifie
par mutation AVANT d'être livrée.

> **Un échange de chaîne s'annule par l'échange inverse ; jamais par une restauration de
> dépôt, qui ne distingue pas la mutation du travail en cours.**

La forme sûre, celle des mutations de cette séance : l'échange aller avec une assertion
de compte (la chaîne mutée doit exister, une fois), le test qu'on regarde tomber, puis
**l'échange inverse** avec la même assertion — la restauration est vérifiée comme
l'aller, et elle ne touche que ce que la mutation a touché. Une mutation marquée
(`/*MUT*/` dans la chaîne d'échange) rend l'inverse inambigu.

Et c'est le **second cas de la même séance où l'outil de vérification était plus
dangereux que ce qu'il vérifiait** — après la garde de rendu, verte pendant la panne
totale parce que son banc n'exerçait pas la branche en panne. Une garde qui ne regarde
pas est aveugle ; un geste de vérification qui déborde son objet est pire, il détruit.
Cette règle-ci ne se ferme que par vigilance : aucune garde du dépôt ne voit un geste
de séance, et le garde-fou d'environnement n'appartient pas au dépôt. C'est précisément
pourquoi elle est écrite.

### Une suppression se cartographie avant de se faire

Le cas réel : trois familles de producteurs sans consommateur — la page de vente de
l'application, le contrôle mémoire, le dialogue des manquants — à supprimer parce qu'un
producteur mort coûte deux fois : il pèse dans l'artefact et il fait croire à une
fonction. La cartographie préalable a trouvé **six gardes** accrochées à ce qui partait,
dont deux que personne n'aurait devinées. Sans elle, chacune serait devenue **vacue** —
verte en ne gardant plus rien, le pire mode de panne, appliqué à une suppression au lieu
d'une réécriture : *une garde doit échouer quand son hypothèse cesse d'être vraie.*

**Chaque garde accrochée a une fin, et elle se dit.** Trois issues :

- **elle part avec le geste** — quand le geste supprimé était son seul sujet
  (l'ancre `nomPlan(PLAN_ACHETE)` de `coherence`, partie avec la page de vente, la
  raison écrite à sa place) ;
- **elle se réancre sur ce qui reste** — quand son invariant survit au geste (la
  dérivation des libellés d'article, réancrée sur les durées de `/tarifs` et la
  matrice du module) ;
- **elle s'ancre sur l'ABSENCE** — la troisième issue, trouvée en pratique : la garde
  affirme que la chose n'est plus là (« aucun lien de paiement ne s'ouvre d'ici »).
  Elle garde ses dents alors que son sujet a disparu, et elle attrape la
  **réintroduction** — qui est précisément le risque, puisque la doctrine reste
  écrite au-dessus pour le jour où le geste renaîtra.

**Et une suppression périme de la PROSE, pas seulement du code.** Deux consignes sont
devenues fausses en une heure sans qu'aucun test ne les touche : `tarifs.tsx` disait
« les montants sont ceux du code de l'application » — l'application n'en portait plus
un seul —, et la note au-dessus de `RENONCE_TXT` disait « la garde vit ici, dans
l'unique fonction par laquelle un lien de paiement s'ouvre » — la fonction venait de
partir. Une consigne périmée a l'autorité des vraies et envoie chercher une panne qui
n'existe plus : les commentaires autour de ce qu'on supprime se relisent comme les
gardes, dans le même geste.

#### Et l'inverse : la PROSE QU'ON AJOUTE pour expliquer un retrait entre dans le champ des gardes

La phrase précédente ne couvrait qu'une moitié — le texte qui **reste** autour de ce
qui part. L'autre moitié est le texte qu'on **écrit** pour dire pourquoi ça part, et
c'est du contenu neuf : il s'ajoute au fichier, donc il s'ajoute à ce que les gardes
lisent. Deux fois dans un seul commit — le retrait de la vérification de place :

| Ce que la prose a fait | La garde qui a rougi |
|---|---|
| elle **épelait l'appel** qu'elle racontait (`storage.estimate(`) | celle qui interdit sa réintroduction l'a trouvé dans le récit |
| elle a **éloigné** le `finally` de l'ouverture du writable, 2 200 → 2 385 caractères | celle du `.crswap`, qui cherchait dans une fenêtre |

Aucune ligne de code n'avait bougé dans les deux cas. **Deux faux positifs, et deux
sorties différentes**, parce que ce n'est pas toujours la garde qui a tort :

- **La prose ne se fait pas passer pour du code.** Le récit d'un retrait cite ce qui
  est parti — c'est son travail — mais il peut le nommer sans l'épeler comme un
  appel. C'est la règle 3 vue depuis l'écrivain : on interdit le code, pas le récit
  du code, donc **le récit évite la forme du code**. Apprendre les commentaires à la
  garde serait le motif de plus que la règle 3 refuse.
- **Une garde dont la prise est une DISTANCE n'a pas de prise.** 2 200 caractères
  était un nombre magique, et la réponse n'était pas 2 600 : la troisième prose
  l'aurait dépassé. La portée qui compte n'était jamais un nombre de caractères,
  c'était **la méthode** — `borne(APP, "\n  }", i)`, qui jette si elle ne la trouve pas
  plutôt que de s'élargir en silence. Changer de forme, pas ajouter un motif.

> **Le texte qu'on ajoute pour expliquer une suppression se cartographie comme le
> code qu'on retire.** La cartographie de la règle 14 se fait donc dans les DEUX sens :
> ce qui part, et ce qu'on écrit à la place.

Et le corollaire pratique : une suppression bien expliquée est **longue**, par
construction — elle porte ses mesures et ses raisons. C'est précisément cette
longueur qui déborde les fenêtres et qui multiplie les chances d'épeler un motif
interdit. Plus le retrait est bien documenté, plus il accroche.

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

**Et ces marques ont déjà sauvé un diagnostic, pas une performance.** En cherchant à
reproduire une perte de séries, deux semis de sonde sont tombés à côté — le champ `b` au
lieu de `l` pour les bas, puis l'espace `.perso.ic` quand le compte réel était
`.client.fxpro`. Les deux fois, la sonde rendait **« 0 série » sans se plaindre** : une
mesure fausse qui a l'air d'une mesure, le pire mode de panne d'un diagnostic. C'est
`vena:reprendreSeries 0 série`, posée dans le produit, qui l'a dit — pas une assertion de
test, qui aurait simplement échoué sans dire que c'était la sonde qui avait tort.

> **Une instrumentation posée dans le produit attrape une mesure fausse ; une sonde de test
> ne peut attraper que le produit.** C'est l'argument pour en garder, et il ne se voit que
> le jour où on en a besoin.

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
date-contre-aujourd'hui — `Date.now() - cv.t1 > 45 jours`, dans le producteur de la
fiche — et **celui-là s'applique bien à elles** : elles passeront « périmées »
quarante-cinq jours après leur dernière bougie.

**« Le seul date-contre-aujourd'hui du fichier » était écrit ici, et c'était faux** : la
colonne « Bougies présentes » en portait un deuxième (`< 8 jours` → « hier », au-delà →
« s'arrête en » à l'encre d'alerte), invisible tant que sa table ne rendait rien. Sur une
série d'exemple, elle disait « 2023 → hier · complet » — vrai le jour de la génération,
faux dès le lendemain — puis aurait basculé en alerte sans action possible. Corrigée en
date absolue, « 2023 → 11/09/2026 · fenêtre fixe », encre neutre, décidée AVANT le seuil
relatif. Un « seul » se périme sans bruit : compter, pas jurer.

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

## Le contrôle du hasard se corrige de la sélection

Le champion d'une carte est le MEILLEUR de N configurations mesurées ; son ancien
chiffre le comparait à des tirages faits sur lui seul — **un maximum contre une
moyenne**, et le hasard seul en fait passer une sur vingt à 5 %. Le verdict corrigé
(`scan-noyau.js`, `controleCorrige`) compare **deux maxima** : à chaque tirage, les
têtes de l'instrument sont rejouées avec des entrées au hasard et le meilleur rejeu
doit être battu par le meilleur réel. `p = (au + 1) / (tirages + 1)` — jamais battu en
500 tirages veut dire « moins d'une fois sur 501 », pas « jamais ».

**Le null tire les DATES D'ENTRÉE, il ne mélange jamais les prix.** Mélanger détruirait
la structure des prix ; tirer les dates la garde et ne détruit que le choix du moment —
la question posée est « le signal choisit-il mieux ses entrées que le hasard ». Le
brief initial disait « prix mélangés » : c'était un contresens sur le null, corrigé.

**N est l'union des têtes** — les trois meilleures par critère de classement,
l'ensemble dont un champion peut sortir — **fixée sur les lignes en mémoire, jamais sur
les lignes affichées** : un p qui bouge quand on déplace un curseur de filtre serait le
défaut corrigé, sous sa forme la plus sournoise. L'**ordre des entrées est partagé** :
le flux est réamorcé PAR TÊTE sur la graine du tirage — la corrélation de deux
configurations voisines est absorbée par construction (Bonferroni les compterait comme
indépendantes), chaque case (tête, tirage) est indépendante du découpage, donc les
plages se parallélisent et **pousser AJOUTE** (500 → 2 000 conserve les 500 premiers).

**Plus de bouton PAR CARTE.** Le contrôle se calcule pendant le scan (cœurs encore
chauds, ~+25 % mesuré : un tirage vaut 1,5 combinaison balayée). Le nombre de tirages
vaut pour toute la page, jamais pour une carte — réglable par carte, il permettrait de
pousser le seul instrument qui a failli passer. Le cadre « Contrôle du hasard » en lot
(et son verdict Benjamini-Hochberg) est parti avec : il posait la même question, sans
corriger la sélection.

**Et les scans ANTÉRIEURS ne se complètent plus tout seuls.** Le complètement démarrait
à l'ouverture de la page : sur un arriéré de 56 instruments, une demi-heure de
processeur saturé que personne n'avait demandée et que rien ne pouvait arrêter —
« l'ordinateur rame », le contraire de ce que le retrait du bouton visait. La page des
scans porte une ligne d'état — « N verdicts corrigés manquants · environ X » (durée
estimée sur la vitesse mesurée de la machine) — avec un geste pour lancer et un pour
arrêter : un travail dont l'utilisateur connaît le prix. Pendant qu'il tourne :
**l'export a priorité** (le complètement se met en pause sur le témoin `exportEnCours`,
au grain de l'instrument — une sauvegarde qui échoue parce qu'un calcul de confort
tournait est le pire compromis possible), et **les bougies se libèrent par instrument**,
pas à la fin — mesuré, le cache du fil principal croissait de façon monotone sur tout
l'arriéré pendant que les cœurs, eux, restaient constants (une écurie mémoïsée, bougies
remplacées). `scripts/app/fond-budget.test.mjs` tient les trois, par mutation.

**Une épinglée (« Voir ») hors têtes porte un p à UNE configuration, nommé « NON
corrigé »** : choisie à l'œil parmi des centaines, aucun N ne décrit cette sélection —
fabriquer une correction ferait croire qu'on a mesuré une sélection qu'on ne connaît
pas (règle 9). Son contrôle individuel se lance tout seul à l'épinglage.

**L'angle mort est déclaré AVEC sa magnitude, mesurée** (hors produit, 2 400
combinaisons × 200 tirages, ordre partagé) : le meilleur rejeu de la grille entière
dépasse celui des têtes d'**environ 13 R en moyenne à 2 400**, et l'écart croît en
logarithme de la taille — de l'ordre de **+100 R extrapolé à 64 000** (extrapolation,
pas mesure). Au-dessus du seuil convenu (25 R), la déclaration vit **dans le verdict
lui-même** — « se distingue — des têtes rejouées » — pas dans une infobulle. Une dette
déclarée sans sa gravité se classe toute seule en bas de la pile.

`scripts/app/hasard-corrige.test.mjs` tient les huit gardes, chacune éprouvée par
mutation — critère actif, +1, valeur de page, plages additives, ordre partagé (deux
têtes identiques doivent rendre le même tirage), bouton parti, épinglée non corrigée,
angle mort rendu.

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

## La transposition JS → MQL5 lit le marché à l'identique — et sur quoi ça repose

**PROVENANCE · RAPPORTÉE PAR L'UTILISATEUR, NON CONSIGNÉE DANS LE DÉPÔT.** Cette section
est écrite en premier lieu pour dire d'où elle vient. Quatre robots rejoués sur historique
complet — 40 000 barres, qualité 99 % — donnent **quasiment le même nombre de trades que
Véna**, trois légèrement en dessous et un légèrement au-dessus en résultat. La mesure a été
faite sur le poste de l'utilisateur ; aucun journal n'est entré dans `scripts/mt5/`, et les
chiffres exacts ne sont pas ici. Le statut honnête est donc **panne absente, rapportée** —
pas « établie » au sens des cinq gardes, qui exigerait une trace qu'un test peut relire.

**CE QUE LE COMPTE DE TRADES TRANCHE, ET C'EST LA QUESTION DU MOIS.** Deux implémentations
peuvent différer sur ce qu'elles DÉCIDENT ou sur ce qu'elles PAIENT, et un écart de R net
seul ne distingue pas les deux. Le **nombre** de trades, lui, ne dépend que des entrées :
même compte, mêmes entrées, donc même lecture du marché. C'était déjà le discriminant du
harnais — `references.mjs` porte ses avant/après au trade près (62 contre 503, corrigé en
502 contre 503 ; 420 → 352 contre 355 au testeur) — mais à l'échelle d'une configuration à
la fois, sur historique partiel. Sur quatre robots et l'historique complet, la réponse
tient : **l'écart résiduel n'est pas dans la décision, il est dans l'exécution** — spread
au remplissage, ordre des ticks dans la bougie.

### Un écart qui CHANGE DE SIGNE n'est pas un coût mal modélisé

C'est l'inférence qui clôt le dossier, et elle vaut au-delà de MT5.

> **Un biais de modélisation a un signe.** Un spread sous-estimé, une commission oubliée,
> un swap au mauvais sens : chacun pousse TOUS les cas du même côté. Quand quatre mesures
> se répartissent trois d'un côté et une de l'autre, ce qui reste est du bruit
> d'exécution, pas une erreur de modèle.

Le test se fait avant de chercher : *l'écart a-t-il un signe ?* S'il en a un, on cherche un
terme manquant et on le trouvera. S'il change de signe, chercher un terme manquant est une
chasse sans gibier — et c'est là qu'un mois se perd. La dispersion autour de zéro est une
information sur la NATURE de l'écart, pas seulement sur sa taille.

**Ce qui en ferait un fait du dépôt plutôt qu'un rapport**, et c'est peu : les quatre
journaux de ces rejeux dans `scripts/mt5/`, joints au jeu de référence. Le harnais sait
déjà les lire — `lireRapportMt5`, `apparier`, `comparer` — et `references.mjs` dit
explicitement que ses `nVéna`/`rVéna` sont « un repère historique, pas une cible ». Avec
les journaux, ils deviendraient une cible, et la phrase ci-dessus cesserait d'avoir besoin
de sa ligne de provenance.

### Ce qui reste, et ce que ça pèse

| | Ce que c'est | Ce que ça coûte |
|---|---|---|
| **Le cinquième robot** | il divergeait sur des données TRONQUÉES ; à refaire sur historique complet | un rejeu — et une divergence sur données tronquées n'est pas une divergence |
| **Les quatre filtres non transposables** | `fResist` ~10 lignes, `fPivot` ~8, `fNuage` plus de code sans machinerie neuve, `fZone` le seul dont la fidélité soit en jeu | une file d'attente, pas une panne — détaillée au-dessus de la table `INCONNUS` de `robot-mt5.js` |

**Aucun des deux n'est un défaut ouvert**, et c'est la raison d'être de ce tableau : sans
lui, « il reste deux choses » se lit comme deux pannes. Le premier est une mesure à
refaire, le second un chantier chiffré dont le refus actuel est le comportement JUSTE —
livrer un robot amputé de son filtre donnerait un nombre de trades différent de la mesure,
c'est-à-dire exactement ce que la section ci-dessus vient d'établir comme le critère.

## Un palier armé rend la bougie H1 indécidable — et c'est le signe du résultat qui bascule

**STATUT · CAUSE ÉTABLIE, MESURÉE dans le dépôt** pour les nombres ci-dessous ;
**RAPPORTÉE, NON REPRODUITE** pour les neuf rejeux du testeur qui ont mené ici (ils sont
sur le poste de l'utilisateur, aucun journal n'est entré dans `scripts/mt5/`).

Véna évalue ses paliers de sécurisation sur les **clôtures H1** ; MT5 déplace le stop et
le lit en **intrabar**. Sur les mêmes entrées, les sorties divergent. Le dépôt le savait
et l'avait écrit — au-dessus de `comparerMt5` — avec une conclusion qui a coûté des
semaines : *« un désaccord qui n'est pas une erreur »*. Vraie sur son domaine, elle se
lisait comme « il n'y a rien à regarder ».

**Mesuré sur les dix familles d'exemple**, même configuration, trois jeux de paliers :

| jeu de paliers | trades ambigus (moyenne) | familles où la convention CHANGE LE SIGNE |
|---|---|---|
| aucun | **0 %** | 0 / 10 |
| point mort à 25 % | **21 %** | **5 / 10** |
| paliers progressifs | **27 %** | **6 / 10** |

Et ça suit la volatilité : VX-EUR (8 %) reste à 3–4 % d'ambiguïté, VX-BTC (60 %) monte à
47–52 %. Sur VX-BTC avec un simple point mort : 83 trades ambigus sur 177, résultat
**−41 R ou +86 R** selon la convention d'ordre intra-bougie.

> **Sans palier, la convention n'est jamais invoquée ; avec un palier, elle décide du
> signe.** Ce n'est pas une marge d'arrondi qu'on mentionne en note — c'est la moitié des
> configurations dont le chiffre affiché a le signe opposé sous l'autre lecture.

**La bougie H1 ne PORTE PAS l'information, et aucun correctif ne l'y mettra.** Une bougie
qui monte assez pour armer le point mort puis redescend le toucher n'a pas dit dans quel
ordre. Trois issues, et c'est un arbitrage produit, pas une question technique :

| | Ce que ça fait | Ce que ça coûte |
|---|---|---|
| **borner** | afficher le résultat dans les deux conventions au-delà d'un seuil d'ambiguïté, et dire combien de trades sont indéterminés | deux chiffres là où l'utilisateur en lit un ; l'infobulle du produit conseille DÉJÀ de cocher les deux lectures et de lire l'écart — ce serait le calculer à sa place |
| **refuser** | ne pas proposer de paliers tant que la mesure ne peut pas les trancher | retire une fonction utilisée, et les paliers sont ce qui rapproche le backtest d'un vrai suivi |
| **descendre** | évaluer les paliers sous la H1 | demande des données que l'utilisateur n'exporte pas — et l'export MT5 sait écrire les colonnes d'ORDRE des extrêmes (`ah`/`ab`), que le moteur lit déjà (`ordreConnuA`), ce qui est une quatrième voie partielle et non mesurée |

**Le réglage qui décide de tout est celui que la ligne n'affiche pas.** `reglages`, la
chaîne de configuration d'une ligne de portefeuille, est bâtie sur l'entrée, la ligne, la
période, le stop et le R/R — **jamais sur la sécurisation**. Deux lignes dont l'une porte
des paliers et l'autre non s'affichent identiquement. Quand on a cherché à savoir
lesquelles des neuf lignes rejouées portaient un palier, la réponse n'était pas lisible à
l'écran : il fallait appeler `paliersDe(v)`. *Le seul réglage capable de renverser le
signe du résultat est absent de la ligne qui décrit la configuration.*

`scripts/mt5/lecture-ambigue.test.mjs` tient les deux bouts : le **zéro** sans palier —
sur lequel repose la réfutation de l'hypothèse intra-bougie telle qu'elle avait d'abord
été posée — et la **magnitude** avec palier, exigée sur le SIGNE et non sur un écart
quelconque. Éprouvé par mutation, et il a fallu trois essais : le tableau `ordre` et la
branche `else if (prudent)` sont l'un et l'autre inertes ; seul le drapeau à sa racine
fait bouger les nombres. Les deux premières mutations ont été vérifiées par LECTURE avant
d'accuser la garde — sans quoi elle passait deux fois pour aveugle à tort.

## Un champ qui nomme mal ce qu'il porte coûte plus cher qu'un champ absent

**Quatre fois, un libellé d'écran a envoyé chercher un défaut là où il n'y en avait
pas.** Aucun n'était un bug : dans les quatre cas le code calculait juste, et c'est le
MOT au-dessus du nombre qui mentait sur la grandeur.

| Le champ | Ce qu'il annonçait | Ce qu'il portait | Ce que ça a coûté |
|---|---|---|---|
| « Depuis » | la date de début de la mesure | une constante écrite en dur | un tour |
| « les deux lectures s'accordent » | que le résultat est déterminé | une comparaison qui ne discrimine rien | un tour |
| « Période couverte » | la période du RÉSULTAT | la couverture des bougies en mémoire | deux tours — 7,7 ans contre 3,4 |
| « session … · N bougies écartées » | la séance du courtier et les bougies hors séance | la fenêtre horaire homogène de `nettoyer` et les bougies hors d'elle | une inférence fausse : la règle de séance du moteur disculpée par un nombre qui ne l'avait jamais mesurée |

La quatrième est la plus instructive parce qu'elle a produit un **raisonnement**, pas
seulement une confusion. Deux instruments à fenêtre étroite divergeaient d'un testeur,
deux à fenêtre pleine divergeaient aussi : « donc ce n'est pas la séance ». La
corrélation était réelle, la variable n'était pas celle qu'on croyait lire.

> **Un champ absent fait poser la question ; un champ qui ment y répond.** C'est
> pourquoi il coûte plus cher : personne ne vérifie une réponse qu'il a déjà.

**ET AUCUNE GARDE NE FERME CETTE CLASSE — il faut le dire.** Un libellé est de la prose,
et la règle 3 interdit d'ancrer une garde sur de la prose ; rien, dans un fichier, ne
dit qu'un mot désigne bien la grandeur calculée en dessous. Ce qui a été fait est plus
pauvre et honnête : le champ est **renommé jusque dans son identifiant** —
`sessionInfo` est devenu `fenetreHeuresInfo` —, et
`scripts/app/fenetre-nest-pas-seance.test.mjs` s'ancre sur **l'absence** (règle 14,
troisième issue) pour attraper la réintroduction du mot sur cette grandeur-là. Une
garde d'un cas, déclarée comme telle.

### Et deux comptes DISJOINTS lus l'un sous l'autre se fondent en un

Le cinquième cas n'est pas un libellé qui ment : ce sont deux libellés **justes** qui,
voisins, décrivent la même chose pour le lecteur. Sur la reprise d'US30 : « 0 bougies
hors de cette fenêtre » et, juste au-dessus, « 23 bougies hors séance sur 68 sautées ».
Les deux nombres sont exacts, les deux populations sont disjointes, et rien à l'écran ne
le disait.

La cause tient au mot choisi : chacun ne nommait que l'**exclusion**, qui est le terme
commun aux deux mécanismes — « écartées » d'un côté, « sautées » de l'autre, deux
synonymes pour deux choses. Le fait qui les sépare n'était écrit nulle part : celles de
la fenêtre sont **RETIRÉES de la série** — elles n'y entrent jamais, aucun de leurs
extrêmes n'est mesurable —, celles de la règle de séance y sont **PRÉSENTES** et
seulement sautées à l'évaluation.

Les deux infobulles le disaient déjà, et l'une niait explicitement l'autre. **Ça n'a
servi à rien : une infobulle ne s'ouvre pas toute seule, et c'est en lisant les deux
lignes ensemble qu'on les confond.** Le mot vit donc dans le texte rendu.

> **Deux grandeurs distinctes qui partagent un écran doivent se distinguer dans ce qui
> est LU, pas dans ce qui est survolé.** Et l'angle mort est déclaré dans la garde :
> elle tient les deux mots, pas la disposition — or c'est le voisinage qui produit la
> confusion.

**Le seuil pour construire une forme est posé d'avance**, comme celui des statuts : le
jour où un libellé mentira sur une grandeur qu'un test peut RECALCULER — un total, un
compte, une date lisible ailleurs —, la prise cesse d'être la prose et devient la
valeur. Une garde pourra alors vérifier que le champ « Période couverte » porte bien la
période du résultat, parce que les deux sont calculables. Tant que la grandeur n'est
lisible que dans le mot, il n'y a rien à quoi s'accrocher.

### Son application immédiate : un zéro se rend avec son dénominateur

La même séance a livré un compteur — les bougies sautées par la règle de séance qui
franchissaient un niveau — et il portait le même défaut d'un cran plus bas : **son zéro
avait deux sens**. « La règle n'a jamais joué sur cette série » et « elle a joué des
milliers de fois sans rien coûter » s'écrivaient tous deux `0`, et le bandeau ne
paraissait QUE lorsque le compte était non nul — si bien que son absence valait aussi
« pas encore mesuré ». Trois états, un seul rendu.

> **Une sonde qui peut rendre zéro prouve d'abord sa PRISE.** C'est déjà la règle du
> dépôt pour les sondes de test — moins de quinze éléments cliquables fait tomber la
> tournée des gestes plutôt que de laisser passer un zéro qui n'a rien regardé. Elle
> vaut mot pour mot pour une mesure posée dans le PRODUIT.

`sautesVues` est cette prise : toute bougie sautée en position, franchissement ou non.
Les trois états se rendent tous les trois, en toutes lettres — et celui qui DISCULPE la
règle (« elle a joué et n'a rien coûté ici ») est celui qui referme la question, donc
le moins dispensable des trois.

## Ce que la fenêtre horaire homogène RETIRE, le moteur ne peut pas le voir

**STATUT · PANNE OBSERVÉE, MÉCANISME NON PROUVÉ.** Le fait est mesuré chez l'utilisateur
sur sept instruments, robots réexportés, garde de symbole active, périodes alignées et
**aucune sécurisation sur aucune ligne** — donc les 21 % d'ambigus des paliers ne
s'appliquent à aucune. Le mécanisme est lu dans le source ; aucun journal n'est entré
dans `scripts/mt5/`.

| écartées | trades V → MT5 | réussite V → MT5 |
|---|---|---|
| 0 · GOLD | 465 → 463 | 49,5 → 48,0 (**−1,6**) |
| 0 · US30 | 141 → 141 | 34,8 → 32,6 (**−2,2**) |
| 0 · SILVEREURO | 157 → 163 | 36,9 → 33,7 (**−3,2**) |
| 912 · HongKong50 | 162 → 161 | 51,9 → 44,7 (**−7,2**) |
| 895 · IBEX 35 | 91 → 89 | 41,8 → 30,3 (**−11,5**) |

**La séparation est binaire et sans contre-exemple**, et ce qui la rend décisive n'est pas
l'ordre : c'est que le nombre **absolu** de trades basculés est le même des deux côtés,
dix à douze. 12/162 = 7,2 %, 10/91 = 11,5 % — l'écart en points n'était que le
dénominateur. Ce n'est plus une grandeur qui classe, c'est une prédiction qui tombe juste.

`nettoyer` retire les bougies hors fenêtre horaire **avant toute mesure** : leur extrême
n'entre ni dans `h`/`l` ni dans `eh`/`eb`, et `const exH = df.eh || df.h` est tout ce que
le backtest regarde. Un stop touché pendant ces heures n'existe pas pour le moteur ; un
testeur, sur son graphique H1 complet, le voit. **Un perdant devient gagnant — biais d'un
seul signe.**

### IBEX et HongKong50 ne sont pas la même panne — l'arithmétique les sépare

**⚠ CE QUI SUIT A ÉTÉ CALCULÉ SUR UN R FAUX, et le résidu de 10 R n'existe pas.** Le net
MT5 de HongKong50 a été converti au taux de l'écran Véna (100 €/R) sur un test à dépôt de
20 000 € : +4,00 R annoncé pour +14,8 R réels. La décomposition ci-dessous est gardée
parce que sa MÉTHODE tient et qu'elle a donné le bon résultat sur IBEX — le résidu nul
y est vrai —, mais la ligne HongKong50 est morte. Voir « Les trois formes ont été
RÉFUTÉES » plus bas, qui porte les chiffres justes et le mécanisme qui reste.

**PROVENANCE · DÉRIVÉE DES CHIFFRES RAPPORTÉS, calcul fait DANS LE DÉPÔT.** Rien de
mesuré ici : les cinq nombres par instrument viennent des rapports de l'utilisateur.
**Hypothèses écrites** : réussite = part de gagnants sur le total, aucun neutre, R/R
constant sur la ligne, aucune sécurisation (établi — les sept lignes portent « Aucune
sécurisation »).

On ajuste le R/R sur le côté Véna, puis on demande ce que la réussite MT5 **implique**
comme résultat. Si l'écart de R n'est qu'une conséquence de l'écart de réussite, le
résidu doit être nul :

| | R/R ajusté | MT5 prévu | MT5 observé | résidu | écart total |
|---|---|---|---|---|---|
| IBEX 35 | 2,355 | +1,46 R | +1,60 R | **+0,14 R** | 35,0 R |
| HongKong50 | 1,431 | +13,96 R | +4,00 R | **−9,96 R** | 38,4 R |

**Balayé sur la boîte d'arrondi** (réussites au dixième de point, R au dixième de R) :
IBEX reste dans [−0,21 ; +0,48] — *compatible avec zéro* ; HongKong50 dans
[−10,41 ; −9,50] — *exclut zéro*, cinq fois la bande d'arrondi.

> **Sur IBEX, la totalité de l'écart est « quels trades ont gagné ». Sur HongKong50,
> les trois quarts le sont et un quart ne l'est pas.** Les deux instruments ont ~900
> bougies écartées et ont été traités comme une seule panne ; ils portent deux termes.

Ce que ça **élimine** sur IBEX, et c'est la moitié utile : aucun terme de coût. Un
spread sous-estimé, une commission oubliée, un swap au mauvais sens changeraient la
valeur de CHAQUE trade, donc laisseraient un résidu. Il n'y en a pas. La divergence
d'IBEX est entièrement une divergence de **résolution** — un perdant devenu gagnant,
ce qui est exactement la forme d'un stop touché hors de portée du moteur.

Ce que ça **ouvre** sur HongKong50 : un second terme de 10 R qu'aucune des trois
candidates ne nomme. Il vaut 26 % de l'écart et il est absent de l'autre instrument
divergent. Les suspects se lisent dans les hypothèses ci-dessus, et ils sont
**vérifiables à l'écran, sans rejeu** : des trades neutres du côté MT5 (le compte de
réussite les mettrait au dénominateur sans qu'ils rapportent de R), ou un R/R qui n'est
pas constant sur la ligne. **Tant que ces deux-là ne sont pas lus, chercher une
troisième cause de fond serait chercher au-delà de ce qui est déjà mesurable** — la
règle du refus : la donnée manque-t-elle, ou personne n'est-il allé la chercher ?

#### Les trois formes ont été RÉFUTÉES — et le terme de 10 R n'existait pas

**PROVENANCE · RAPPORT MT5 COMPLET, RAPPORTÉ — lu par l'utilisateur, non entré dans
`scripts/mt5/`.** Les trois prédictions avaient été chiffrées d'avance pour être relues
telles quelles. Elles tombent toutes les trois, et le paragraphe est gardé entier parce
que c'est ce que cet exercice vaut.

| la prédiction | ce que le rapport porte | verdict |
|---|---|---|
| **A** 11,6 neutres côté Véna | 72 + 89 = 161, **aucun neutre** | mort |
| **B** gain moyen MT5 1,293 R | 333,35 / 231,22 = **1,442 R** — MT5 fait *mieux* | mort |
| **C** perte moyenne −1,112 R | **−1,000 R** après normalisation | mort |

**Et C meurt par le chiffre écrit d'avance** — « elle est fausse dès que la perte moyenne
MT5 rend −1,00 ». Elle rend −1,00. C'est la seule chose que la prédiction a bien faite.

##### Le terme de 10 R était une erreur de DÉNOMINATEUR, en deux couches

Il n'y avait rien à expliquer, et c'est pire qu'une hypothèse fausse : une grandeur
fabriquée par la conversion, autour de laquelle trois formes ont été construites.

1. **Le dépôt du test est 20 000 €, pas 10 000.** Le net de +3 422,35 € a été converti au
   taux de l'écran Véna — 100 €/R. **+4,00 R annoncé pour +14,8 R réels.**
2. **`InpRisquePct` porte sur l'ÉQUITÉ COURANTE.** La perte moyenne vaut −231,22 € et non
   −200 : l'équité monte de 20 000 à 23 422, sa moyenne sur la course vaut ≈ 23 100, dont
   1 % fait 231 €. **À l'euro près.**

Lu contre 200, ce −231 se présente comme un **dépassement de stop de 11 %** — la signature
d'un gap —, et l'instrument avait neuf cents bougies écartées pour l'expliquer.
L'hypothèse était cohérente, chiffrée, cohérente avec l'autre instrument, et **entièrement
produite par un dénominateur faux.**

> **Un risque en pourcentage de l'équité courante n'a pas de R constant sur la course.**
> Le prendre pour constant fabrique un dépassement de stop qui n'est que de la
> capitalisation.

**La conversion en R se dérive du RAPPORT, jamais de l'écran de l'application.** Le rapport
porte le dépôt, le pourcentage de risque, et surtout la **perte moyenne réalisée**, qui est
la mesure directe d'un R quand le risque suit l'équité. Lire le R sur l'écran, c'est encore
la règle 8 : `capital × risquePct` est un **lieu** — ce que les réglages annonçaient au
départ ; la perte moyenne encaissée est la **propriété** — ce qu'un R a réellement coûté.

`euroParR` préférait déjà la médiane des stops réels et ne retombait sur le nominal qu'en
dernier recours — le code avait raison, c'est un humain qui a divisé de tête. Ce qui a été
retiré est le `eurParR: 200` de `CADRE`, que **plus aucune ligne ne lisait** et qu'un
lecteur a cru. `scripts/mt5/conversion-en-r.test.mjs` tient les trois : plus de €/R
constant dans le jeu de référence, le nominal en dernier recours, et une course qui
capitalise doit rendre 231 et non 200. Son angle mort est écrit : **elle ne peut rien
contre quelqu'un qui lit un chiffre sur un écran et le divise de tête**, ce qui est
exactement ce qui s'est produit.

##### Ce qui reste après la correction : UN mécanisme, entièrement chiffré

| | réussite | gain moyen | perte moyenne | net |
|---|---|---|---|---|
| Véna | 51,9 % (84/162) | 1,431 R | −1,000 R | +42,2 R |
| MT5 | 44,72 % (72/161) | **1,442 R** | **−1,000 R** | +14,8 R |

**Les trois multiples concordent.** Gain moyen, perte moyenne, compte de trades : tout
s'aligne. Seule la réussite diffère, de sept points — **douze trades**.
12 × (1,431 + 1,000) = 29,2 R pour un écart observé de 27,4 R : **94 % expliqué par douze
trades qui basculent, et par rien d'autre.** Même forme sur IBEX, dix trades.

C'est le nombre ABSOLU que la prédiction de `bougies-cachees` annonçait — dix et douze —
et que le compteur n'a pas rendu (5 et 28, direction inversée). La cible est retrouvée ;
le compteur ne la touche toujours pas.

##### Le candidat qui coûtait une lecture de source, et la réponse est NON

`InpPasDebutSemaine = true` sur ce rapport : le robot refuse le dimanche et le lundi avant
02:00. Véna applique-t-il la même règle ? **Oui, et sur la même horloge** — relu dans les
quatre fichiers :

| | ce qui est lu |
|---|---|
| `robot-mt5.js` | `TimeToStruct(TimeCurrent(), …)` → heure **serveur** du courtier |
| `Export_H1_Vena.mq5` | `TimeToString(r[i].time, …)` → la même, en horloge murale |
| `moteur.js` · `lireCsv` | `Date.UTC(an, mois-1, jour, h, m)` → cette horloge murale, **rangée en UTC** |
| `moteur.js` · `executable` | `getUTCDay()` / `getUTCHours()` → **ressort l'heure serveur** |

**L'accord ne tient pas parce que les deux seraient en UTC — aucun des deux ne l'est.** Il
tient parce que `lireCsv` range l'heure du serveur dans un champ UTC et que `executable`
l'en ressort telle quelle : **deux erreurs qui s'annulent exactement**. C'est ce qui rend
la garde nécessaire — corriger l'une des deux « pour bien faire » romprait l'accord sans
qu'aucun test ne rougisse. `scripts/mt5/meme-horloge.test.mjs` lie les quatre maillons,
comme `manifeste-version` liait trois chemins : le défaut ne serait dans aucun d'eux pris
isolément, il serait dans leur **désaccord**.

##### Le cinquième candidat — la qualité à 96 % — est RÉFUTÉ

**PROVENANCE · RAPPORTÉE.** Il avait été posé comme « ordre de grandeur compatible, pas
mesure » : 4 % de barres modélisées contre 7,5 % de trades à faire basculer, et une barre
modélisée porte des extrêmes synthétiques. L'épreuve écrite d'avance était de relancer en
qualité 99 %.

M1 téléchargé — **1 956 665 bougies depuis le 2 janvier 2019**, bien au-delà de la période
testée, écrites par l'export du dépôt. Rejeu : **qualité 96 %, net +3 422,35, 29 988
barres — identiques au centime**, barre de qualité verte sur toute la durée. Les trous
sont diffus et ce sont ceux de l'historique réel du courtier. Le candidat meurt comme les
quatre autres.

##### La sixième piste — la MODÉLISATION du testeur — se coupe en deux, et une moitié est déjà morte

Le rapport porte « Délais : pas de latence, exécution idéale » et **« Modélisation :
1 minute OHLC »**. En ce mode, MT5 ne connaît pas le chemin du prix dans la minute : il le
synthétise. L'idée est donc que **les deux côtés devinent**, chacun à sa granularité.

**La moitié « ordre des extrêmes » est réfutée DANS LE DÉPÔT, sur cette configuration
exacte.** `lecture-ambigue` mesure les quatre couples SL/RR des lignes rapportées — dont
**0,7/1,5, celui du robot HongKong50** — sur les dix familles, sans palier : **zéro bougie
ambiguë**, et la raison est une magnitude, pas un hasard de série. La bande stop→objectif
vaut 1,75 % du cours et **dépasse l'amplitude d'une H1**.

> **Si aucune H1 ne contient les deux niveaux, aucune M1 qu'elle contient ne les contient
> non plus.** L'ordre à l'intérieur de la minute ne peut donc arbitrer entre stop et
> objectif ni chez Véna, ni chez MT5. Et les extrêmes d'une M1 sont RÉELS dans les deux
> modes — « chaque tique » n'ajoute aucun extrême, il n'ajoute qu'un chemin. *Le fait
> qu'un niveau soit touché est identique ; seul l'ordre change, et l'ordre ne décide de
> rien ici.*

**La moitié qui reste vivante est le PRIX D'ENTRÉE, et c'est elle que le rejeu teste.** En
« 1 minute OHLC », `OnTick` ne se déclenche qu'aux quelques tiques synthétisées de chaque
minute ; le contrôle de spread (`InpSpreadMaxPct`) et le remplissage tombent donc à des
instants et des prix différents. Stop et objectif étant des POURCENTAGES du prix d'entrée,
une entrée décalée déplace les deux niveaux — et fait basculer les trades marginaux. Douze
sur 161 est exactement l'ordre de grandeur d'un effet de bord d'entrée.

**Ce que le rejeu « tiques réelles » tranchera, et ce qu'il ne tranchera pas :** il mesure
l'effet du prix d'entrée. Il ne mesure pas l'ordre des extrêmes, qui est déjà réfuté — donc
**un résultat inchangé ne renvoie pas la piste à l'ordre**, il la ferme entière.

##### LE COURTIER SE CONTREDIT LUI-MÊME — et ça retire au testeur son statut de référence

**PROVENANCE · RAPPORTÉE, relevée au journal du testeur avant l'arrêt du rejeu.** Le rejeu
en tiques réelles a été interrompu (voir ci-dessous), mais il avait déjà écrit ceci :

```
real ticks discarded for 51 minutes
50 249 tick prices mismatch for 51 minute bars
```

**L'historique de TIQUES de FxPro contredit ses propres bougies M1.** Cinquante mille prix
en désaccord, sur cinquante et une minutes, pour le même symbole chez le même courtier.

> **Deux modélisations du même courtier sur le même symbole ne donnent pas le même prix.**
> Le mode « tiques réelles » n'aurait donc pas été une référence *plus vraie* — seulement
> **différemment fausse**. Et un arbitre qui se contredit lui-même ne peut pas trancher un
> écart de douze trades.

C'est la conclusion la plus large du chantier, et elle vaut d'être dite comme telle :
**le testeur MT5 a servi d'arbitre à tout ce dossier, et il vient de montrer qu'il n'en
est pas un au niveau de finesse qu'on lui demandait.** Un écart de douze trades sur 161
est du même ordre que le bruit que le courtier porte entre ses propres jeux de données.

**Ce que ça ne dit PAS**, et il faut le border : ça ne disculpe pas le moteur, ça retire un
chemin de preuve. Les douze trades existent toujours ; ce qui disparaît, c'est l'idée
qu'une modélisation plus fine les expliquerait.

##### Le coût du rejeu est venu d'une ligne du robot, et il est dans le produit depuis

**En mode tiques réelles, `TauxVersCompte` fait télécharger tout l'historique de tiques de
la paire croisée** — une ligne `download` par mois, de 202306 à 202510 pour EURHKD. Mesuré
chez l'utilisateur : **32 secondes devenues 27 h 57 estimées**. Le rejeu a été arrêté.

**Le comportement est le bon et ne change pas.** Sans cette sélection, la conversion échoue
et le robot retombe sur le refus — un instrument du portefeuille sans une seule position,
ce que « Refuser est la moitié du travail » a précisément fermé. Et la note du dépôt disait
« c'est peu » : **c'était vrai en mode OHLC, et cette phrase était une garantie vraie sur
son domaine lue comme générale** — la famille de `netlify.toml`, une fois de plus.

Ce qui manquait n'était pas un garde-fou, c'était de **pouvoir lire la cause** : mille
lignes de téléchargement sans une ligne disant pourquoi. Le robot annonce donc la paire
**avant** de la sélectionner, nomme le mode qui rend le coût explosif, et donne le remède —
ajouter la paire à l'Observation du marché avant le test.

> **Un coût qu'on ne peut pas anticiper se dit AVANT d'être engagé.** Après, ce n'est plus
> une information, c'est une autopsie — et le remède n'est actionnable qu'avant.

`dimension-devise.test.mjs` tient l'**ORDRE des deux gestes**, pas la présence du mot : un
message posé après `SymbolSelect` satisferait une recherche de chaîne et ne servirait à
rien. Éprouvé par mutation — déplacer le `PrintFormat` d'une ligne fait tomber la garde.
Son angle mort est déclaré : elle ne peut pas vérifier que la ligne sera **lue**.

##### C'EST LA PRÉDICTION QUI AVAIT TORT, PAS LE COMPTEUR — mesuré, sans rejeu

La question est restée ouverte trois jours : *5 et 28 avec une direction inversée, sur une
population que le compteur seul mesure — est-ce la prédiction qui se trompait, ou lui ?*
Elle ne coûtait pas un rejeu ; elle était dans le dépôt, et personne ne l'avait posée.

**Les cinq gardes existantes vérifiaient qu'il EXISTE, qu'il a une prise, qu'il SUIT la
mèche, qu'il survit à la découpe et au stockage. Aucune ne vérifiait que son NOMBRE est le
bon.** C'est la forme que ce dépôt connaît : une garde qui mesure que quelque chose bouge
n'a jamais mesuré que ça bouge JUSTE.

La mesure est un **recompte indépendant**, écrit depuis la définition et non depuis le
code : *une bougie écartée dont l'instant tombe pendant une position ouverte, et dont
l'extrême franchit le stop ou l'objectif de CE trade.* Le compteur du moteur avance un
pointeur en flux dans la boucle principale et lit `enPos` au passage ; le recompte
parcourt par TRADE et redérive l'objectif au lieu de le lire. Deux implémentations sans
rapport.

| mèche | vues | stop | objectif | les deux | |
|---|---|---|---|---|---|
| 0 % | 25 | 2 | 1 | 0 | **accord** |
| 0,5 % | 25 | 10 | 13 | 0 | **accord** |
| 3 % | 25 | 0 | 0 | 25 | **accord** |

**Le compteur compte juste, sur les quatre nombres et aux trois niveaux.** Donc l'hypothèse
des bougies écartées meurt **sur sa propre mesure** et non sur un doute — c'est la
meilleure façon dont une hypothèse puisse mourir, et c'est le compteur lui-même qui l'a
tuée.

**L'angle mort est déclaré et il est réel** : un recompte indépendant attrape une erreur
d'IMPLÉMENTATION — pointeur mal avancé, borne de position décalée, sens inversé (vérifié
par mutation : inverser les extrêmes sur l'objectif fait tomber la garde). Il n'attrape pas
une erreur de DÉFINITION partagée : si « franchir » devait se lire autrement, les deux se
tromperaient ensemble et s'accorderaient quand même. La portée est donc exactement ce
qu'elle annonce — **le compteur fait ce qu'il DIT faire**.

> **Vérifier qu'une mesure BOUGE n'est pas vérifier qu'elle compte JUSTE**, et c'est la
> seconde qui décide si une hypothèse est morte ou si c'est l'instrument. Le départage
> demande une seconde implémentation, écrite depuis l'énoncé — pas depuis la première.

**Et l'énoncé général est plus large que ce cas** : c'est la règle de la PRISE, déplacée
du rapport vers la réfutation.

> **Une prédiction réfutée par un instrument non vérifié ne réfute rien.**

Le dépôt exigeait déjà qu'une sonde prouve sa prise avant de RAPPORTER — `sautesVues`
pour `sautesSortie`, `cachesVues` pour `cachesStop`, quinze éléments cliquables avant un
verdict de tournée. Il manquait la moitié symétrique : **qu'un instrument prouve sa
justesse avant de TUER quelque chose.** Un compteur non vérifié qui contredit une
prédiction laisse les deux debout, et c'est le pire état d'un dossier — on croit avoir
éliminé, on a seulement échangé une incertitude contre une autre.

Le coût de l'oubli se lit ici : la prédiction est tombée le 18 septembre, et l'hypothèse
est restée dans les limbes **trois jours** — ni vivante ni morte — faute d'une mesure qui
tenait dans une heure et ne demandait aucun rejeu.

### Le candidat précédent est mort par son propre dénominateur

Les bougies sautées par `releve(i)` allaient à l'**envers** du symptôme :

| | sautées / franchissantes | écart |
|---|---|---|
| SILVEREURO | 413 / **53** | −3,2 |
| GOLD | 79 / **58** | −1,6 |
| IBEX 35 | 21 / **6** | −11,5 |

Cinquante-trois franchissements non relevés pour 3,2 points ; six pour 11,5. **Les deux
populations sont disjointes** — `releve` saute des bougies *présentes* dans la série,
`ecartees` compte celles qui n'y sont *jamais entrées* — et une seule explique quoi que
ce soit. C'est le dénominateur, posé la veille pour donner sa prise au zéro, qui a tué
l'hypothèse qu'il servait.

### Ce qui est livré, et la prédiction écrite AVANT la mesure

`nettoyer` retient les trois seules colonnes utiles des bougies écartées — l'instant et
les deux extrêmes, une quinzaine de kilo-octets pour neuf cents bougies contre plus d'un
mégaoctet pour la série. `backtesterSuivi` compte celles qui, **en position**,
franchissaient le stop ou l'objectif, réparties **stop / objectif / les deux**, la
troisième case à part parce que rien ne dit lequel d'abord.

**La prédiction est dans la garde, pour être relue telle quelle** : environ **dix** sur
IBEX, **douze** sur HongKong50, **zéro** sur GOLD, US30 et SILVEREURO. Si le compteur rend
ça, le statut passe à « cause établie » ; sinon c'est la prédiction qui tombe, par écrit.

**Et le troisième état est celui qu'on oublie.** Une série enregistrée avant cette version
ne porte pas les colonnes : `cachesDispo` vaut faux, et le bandeau dit « réimportez le
CSV » au lieu d'annoncer zéro. Confondre les deux disculperait la fenêtre sans qu'aucune
mesure ait eu lieu — sur le chemin même qu'on instrumente pour trancher.

**La série de banc porte le défaut qu'aucune famille d'exemple n'a** : les dix cotent les
mêmes heures toutes les années, donc `fenetreHomogene` n'y écarte rien et la propriété y
serait inéprouvable. Le banc fait coter 9 h→17 h en 2020 et 8 h→17 h en 2021 ; l'heure 8
est écartée, et c'est là qu'on pose les mèches. Zéro octet chez l'utilisateur — la même
règle que l'échelle des prix.

**Une assertion de cette garde n'est pas tombée sous mutation, et c'est comme ça qu'on l'a
su.** Elle bornait la découpe au 1ᵉʳ janvier 2021 ; l'amorce de 400 jours reculait la
borne à novembre 2019, donc aucune bougie n'était coupée et l'assertion passait avec ou
sans le filtre. La borne de FIN, elle, coupe — et la garde exige désormais qu'elle coupe
avant de vérifier ce qu'elle a coupé.

## Ce qu'un robot MQL5 a BÂTI n'est pas ce qu'il a FAIT TOURNER

**L'en-tête du `.mq5` décrit l'export ; les `input` décrivent le lancement, et MT5 les
mémorise.** Le testeur retient le dernier jeu utilisé par expert, un fichier `.set` le
remplace, l'onglet Réglages se règle à la main — et rien, dans la sortie du robot, ne
disait lequel avait servi. Un test lancé avec des paliers hérités d'un lancement
précédent coupe ses gagnants et adoucit ses perdants ; l'écart se lit alors comme un
défaut du moteur, et on le cherche dans le moteur.

Les deux lignes `VÉNA ENTRÉES EFFECTIVES` à `OnInit` rendent le cas décidable depuis le
seul journal. `scripts/mt5/journal-dit-ce-qui-decide.test.mjs` tient la surface par un
**registre** — la forme de `boucles-mql5`, et pour la même raison : « cette entrée
décide-t-elle ? » n'est pas une propriété du texte, `InpTaillePolice` et
`InpSlippagePoints` ont exactement la même forme. Chaque entrée est inscrite avec sa
raison, et la garde échoue **dans les deux sens**.

### Et un robot ne rend jamais des chiffres qui RESSEMBLENT à une mesure

`nomRobot` compose le nom du fichier avec `cfg.sym` : un `.ex5` nommé
`Vena_<compte>_Spain35_…` ne peut être né que d'un export de Spain35. Posé sur un
graphique d'un autre instrument, il tradait quand même — il lit `_Symbol`, pas le
symbole mesuré — et n'imprimait qu'un `ATTENTION` parmi dix lignes de démarrage. Les
chiffres obtenus avaient la forme d'une mesure de l'instrument affiché sans en être une.

C'est le pire mode de panne du dépôt, sous sa forme la plus coûteuse : **une mesure
fausse qui a l'air d'une mesure**, produite par la machine qui sert d'arbitre à tout le
chantier MT5. L'avertissement est donc devenu un **refus** — `INIT_FAILED` —, avec une
porte explicite pour le seul cas légitime : le même instrument sous un autre nom chez
le courtier (« GOLD » contre « GOLD.r »), qui demande de cocher `InpSymboleLibre`.

> **Un accident ne doit pas pouvoir se produire sans un geste ; un choix doit rester
> possible en un clic.** Entre les deux, un avertissement imprimé ne fait ni l'un ni
> l'autre.

#### Et le lendemain, la garde était désarmée — parce qu'elle refusait le cas NORMAL

Le refus comparait les chaînes BRUTES, et ce courtier écrit ses indices `#HongKong50`
là où la mesure porte `HongKong50` : il tombait sur le MÊME instrument, l'utilisateur
a coché `InpSymboleLibre` pour travailler, et la garde ainsi désarmée a laissé passer
le soir même ce qu'elle venait d'interdire. C'est la **règle 16**, née là — voir
« Une garde se juge aussi sur ses faux refus », plus haut, où la forme retenue (la
comparaison par NOYAU) est écrite avec ses onze cas mesurés.

## Refuser est la moitié du travail quand la réponse est disponible

La garde de devise a mordu, et elle a nommé sa cause — journal MT5, robot `260917.13`
sur `#HongKong50` : *« la valeur du tick (0.01000) est celle de la devise de cotation
HKD »*, puis zéro trade et solde inchangé. La valeur rendue valait **exactement** taille
du contrat × pas de cotation : le terminal n'avait pas converti, et le facteur 7 observé
est celui de EUR/HKD ≈ 8,5. Le statut de la garde est passé de « mécanisme non prouvé »
à « cause établie » sur cette ligne de journal.

**Et c'était quand même la moitié du travail.** Remplacer un chiffre faux par un refus
explicite est le bon sens du correctif — mais il laissait un instrument du portefeuille
sans une seule position, alors que **le taux est dans le terminal** : la paire croisée
existe, il suffisait de la chercher.

> **Un refus qui remplace un chiffre faux est juste ; un refus quand la réponse est à
> portée est une capitulation.** La question à poser devant tout refus : *ce qui manque
> est-il une donnée que personne n'a, ou une donnée que personne n'est allé chercher ?*

`TauxVersCompte` la cherche **par propriété** — devise de base et devise de profit de
chaque symbole du terminal, dans les deux sens, le cours inversé quand il le faut — et
jamais par un nom fabriqué : `EURHKD` n'existe pas chez tous les courtiers, `EUR/HKD`,
`EURHKD.r` et `HKDEUR` oui. Le taux trouvé s'imprime au journal, parce qu'il est ce qui
sépare un risque de 200 EUR d'un risque de 28. Le refus reste, en **dernier** recours,
quand aucune paire n'existe — et il le dit alors en toutes lettres, sans quoi il
renverrait l'utilisateur vérifier l'Observation du marché que le robot vient de parcourir.

### Où la réserve vit : là où la promesse se fait, pas là où le chiffre s'affiche

Tant que la conversion manque, la ligne du portefeuille affiche un R par an qu'aucun
robot ne peut réaliser chez ce courtier. La tentation est d'écrire l'avertissement **sur
la ligne** — et c'est le défaut qu'on vient de purger deux sections plus haut : Véna,
depuis le navigateur, ne sait pas dans quelle devise un courtier cote ni ce qu'il
renseigne. Un bandeau permanent y serait une affirmation qu'aucune mesure ne soutient.

Le R par an mesure des **prix**, et il reste vrai. Ce qui peut être faux est « un robot
réalisera ça chez mon courtier » — et cette promesse-là naît **au téléchargement du
robot**. La réserve vit donc dans l'infobulle du bouton Exporter, où elle est vraie,
vérifiable, et suivie du geste qui la tranche : lire la première ligne du journal du
test, qui dit lequel des trois cas s'est produit — converti (avec le taux), refusé (avec
la paire manquante), ou rien à convertir.

## Le bouton Exporter porte ce qu'on sait de la ligne — et pas un verdict

**STATUT · INSTRUMENTATION, AUCUNE CAUSE PRÉTENDUE.** Rien n'est réparé : trois faits que
l'application possédait déjà **séparément** sont rendus lisibles **ensemble**, à l'endroit
où la promesse se fait. La corrélation qu'ils portent est **RAPPORTÉE** — neuf instruments,
un seul courtier, un seul compte, mesures hors du dépôt.

La question du produit est *« ce robot fera-t-il ce que cette ligne annonce ? »*, et trois
faits l'ont prédite sur neuf instruments rejoués :

| le critère | les 6 concordants | les 2 divergents | les 3 non comparables |
|---|---|---|---|
| bougies retirées par la fenêtre horaire | 0 | ~900 | — |
| durée du résultat | 6,5–6,6 ans | 6,6 ans | 3,4 à 4,9 ans |
| reprise fidèle | fidèle | fidèle | **INCOMPLÈTE** |

Chacun vivait sur un écran différent — donc lisible par personne ensemble, au moment qui
compte. `reservesExport(v)` les réunit dans l'infobulle du bouton, et **rend vide quand il
n'y a rien à dire** : une ligne sans réserve ne doit pas ouvrir sur une phrase qui rassure.

### « Valide » est interdit, et l'énoncé porte son ÉCHANTILLON

C'est la règle du statut appliquée à un écran que voit un **client**. Ce qu'on a est une
corrélation sur neuf instruments chez un courtier ; « valide » promettrait une loi. La
formule est **« vérifié contre le testeur » ou « non vérifié »**, suivie de son
échantillon — *neuf instruments, un courtier, un compte* — sans quoi « le testeur rend 7 à
11 points en moins » se lit comme une règle.

> **Une ligne de statut fausse est pire que pas de ligne du tout**, et ça ne change pas
> parce que le lecteur est un client plutôt qu'un développeur.

**Et la phrase qui NIE le mot ne peut pas l'épeler.** Premier jet : « ils ne valident
rien ». La garde l'a refusé et elle avait raison — son interdit est **absolu**, sans quoi
il faudrait lui apprendre à distinguer l'affirmation de la négation, puis le cas suivant.
C'est le motif de plus que la règle 3 refuse. **Le texte a changé de mot, pas la garde
d'exception** : « ils n'attestent rien ».

### Trois occasions de se tromper, et les trois étaient déjà écrites dans ce fichier

Cet écran a fait mordre trois pièges que le dépôt avait documentés **avec leur sortie**, et
les trois se sont réglés en appliquant ce qui était écrit plutôt qu'en inventant :

| ce qui a mordu | ce que le dépôt disait déjà |
|---|---|
| le brief écrivait « bougies **hors séance** » | `fenetre-nest-pas-seance` : ce n'est PAS la séance — elles sont RETIRÉES de la série |
| l'échantillon coupé par le formateur (`… chez UN ' + 'courtier …`) | **troisième** fragmentation en littéraux : le seuil écrit d'avance disait de **concaténer avant de lire**, et c'est fait |
| l'apostrophe en échappement (`\u2019`) invisible à un motif portant le vrai caractère | `sorties-hors-seance` : s'ancrer sur un fragment **sans** apostrophe |

**Le deuxième est le plus instructif** : le seuil disait *« si le cas revient une troisième
fois, la conclusion n'est pas un troisième `prettier-ignore` — c'est de concaténer les
littéraux adjacents avant de lire »*. Il est revenu, et la prise a changé de forme : elle
cesse d'être « le texte tel qu'il est écrit » pour devenir **« le texte tel qu'il est
rendu »**, et la façon dont il est coupé cesse d'exister pour la garde.

`scripts/app/exporter-dit-ce-quon-sait.test.mjs` tient les mots et les trois états —
éprouvé par mutation, réintroduire « validee » la fait tomber. **Son angle mort est en
tête** : elle ne peut pas vérifier que la corrélation citée est encore vraie. Elle vient
de neuf rejeux hors dépôt, et si un dixième instrument la cassait, rien ici ne rougirait.
*C'est précisément pourquoi la phrase porte son échantillon plutôt qu'un verdict : le
texte dit ce qu'il est, faute de pouvoir être gardé.*

### Et le dossier MT5 se ferme ici, sans le rejeu court

Six candidats sont morts, **chacun par une mesure** : les paliers (0 % d'ambigus sans
sécurisation), le compteur de `releve` (mort par son propre dénominateur), les trois formes
du terme de 10 R (qui n'existait pas), le début de semaine (même règle, même horloge), la
qualité à 96 % (identique au centime), et l'ordre des extrêmes (la bande dépasse
l'amplitude d'une H1).

**Et l'arbitre s'est récusé lui-même** : `50 249 tick prices mismatch` entre l'historique de
tiques de FxPro et ses propres bougies M1, sur le même symbole. Le testeur se contredit de
plus que l'écart qu'on lui demandait de trancher.

**`ecartees` reste le meilleur prédicteur du chantier — et n'a plus aucun mécanisme.**
Zéro sur les six concordants, ~900 sur les deux divergents, sans exception ; et le
mécanisme qu'il suggérait est mort par son propre compteur, vérifié juste. C'est la
famille « une grandeur qui classe bien n'est pas celle du mécanisme », mesurée **jusqu'au
bout** pour la première fois : elle reste **utilisable comme signal et interdite comme
explication**, et c'est ce que l'infobulle en dit — elle indique où regarder, elle
n'atteste rien.

## Additionner des périodes qui ne se recouvrent pas

**STATUT · CAUSE ÉTABLIE — symptôme RAPPORTÉ, mécanisme et correctif MESURÉS DANS LE
DÉPÔT.** Le chiffre fondateur vient de l'écran d'un utilisateur : `+ 9,6 + 6,5 + 8,7 +
6,7 = 31,5 R/an` sur quatre lignes couvrant **3,4 / 4,1 / 4,9 / 6,5 ans**. L'addition est
juste ; la phrase est fausse. Tout ce qui suit — la fenêtre commune, l'exposition
simultanée, la redondance, les paris — se relit dans `moteur.js` et dans
`scripts/app/portefeuille-quatre-calculs.test.mjs`.

> **Une supposition écrite SOUS un chiffre qui la viole n'est pas un avertissement,
> c'est un aveu.** Le pied de page disait déjà « suppose que les lignes tournent sur la
> même période ». C'est la famille de la règle 9 poussée d'un cran : là, une réserve
> placée sous une affirmation la suit au lieu de la tempérer ; ici, la réserve DÉCRIT
> exactement ce qui rend le chiffre faux, et elle est imprimée trois fois plus petit.

Le grand chiffre est donc **recalculé sur la fenêtre commune** — `[max(début),
min(fin)]`, et seuls les trades entièrement dedans. Le brut garde sa place, **en note et
avec sa raison dans la MÊME phrase** : « + 31,5 R/an si l'on additionne les quatre
fenêtres — mais elles ne se recouvrent pas ». Séparer le chiffre de sa raison le rendrait
lisible comme une variante au choix — c'est la leçon de `TARIF_GELE`, appliquée à un
nombre au lieu d'une promesse.

**Trois états, et le troisième n'est jamais « zéro ».** Fenêtre commune pleine : les deux
chiffres. Fenêtre commune VIDE (deux lignes disjointes) : on le dit, et on n'affiche pas
d'agrégat — deux lignes qui n'ont jamais tourné ensemble n'ont pas un résultat de zéro,
elles n'en ont pas. Une seule ligne : sa fenêtre EST la fenêtre commune, et la note
disparaît.

### Trois autres calculs, et ils tenaient tous dans la même liste

| Ce que l'écran disait | Ce qu'il ne disait pas |
|---|---|
| « capital immobilisé 29 % du temps » | une MOYENNE. Quatre lignes à 1 % qui ouvrent le même jour font **4 % de risque simultané**, et c'est le simultané qui fait sauter un compte |
| « redondance non mesurée », derrière un bouton | la mesure est une agrégation de la liste de trades **déjà en main**. Un portefeuille de huit lignes dont six corrèlent est un portefeuille de deux |
| le nombre de LIGNES | le nombre de **paris** — les lignes après regroupement des paires au-delà de 0,70 |

**L'exposition simultanée rend le maximum ET le nombre de JOURS où il tient.** Un pire cas
atteint une fois en six ans est un accident ; atteint onze jours, c'est la façon dont le
portefeuille fonctionne. Le compte est ce qui les sépare, et sans lui le chiffre ne dit
pas laquelle des deux choses on regarde.

**La redondance corrèle les rendements MENSUELS des lignes, pas les prix.** L'ancienne
mesure prenait les variations journalières des cours sur 250 séances : deux
configurations OPPOSÉES sur le même instrument y étaient parfaitement corrélées. Et **un
mois sans position vaut zéro, pas « pas de donnée »** — écarter ces mois ferait correler
deux lignes sur les seuls mois où elles ont travaillé ensemble, ce qui est exactement la
question qu'on ne pose pas.

**Une variance nulle ne donne pas une corrélation de zéro : elle n'en donne aucune.**
`pearson` rend `null`, la case rend « — » avec sa raison, et le nombre de paris rend
« non mesurable ». Rendre 0 ferait lire « paris distincts » là où rien n'a été mesuré —
c'est la règle du zéro qui prouve sa prise, appliquée au produit et non à une sonde.

### Une porte unique, parce que quatre producteurs sont quatre occasions de diverger

Les quatre calculs sont quatre agrégations d'**une** liste : `pfTrades` la produit, et
elle seule. C'est la figure de `deposes` — une garde sur un chemin ferme un CAS, une
porte unique ferme la CLASSE. Un second producteur qui relirait la série divergerait du
premier, et **rien à l'écran ne le dirait**.

La porte décide sur un RÉSULTAT, pas sur une intention : une série non chargée ou une
configuration introuvable rendent `trades: null`, jamais une liste vide. « Aucun trade »
et « rien n'a été mesuré » sont deux états, et les confondre ferait annoncer un zéro que
personne n'a regardé.

**Le grand chiffre est donc REMESURÉ, la colonne du tableau ne l'est pas.** `pfTrades`
rejoue sous la règle actuelle du moteur ; la colonne « R / an » porte le chiffre
enregistré à la validation. Les deux peuvent différer, et c'est ce que dit la réserve
sous le bandeau — elle a changé de sujet en même temps que le chiffre.

### La frise mentait sur son alignement — et c'était le défaut qu'elle rend visible

Le calque de la maquette était posé sur le **conteneur** pleine largeur, avec un `left`
écrit en pixels. Mesuré par son auteur : **76 px de décalage**, la largeur de la colonne
des noms. La bande affirmait donc une fenêtre commune FAUSSE.

> **Un alignement est un défaut d'AFFICHAGE : il n'existe que rendu.** Deux chaînes
> `grid-template-columns` identiques dans le source ne prouvent pas que les deux boîtes
> tombent au même pixel. C'est le même énoncé que le mot relatif, sur une autre grandeur.

La bande est désormais une grille de **même gabarit** superposée à celle des barres : sa
deuxième colonne EST la piste des barres, calculée par le navigateur sur la même largeur.
`scripts/app/portefeuille-fenetre-commune.test.mjs` lit les rectangles dans un vrai
navigateur et compare la bande à la position que **ses propres pour-cent** désignent sur
la piste — pas à « quelque part dedans », qui est une garde vacue : une bande décalée mais
étroite y survivrait. Éprouvé par mutation : deux gabarits divergents de 76 px la font
tomber **en nommant l'écart mesuré** (75 px rendus).

**Et le calque se peint DERRIÈRE les barres.** Un élément statique passe sous un absolu :
la bande teintait les barres au lieu de teinter la piste, et 13 % d'accent sur du bleu
foncé ne se voit pas. La fenêtre commune redevenait invisible dans la figure écrite pour
la montrer.

### Ce que la colonne « Part » ne disait pas, et ce que les deux dates disent

`Part` décrivait sans conseiller — et elle décrivait une part d'un total qui, lui,
additionnait des fenêtres qui ne se recouvrent pas. Ce que l'utilisateur reporte
réellement dans le testeur, ce sont les **deux dates de la mesure** ; leur absence a coûté
une demi-journée sur AUDUSD, où le robot a tourné sur toute la série quand la mesure n'en
couvrait qu'un tiers. Comparer deux périodes différentes ne compare rien.

**Et l'étiquette de rangée dit « vérifié contre le testeur » ou « non vérifié — mesure sur
3,7 ans ».** Le mot « valide » y est interdit comme sur le bouton Exporter, et l'énoncé
porte son échantillon : ce qui est vérifié, c'est CETTE ligne chez CE courtier.
`exporter-dit-ce-quon-sait` tient les deux surfaces — l'infobulle et l'étiquette — sous le
même interdit **absolu**, et son faux refus connu est écrit dans sa tête (règle 16) : il
tombe aussi sur « validée » employé pour le geste de l'application, et c'est le TEXTE qui
a cédé, jamais la garde.

### Quatre pastilles identiques sur chaque ligne ne distinguent rien

`P2 P3 P4 P1` était rendu sur CHAQUE rangée, dans le même gris : impossible de savoir où
une ligne est rangée, puisque tout était marqué. Dans la table du portefeuille il ne
reste que les portefeuilles qui **contiennent** la ligne — une marque, pas une commande.
Le geste de placement vit dans « À ranger », où sa liste déroulante porte déjà son verbe,
et « Ranger une ligne ici… » vit au pied du portefeuille ouvert, là où le geste a un
sujet.

**Et « Retirer » a disparu de l'onglet « Toutes les lignes » : il n'y a pas de sujet.**
Laissé rendu, il ne faisait rien — un geste mort, que la tournée des gestes a attrapé à
sa première exécution. Un onglet de lecture ne porte pas les gestes d'un portefeuille.

**Un onglet vide reste VISIBLE, à demi-encre.** La version précédente masquait un
portefeuille sans ligne : il devenait un portefeuille qu'on ne peut plus remplir, puisque
le seul geste pour y ranger quelque chose vit à son pied. La note « N portefeuilles vides
masqués » est partie avec le masquage — une consigne périmée a l'autorité des vraies.

### Le banc devait pouvoir MESURER, et il ne le pouvait pas

`decisions` sème des lignes validées, et la page les affiche — mais aucune n'est
**rejouable** : `cfgDeLigne` cherche la configuration de la variante dans une table que
seule la boucle d'un vrai scan remplit. Les quatre calculs seraient donc tombés tous les
quatre dans leur état « non mesurable », et une garde de rendu posée là aurait mesuré le
DÉCOR — la borne n'aurait rien coupé. Le semis `portefeuille` pose la table par la
fonction du produit qui la construit, puis **relit par `pfTrades`** et jette si une ligne
ne rend aucun trade. C'est la règle 10 dans l'outillage, une fois de plus : le cas qu'on
sème spontanément est celui où le défaut ne peut pas se produire.

**Et la garde prouve sa prise avant de conclure** : elle exige que le grand chiffre et le
brut DIFFÈRENT sur le semis. S'ils sont égaux, la fenêtre commune n'a rien coupé et
l'assertion passerait avec ou sans le calcul qu'elle vérifie.

**Son premier faux refus a été attrapé à sa première exécution** : `/0 % au pire/` trouve
« 3,0 % au pire ». Un zéro non ancré refuse le cas normal — c'est la règle 16 sur un
motif de trois caractères, et c'est le genre de garde qu'on désactive le soir même.

## Un réglage seul sur sa rangée coûte 40 px pour un champ de 50

**STATUT · CAUSE ÉTABLIE, MESURÉE DANS LE DÉPÔT** pour le gain : même semis, mêmes plis,
la page passe de **3 057 à 2 865 px rendus** — 192 px, mesurés dans un navigateur sur le
fichier livré. La maquette de l'utilisateur annonce ~390 px sur son cas (quatre lignes et
trois portefeuilles à comparer, que le banc n'a pas) ; les deux chiffres décrivent deux
écrans, et celui du dépôt est celui qu'un test peut relire.

**Les deux plus gros gains n'étaient pas du serrage : deux bandes ont DISPARU.** « Creux
redouté 20 % » occupait une rangée entière pour un champ de 50 px de large ; il vit au bout
de l'en-tête de sa section, où la place est déjà payée. « N configurations contre la
détention de M instruments » a été remplacée par un **`Tous (N)`** dans la ligne
« Comparer », qui reçoit au passage « Part détenue » et « Sans risque », poussés à droite.

> **Un réglage qui vit seul sur sa rangée paie une rangée entière pour lui.** Le remède
> n'est pas de rétrécir la rangée, c'est de trouver la ligne où la place est déjà payée.

Même mouvement en plus petit : le renvoi « ▸ Détail par instrument » entre au bout de la
phrase du pied au lieu d'occuper une rangée — ce qui a demandé de remplacer un `details`
natif par un pli de la même fabrique que les trois autres, un `summary` ne pouvant pas
vivre à la fin d'un paragraphe.

**Et une réserve ne se supprime pas au nom de la place.** La bande supprimée portait, en
plus de sa description, un fait qui n'est pas décoratif : des instruments du portefeuille
sont HORS comparaison faute de série chargée. Il survit à sa rangée, en une phrase courte
dans la ligne « Comparer ». Le point d'interrogation qui porte les hypothèses de
conversion reste lui aussi.

### Ce qui est COMMUN n'appartient pas aux lignes

Cinq des huit réglages étaient identiques sur les quatre lignes — « Croisement et
Rebond », « Aucune sécurisation », « Lecture basse », « Frais courtier », « D1 ». Répétés
quatre fois, ils n'aident pas à comparer : l'œil doit trier pour trouver les trois qui
distinguent.

> **Le gain n'est pas surtout la place, c'est que la comparaison devient possible.**

Ils sont hissés en note de l'en-tête de colonne, et chaque ligne ne garde que sa
différence. **La note se DÉCOUVRE : elle est l'intersection des réglages des lignes
affichées** (règle 7). Écrite à la main, elle porterait une hypothèse que personne ne
réviserait — le jour où un sixième réglage deviendrait commun, ou où l'un des cinq
cesserait de l'être, elle resterait verte en décrivant un état qui n'existe plus, et elle
se lirait comme une note dérivée.

`scripts/app/reglages-communs-decouverts.test.mjs` mesure **les deux sens** au rendu : ce
qui est commun aux trois lignes est dans la note et sur AUCUNE rangée ; ce qui distingue
est sur sa rangée et PAS dans la note. Éprouvé par deux mutations — une note écrite en dur
tombe, et une note à laquelle on ajoute un réglage non commun tombe aussi.

**Le banc a dû apprendre à porter les deux états.** Trois lignes de configuration
identique ne font exister que la moitié du mécanisme : tout serait hissé, rien ne
redescendrait. Le semis donne donc à la dernière ligne une période différente — c'est la
règle 10 dans l'outillage, encore : le cas qu'on sème spontanément est celui où la moitié
du défaut ne peut pas se produire.

**La note s'enroule, elle ne se tronque pas.** Ce qu'elle porte ne figure plus sur les
rangées : une ellipse sur un écran étroit retirerait de l'écran ce qu'on vient d'y hisser,
et une infobulle ne s'ouvre pas toute seule.

### Le serrage, lui, est mesuré et sans conséquence

| | avant | après |
|---|---|---|
| courbe de capital | 160 px | 112 px |
| rangées de la comparaison des portefeuilles | 3 px | 1 px de gouttière |
| rangées d'instruments | 10 px | 8 px |
| en-têtes de section pliables | 12 px | 9 px |
| chiffres de la section hasard | 28 px | 25 px |
| totaux de la comparaison | 28 px | 20 px |

La courbe est le plus gros gain unitaire : **un creux se voit autant sur 112 px que sur
168**, et c'est vérifiable — le creux le plus profond y est tracé entre son sommet et son
fond, pas seulement chiffré en légende.

### Changer le conteneur ne déplace pas ce qui est imbriqué dedans

Le rapport porte un incident d'implémentation qui vaut d'être écrit : un premier correctif
avait remis le conteneur en colonne mais laissé les réglages À L'INTÉRIEUR de la rangée du
nom. **Rien ne bougeait à l'écran, et le correctif a été annoncé fait.** C'est l'utilisateur
qui a dit non.

> **C'est la règle 11 sur un correctif de MISE EN PAGE : seul le rendu prouve qu'un
> élément a bougé.** Une déclaration CSS juste sur un conteneur ne dit rien de ce que ses
> enfants font, et une garde de source lirait la déclaration.

C'est pourquoi la garde de la note de réglages lit l'écran — le texte rendu de la note et
celui de chaque rangée — et non le gabarit. Sa première assertion est une PRISE : si
aucune note n'est rendue, elle tombe en nommant ce piège, plutôt que de vérifier des
absences sur un écran vide.

## Une déclaration valide qui ne peint rien, et personne ne le dit

**STATUT · PANNE OBSERVÉE (RAPPORTÉE), MÉCANISME MESURÉ DANS LE DÉPÔT.** L'utilisateur
rapporte une page qui a perdu sa structure entière — tous les cadres disparus — « sans une
seule erreur de console », pour un `var(--color-border)` qui n'existe pas dans le système
lié. Le mécanisme se relit : une propriété personnalisée non résolue rend la déclaration
INVALIDE, et `border-style` retombe à `none`.

> **Une couleur peut échouer de deux façons, et aucune des deux ne se plaint.** Le jeton
> n'existe pas : la déclaration est jetée. Ou le jeton existe et vaut la même couleur que
> ce sur quoi il se pose : la déclaration s'applique, et ne produit rien.

**Le second cas a été mesuré ici, et il contredisait la maquette.** `--color-neutral-100`
vaut `#f5f5f8` ; le fond de carte `--color-bg` vaut `#f2f2f3`. Le « bandeau teinté » d'un
en-tête de section est donc **trois unités PLUS CLAIR que sa carte** — il ne teinte rien.
Le jeton qui porte ce rôle dans ce système s'appelle `--color-surface` (`#e9e9ea`), neuf
unités plus sombre, et c'est son nom qui le désigne.

`scripts/app/couleur-qui-existe.test.mjs` tient les deux, et chacun se garde là où il est
lisible :

| Le défaut | Où il se voit | Ce que la garde lit |
|---|---|---|
| le jeton n'existe pas | dans le SOURCE — un nom se lit | tout `var(--…)` écrit, contre les définitions de la feuille vendorée **et** de celle qui est réellement livrée |
| le jeton ne teinte pas | au RENDU seulement | la luminance de la bande contre celle de la première couleur DIFFÉRENTE au-dessus d'elle |

**La feuille livrée ne voyage pas en clair.** Elle part en `data:text/css;base64` pour que
le fichier unique se suffise en `file://`. Un relevé à plat du solo n'y trouve donc aucune
définition et déclarerait les vingt-trois propriétés orphelines — une garde qui accuse
tout n'accuse rien. Elle est décodée, et c'est elle qu'on lit.

**Et la comparaison saute les parents de la MÊME teinte.** L'en-tête d'une section porte
parfois sa rangée, tintée pareil : se comparer à elle rend toujours zéro, c'est-à-dire un
verdict sur le décor. Éprouvé par mutation, dans les deux sens — un jeton inexistant, et
le retour au jeton plus clair, qui tombe en annonçant **−4 unités**.

**Ce qui n'est pas fermé, et qui est relevé.** Treize autres fonds de l'application sont
posés en `--color-neutral-100` ; plusieurs sont dans le même cas et ne teintent rien. La
garde ne couvre que les trois bandeaux d'en-tête du portefeuille — c'est écrit dans sa
tête, et c'est une file, pas une panne.

**Et le seuil de sa généralisation est écrit avec elle**, parce qu'un angle mort déclaré a
une date de péremption et qu'il ne sert que si la note dit quoi remplacer. Sa portée est
un LIEU — « les trois bandeaux du portefeuille » —, et un lieu ne se généralise pas, il se
déplace (règle 8). La PROPRIÉTÉ, elle, est déjà dans son corps : *ce fond teinte-t-il ce
qu'il recouvre ?* Le jour où le sujet revient, la prise ne change pas — seule la
découverte des éléments cesse d'être `button.tete.carte` pour devenir « tout fond non
transparent posé dans une carte ».

**Son coût est un faux refus à prévoir** (règle 16), et c'est ce tri-là qui reste à faire,
pas la mesure : une pastille, une case de matrice de corrélation, un témoin de légende
sont des fonds VOULUS proches de leur voisin. Les prendre pour des bandeaux ratés
désarmerait la garde le premier jour. Et toucher les treize d'un coup sur des écrans
qu'on n'a pas mesurés est la façon ordinaire dont un correctif introduit un défaut.

## Une grille dont les colonnes portent du sens compte ses cellules

**STATUT · CAUSE ÉTABLIE — symptôme RAPPORTÉ sur `260918.7`, cause relue DANS LE DÉPÔT.**
« Retirer » occupait la colonne « Période à tester », qui se tassait à gauche. L'en-tête
déclarait **sept** pistes, le corps **huit**.

La cause est une suppression : « Retirer » vivait à côté de « Part », la colonne « Part »
est partie, et il est resté — il s'est décalé d'un cran et a partagé la cellule des dates.

> **Deux gabarits écrits l'un en face de l'autre sont deux vérités à tenir d'accord, et
> elles divergent sur la première suppression.** C'est la même famille que « une grille
> dont le nombre de colonnes porte du sens s'écrit, elle ne se calcule pas », vue depuis
> l'autre bout : là on déléguait le compte à `auto-fit`, ici on l'écrivait deux fois.

Il n'y en a plus qu'un, `grilleLigne`, lu par l'en-tête et par chaque rangée, et « Retirer »
a sa propre piste — sans intitulé, parce que c'est une action de rangée, mais elle EXISTE
des deux côtés.

**La garde mesure au RENDU, et c'est ce qui la rend juste.** Deux gabarits identiques dans
le source ne prouvent pas deux grilles identiques à l'écran : c'est la grille CALCULÉE qui
décale, et elle dépend de la largeur du parent, du `gap`, d'une piste `max-content`.
`scripts/app/grille-compte-ses-cellules.test.mjs` compare les pistes résolues en pixels et
le compte de cellules. Mutation : retirer une cellule d'en-tête la fait tomber en nommant
les deux comptes.

### Et le tiret qui couvrait trois causes

Même écran, même rapport : la colonne rendait « — » sur toutes les lignes. Mesuré : le
repli de `normValides` — celui qui complète une ligne validée depuis la meilleure ligne
connue — ne recopiait pas `t0`/`t1`. Ils n'étaient pas dans sa liste de champs.

> **Un tiret qui couvre trois causes n'en nomme aucune : il disculpe sans avoir
> regardé.** C'est la règle des trois états, celle des quatre calculs du portefeuille,
> appliquée à une date.

Deux corrections, et la première est la plus importante : **la période vient désormais des
trades MESURÉS**, c'est-à-dire de la même liste que la frise, le bilan et la corrélation.
La page ne peut donc plus afficher une durée d'un côté et deux tirets de l'autre — ce qui
est exactement ce qui a été rapporté, et ce qui a fait croire que les bornes existaient.
À défaut, les bornes enregistrées ; à défaut de tout, la cellule DIT ce qui manque —
« bougies / non chargées », « configuration / introuvable », « bornes / non enregistrées ».

### Une infobulle qui recouvre une action est une action perdue

Le `title` du dépli vivait sur la rangée ENTIÈRE : une infobulle native s'ouvre sous le
curseur où qu'il soit, donc celle-ci s'ouvrait au-dessus du bouton « Exporter » de la
rangée suivante et le masquait. Elle vit sur le chevron — quatorze pixels, à gauche, loin
de tout bouton.

**La garde qui tenait le dépli s'est réancrée** (règle 14, deuxième issue) : son ancre
portait le `title` de la rangée, qui est parti ; son invariant — la rangée se déplie au
clic, donc la coupure de propagation du retrait a un objet — n'a pas bougé.

## Un accord qui tient par ANNULATION D'ERREURS

**C'est la voisine de la règle 15, et elle est pire.** Là, une sonde muette rend le défaut
indistinguable du cas normal. Ici, c'est un **accord juste** qui est indistinguable d'un
accord **fortuit** — et rien, dans aucun des deux maillons pris isolément, ne dit lequel
des deux on a.

Le cas mesuré : la règle de début de semaine du robot et celle du moteur s'accordent
parfaitement. Pas parce que les deux lisent UTC — **aucun des deux ne le fait**.

| | ce qui est lu |
|---|---|
| `robot-mt5.js` | `TimeToStruct(TimeCurrent(), …)` → heure **serveur** du courtier |
| `Export_H1_Vena.mq5` | `TimeToString(r[i].time, …)` → la même, en horloge murale |
| `moteur.js` · `lireCsv` | `Date.UTC(an, mois-1, jour, h, m)` → cette horloge murale **rangée en UTC** |
| `moteur.js` · `executable` | `getUTCDay()` / `getUTCHours()` → **ressort l'heure serveur** |

`lireCsv` range une heure de serveur dans un champ UTC ; `executable` l'en ressort telle
quelle. **Deux erreurs qui s'annulent exactement**, et le résultat est juste.

> **Un accord qui tient par annulation d'erreurs est indistinguable d'un accord par
> justesse.** Seule une garde qui lie les MAILLONS les sépare — aucune garde posée sur un
> maillon ne le peut, puisque chaque maillon, pris seul, a tort.

**Et le danger n'est pas le maillon fautif : c'est le maillon CORRIGÉ.** Quelqu'un qui
lirait `lireCsv` et déciderait, de bonne foi, d'y interpréter le fuseau « pour bien
faire » romprait l'accord — et **aucun test ne rougirait**, parce que chaque moitié serait
devenue *plus* correcte. C'est le seul cas du dépôt où réparer casse.

### Et l'annulation est LOAD-BEARING bien au-delà de la règle qui l'a révélée

Mesuré en cherchant les autres consommateurs : `moteur.js` porte **vingt-trois** lectures
`getUTC*`, et la plus lourde n'est pas la règle de début de semaine. C'est
`resamplerBrut`, qui construit le **seau D1** sur
`Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())` — appliqué à une horloge
murale de serveur, ce seau est le **jour calendaire du courtier**, c'est-à-dire exactement
la frontière sur laquelle MT5 bâtit ses barres D1.

**Toute décision en `ut: 'D1'` — la plus courante du produit — repose donc sur cette
annulation.** Ce n'est pas une bizarrerie tolérable dans un coin : c'est ce qui aligne le
moteur sur le testeur, et ça n'était écrit nulle part.

`scripts/mt5/meme-horloge.test.mjs` lie les maillons — la forme de `manifeste-version`,
qui liait trois chemins : *le défaut ne serait dans aucun d'eux pris isolément, il serait
dans leur désaccord.* **Son angle mort est chiffré** : elle couvre **deux** des
vingt-trois lectures, les deux dont on a mesuré qu'elles portent l'accord avec MT5. Les
vingt et une autres suivent la même convention sans garde, et une conversion de fuseau
posée dans `lireCsv` les emporterait toutes ensemble.

**Le signal, au moment d'écrire :** *ce maillon est-il juste TOUT SEUL, ou seulement en
compagnie du suivant ?* Quand la réponse est « en compagnie », l'accord se documente à
l'endroit où il se produit — dans une garde qui lit les deux — et jamais dans un
commentaire posé sur l'un des deux, qui sera lu comme une excuse pour un défaut local.

### Et si une vraie conversion devient nécessaire : on NOMME avant de convertir

C'est le geste à faire le jour où quelqu'un aura une raison d'interpréter un fuseau, et il
n'est pas celui qui vient à l'esprit. **Le réflexe est de corriger `lireCsv` ; c'est
exactement ce qui casse.**

L'ordre est l'inverse : la convention se rend d'abord **explicite**, en nommant l'horloge —
*heure serveur du courtier* — partout où elle est lue, **jusque dans les identifiants**. Le
lecteur suivant sait alors qu'il n'y a rien à convertir, et la conversion, si elle reste
nécessaire, se pose sur une chaîne dont chaque maillon dit ce qu'il porte.

> **Un commentaire ne suffira pas ; un nom, si.** C'est la leçon de `sessionInfo` devenu
> `fenetreHeuresInfo` : un champ qui nomme mal ce qu'il porte coûte plus cher qu'un champ
> absent, et un commentaire qui explique une convention ne se lit qu'après qu'on l'a
> enfreinte.

La consigne vit aussi **dans le message de `meme-horloge`**, parce que c'est là qu'elle
arrive au moment où elle sert — une garde de convention doit ENSEIGNER la convention, pas
opposer un veto, et un veto se contourne.

## Une sonde dont l'échec est silencieux par conception se garde ailleurs

Le témoin de version comparait ce que sert l'adresse publique à ce que la page est. Il a
été MUET depuis le jour où il a été écrit, et personne ne l'a vu — parce qu'il est muet
quand il échoue, et que c'est **le bon choix** : un fichier ouvert en `file://`, un avion,
un pare-feu ne doivent pas produire un avertissement permanent. *L'absence d'information
n'est pas une information.*

La conséquence n'avait pas été tirée : un chemin faux devient alors indistinguable d'un
utilisateur à jour. Le silence choisi pour le cas légitime couvre aussi le cas cassé.

> **Le témoin ne peut pas être son propre témoin.** Quand une sonde est conçue pour se
> taire en cas d'échec, rien à l'intérieur d'elle ne signalera jamais qu'elle a cessé de
> fonctionner : la vérification vit nécessairement dehors.

Ici, dehors veut dire `scripts/app/manifeste-version.test.mjs` : il lie les trois sources
qui doivent s'accorder — le chemin où `publier-solo` dépose, celui que `netlify.toml` sert,
celui que l'application demande. Le défaut n'était dans aucune des trois prise isolément ;
il était dans leur **désaccord**.

**Et la classe est probablement plus large qu'un cas.** Toute lecture qui retombe en
silence — un `catch` qui rend `null`, un `if (!r.ok) return`, un repli sur une valeur par
défaut — a le même besoin. Elles ne sont pas recensées ; c'est une file, pas une panne.

### Sa cause dans cette occurrence : la règle 12, appliquée à une URL

`netlify.toml` sert `/app` par une **réécriture** (`status = 200`), pas une redirection :
l'URL du document reste « /app », sans barre finale, donc la base des chemins relatifs est
« / » et `fetch('version.json')` partait à la racine du site. Un chemin relatif emprunte
son sens à un point fixe — « depuis où » — et un document servi sous deux formes n'en a
pas. C'est le même énoncé que « ci-dessous » depuis une barre collante et « hier » sur une
fenêtre figée, sur un référentiel qu'on n'aurait pas pensé y ranger.

**Et un chemin absolu n'est pas la réponse générale** : en `file://` — l'usage recommandé —
`/app/version.json` devient `file:///app/version.json`, un voisin qui n'existera jamais.
Les deux référentiels s'écrivent donc tous les deux, plutôt qu'un chemin qui a l'air
général. C'est la garde `aucun-voisin` qui l'a dit, et elle avait raison.

## Le test qui tient la convention

`scripts/app/nom-vena.test.mjs` échoue si l'ancien nom réapparaît ailleurs que dans la
migration et l'import de sauvegarde, si un accent se glisse dans un chemin, une clé ou un
nom de fichier, ou si un fichier du dépôt reprend l'ancien nom.
