# Parallaxe - Unis pour la France

Source : `C:/Users/laslite/Documents/Git/fastDVDNet/comic-workflow/asselineau-unis-pour-la-france.png`, copiée sans modification dans `original.png`.

Animation déterministe de 6 secondes, caméra allant de gauche à droite. Le personnage conserve sa pose ; les bandeaux et les murs portant les inscriptions restent fixes. Seul le décor central se déplace horizontalement, avec un déplacement plus faible pour la carte lointaine que pour la ville. Les transitions de profondeur sont progressives. Aucun zoom, mouvement de marche ou changement d'expression.

Le GIF boucle avec un retour instantané au cadrage initial ; il n'y a pas de trajet inverse. MP4 H.264 sans son, 720 × 900, yuv420p et faststart. GIF optimisé, 480 × 600, palette de 128 couleurs, 10 images par seconde.

Le fond caché par le personnage a été reconstitué avec imagegen à partir de l'affiche originale. Prompt :

> Create a clean background plate for deterministic layered parallax animation of this exact poster. Preserve exact image dimensions composition and alignment. Remove ONLY the central man completely, reconstruct the tricolor map and Paris city scenery behind him plausibly. Remove all typography from the top headline and bottom slogan banner, filling with surrounding dark navy texture. Preserve the left and right walls and their GAUCHE and DROITE inscriptions exactly, preserve sky lighting architecture and foreground rubble. This is a static clean plate, no animation, no new objects.

Seules les zones sous le masque du personnage utilisent cette reconstitution. Le personnage et les inscriptions proviennent de l'original. `verification.json` mesure leur invariance avant compression ; la quantification GIF et la compression vidéo peuvent modifier les couleurs après encodage.

Reproduction : `node scripts/animate-unis-parallax.mjs`. Les exports restent dans ce dossier et ne sont pas ajoutés au catalogue du site.
