import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import BookingForm from '../components/BookingForm';
import type { AvailabilitySlot } from '../lib/api';

const usePreselectedSlot = (): AvailabilitySlot | undefined => {
  const { search } = useLocation();

  return useMemo(() => {
    const params = new URLSearchParams(search);
    const start = params.get('start');
    const end = params.get('end');

    if (!start || !end) return undefined;
    if (!dayjs(start).isValid() || !dayjs(end).isValid()) return undefined;

    const now = dayjs();
    if (dayjs(start).isBefore(now) || dayjs(end).isBefore(now)) {
      return undefined;
    }

    return {
      startTime: start,
      endTime: end
    };
  }, [search]);
};

const BookingPage = () => {
  const slot = usePreselectedSlot();

  return (
    <div className="content-section">
      <div className="card">
        <h1>Book the Gym</h1>
        <p>
          Fill out the form to reserve your time. We&apos;ll send you a confirmation email with your
          reservation ID and payment link.
        </p>
        <p>
          Prefer to secure your time first? Visit the availability page to select an open slot and
          we&apos;ll bring it back here automatically.
        </p>
      </div>

      <BookingForm initialSlot={slot} />
    </div>
  );
};

export default BookingPage;
