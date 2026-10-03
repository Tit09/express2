# Teranga Réseaux : point de contrôle Express

Application web Express de trois pages (Accueil, Nos services, Nous contacter),
**accessible uniquement pendant les heures de travail : du lundi au vendredi, de 9h à 17h**.

## Exigences du point de contrôle

| Exigence | Où la trouver |
|---|---|
| Serveur et routes avec Express | `server.js` |
| Lien dans la barre de navigation pour chaque page | `views/partials/header.ejs` |
| Middleware personnalisé qui vérifie l'heure de la requête | `middleware/workingHours.js` |
| Pages stylisées avec CSS | `public/css/style.css` |
| Moteur de template (optionnel) | EJS, dossier `views/` |

## Lancer le projet

Prérequis : Node.js 18 ou plus récent.

```bash
npm install
npm start
```

Ouvrir ensuite http://localhost:3000

Hors horaires (soir, samedi, dimanche), le serveur répond **503** avec une page
« Le site est fermé pour le moment » qui indique la prochaine ouverture.

## Tester sans attendre lundi matin

L'heure de la requête est lue dans le fuseau `Africa/Dakar`. Pour simuler un autre moment :

```bash
# Simuler un mercredi à 10h (site ouvert)
FAKE_NOW=2026-10-07T10:00:00Z npm start

# Simuler un samedi à 10h (site fermé)
FAKE_NOW=2026-10-10T10:00:00Z npm start

# Désactiver la vérification des horaires
BYPASS_WORKING_HOURS=true npm start
```

Sous Windows PowerShell : `$env:FAKE_NOW="2026-10-07T10:00:00Z"; npm start`

Un test automatique de la logique d'horaires est fourni : `npm test`.

## Structure

```
server.js                    serveur Express et routes
middleware/workingHours.js   middleware qui vérifie l'heure
views/                       templates EJS (pages et partials)
public/css/style.css         styles
test/workingHours.test.js    test de la logique d'horaires
```

## Comment fonctionne le middleware

1. Il lit le jour et l'heure de la requête dans le fuseau `Africa/Dakar`.
2. Le site est ouvert si le jour va de lundi à vendredi et si l'heure est comprise entre 9h et 17h (17h exclu).
3. Si c'est ouvert, il appelle `next()` et la route normale répond.
4. Sinon, il répond avec le statut 503 et la page `closed.ejs`.

Les fichiers CSS sont servis avant le middleware, afin que la page « fermé » reste bien stylisée.
