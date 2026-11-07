export const franchiseData = {
  brand: 'Pizza Zio',
  foundingYear: 1983,
  founder: 'Angelo Ascone',
  origin: 'Calabre',
  firstCity: 'Roubaix',
  formats: ['À emporter', 'Avec restaurant'] as const,
  // Conditions et accompagnement confirmés par l’équipe le 7 novembre 2026.
  onboarding: 'Rejoindre Pizza Zio, c’est bénéficier d’une formation complète, d’un accompagnement au lancement et de prix négociés auprès de fournisseurs centralisés.',
  entryFee: 30_000,
  entryFeeTax: 'TTC',
  royaltyPercent: 5,
  royaltyBase: 'HT',
  contractYears: 10,
  benefits: [
    { title: 'Des achats organisés', description: 'Des prix négociés auprès de fournisseurs centralisés pour vos approvisionnements.' },
    { title: 'Une formation complète', description: 'Une formation complète pour préparer votre activité au sein du réseau Pizza Zio.' },
    { title: 'Un lancement accompagné', description: 'Un accompagnement au lancement de votre établissement.' },
  ],
  recruitingArea: 'Nord (59)',
  // Adresses officielles pizza-zio.fr, coordonnées BAN / IGN vérifiées le 7 novembre 2026.
  // Mérignies utilise le point du restaurant publié dans le lien Google Maps officiel.
  // Les années connues sont celles confirmées par le responsable du projet.
  restaurants: [
    {
      "id": "marcq",
      "city": "Marcq-en-Barœul",
      "opened": 1991,
      "address": "27 rue Jules Guesde",
      "postcode": "59700",
      "url": "https://pizza-zio.fr/marcq-en-baroeul/",
      "coordinates": [
        3.074187,
        50.667454
      ],
      "mapLabel": [
        -22,
        -28,
        "end"
      ]
    },
    {
      "id": "capinghem",
      "city": "Capinghem",
      "opened": 2025,
      "address": "2 bis rue de l’Église",
      "postcode": "59160",
      "url": "https://pizza-zio.fr/pizza-zio-capinghem-pizzas-artisanales-sur-place-a-emporter-ou-livraison-rapide/",
      "coordinates": [
        2.965628,
        50.64466
      ],
      "mapLabel": [
        0,
        -31,
        "middle"
      ]
    },
    {
      "id": "saint-andre",
      "city": "Saint-André-lez-Lille",
      "opened": 2002,
      "address": "32 rue du Général Leclerc",
      "postcode": "59350",
      "url": "https://pizza-zio.fr/saint-andre-lez-lille/",
      "coordinates": [
        3.05193,
        50.659182
      ],
      "mapLabel": [
        -27,
        8,
        "end"
      ]
    },
    {
      "id": "lesquin",
      "city": "Lesquin",
      "opened": null,
      "address": "4 rue Vincent Van Gogh",
      "postcode": "59810",
      "url": "https://pizza-zio.fr/lesquin/",
      "coordinates": [
        3.1211,
        50.593915
      ],
      "mapLabel": [
        27,
        8,
        "start"
      ]
    },
    {
      "id": "mons",
      "city": "Mons-en-Barœul",
      "opened": null,
      "address": "126 rue du Général de Gaulle",
      "postcode": "59370",
      "url": "https://pizza-zio.fr/mons-en-baroeul/",
      "coordinates": [
        3.102463,
        50.645471
      ],
      "mapLabel": [
        30,
        7,
        "start"
      ]
    },
    {
      "id": "merignies",
      "city": "Mérignies",
      "opened": null,
      "address": "2 avenue du Golf",
      "postcode": "59710",
      "url": "https://pizza-zio.fr/merignies/",
      "coordinates": [
        3.1328151,
        50.5179141
      ],
      "mapLabel": [
        0,
        43,
        "middle"
      ]
    },
    {
      "id": "loos",
      "city": "Loos",
      "opened": null,
      "address": "45 rue du Maréchal Foch",
      "postcode": "59120",
      "url": "https://pizza-zio.fr/loos/",
      "coordinates": [
        3.020334,
        50.615588
      ],
      "mapLabel": [
        -27,
        8,
        "end"
      ]
    },
    {
      "id": "villeneuve",
      "city": "Villeneuve-d’Ascq",
      "opened": null,
      "address": "4 rue de la Station",
      "postcode": "59650",
      "url": "https://pizza-zio.fr/villeneuve-dascq/",
      "coordinates": [
        3.14826,
        50.625343
      ],
      "mapLabel": [
        0,
        43,
        "middle"
      ]
    }
  ] as const,
};
