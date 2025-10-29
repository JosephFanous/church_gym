import { Router } from 'express';
import { config } from '../config.js';
import { requireAdminKey } from '../utils/validation.js';
import {
  deleteReservation,
  findConflictingReservations,
  findReservationById,
  listReservations,
  updateReservation
} from '../models/reservations.js';
import { recordReservationAudit } from '../utils/audit.js';

export const adminRouter = Router();

adminRouter.use((req, res, next) => {
  try {
    requireAdminKey(req.header('x-admin-key'), config.adminApiKey);
    next();
  } catch (error) {
    const err = error as Error & { status?: number };
    res.status(err.status ?? 401).json({ error: err.message });
  }
});

adminRouter.get('/reservations', (req, res, next) => {
  try {
    const limit = Number(req.query.limit ?? 50);
    const offset = Number(req.query.offset ?? 0);
    const upcomingOnly = req.query.upcomingOnly === 'true';

    const reservations = listReservations({
      limit: Number.isFinite(limit) ? limit : 50,
      offset: Number.isFinite(offset) ? offset : 0,
      upcomingOnly
    });

    res.json({
      data: reservations,
      meta: {
        count: reservations.length
      }
    });
  } catch (error) {
    next(error);
  }
});

adminRouter.patch('/reservations/:id', (req, res, next) => {
  try {
    const reservation = findReservationById(req.params.id);
    if (!reservation) {
      res.status(404).json({ error: 'Reservation not found' });
      return;
    }

    const newStart = req.body.startTime ?? reservation.startTime;
    const newEnd = req.body.endTime ?? reservation.endTime;

    const conflicts = findConflictingReservations(newStart, newEnd).filter(
      (item) => item.id !== reservation.id
    );

    if (conflicts.length > 0) {
      res.status(409).json({
        error: 'Updated time conflicts with another reservation.',
        conflicts
      });
      return;
    }

    const updated = updateReservation(req.params.id, req.body);
    recordReservationAudit(req.params.id, 'updated', req.body);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

adminRouter.delete('/reservations/:id', (req, res, next) => {
  try {
    const reservation = findReservationById(req.params.id);
    if (!reservation) {
      res.status(404).json({ error: 'Reservation not found' });
      return;
    }

    deleteReservation(req.params.id);
    recordReservationAudit(req.params.id, 'deleted');

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
