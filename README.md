# Photo Automation Pipeline 📱✨

**Automatisation Photoshop en un clic : détourage de l'arrière-plan, ajustement et centrage des photos produit sur un gabarit, puis export en WebP prêt à publier — pour un dossier entier en une seule exécution.**

Conçu pour toute personne qui traite des photos de produits (téléphones, gadgets, peu importe) pour des fiches e-commerce, des catalogues ou les réseaux sociaux, et qui en a assez de répéter les cinq mêmes étapes Photoshop pour chaque image.

---

## Ce que le script fait réellement

Indiquez-lui un dossier de photos produit brutes ainsi qu'un gabarit `.psd` (votre format de canevas + un calque de texte/logo), et il va, pour **chaque image du dossier** :

1. **Ouvrir l'image.**
2. **Détecter si l'arrière-plan est encore plein** — même si le fichier est un PNG (le script vérifie la transparence réelle des pixels, pas seulement le type de fichier ou l'indicateur de calque, donc il ne se laisse pas tromper par un "PNG opaque").
3. **Supprimer automatiquement l'arrière-plan** grâce à la détection de sujet par IA intégrée à Photoshop (Sélectionner le sujet), puis convertir cette sélection en transparence réelle.
4. **Copier le détourage sur votre gabarit**, le redimensionner (seulement si nécessaire) pour qu'il tienne dans le canevas, et le centrer — avec une petite marge en haut/bas plutôt que de toucher les bords.
5. **Nettoyer la pile de calques** : supprimer tout calque restant/en trop, conserver votre calque de texte, et le remettre systématiquement tout en haut.
6. **Exporter en WebP à 85% de qualité**, avec exactement le même nom que l'image source, dans un sous-dossier `webp` à côté de vos originaux.

Aucun détourage manuel, aucun redimensionnement manuel, aucun renommage de fichier, aucun risque d'oublier d'aplatir un calque égaré.

## Avant / Après

| Entrée | Sortie |
|---|---|
| Photo produit brute, fond blanc/plein, taille aléatoire | Détourage transparent, centré sur votre gabarit, WebP à 85%, même nom de fichier |

## Prérequis

- **Adobe Photoshop 2022 (v23) ou plus récent** — l'export WebP natif via script nécessite cette version.
- Une **connexion internet** — la suppression d'arrière-plan utilise la fonction cloud "Sélectionner le sujet" de Photoshop (Adobe Sensei), qui doit contacter les serveurs d'Adobe.
- Un **gabarit `.psd`** contenant :
  - Le format de canevas souhaité (ex. 600×600).
  - Un calque de texte (logo, filigrane, étiquette, ce que vous voulez garder en permanence au-dessus).

## Installation

1. Téléchargez `batch_process_images.jsx` depuis ce dépôt.
2. Dans Photoshop, allez dans **Fichier → Scripts → Parcourir…** et sélectionnez le fichier, **ou** placez-le dans votre dossier Photoshop `Presets/Scripts` pour qu'il apparaisse en permanence dans **Fichier → Scripts**.

## Utilisation

1. Lancez le script (**Fichier → Scripts → batch_process_images**).
2. Choisissez le **dossier contenant vos images sources** (`.jpg`, `.jpeg`, `.png`, `.tif`, `.tiff`, `.bmp`,`.wepb`).
3. Choisissez votre **fichier gabarit `.psd`**.
4. Laissez faire. Le script traite chaque image du dossier et enregistre les résultats dans un nouveau sous-dossier `webp`.
5. Une fenêtre de confirmation s'affiche une fois le traitement terminé.

Vos images d'origine et votre fichier gabarit ne sont **jamais modifiés ni écrasés** — tout est ouvert, traité en mémoire, puis fermé sans être enregistré.

## Pourquoi la vérification de la transparence est importante

Un piège courant : Photoshop marque le calque unique d'un JPG comme un calque "Arrière-plan" verrouillé, ce qui pousse à supposer que "pas Arrière-plan = déjà détouré." Cette hypothèse ne tient plus pour un PNG opaque, qui s'ouvre comme un calque normal (déverrouillé) même si le fond est encore entièrement plein. Ce script vérifie plutôt si les contours réels des pixels du calque remplissent tout le canevas — un indicateur bien plus fiable pour savoir si une image a réellement besoin d'un détourage.

## Limites connues

- La qualité du détourage dépend entièrement de l'IA "Sélectionner le sujet" de Photoshop — excellente sur des photos produit nettes, moins prévisible sur des fonds chargés/complexes.
- Les groupes de calques imbriqués dans les images sources ne sont pas parcourus (le script attend une image à plat).
- Nécessite un accès internet pour chaque image traitée (détection de sujet basée sur le cloud).

## Auteur

Créé par **Walid Najjar**.

N'hésitez pas à me suivre / me contacter sur LinkedIn : [linkedin.com/in/walidnajjarr](https://www.linkedin.com/in/walidnajjarr/)

## Licence

MIT — utilisez-le, modifiez-le, intégrez-le dans votre propre flux de travail.
