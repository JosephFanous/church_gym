import { FormEvent, useState } from 'react';
import dayjs from 'dayjs';
import type { AvailabilitySlot, ReservationRequest, ReservationResponse } from '../lib/api';
import { createReservation } from '../lib/api';

interface BookingFormProps {
  initialSlot?: AvailabilitySlot;
  onSuccess?: (response: ReservationResponse) => void;
}

const defaultForm: ReservationRequest = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dob: '',
  sport: 'Basketball',
  startTime: '',
  endTime: '',
  amountCents: 7500,
  notes: '',
  paymentMethod: 'paypal'
};

const BookingForm = ({ initialSlot, onSuccess }: BookingFormProps) => {
  const [form, setForm] = useState<ReservationRequest>(() => {
    if (!initialSlot) return { ...defaultForm };
    return {
      ...defaultForm,
      startTime: initialSlot.startTime,
      endTime: initialSlot.endTime
    };
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReservationResponse | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ startTime?: string; endTime?: string; dob?: string }>({});
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState<string>('Update Your Times');

  const handleChange = (field: keyof ReservationRequest) => (value: string) => {
    if (field === 'paymentMethod' && (value === 'paypal' || value === 'clover')) {
      setForm((prev) => ({ ...prev, paymentMethod: value }));
      return;
    }

    if (field === 'startTime' || field === 'endTime') {
      const iso = value ? dayjs(value).toISOString() : '';
      setForm((prev) => ({ ...prev, [field]: iso }));
      return;
    }

    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});
    setModalMessage(null);
    setModalTitle('Update Your Times');

    const now = dayjs();
    const start = dayjs(form.startTime);
    const end = dayjs(form.endTime);

    const newFieldErrors: { startTime?: string; endTime?: string; dob?: string } = {};
    let hasError = false;

    if (!form.startTime || !start.isValid() || start.isBefore(now)) {
      newFieldErrors.startTime = 'Start time must be in the future.';
      hasError = true;
    }
    if (!form.endTime || !end.isValid() || end.isBefore(now)) {
      newFieldErrors.endTime = 'End time must be in the future.';
      hasError = true;
    }
    if (!hasError && start.isValid() && end.isValid() && !end.isAfter(start)) {
      newFieldErrors.endTime = 'End time must be after start time.';
      hasError = true;
    }

    // Validate age is 18+
    if (form.dob) {
      const dob = dayjs(form.dob);
      if (dob.isValid()) {
        // Calculate age accounting for whether birthday has occurred this year
        let age = now.year() - dob.year();
        if (now.month() < dob.month() || (now.month() === dob.month() && now.date() < dob.date())) {
          age--;
        }
        if (age < 18) {
          newFieldErrors.dob = 'You must be at least 18 years old to make a reservation.';
          hasError = true;
          setModalTitle('Age Requirement Not Met');
          setModalMessage('You must be at least 18 years old to make a reservation.');
        }
      }
    }

    if (hasError) {
      setFieldErrors(newFieldErrors);
      setLoading(false);
      if (!newFieldErrors.dob) {
        setModalMessage('Please pick a start and end time that are after the current time.');
      }
      return;
    }

    try {
      const response = await createReservation(form);
      setResult(response);
      setLoading(false);

      onSuccess?.(response);
    } catch (err) {
      setLoading(false);
      setError((err as Error).message ?? 'Failed to create reservation');
    }
  };

  const durationLabel =
    form.startTime && form.endTime
      ? `${dayjs(form.startTime).format('MMM D, h:mm A')} → ${dayjs(form.endTime).format(
          'h:mm A'
        )}`
      : 'Select a start and end time above to hold your spot.';

  return (
    <div className="card">
      <h2>Create a Reservation</h2>
      <p>{durationLabel}</p>

      <form onSubmit={handleSubmit} className="content-section">
        <div className="input-grid">
          <label className={fieldErrors.startTime ? 'field-error' : undefined}>
            Start Time
            <input
              required
              type="datetime-local"
              value={form.startTime ? dayjs(form.startTime).format('YYYY-MM-DDTHH:mm') : ''}
              onChange={(event) => handleChange('startTime')(event.target.value)}
            />
            {fieldErrors.startTime && <span className="field-error__message">{fieldErrors.startTime}</span>}
          </label>
          <label className={fieldErrors.endTime ? 'field-error' : undefined}>
            End Time
            <input
              required
              type="datetime-local"
              value={form.endTime ? dayjs(form.endTime).format('YYYY-MM-DDTHH:mm') : ''}
              onChange={(event) => handleChange('endTime')(event.target.value)}
            />
            {fieldErrors.endTime && <span className="field-error__message">{fieldErrors.endTime}</span>}
          </label>
          <label>
            First Name
            <input
              required
              value={form.firstName}
              onChange={(event) => handleChange('firstName')(event.target.value)}
            />
          </label>
          <label>
            Last Name
            <input
              required
              value={form.lastName}
              onChange={(event) => handleChange('lastName')(event.target.value)}
            />
          </label>
          <label>
            Email
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) => handleChange('email')(event.target.value)}
            />
          </label>
          <label>
            Phone
            <input
              required
              value={form.phone}
              onChange={(event) => handleChange('phone')(event.target.value)}
            />
          </label>
          <label className={fieldErrors.dob ? 'field-error' : undefined}>
            Date of Birth
            <input
              required
              type="date"
              value={form.dob}
              onChange={(event) => handleChange('dob')(event.target.value)}
            />
            {fieldErrors.dob && <span className="field-error__message">{fieldErrors.dob}</span>}
          </label>
          <label>
            Sport
            <select
              value={form.sport}
              onChange={(event) => handleChange('sport')(event.target.value)}
            >
              <option>Basketball</option>
              <option>Volleyball</option>
              <option>Futsal</option>
              <option>Pickleball</option>
              <option>Training Session</option>
              <option>Other</option>
            </select>
          </label>
          <label>
            Rate (CAD)
            <input
              required
              type="text"
              value={`$${(form.amountCents / 100).toFixed(2)}`}
              readOnly
              className="input-readonly"
            />
          </label>
          <label>
            Payment Method
            <select
              value={form.paymentMethod}
              onChange={(event) => handleChange('paymentMethod')(event.target.value)}
            >
              <option value="paypal">PayPal</option>
              <option value="clover">Clover</option>
            </select>
          </label>
        </div>

        <label>
          Notes
          <textarea
            rows={3}
            value={form.notes}
            onChange={(event) => handleChange('notes')(event.target.value)}
          />
        </label>

        <div>
          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'Processing...' : 'Submit Reservation'}
          </button>
        </div>

        {error && <p style={{ color: '#dc2626' }}>{error}</p>}

        {modalMessage && (
          <div className="modal-overlay" role="alert">
            <div className="modal-card">
              <h3>{modalTitle}</h3>
              <p>{modalMessage}</p>
              <button type="button" className="btn" onClick={() => setModalMessage(null)}>
                Got it
              </button>
            </div>
          </div>
        )}

        {result && (
          <div className="card" style={{ background: '#ecfeff' }}>
            <h3>Reservation Created</h3>
            <p>Confirmation ID: {result.reservation.id}</p>
            {result.payment.approvalUrl && (
              <p>
                Complete payment at:{' '}
                <a href={result.payment.approvalUrl} target="_blank" rel="noreferrer">
                  PayPal Checkout
                </a>
              </p>
            )}
            {result.payment.checkoutUrl && (
              <p>
                Complete payment at:{' '}
                <a href={result.payment.checkoutUrl} target="_blank" rel="noreferrer">
                  Clover Checkout
                </a>
              </p>
            )}
          </div>
        )}
      </form>
    </div>
  );
};

export default BookingForm;
