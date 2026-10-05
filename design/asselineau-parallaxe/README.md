# Affiche animée - parallaxe 2,5D

Source originale : `public/media/asselineau-2027/asselineau-affiche.jpg` (inchangée).
Livrable : `public/media/asselineau-2027/asselineau-parallaxe.gif`.

Le visage visible provient exclusivement des pixels de la photographie originale.
Une carte de profondeur couvre le visage, le cou, les épaules et le buste jusqu'en bas.
La caméra va de gauche à droite, puis revient, avec reprojection des textures selon
leur profondeur : le nez, les joues, les oreilles et les vêtements ne se déplacent
plus comme une seule couche plate. Aucun dialogue ou événement n'est inventé.
Il s'agit d'une illusion de profondeur 2,5D, pas d'un véritable modèle tridimensionnel.

Les lettres des slogans, le bandeau du nom, la date, le QR code et les mentions légales
à gauche restent fixes. Le buste bouge derrière les lettres. La texture des vêtements
cachée par les éléments imprimés est reconstituée ; cette partie est une approximation,
pas une nouvelle photographie authentique. La résolution est réduite et le GIF
utilise une palette indexée, comme tout GIF ; il ne s'agit pas d'un export sans perte.

Le fond caché derrière le portrait est reconstitué par le **mode intégré imagegen**.
Prompt exact, avec l'affiche originale comme image de référence :

> Use case: precise-object-edit. Input image 1 is the edit target, an original vertical poster. Asset type: clean background plate for deterministic 2.5D animation. Remove the entire photographed man and ALL lettering, colored name banner, slogans, legal vertical text, logos and QR code from this image. Reconstruct ONLY the soft teal/turquoise fabric-like radial folds and blurred cyan rays background across the entire canvas, continuing the original background visible in the upper left and upper right. Keep the original vertical aspect ratio 1890:2693 and original background palette and diffuse lighting. The output must be an empty full-bleed turquoise/teal photographic backdrop with subtle broad folds, no people, no face, no silhouettes, no typography, no watermark, no dark suit shapes, no yellow, no border. It will be used behind the unmodified original portrait; do not redraw a portrait.

Reproduction depuis la racine du projet (Node, dépendances npm et FFmpeg requis) :

```powershell
npm.cmd exec -- tsx scripts/create-parallax-gif.ts
```

Prompts définitifs de profondeur et de reconstruction du buste : `prompts-relief.md`.
Paramètres et poids mesurés : `export.json`.
Les images intermédiaires dans `frames/` sont ignorées par Git.
Le script exige un poids final strictement inférieur à 10 000 000 octets.
Il vérifie aussi la boucle, le nombre d'images, la stabilité des pixels imprimés
sur plusieurs images décodées du GIF et le mouvement du haut et du bas du buste.
Cette animation n'est pas ajoutée automatiquement au catalogue JSON du site.
