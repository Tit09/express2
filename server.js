const path = require('path');
const express = require('express');
const workingHours = require('./middleware/workingHours');

const app = express();
const PORT = process.env.PORT || 3000;

// Moteur de template : EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Fichiers statiques (CSS) : servis avant le middleware d'horaires,
// pour que la page « fermé » puisse aussi être stylisée.
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));

// Chemin courant, utilisé pour mettre en évidence le lien actif de la navigation
app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  next();
});

// Middleware personnalisé : le site n'est ouvert que du lundi au vendredi, de 9h à 17h
app.use(workingHours());

// ---------- Routes ----------
app.get('/', (req, res) => {
  res.render('index', { title: 'Accueil' });
});

app.get('/services', (req, res) => {
  res.render('services', { title: 'Nos services' });
});

app.get('/contact', (req, res) => {
  res.render('contact', { title: 'Nous contacter', errors: [], values: {}, sent: false });
});

app.post('/contact', (req, res) => {
  const values = {
    nom: (req.body.nom || '').trim(),
    email: (req.body.email || '').trim(),
    sujet: (req.body.sujet || '').trim(),
    message: (req.body.message || '').trim(),
  };

  const errors = [];
  if (values.nom.length < 2) errors.push('Indiquez votre nom (2 caractères minimum).');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.push('Indiquez une adresse e-mail valide.');
  if (values.message.length < 10) errors.push('Votre message doit contenir au moins 10 caractères.');

  if (errors.length > 0) {
    return res.status(400).render('contact', { title: 'Nous contacter', errors, values, sent: false });
  }

  // Ici, on pourrait enregistrer le message ou envoyer un e-mail.
  console.log('Nouveau message de contact :', values);
  return res.render('contact', { title: 'Nous contacter', errors: [], values: {}, sent: true, nom: values.nom });
});

// ---------- 404 et erreurs ----------
app.use((req, res) => {
  res.status(404).render('404', { title: 'Page introuvable' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Une erreur est survenue sur le serveur.');
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
  });
}

module.exports = app;
