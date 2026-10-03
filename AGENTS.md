# AGENTS.md — Médiathèque Asselineau

## Objet du projet

Construire une plateforme web statique destinée à centraliser et diffuser des contenus médiatiques consacrés à François Asselineau, afin de contribuer à sa visibilité en dehors des médias traditionnels.

Le site doit être compatible avec un déploiement sur GitHub Pages. Toute décision technique doit donc rester compatible avec un hébergement statique, sauf demande explicite contraire.

## Fonctionnalités principales

Le site doit pouvoir accueillir différents types de médias :

- vidéos ;
- images ;
- GIF animés ;
- autres formats utiles à la communication politique, notamment sur X.

Chaque média doit :

- pouvoir être consulté ou lu directement depuis la page lorsque le navigateur prend en charge son format ;
- être proposé dans un format adapté à son utilisation et, en particulier, à sa publication sur X ;
- pouvoir être téléchargé facilement ;
- disposer d'une fonction de partage fournissant un lien direct vers le média ou sa page dédiée.

Il n'existe pas d'interface d'administration. Les fichiers médias sont ajoutés manuellement au projet. Les textes généraux sont pilotés par `content/site.json` et chaque publication par son propre `public/media/<dossier>/media.json`, sans intervention dans le code React.

Le chemin retenu par défaut est `content/site.json`. Ce fichier constitue la source de vérité pour :

- les principaux textes éditoriaux du site ;
- les catégories et leur ordre d'affichage ;
- les règles de validation et les messages de l'interface.

Chaque `media.json` définit le titre, la description, la date, le type, la catégorie,
les mots-clés, le texte alternatif, les dimensions, la mise en avant, les parties et
les variantes de sa publication. Les chemins sont relatifs à son propre dossier :
aucune publication ne doit dépendre des fichiers d'une autre. `order` détermine
l'ordre du catalogue (entier croissant, défaut 1000, puis identifiant).

Découvrir les définitions automatiquement au build et en développement, sans liste
centrale maintenue à la main. Générer le catalogue client et les pages statiques à
partir de la même découverte. Supprimer un dossier doit retirer sa publication au
prochain build, sans autre nettoyage. Signaler les JSON invalides, identifiants
dupliqués, fichiers absents et chemins hors du dossier avec un message précis.

Conserver les fichiers binaires séparés du JSON. Utiliser des identifiants stables et uniques pour les médias afin qu'une réorganisation ou une modification de titre ne casse pas les liens existants.

Définir un schéma TypeScript correspondant au JSON et valider automatiquement le fichier avant chaque construction. En cas d'erreur, indiquer précisément l'entrée et le champ concernés avec un message compréhensible. Éviter les champs techniques inutiles et fournir un fichier d'exemple documenté dans la documentation du projet.

Le catalogue doit être conçu dès l'origine pour plusieurs centaines de médias. Utiliser notamment la pagination ou le chargement progressif, les miniatures, le chargement différé et un index de recherche léger afin que la taille du catalogue ne dégrade pas l'expérience.

## Fenêtre de partage

Une publication peut regrouper plusieurs fichiers ordonnés, par exemple les planches d'une BD. La publication conserve une seule carte dans le catalogue, un seul identifiant et une seule page de partage. Le fichier principal et les fichiers complémentaires sont décrits dans le JSON ; l'ordre de la liste détermine l'ordre de lecture.

Permettre de consulter chaque fichier sur la page du groupe, de télécharger un fichier individuellement ou de télécharger la publication complète en ZIP. Générer les archives lors de la construction et non au clic sur le site publié. Ne pas confondre les parties d'un même récit avec les variantes de format d'un média.

L'action de partage doit ouvrir une fenêtre contextuelle contenant le lien de partage et le message suivant :

> Voici le lien de partage. Toutefois, pour garantir que ce média reste toujours accessible, nous vous recommandons de le télécharger directement, puis de le publier sans dépendre de ce lien.

La fenêtre doit permettre de copier facilement le lien et de télécharger directement le média.

Le lien partagé doit mener vers une page propre au média, et non directement vers le fichier. Chaque page de média doit disposer de métadonnées sociales statiques, notamment Open Graph et X Cards, avec un titre, une description, une URL canonique et une miniature absolue adaptée. Ces balises doivent être présentes dans le HTML livré au robot du réseau social ; ne pas compter uniquement sur une modification dynamique effectuée par React dans le navigateur.

Pré-générer les pages de médias au moment de la construction afin de conserver React et TypeScript tout en produisant des aperçus sociaux fiables sur un hébergement statique.

## Orientation éditoriale

Le site porte le message politique central suivant :

> Ni droite, ni gauche : pour une France indépendante.

L'objectif est de présenter les contenus et les prises de parole de François Asselineau de manière claire, accessible et directement exploitable par les visiteurs.

Le ton éditorial doit être affirmatif, précis et pédagogique. Ne pas affaiblir artificiellement les conclusions par des précautions oratoires inutiles. Distinguer néanmoins clairement les faits établis, les raisonnements, les hypothèses et les interprétations.

## Identité visuelle

L'interface doit être :

- moderne, claire et agréable à utiliser ;
- adaptée aux ordinateurs comme aux appareils mobiles ;
- inspirée par l'histoire de France, son patrimoine, son rayonnement et ce qui a construit sa notoriété dans le monde ;
- rassembleuse et indépendante des codes graphiques traditionnels de la droite et de la gauche.

Ne faire aucun lien visuel, symbolique ou éditorial avec l'Union européenne. Ne pas employer le drapeau européen, ses étoiles ou une palette graphique susceptible de devenir l'identité dominante du site.

L'identité française doit rester élégante et contemporaine : éviter l'accumulation de symboles, les décors surchargés et l'esthétique institutionnelle vieillissante.

## Principes d'interface

- Mettre les médias au premier plan.
- Rendre immédiatement visibles les actions de lecture, de téléchargement et de partage.
- Afficher clairement le type, le format et, lorsqu'elles sont disponibles, les dimensions ou la durée de chaque média.
- Utiliser des lecteurs natifs ou largement compatibles pour les vidéos, les sons et les animations.
- Prévoir une solution compréhensible lorsqu'un format ne peut pas être lu directement par le navigateur.
- Conserver des parcours simples, rapides et accessibles, notamment sur mobile.
- Ne pas charger tous les fichiers originaux à l'ouverture du catalogue : charger d'abord les métadonnées et les miniatures, puis le média complet à la demande.
- Prévoir une pagination ou un chargement progressif compatible avec plusieurs centaines de médias.
- Ne pas concevoir la grille comme si tous les contenus étaient en 16:9. Elle doit présenter correctement les médias horizontaux, carrés et verticaux destinés aux réseaux sociaux.
- Conserver des cartes extérieures régulières pour faciliter le parcours d'un grand catalogue, mais afficher chaque média dans une zone d'aperçu respectant son rapport d'origine, sans recadrage destructeur. Utiliser `object-fit: contain` ou un équivalent, avec un fond neutre cohérent lorsque des marges sont nécessaires.
- Afficher sur chaque carte un badge de format explicite, par exemple `16:9`, `1:1`, `4:5` ou `9:16`, en plus du type de fichier.
- Permettre de filtrer les médias par orientation ou format : horizontal, carré et vertical.
- Sur la page individuelle, afficher le média dans son rapport natif et proposer séparément les variantes disponibles pour les réseaux sociaux.
- Ne jamais utiliser la miniature sociale comme substitut au fichier original : la miniature de partage et le média téléchargeable répondent à deux usages distincts.

## Contraintes techniques

- Utiliser Git LFS pour les vidéos et les fichiers sources lourds lorsque cela est justifié. Éviter d'y placer systématiquement toutes les petites images. Le workflow doit récupérer les fichiers LFS réels avant construction ; vérifier que le site ne publie aucun pointeur LFS à la place d'un média.

- Développer l'interface avec React et TypeScript. Ne pas produire une application principale en JavaScript non typé.
- Conserver le typage strict et définir des interfaces explicites pour les médias, leurs métadonnées, leurs formats et leurs liens.
- Garantir le fonctionnement du site sur GitHub Pages.
- Ne pas dépendre d'un serveur applicatif pour les fonctions essentielles.
- Employer des chemins compatibles avec un déploiement dans un sous-répertoire GitHub Pages.
- Préserver le téléchargement des fichiers dans leur format original lorsque cela est pertinent.
- Optimiser l'affichage sans dégrader inutilement la qualité des médias proposés au téléchargement.
- Éviter qu'un lien de partage soit présenté comme une garantie de conservation permanente du média.
- Déployer uniquement sur GitHub Pages, au moyen d'un workflow GitHub Actions adapté à la construction React et à la pré-génération des pages de médias.
- Surveiller la taille totale du site publié et la consommation prévisible de bande passante. GitHub Pages limite actuellement un site publié à 1 Go et applique une limite souple de 100 Go de bande passante par mois ; signaler avant intégration tout lot de médias susceptible d'approcher ou de dépasser ces limites.

## Validation des médias

À chaque ajout, analyser automatiquement, lorsque le format le permet :

- le type MIME et l'extension ;
- la taille du fichier ;
- les dimensions et le rapport largeur/hauteur ;
- la durée, le codec, le débit et la fréquence d'images des vidéos ;
- la présence d'une miniature sociale exploitable ;
- la compatibilité avec la lecture dans les navigateurs modernes et avec une publication sur X.

Classer automatiquement l'orientation du média (`horizontal`, `carre` ou `vertical`) et exposer son rapport dans le catalogue JSON ou dans les données générées à partir de celui-ci.

La validation ne doit pas bloquer silencieusement un média. Produire un rapport clair distinguant les erreurs bloquantes des avertissements et proposer, si nécessaire, les dimensions ou le format de conversion appropriés.

Pour X, vérifier les exigences officielles en vigueur au moment de l'ajout plutôt que de figer définitivement les seuils dans le code. Préférer pour les vidéos largement diffusables un conteneur MP4, une vidéo H.264 et un son AAC. Les règles de validation doivent rester configurables pour suivre l'évolution des réseaux sociaux.

Générer ou demander une miniature dédiée lorsque l'original ne convient pas à l'aperçu social. Aucun texte, visage ou élément essentiel ne doit se trouver dans une zone susceptible d'être recadrée.

## Référentiel commun

Avant toute modification importante, consulter le référentiel éditorial partagé situé dans :

`C:\Users\laslite\Documents\IA COMMON`

Le fichier `analysis\profil_intellectuel.md` sert de référence pour la méthode, la clarté, la progression argumentative et la voix éditoriale. Les consignes explicites du projet et de la demande en cours restent prioritaires.

## Contrôle avant livraison

Avant de considérer une modification comme terminée, vérifier que :

1. le site reste déployable sur GitHub Pages ;
2. les médias pris en charge sont lisibles directement sur la page ;
3. chaque média peut être téléchargé ;
4. la fonction de partage affiche le message prévu et permet de copier le lien ;
5. l'interface fonctionne sur ordinateur et sur mobile ;
6. l'identité visuelle évoque la France sans référence à l'Union européenne ;
7. le positionnement « Ni droite, ni gauche : pour une France indépendante » demeure clair ;
8. les contenus factuels nouveaux ont été vérifiés et leurs sources sont identifiables.
9. le rapport de validation signale les médias mal dimensionnés, trop lourds ou incompatibles avec X ;
10. chaque page individuelle contient des métadonnées sociales statiques et une miniature adaptée ;
11. le catalogue conserve de bonnes performances avec plusieurs centaines d'entrées ;
12. la taille du déploiement reste compatible avec les limites de GitHub Pages.
13. les textes généraux se trouvent dans `content/site.json` et les définitions dans les `media.json` de chaque publication ;
14. les JSON sont valides, chaque média possède un identifiant unique et chaque fichier référencé existe dans son propre dossier.
