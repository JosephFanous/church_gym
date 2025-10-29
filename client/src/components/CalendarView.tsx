import dayjs, { Dayjs } from 'dayjs';
import type { AvailabilitySlot } from '../lib/api';

interface CalendarViewProps {
  weekStart: Dayjs;
  slots: AvailabilitySlot[];
  onSelectSlot?: (slot: AvailabilitySlot) => void;
}

const formatRange = (slot: AvailabilitySlot) => {
  const start = dayjs(slot.startTime);
  const end = dayjs(slot.endTime);
  return `${start.format('h:mm A')} - ${end.format('h:mm A')}`;
};

const CalendarView = ({ weekStart, slots, onSelectSlot }: CalendarViewProps) => {
  const days = Array.from({ length: 7 }, (_, index) => weekStart.add(index, 'day'));

  const slotsByDay = days.map((day) => {
    const start = day.startOf('day');
    const end = start.endOf('day');
    return slots.filter((slot) => {
      const slotStart = dayjs(slot.startTime);
      return slotStart.isAfter(start.subtract(1, 'minute')) && slotStart.isBefore(end.add(1, 'minute'));
    });
  });

  return (
    <div className="calendar-grid">
      <div className="calendar-week">
        {days.map((day, index) => (
          <div key={day.toString()} className="calendar-day">
            <h4>
              {day.format('ddd, MMM D')}
              <br />
              <small>{day.format('YYYY')}</small>
            </h4>
            {slotsByDay[index].length === 0 ? (
              <div className="empty-state">No open slots</div>
            ) : (
              slotsByDay[index].map((slot) => (
                <button
                  key={slot.startTime}
                  className="slot"
                  type="button"
                  onClick={() => onSelectSlot?.(slot)}
                >
                  {formatRange(slot)}
                </button>
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarView;
