/**
 * Middleware personnalisé : vérifie l'heure de la requête.
 *
 * Le site n'est accessible que du lundi au vendredi, de 9h à 17h
 * (17h exclu : à 17h00 pile, le site est fermé).
 *
 * Réglages possibles par variables d'environnement :
 *   TIMEZONE                 fuseau horaire (défaut : Africa/Dakar)
 *   FAKE_NOW                 date ISO utilisée à la place de l'heure réelle,
 *                            pratique pour tester (ex. 2026-10-05T10:00:00Z)
 *   BYPASS_WORKING_HOURS     "true" pour désactiver la vérification
 */

const DEFAULTS = {
  timeZone: process.env.TIMEZONE || 'Africa/Dakar',
  openDays: [1, 2, 3, 4, 5], // 0 = dimanche, 1 = lundi ... 6 = samedi
  startHour: 9,
  endHour: 17,
};

const DAY_NAMES = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]; // affichage du lundi au dimanche
const WEEKDAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** Retourne le jour (0-6), l'heure (0-23) et les minutes dans le fuseau demandé. */
function getLocalTime(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(date);

  const pick = (type) => parts.find((p) => p.type === type).value;
  return {
    day: WEEKDAY_INDEX[pick('weekday')],
    hour: parseInt(pick('hour'), 10),
    minute: parseInt(pick('minute'), 10),
  };
}

/** Vrai si le site est ouvert à ce moment-là. */
function isOpen({ day, hour }, config = DEFAULTS) {
  return (
    config.openDays.includes(day) &&
    hour >= config.startHour &&
    hour < config.endHour
  );
}

/** Texte décrivant la prochaine ouverture (« aujourd'hui à 9h », « lundi à 9h »...). */
function nextOpening({ day, hour }, config = DEFAULTS) {
  if (config.openDays.includes(day) && hour < config.startHour) {
    return `aujourd'hui à ${config.startHour}h`;
  }
  for (let step = 1; step <= 7; step += 1) {
    const candidate = (day + step) % 7;
    if (config.openDays.includes(candidate)) {
      const name = step === 1 ? 'demain' : DAY_NAMES[candidate];
      return `${name} à ${config.startHour}h`;
    }
  }
  return 'bientôt';
}

/** Tableau des horaires de la semaine (utilisé par les vues). */
function buildSchedule(today, config = DEFAULTS) {
  return WEEK_ORDER.map((d) => ({
    label: capitalize(DAY_NAMES[d]),
    hours: config.openDays.includes(d)
      ? `${config.startHour}h – ${config.endHour}h`
      : 'Fermé',
    open: config.openDays.includes(d),
    isToday: d === today,
  }));
}

function resolveNow(options) {
  if (typeof options.now === 'function') return options.now();
  if (process.env.FAKE_NOW) return new Date(process.env.FAKE_NOW);
  return new Date();
}

/**
 * Fabrique le middleware.
 * Il expose toujours `res.locals.status` aux vues, puis :
 *  - laisse passer la requête si le site est ouvert ;
 *  - sinon répond 503 avec la page « fermé ».
 */
function workingHours(options = {}) {
  const config = { ...DEFAULTS, ...options };

  return function workingHoursMiddleware(req, res, next) {
    const local = getLocalTime(resolveNow(options), config.timeZone);
    const open = isOpen(local, config);
    const reopening = nextOpening(local, config);

    res.locals.status = {
      isOpen: open,
      message: open
        ? `Ouvert, nous fermons à ${config.endHour}h`
        : `Fermé pour le moment, réouverture ${reopening}`,
      nextOpening: open ? null : reopening,
      schedule: buildSchedule(local.day, config),
      startHour: config.startHour,
      endHour: config.endHour,
    };

    if (open || process.env.BYPASS_WORKING_HOURS === 'true') {
      return next();
    }

    res.set('Retry-After', '3600');
    return res.status(503).render('closed', { title: 'Site fermé' });
  };
}

module.exports = workingHours;
module.exports.getLocalTime = getLocalTime;
module.exports.isOpen = isOpen;
module.exports.nextOpening = nextOpening;
module.exports.DEFAULTS = DEFAULTS;
