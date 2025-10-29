import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { assertReservationRequest } from '../utils/validation.js';
import {
  findConflictingReservations,
  createReservation as persistReservation,
  findReservationById
} from '../models/reservations.js';
import { createCustomer, findCustomerByEmail } from '../models/customers.js';
import { createPaypalOrder } from '../services/payments/paypal.js';
import { createCloverCheckout } from '../services/payments/clover.js';
import { sendReservationConfirmation } from '../services/emailService.js';
import { recordReservationAudit } from '../utils/audit.js';
import type { PaymentMethod } from '../types.js';

export const reservationsRouter = Router();

reservationsRouter.get('/:id', (req, res, next) => {
  try {
    const reservation = findReservationById(req.params.id);
    if (!reservation) {
      res.status(404).json({ error: 'Reservation not found' });
      return;
    }
    res.json(reservation);
  } catch (error) {
    next(error);
  }
});

reservationsRouter.post('/', async (req, res, next) => {
  try {
    assertReservationRequest(req.body);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
    return;
  }

  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      dob,
      sport,
      startTime,
      endTime,
      amountCents,
      paymentMethod,
      notes
    } = req.body;

    const conflicts = findConflictingReservations(startTime, endTime);
    if (conflicts.length > 0) {
      res.status(409).json({
        error: 'Timeslot is no longer available',
        conflicts
      });
      return;
    }

    const customer =
      findCustomerByEmail(email) ??
      createCustomer({
        firstName,
        lastName,
        email,
        phone,
        dob
      });

    const reservationId = randomUUID();
    const reservation = persistReservation({
      id: reservationId,
      customerId: customer.id,
      sport,
      notes,
      startTime,
      endTime,
      amountCents,
      paymentMethod,
      paymentStatus: 'pending'
    });

    recordReservationAudit(reservationId, 'created', {
      amountCents,
      paymentMethod
    });

    let paymentResponse:
      | Awaited<ReturnType<typeof createPaypalOrder>>
      | Awaited<ReturnType<typeof createCloverCheckout>>;

    const successUrl = `${req.body.successUrl ?? ''}`.trim() || undefined;
    const cancelUrl = `${req.body.cancelUrl ?? ''}`.trim() || undefined;

    if (paymentMethod === 'paypal') {
      paymentResponse = await createPaypalOrder({
        reservationId,
        amountCents,
        successUrl,
        cancelUrl
      });
    } else {
      paymentResponse = await createCloverCheckout({
        reservationId,
        amountCents
      });
    }

    sendReservationConfirmation({
      reservationId,
      recipientEmail: email,
      recipientName: `${firstName} ${lastName}`,
      sport,
      startTime,
      endTime,
      amountCents
    }).catch((error) => {
      console.error('[reservations] Failed to send confirmation email', error);
    });

    res.status(201).json({
      reservation,
      payment: paymentResponse
    });
  } catch (error) {
    next(error);
  }
});
