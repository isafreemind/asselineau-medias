# Grandissez et comprenez - dossier d’intégration

Source : `C:\Users\laslite\Documents\Git\surLaBete`, intégrée le 9 octobre 2026.

Les trois fichiers correspondent à trois publications distinctes, chacune avec sa carte, sa page de partage, son aperçu social et son téléchargement :

- `affiche-frexit-sept-partis` : affiche originale PNG ;
- `grandissez-frexit-sept-partis` : vidéo MP4 ;
- `grandissez-frexit-sept-partis-gif` : boucle courte GIF.

Chaque dossier contient son propre `media.json`, son fichier original et sa miniature. Les identifiants et les liens de partage sont conservés lors de la réimportation. Les trois fichiers fournis sont conservés sans conversion ni modification et se consultent directement sur leurs pages respectives. Aucun personnage du référentiel de BD n’est employé : le prompt demande sept élus fictifs anonymes. Les fichiers mis à jour portent la signature @Be_Free_Mind dans la marge inférieure.

Réimportation des trois fichiers mis à jour et du prompt le 9 octobre 2026. Les fichiers du premier import, son prompt et son rapport sont archivés dans `avant-mise-a-jour/`, hors du site publié. Les miniatures sont régénérées à partir des nouveaux fichiers ; les descriptions et textes alternatifs mentionnent leur signature.

## Intention et documentation fournies

- `affiche-frexit-prompt.txt` : prompt original de l’affiche, copié sans modification. Aucune image de référence n’est indiquée dans ce prompt ni présente dans le dossier source.
- `cout-eurodeputes-francais-par-parti.md` : dossier documentaire fourni, conservé sans modification avec sa méthode, ses hypothèses et ses liens vers les sources primaires. Il décrit une projection annualisée, pas des dépenses exécutées ou des aides aux partis. Les montants ne démontrent pas les motivations des formations politiques.

La description publique restitue la question, la scène et la conclusion de la satire. Elle conserve la distinction entre les moyens associés aux mandats et le financement des partis. Les chiffres détaillés restent dans le visuel et le document source.

## Vérification des fichiers réels

- PNG : 1024 × 1536, ratio 2:3, environ 2,57 Mo.
- MP4 : 768 × 1152, ratio 2:3, vidéo H.264, pixels `yuv420p`, 24 images/s, son AAC stéréo à 32 kHz, durée du conteneur 5,184 s, environ 10,99 Mo. Pas de conversion nécessaire.
- GIF : 768 × 1152, 18 images à 10 images/s, durée mesurée 1,80 s, environ 4,79 Mo. Il représente une boucle plus courte que la vidéo, pas son intégralité.
- `apercu.jpg` : miniature statique propre à chaque dossier, sans recadrage. L’affiche utilise une copie JPEG réduite de son original ; la vidéo et le GIF utilisent chacun leur première image. Le GIF conserve le réglage `thumbnail: grandissez.gif` choisi dans son JSON. Le build produit séparément les trois aperçus sociaux de 1200 × 630 avec marges.

L’inspection de l’affiche et d’images de la vidéo au début, au milieu et à la fin confirme les sept lignes, la porte FREXIT, les inscriptions principales et les notes de bas de page. La composition entière est conservée. Les petites notes nécessitent l’ouverture du média en grand ; la miniature sociale privilégie la conservation de l’affiche complète. Le prompt conservé concerne l’affiche ; aucun prompt d’animation ni durée demandée n’a été fourni.

Les pages officielles X ont été sollicitées lors de l’intégration, mais ont répondu HTTP 403. Les règles existantes vérifiées le 3 octobre 2026 restent inchangées ; cette tentative ne constitue pas une nouvelle vérification documentaire. Les fichiers sont contrôlés automatiquement selon ces seuils configurables par `npm.cmd run build`.

Le rapport `verification.json` conserve les empreintes SHA-256, les caractéristiques mesurées et les résultats des contrôles. La vidéo est couverte par la règle Git LFS `*.mp4` existante. Le PNG et le GIF restent dans Git classique.
