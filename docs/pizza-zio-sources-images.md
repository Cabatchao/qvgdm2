# Pizza Zio — sources et traitement des photographies

Sélection vérifiée visuellement le 28 octobre 2026. Cinq photographies existantes sont reprises pour retrouver l’univers du site historique et montrer les lieux et objets de la marque. Aucune image générée et aucun visage ajouté.

Les trois premiers fichiers viennent de la landing historique `growth-franchise-zio.vercel.app`, dont les sources HTML déclarent ces URLs. Les deux derniers figurent dans le code de la page officielle [Devenir franchisé](https://pizza-zio.fr/devenir-franchise/). La présence sur le site historique prouve la réutilisation de son visuel ; elle ne permet pas, à elle seule, de certifier le lieu exact du shooting ou le nom du photographe.

## Fichiers utilisables

| Fichier principal | Dimensions | Poids | Variante responsive | Texte alternatif descriptif |
| --- | --- | --- | --- | --- |
| `zio-pizza.webp` | 900 × 1600 | 170.7 Kio | `zio-pizza-480.webp` (60.8 Kio) | Une pizza garnie et une assiette de pâtes sur une table en bois. |
| `zio-table.webp` | 900 × 1600 | 155.6 Kio | `zio-table-480.webp` (55.5 Kio) | Une pizza et une assiette de pâtes servies sur une table en bois. |
| `zio-calzone.webp` | 900 × 1600 | 218.0 Kio | `zio-calzone-480.webp` (77.1 Kio) | Deux pizzas repliées accompagnées de roquette et de tomates. |
| `zio-service.webp` | 900 × 1350 | 95.0 Kio | `zio-service-480.webp` (33.9 Kio) | Des mains se passent une pile de boîtes portant le nom Pizza Zio. |
| `zio-restaurant.webp` | 1200 × 800 | 84.9 Kio | `zio-restaurant-640.webp` (34.7 Kio) | Le comptoir et les tables d’un restaurant Pizza Zio. |

## Provenance exacte

- **zio-pizza** : https://growth-franchise-zio.vercel.app/landing-page/assets/img/pizza.jpg
  - SHA-256 de la source JPEG téléchargée : `988eca646f7c69764ec642dcd3221ae8bcc51dec72a14492cbe91b01040ed533`.
- **zio-table** : https://growth-franchise-zio.vercel.app/landing-page/assets/img/ambiance.jpg
  - SHA-256 de la source JPEG téléchargée : `7231379a14dcfbe077793c6e69b31a5cb5d2046084ae7782feae2bba22b732ad`.
- **zio-calzone** : https://growth-franchise-zio.vercel.app/landing-page/assets/img/pasta.jpg
  - SHA-256 de la source JPEG téléchargée : `a630244d7acd9dbe41dac5e4ea2a7d8fd4f5472195f87b3b131a9e75e8cfadc2`.
- **zio-service** : https://pizza-zio.fr/wp-content/uploads/2024/10/zio-marcq2-scaled.jpg
  - SHA-256 de la source JPEG téléchargée : `4aaa3ffebe35ac5eb193e59969409379a4c58f9bf4ffa2b1093f7821ecc57ae6`.
- **zio-restaurant** : https://pizza-zio.fr/wp-content/uploads/2024/10/zio-marcq4-scaled.jpg
  - SHA-256 de la source JPEG téléchargée : `969477620e60e4c845a6c9bcf12a9a9998e428fa98ef47c1804a5633f4130114`.

## Choix de présentation

- L’image de pizza convient à l’ouverture ; les photos de service et de restaurant donnent ensuite une réalité à l’exploitation.
- Préserver les cadres verticaux des photos de plats et alterner leur position. Le fichier de service garde son ratio 2:3 et le restaurant son ratio 3:2 ; aucun portrait 9:16 n’a été fabriqué en coupant le sujet.
- Une seule photographie doit être chargée en priorité ; les autres restent en chargement différé. Utiliser `srcSet` et `sizes`, fixer les dimensions et éviter de précharger tous les médias.
- L’export de consultation doit copier ces fichiers locaux ; aucun hotlink n’est nécessaire.

## Corrections par rapport aux noms historiques

Les noms et textes alternatifs de l’ancien site ne correspondent pas toujours à ce que montrent les photographies : `interieur.jpg` est une assiette de pâtes, `equipe.jpg` reprend presque la même composition de plats que `ambiance.jpg`, et `bar.jpg` montre des plats. Ils ne constituent donc pas des preuves visuelles d’un intérieur, d’une équipe ou d’un bar. Les fichiers retenus sont nommés et décrits d’après leur contenu effectivement observé.

## Traitement technique

Conversion JPEG → WebP, application de l’orientation EXIF, réduction proportionnelle avec filtre Lanczos, qualité 82 pour le principal et 80 pour la variante. Pas de modification des plats, des personnes, des logos, des couleurs ou du cadrage. Les métadonnées EXIF ne sont pas recopiées. Les textes et logos présents dans la photographie restent ceux de la source.

Les URLs ci-dessus identifient les sources ; aucun crédit de photographe ou régime de licence distinct n’a été trouvé dans les pages examinées. La liste permet au réseau de rattacher ces médias à ses droits et crédits existants avant une campagne publique.
