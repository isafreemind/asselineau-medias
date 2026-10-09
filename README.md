# La France indépendante - Médiathèque

Application React et TypeScript pour consulter, télécharger et partager des vidéos, images, GIF et publications composées de plusieurs fichiers. L'interface reprend la maquette multiformat : papier ivoire, bleu profond, touches tricolores et décor gravé discret.

## Démarrer

Prérequis : Node.js 24, Git, Git LFS et FFmpeg (avec `ffprobe`).

```powershell
npm.cmd ci
npm.cmd run dev
```

Ouvrir l'adresse affichée, normalement <http://localhost:5173>. Sous Windows, utiliser `npm.cmd` si PowerShell bloque `npm.ps1`. Les fichiers d'exemple sont déjà présents et clairement identifiés. Ils ne contiennent pas de discours ou de citations authentiques de François Asselineau.

```powershell
npm.cmd run validate:content
npm.cmd run build
npm.cmd run check:build
npm.cmd run preview
```

La construction valide le JSON et les fichiers, compile TypeScript et React, puis génère les pages HTML individuelles, les miniatures JPEG de partage et les archives ZIP. Le rapport complet est écrit dans `reports/media-validation.json` et conservé comme artifact dans GitHub Actions. Les erreurs interrompent la construction ; les avertissements sont affichés.

`check:build` contrôle les liens des pages générées, leurs métadonnées, les dimensions des aperçus sociaux et l'intégrité des fichiers contenus dans les ZIP. Exécuter ce contrôle avec les mêmes variables d'environnement que le build.

## Modifier les textes et le catalogue

Les textes et réglages généraux se trouvent dans **`content/site.json`** :

- `site` : nom, titre d'accueil, description, présentation et pied de page ;
- `labels` : textes des commandes et messages de l'interface ;
- `shareMessage` : message de la fenêtre de partage ;
- `categories` : thèmes dans l'ordre souhaité ;
- `validationRules` : limites de poids et paramètres de contrôle.

Chaque publication possède son propre **`public/media/<dossier>/media.json`**.
Il n'existe plus de liste centrale à maintenir. Les dossiers immédiats de `public/media/`
sont découverts automatiquement, puis les données sont validées et intégrées au catalogue
React et aux pages statiques lors de la construction. Le navigateur n'a pas besoin de
lister les dossiers ni de charger des centaines de fichiers JSON séparément.

Utiliser du JSON standard : pas de commentaires, pas de virgule après le dernier élément.
Enregistrer en UTF-8. Le serveur local recharge le catalogue à l'ajout, à la modification
ou à la suppression d'un dossier ou d'un fichier. Le site publié nécessite un nouveau build.

### Ajouter un média

1. Créer un sous-dossier par publication dans `public/media/`, puis y déposer ses fichiers, ses variantes et ses miniatures.
2. Ajouter un fichier `media.json` dans ce dossier, sur le modèle ci-dessous.
3. Exécuter la validation et corriger les erreurs signalées.

Exemple de `public/media/discours-independance-01/media.json` :

```json
{
  "id": "discours-independance-01",
  "title": "Le titre du média",
  "description": "Son contexte et sa présentation.",
  "date": "2026-10-03",
  "type": "video",
  "category": "independance",
  "tags": ["France", "souveraineté"],
  "file": "discours-01.mp4",
  "thumbnail": "discours-01.jpg",
  "width": 1080,
  "height": 1920,
  "alt": "Description du visuel pour les personnes qui ne peuvent pas le voir",
  "featured": false,
  "demo": false,
  "order": 10
}
```

Les chemins sont **relatifs au dossier contenant `media.json`**, sans slash initial,
sans `../` et sans référence à une autre publication. Les fichiers manquants et les
liens sortant du dossier sont refusés. `id` doit rester unique et stable : il détermine
l'adresse `medias/discours-independance-01/`. `category` correspond à un thème déclaré
dans `content/site.json`. Le catalogue affiche les publications par `date`, de la
plus récente à la plus ancienne. À date identique, `order`, entier facultatif
(1000 par défaut), classe les plus petits nombres d'abord ; les identifiants
départagent ensuite les égalités.
Renommer un dossier ne change pas le lien de partage si son `id` reste le même.

Pour retirer une publication, supprimer son dossier puis reconstruire le site : sa
carte, sa page de partage et son ZIP disparaissent sans nettoyer de liste ailleurs.
Un dossier présent sans `media.json` déclenche une erreur explicite plutôt qu'une omission.

Types disponibles : `image`, `video`, `gif`, `audio`. Pour l'audio, les dimensions décrivent le visuel de couverture. Les dimensions des images et vidéos doivent correspondre aux fichiers réels. L'orientation et le ratio sont calculés automatiquement. `featured` affiche un badge sans modifier l'ordre choisi dans le JSON. `source`, facultatif, fournit un lien vers la source du contenu.

La `description` présente l'idée portée par le média : son message, sa progression
et sa conclusion, à partir de la description éditoriale du projet source lorsqu'elle
existe. Les dimensions, durées, codecs, poids et avertissements restent dans les
métadonnées et les rapports de validation. Pour une création fictive ou par IA,
conserver une courte mention de ce statut et la signature de l'auteur.

Le classement suit la publication, pas l'extension : une affiche et son GIF restent
ensemble dans `media/asselineau-2027/`. Pour une BD, conserver toutes les planches
dans le même dossier, avec un numéro d'ordre dans le nom. Chaque publication possède
tous ses fichiers : même les exemples ne dépendent plus d'un autre dossier.
Cette organisation ne change pas les règles Git LFS ni le déploiement.

Les prévisualisations du catalogue utilisent `thumbnail`, avec le ratio de l'original et sans recadrage. Pour un rendu cohérent, fournir une miniature de même ratio que le média ; une couverture adaptée convient pour l'audio. Les originaux se chargent uniquement sur leur page. Les GIF sont lus sur leur page, leur animation n'est pas chargée dans tout le catalogue.

### Une BD avec plusieurs planches

Une BD correspond à **un dossier et un `media.json`**. Le champ `file` contient la première planche. Ajouter les planches suivantes dans `parts`, dans l'ordre de lecture :

```json
"parts": [
  {
    "title": "Planche 2",
    "type": "image",
    "file": "02.png",
    "thumbnail": "02-miniature.jpg",
    "width": 1080,
    "height": 1350,
    "alt": "Description de la deuxième planche"
  },
  {
    "title": "Planche 3",
    "type": "image",
    "file": "03.png",
    "thumbnail": "03-miniature.jpg",
    "width": 1080,
    "height": 1350,
    "alt": "Description de la troisième planche"
  }
]
```

La publication conserve une seule carte, une seule adresse et une miniature de partage fondée sur la première planche. Sa page permet de sélectionner les planches, de télécharger celle affichée ou d'obtenir l'ensemble en ZIP. Les noms dans l'archive sont préfixés `001-`, `002-`, `003-` pour préserver l'ordre. Les groupes peuvent également mêler différents types de fichiers.

Le ZIP est généré à la construction. Dans l'aperçu de développement, il est fourni par Vite pour permettre de tester la même action. L'archive ajoute du poids au site publié : originaux et ZIP sont tous deux comptés dans le contrôle de capacité.

### Variantes de format

`variants` désigne des versions alternatives du même média, à distinguer de `parts`, qui désigne les parties d'une publication :

```json
"variants": [
  {
    "label": "Version carrée pour X",
    "file": "discours-01-carre.mp4",
    "width": 1080,
    "height": 1080
  }
]
```

Les variantes sont proposées au téléchargement sur la page. Les archives groupées contiennent les parties originales, pas toutes les variantes. Une variante d'un autre type peut préciser `type` (par exemple `image` pour l'affiche originale d'un GIF).

## Contrôler les formats pour X

Le validateur inspecte les fichiers réels avec Sharp et FFprobe : dimensions, extension, format, taille, durée, pistes audio/vidéo, codecs, débit et fréquence d'images. Il signale les incohérences et les formats ou poids peu adaptés à X. Il ne convertit pas vos originaux.

Les paramètres X sont modifiables dans `validationRules.x` ; la durée et la taille vidéo par défaut ciblent les comptes sans Premium. Les possibilités Premium et les interfaces de publication peuvent avoir des limites différentes. La date `checkedOn` suit la dernière vérification documentaire ; un avertissement invite à réviser les règles après 90 jours. Ce contrôle technique ne garantit pas l'acceptation finale d'un fichier par le réseau.

Sources vérifiées le 3 octobre 2026 : [vidéos X](https://help.x.com/en/using-x/x-videos), [images et GIF X](https://help.x.com/en/using-x/posting-gifs-and-pictures).

## Git LFS

Les vidéos et les formats sources lourds sont déjà déclarés dans `.gitattributes`. Les petites images et miniatures restent dans Git classique.

```powershell
git lfs install --local
git lfs pull
git lfs track
```

Pour une image ou un GIF particulièrement lourd (par exemple au-delà de 10 Mo), suivre le fichier précisément au lieu de basculer toutes les petites images dans LFS :

```powershell
git lfs track "public/media/ma-bd/planche-originale.png"
```

Ajouter et versionner `.gitattributes` avec les fichiers concernés. Pour des fichiers déjà committés, éviter toute migration automatique de l'historique sans validation préalable. Git LFS a ses propres quotas de stockage et transfert.

Le workflow utilise `actions/checkout` avec **`lfs: true`** : il récupère les vrais fichiers avant de construire le site. Le validateur détecte les pointeurs LFS non récupérés. Git LFS améliore le versionnement ; il n'augmente pas les limites d'hébergement de GitHub Pages. Le build contrôle aussi le poids final, ZIP et miniatures sociales compris.

## Déployer sur GitHub Pages

1. Créer ou choisir le dépôt GitHub auquel rattacher ce projet et y pousser la branche `main` avec les fichiers LFS.
2. Dans **Settings → Pages → Source**, sélectionner **GitHub Actions**.
3. Le workflow `.github/workflows/pages.yml` construit et publie à chaque push sur `main`. Il est également déclenchable manuellement.

Le préfixe `/nom-du-depot/` et l'origine publique sont calculés automatiquement dans Actions. Le cas d'un dépôt `utilisateur.github.io` est également pris en charge. Aucun serveur applicatif ni espace d'administration n'est nécessaire.

Pour tester localement un déploiement dans un sous-dossier :

```powershell
$env:GITHUB_REPOSITORY = 'votre-compte/Asselineau'
$env:GITHUB_PAGES_URL = 'https://votre-compte.github.io/Asselineau/'
npm.cmd run build
npm.cmd run preview
```

Les pages individuelles contiennent déjà dans le HTML leurs balises Open Graph et X, avec une miniature JPEG dédiée de 1200 × 630 conservant le contenu complet. Les plateformes peuvent mettre en cache les aperçus et choisissent elles-mêmes quand les afficher. L'aperçu social est distinct du fichier original téléchargeable. Les constructions locales sans configuration utilisent une origine `localhost` ; les adresses publiques sont appliquées lors de la publication Actions.

## Organisation des fichiers

```text
content/site.json          Textes, catégories et réglages généraux
src/schema.ts             Schéma de validation et types TypeScript
src/main.tsx              Interface React
src/style.css             Identité visuelle et adaptation mobile
public/media/             Un dossier par publication : originaux, variantes, miniatures
public/media/*/media.json  Définition autonome de chaque publication
public/patrimoine.png     Décor gravé du bandeau
scripts/                  Validation, pages statiques et exemples
scripts/catalog.ts        Découverte et résolution des définitions locales
dist/                     Site prêt à publier (généré, ignoré dans Git)
reports/                  Rapport de validation (généré, ignoré dans Git)
design/                   Maquettes et références de conception
```

Les exemples peuvent être régénérés avec `npx.cmd tsx scripts/create-demo-assets.ts` ; cette commande remplace uniquement les fichiers `exemple-*` de démonstration. Ne pas l'utiliser pour vos propres fichiers.

Le décor `public/patrimoine.png` a été créé avec l'outil intégré de génération d'images. Le brief de génération est conservé dans `design/prompt-patrimoine.md`.
