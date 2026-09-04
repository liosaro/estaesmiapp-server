const express = require('express');

const router = express.Router();

// TODO: reemplazar por una fuente real (Google Calendar, Airtable, una tabla
// en una base de datos, etc). Se deja el mismo "shape" para que el cambio en
// el futuro no rompa la app: solo hay que reescribir este archivo.
const MOCK_EVENTS = [
  {
    id: 'evt-concierto-otono',
    title: 'Concierto comunitario de otono',
    category: 'concierto',
    startsAt: '2026-09-27T19:00:00-04:00',
    location: 'Corona Park, Queens, NY',
    imageUrl: null,
    description: 'Musica en vivo, comida y actividades para toda la familia.',
  },
  {
    id: 'evt-feria-salud',
    title: 'Feria de salud gratuita',
    category: 'salud',
    startsAt: '2026-10-04T10:00:00-04:00',
    location: 'Iglesia Nueva Vida, Bronx, NY',
    imageUrl: null,
    description: 'Chequeos medicos gratuitos, vacunacion y orientacion de seguros.',
  },
  {
    id: 'evt-seminario-migracion',
    title: 'Seminario de inmigracion con la abogada Astrid Cordoba',
    category: 'legal',
    startsAt: '2026-10-11T18:30:00-04:00',
    location: 'Transmision en vivo (ver seccion Vivo)',
    imageUrl: null,
    description: 'Preguntas y respuestas en vivo sobre procesos migratorios.',
  },
];

router.get('/', (req, res) => {
  const { category } = req.query;
  const events = category
    ? MOCK_EVENTS.filter((e) => e.category === category)
    : MOCK_EVENTS;
  res.json({ ok: true, mocked: true, events });
});

module.exports = router;
