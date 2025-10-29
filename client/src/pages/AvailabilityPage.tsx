import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs, { Dayjs } from 'dayjs';
import CalendarView from '../components/CalendarView';
import ListView from '../components/ListView';
import type { AvailabilitySlot } from '../lib/api';
import { fetchAvailability } from '../lib/api';

type ViewMode = 'calendar' | 'list';

const startOfWeek = (value: Dayjs = dayjs()) => value.startOf('day').subtract(value.day(), 'day');
const SLOT_MINUTES = 60;
const HOURS_OPEN = 14; // 8am - 10pm

const AvailabilityPage = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [weekStart, setWeekStart] = useState(startOfWeek());
  const [refreshToken, setRefreshToken] = useState(0);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const start = weekStart.startOf('day');
    const end = start.add(14, 'day');

    setLoading(true);
    fetchAvailability({
      start: start.toISOString(),
      end: end.toISOString()
    })
      .then((response) => {
        setSlots(response.slots);
        setLoading(false);
      })
      .catch((err) => {
        setError((err as Error).message);
        setLoading(false);
      });
  }, [weekStart, refreshToken]);

  const futureSlots = useMemo(() => {
    const now = dayjs();
    return slots.filter((slot) => !dayjs(slot.startTime).isBefore(now));
  }, [slots]);

  const sortedSlots = useMemo(
    () =>
      [...futureSlots].sort(
        (a, b) => dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf()
      ),
    [futureSlots]
  );

  const weekSlots = useMemo(() => {
    const start = weekStart.startOf('day');
    const end = start.add(7, 'day');
    return futureSlots.filter((slot) => {
      const slotStart = dayjs(slot.startTime);
      return slotStart.isSame(start) || (slotStart.isAfter(start) && slotStart.isBefore(end));
    });
  }, [futureSlots, weekStart]);

  const sortedWeekSlots = useMemo(
    () =>
      [...weekSlots].sort(
        (a, b) => dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf()
      ),
    [weekSlots]
  );

  const handleSelectSlot = (slot: AvailabilitySlot) => {
    const params = new URLSearchParams({
      start: slot.startTime,
      end: slot.endTime
    });
    navigate(`/book?${params.toString()}`);
  };

  const triggerRefresh = useCallback(() => setRefreshToken((token) => token + 1), []);

  useEffect(() => {
    const handler = () => triggerRefresh();
    if (typeof window !== 'undefined') {
      window.addEventListener('availability:refresh', handler);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('availability:refresh', handler);
      }
    };
  }, [triggerRefresh]);

  const nextSlot = sortedWeekSlots.length > 0 ? sortedWeekSlots[0] : sortedSlots[0];
  const nextSlotLabel = nextSlot
    ? `${dayjs(nextSlot.startTime).format('ddd, MMM D')} • ${dayjs(nextSlot.startTime).format(
        'h:mm A'
      )}`
    : 'No openings this week';
  const nextSlotButtonLabel = nextSlot ? `Book ${dayjs(nextSlot.startTime).format('MMM D')}` : '';
  const primeTimeCount = sortedWeekSlots.filter((slot) => {
    const hour = dayjs(slot.startTime).hour();
    return hour >= 17 && hour < 21;
  }).length;
  const totalWeekSlotsPossible = HOURS_OPEN * (60 / SLOT_MINUTES) * 7;
  const availabilityRate = totalWeekSlotsPossible
    ? Math.max(
        0,
        Math.min(100, Math.round((sortedWeekSlots.length / totalWeekSlotsPossible) * 100))
      )
    : 0;

  return (
    <div className="content-section availability-page">
      <section className="availability-hero card">
        <div>
          <span className="availability-pill">Live calendar</span>
          <h2>Reserve the gym in minutes</h2>
          <p>
            Browse the schedule, lock your preferred timeslot, and head straight to checkout.
            Choose a calendar or list view to make planning effortless for your team.
          </p>
          <div className="availability-toggle">
            <button
              type="button"
              className={`toggle-option${viewMode === 'calendar' ? ' active' : ''}`}
              onClick={() => setViewMode('calendar')}
            >
              Calendar
            </button>
            <button
              type="button"
              className={`toggle-option${viewMode === 'list' ? ' active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
          </div>
        </div>
        <div className="availability-highlight">
          <p className="highlight-label">Next opening</p>
          <strong>{nextSlotLabel}</strong>
          {nextSlot ? (
            <button
              type="button"
              className="btn"
              onClick={() => handleSelectSlot(nextSlot)}
            >
              {nextSlotButtonLabel}
            </button>
          ) : (
            <span className="highlight-muted">All booked — check back soon</span>
          )}
        </div>
      </section>

      <section className="availability-stats">
        <div className="stat-card">
          <p>Open slots this week</p>
          <h3>{sortedWeekSlots.length}</h3>
          <span>Across {weekStart.format('MMM D')} – {weekStart.add(6, 'day').format('MMM D')}</span>
        </div>
        <div className="stat-card">
          <p>Prime-time evenings</p>
          <h3>{primeTimeCount}</h3>
          <span>5pm&ndash;9pm availability for high-energy sessions</span>
        </div>
        <div className="stat-card">
          <p>Capacity remaining</p>
          <h3>{availabilityRate}%</h3>
          <span>Based on the next 7 days of hourly slots</span>
        </div>
      </section>

      <div className="card availability-controls">
        <div>
          <p className="controls-heading">Navigate the schedule</p>
          <span className="controls-subheading">
            Jump between weeks to explore openings up to two weeks out.
          </span>
        </div>
        <div className="availability-nav">
          <button
            type="button"
            className="btn ghost"
            onClick={() => setWeekStart((prev) => startOfWeek(prev.subtract(7, 'day')))}
          >
            Previous
          </button>
          <button type="button" className="btn ghost" onClick={() => setWeekStart(startOfWeek(dayjs()))}>
            This Week
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => setWeekStart((prev) => startOfWeek(prev.add(7, 'day')))}
          >
            Next
          </button>
        </div>
      </div>

      {loading && <div className="card">Loading availability...</div>}
      {error && <div className="card" style={{ color: '#dc2626' }}>{error}</div>}

      {!loading && !error && (
        <>
          {viewMode === 'calendar' ? (
            <div className="availability-view">
              <CalendarView weekStart={weekStart} slots={sortedWeekSlots} onSelectSlot={handleSelectSlot} />
            </div>
          ) : (
            <div className="availability-view">
              <ListView slots={sortedSlots} onSelectSlot={handleSelectSlot} pageSize={12} />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AvailabilityPage;
