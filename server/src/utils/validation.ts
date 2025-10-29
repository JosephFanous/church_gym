import type { PaymentMethod } from '../types.js';

export interface ReservationRequestBody {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string;
  sport: string;
  startTime: string;
  endTime: string;
  amountCents: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  successUrl?: string;
  cancelUrl?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+()\-\d\s]{7,}$/;

export const assertReservationRequest = (
  input: any
): asserts input is ReservationRequestBody => {
  const errors: string[] = [];
  const requiredFields = [
    'firstName',
    'lastName',
    'email',
    'phone',
    'dob',
    'sport',
    'startTime',
    'endTime',
    'amountCents',
    'paymentMethod'
  ];

  for (const field of requiredFields) {
    if (input[field] === undefined || input[field] === null) {
      errors.push(`${field} is required`);
    }
  }

  if (input.email && !EMAIL_REGEX.test(input.email)) {
    errors.push('email must be valid');
  }

  if (input.phone && !PHONE_REGEX.test(String(input.phone))) {
    errors.push('phone must be a valid phone number');
  }

  if (typeof input.amountCents !== 'number' || input.amountCents <= 0) {
    errors.push('amountCents must be a positive number');
  }

  if (!['paypal', 'clover'].includes(input.paymentMethod)) {
    errors.push('paymentMethod must be paypal or clover');
  }

  const start = new Date(input.startTime);
  const end = new Date(input.endTime);
  if (Number.isNaN(start.valueOf()) || Number.isNaN(end.valueOf())) {
    errors.push('startTime and endTime must be valid ISO date strings');
  } else if (start >= end) {
    errors.push('startTime must be before endTime');
  }

  // Validate age is 18+
  if (input.dob) {
    const dob = new Date(input.dob);
    if (!Number.isNaN(dob.valueOf())) {
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      if (age < 18) {
        errors.push('User must be at least 18 years old');
      }
    }
  }

  if (errors.length > 0) {
    const err = new Error(errors.join(', '));
    err.name = 'ValidationError';
    throw err;
  }
};

export const requireAdminKey = (headerValue: string | undefined, adminKey: string) => {
  if (!headerValue || headerValue !== adminKey) {
    const err = new Error('Unauthorized');
    (err as Error & { status?: number }).status = 401;
    throw err;
  }
};
