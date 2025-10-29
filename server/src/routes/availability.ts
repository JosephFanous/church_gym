import { Router } from 'express';
import { generateAvailability } from '../services/availability.js';

export const availabilityRouter = Router();

availabilityRouter.get('/', (req, res, next) => {
  try {
    const queryStart = req.query.start ? new Date(String(req.query.start)) : new Date();
    const queryEnd = req.query.end
      ? new Date(String(req.query.end))
      : new Date(queryStart.getTime() + 14 * 24 * 60 * 60 * 1000);

    if (Number.isNaN(queryStart.valueOf()) || Number.isNaN(queryEnd.valueOf())) {
      res.status(400).json({ error: 'start and end must be valid ISO datetime strings' });
      return;
    }

    const slots = generateAvailability(queryStart, queryEnd);

    res.json({
      slots,
      meta: {
        start: queryStart.toISOString(),
        end: queryEnd.toISOString(),
        total: slots.length
      }
    });
  } catch (error) {
    next(error);
  }
});
