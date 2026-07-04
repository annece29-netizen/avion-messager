// Lecture de l'agenda (adresse secrète iCal de Google Agenda)
// et déclenchement des rappels quelques minutes avant chaque réunion.
const ical = require('node-ical');

function bannerText(summary, minutes) {
  const s = String(summary || 'Réunion').trim() || 'Réunion';
  const label = /^r[ée]union/i.test(s) ? s : `Réunion ${s}`;
  return `${label} dans ${minutes} min`;
}

// Vérifie qu'une adresse iCal répond, et compte ses événements.
// Sert à valider l'adresse au moment où on la colle dans les réglages.
async function countEvents(url) {
  try {
    const data = await ical.async.fromURL(url);
    const total = Object.values(data).filter((ev) => ev && ev.type === 'VEVENT').length;
    return { ok: true, total };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// rrule calcule les occurrences d'un événement récurrent à partir de l'heure UTC
// de la toute première : si l'heure d'été ou d'hiver a changé entre-temps,
// on corrige le décalage pour retomber sur la bonne heure locale.
function fixRecurrenceDate(date, firstStart) {
  const diff = date.getTimezoneOffset() - firstStart.getTimezoneOffset();
  return diff === 0 ? date : new Date(date.getTime() + diff * 60000);
}

function isExcluded(ev, start) {
  if (!ev.exdate) return false;
  const key = start.toISOString().slice(0, 16);
  return Object.values(ev.exdate).some(
    (d) => new Date(d).toISOString().slice(0, 16) === key
  );
}

// Renvoie les occurrences d'un événement entre windowStart et windowEnd.
function occurrences(ev, windowStart, windowEnd) {
  const result = [];
  if (!ev || ev.type !== 'VEVENT' || !ev.start) return result;
  // Les événements "journée entière" n'ont pas d'heure : pas de rappel.
  if (ev.datetype === 'date') return result;
  if (String(ev.status || '').toUpperCase() === 'CANCELLED') return result;

  if (ev.rrule) {
    for (const raw of ev.rrule.between(windowStart, windowEnd, true)) {
      let start = fixRecurrenceDate(raw, ev.start);
      let summary = ev.summary;
      // Une occurrence peut avoir été déplacée ou renommée individuellement.
      const override = ev.recurrences && ev.recurrences[start.toISOString().slice(0, 10)];
      if (override && override.start) {
        start = override.start;
        summary = override.summary || summary;
      }
      if (isExcluded(ev, start)) continue;
      result.push({ start, summary });
    }
  } else if (ev.start >= windowStart && ev.start <= windowEnd) {
    result.push({ start: ev.start, summary: ev.summary });
  }
  return result;
}

// Surveille l'agenda et appelle onReminder quand une réunion approche.
// Renvoie une fonction qui arrête la surveillance (utile quand on change d'agenda).
function startWatch(config, onReminder) {
  const alreadyShown = new Set();
  const minutesBefore = config.minutesBefore || 5;

  async function check() {
    let data;
    try {
      data = await ical.async.fromURL(config.icsUrl);
    } catch (err) {
      console.error('[avion-messager] Agenda inaccessible :', err.message);
      return;
    }

    const now = new Date();
    const windowEnd = new Date(now.getTime() + 24 * 3600 * 1000);

    for (const ev of Object.values(data)) {
      let occs;
      try {
        occs = occurrences(ev, now, windowEnd);
      } catch {
        continue;
      }
      for (const occ of occs) {
        const minutes = (occ.start - now) / 60000;
        if (minutes <= 0 || minutes > minutesBefore + 0.5) continue;
        const key = `${ev.uid || occ.summary}|${occ.start.toISOString()}`;
        if (alreadyShown.has(key)) continue;
        alreadyShown.add(key);
        console.log(`[avion-messager] Décollage : ${occ.summary} (${occ.start.toLocaleString()})`);
        onReminder(bannerText(occ.summary, Math.max(1, Math.round(minutes))));
      }
    }
  }

  check();
  const timer = setInterval(check, (config.checkEverySeconds || 60) * 1000);
  return () => clearInterval(timer);
}

module.exports = { startWatch, countEvents, bannerText };
