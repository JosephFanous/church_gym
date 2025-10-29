import dayjs from 'dayjs';
import type { AvailabilitySlot } from '../lib/api';

interface ListViewProps {
  slots: AvailabilitySlot[];
  onSelectSlot?: (slot: AvailabilitySlot) => void;
  pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 12;

const ListView = ({ slots, onSelectSlot, pageSize = DEFAULT_PAGE_SIZE }: ListViewProps) => {
  if (slots.length === 0) {
    return <div className="empty-state">No available times in this range.</div>;
  }

  const limited = slots.slice(0, pageSize);
  const remaining = Math.max(0, slots.length - limited.length);

  return (
    <div className="card list-view">
      <header className="list-view__header">
        <div>
          <p className="list-view__subtitle">Upcoming openings</p>
          <h3 className="list-view__title">Hand-picked times ready to reserve</h3>
        </div>
        <span className="list-view__badge">{slots.length} total slots in this range</span>
      </header>
      <div className="list-view__grid">
        {limited.map((slot) => {
          const start = dayjs(slot.startTime);
          const end = dayjs(slot.endTime);
          return (
            <article className="list-view__item" key={slot.startTime}>
              <div className="list-view__time">
                <span className="list-view__day">{start.format('ddd')}</span>
                <span className="list-view__date">{start.format('MMM D')}</span>
              </div>
              <div className="list-view__details">
                <p className="list-view__time-range">
                  {start.format('h:mm A')} &ndash; {end.format('h:mm A')}
                </p>
                <span className="list-view__duration">
                  {end.diff(start, 'minute')} min session
                </span>
              </div>
              <button type="button" className="btn" onClick={() => onSelectSlot?.(slot)}>
                Reserve
              </button>
            </article>
          );
        })}
      </div>
      {remaining > 0 && (
        <footer className="list-view__footer">
          <p>
            Showing the next {limited.length} openings. Use the calendar to explore{' '}
            {remaining} more slots in this range.
          </p>
        </footer>
      )}
    </div>
  );
};

export default ListView;
