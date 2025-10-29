import { useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import type { AdminReservation } from '../lib/api';
import { deleteReservation, fetchReservations, updateReservation } from '../lib/api';

const AdminDashboard = () => {
  const initialKey =
    typeof window !== 'undefined' ? localStorage.getItem('adminKey') ?? '' : '';
  const [adminKeyInput, setAdminKeyInput] = useState(initialKey);
  const [activeAdminKey, setActiveAdminKey] = useState(initialKey);
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingReservation, setEditingReservation] = useState<AdminReservation | null>(null);
  const [editTimes, setEditTimes] = useState<{ startTime: string; endTime: string }>({
    startTime: '',
    endTime: ''
  });
  const [editErrors, setEditErrors] = useState<{ startTime?: string; endTime?: string }>({});
  const [editError, setEditError] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const sortedReservations = useMemo(() => {
    return [...reservations].sort(
      (a, b) => dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf()
    );
  }, [reservations]);

  const lastFetchedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!activeAdminKey) return;
    if (lastFetchedKeyRef.current === activeAdminKey) {
      return;
    }

    lastFetchedKeyRef.current = activeAdminKey;

    setLoading(true);
    fetchReservations(activeAdminKey)
      .then((data) => {
        setReservations(data);
        setLoading(false);
        setError(null);
      })
      .catch((err) => {
        setError((err as Error).message);
        setLoading(false);
      });
  }, [activeAdminKey]);

  const refresh = (overrideKey?: string) => {
    const keyToUse = overrideKey ?? activeAdminKey;
    if (!keyToUse) return;
    lastFetchedKeyRef.current = keyToUse;
    setLoading(true);
    fetchReservations(keyToUse)
      .then((data) => {
        setReservations(data);
        setLoading(false);
      })
      .catch((err) => {
        setError((err as Error).message);
        setLoading(false);
      });
  };

  const applyAdminKey = (): { key: string; changed: boolean } => {
    const key = adminKeyInput.trim();
    setError(null);
    setSuccess(null);
    if (!key) {
      setActiveAdminKey('');
      setReservations([]);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('adminKey');
      }
      return { key: '', changed: true };
    }

    if (key === activeAdminKey) {
      return { key, changed: false };
    }
    setActiveAdminKey(key);
    if (typeof window !== 'undefined') {
      localStorage.setItem('adminKey', key);
    }
    return { key, changed: true };
  };

  const notifyAvailabilityChange = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('availability:refresh'));
    }
  };

  const handleLogout = () => {
    setAdminKeyInput('');
    setActiveAdminKey('');
    setReservations([]);
    setError(null);
    setSuccess('Logged out');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adminKey');
    }
  };

  const handleDelete = async (id: string) => {
    if (!activeAdminKey) return;
    if (!confirm('Delete this reservation?')) return;
    await deleteReservation(id, activeAdminKey);
    setSuccess('Reservation deleted');
    refresh();
    notifyAvailabilityChange();
  };

  const handleMarkCaptured = async (id: string) => {
    if (!activeAdminKey) return;
    await updateReservation(id, activeAdminKey, { paymentStatus: 'captured' });
    setSuccess('Payment marked as captured');
    refresh();
    notifyAvailabilityChange();
  };

  const openAdjustTime = (reservation: AdminReservation) => {
    setEditingReservation(reservation);
    setEditTimes({
      startTime: dayjs(reservation.startTime).format('YYYY-MM-DDTHH:mm'),
      endTime: dayjs(reservation.endTime).format('YYYY-MM-DDTHH:mm')
    });
    setEditErrors({});
    setEditError(null);
  };

  const closeAdjustModal = () => {
    setEditingReservation(null);
    setEditTimes({ startTime: '', endTime: '' });
    setEditErrors({});
    setEditError(null);
    setEditSaving(false);
  };

  const handleAdjustSave = async () => {
    if (!editingReservation || !activeAdminKey) return;

    const start = dayjs(editTimes.startTime);
    const end = dayjs(editTimes.endTime);
    const errors: { startTime?: string; endTime?: string } = {};

    if (!start.isValid()) {
      errors.startTime = 'Enter a valid start time.';
    }
    if (!end.isValid()) {
      errors.endTime = 'Enter a valid end time.';
    }
    if (!errors.startTime && !errors.endTime && !end.isAfter(start)) {
      errors.endTime = 'End time must be after start time.';
    }

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      setEditError('Please fix the highlighted fields to continue.');
      return;
    }

    try {
      setEditSaving(true);
      await updateReservation(editingReservation.id, activeAdminKey, {
        startTime: start.toISOString(),
        endTime: end.toISOString()
      });
      setEditSaving(false);
      setSuccess('Reservation updated');
      closeAdjustModal();
      refresh();
      notifyAvailabilityChange();
    } catch (err) {
      setEditSaving(false);
      setEditError((err as Error).message ?? 'Failed to update reservation');
    }
  };

  return (
    <div className="content-section">
      <div className="card">
        <h1>Admin Dashboard</h1>
        <p>Review bookings, adjust times, and manage payments.</p>
        <div className="input-grid">
          <label>
            Admin API Key
            <input
              type="password"
              value={adminKeyInput}
              onChange={(event) => setAdminKeyInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  const result = applyAdminKey();
                  if (result.key && !result.changed) {
                    refresh(result.key);
                  }
                }
              }}
            />
          </label>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn outline"
              onClick={() => {
                const result = applyAdminKey();
                if (result.key && !result.changed) {
                  refresh(result.key);
                }
              }}
              disabled={!adminKeyInput.trim()}
            >
              Apply Key
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => refresh()}
              disabled={!activeAdminKey || loading}
            >
              Refresh
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
        {error && <p style={{ color: 'var(--color-primary-dark)' }}>{error}</p>}
        {success && <p style={{ color: 'var(--color-primary)' }}>{success}</p>}
      </div>

      <div className="card">
        {loading && <p>Loading reservations...</p>}
        {!loading && sortedReservations.length === 0 && <p>No reservations yet.</p>}
        {!loading && sortedReservations.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact</th>
                <th>Timeslot</th>
                <th>Sport</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedReservations.map((reservation) => (
                <tr key={reservation.id}>
                  <td>
                    {reservation.customer.firstName} {reservation.customer.lastName}
                  </td>
                  <td>
                    <div>{reservation.customer.email}</div>
                    <div>{reservation.customer.phone}</div>
                  </td>
                  <td>
                    {dayjs(reservation.startTime).format('MMM D, h:mm A')} &rarr;{' '}
                    {dayjs(reservation.endTime).format('h:mm A')}
                  </td>
                  <td>{reservation.sport}</td>
                  <td>
                    <span
                      className={`status-pill ${
                        reservation.paymentStatus === 'captured' ? 'paid' : 'pending'
                      }`}
                    >
                      {reservation.paymentStatus === 'captured' ? 'Paid' : 'Pending'}
                    </span>
                  </td>
                  <td>
                    ${(reservation.amountCents / 100).toFixed(2)}
                    <br />
                    {reservation.paymentMethod} · {reservation.paymentStatus}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => handleMarkCaptured(reservation.id)}
                      >
                        Mark Paid
                      </button>
                      <button
                        type="button"
                        className="btn outline"
                        onClick={() => openAdjustTime(reservation)}
                      >
                        Adjust Time
                      </button>
                      <button
                        type="button"
                        className="btn outline"
                        onClick={() => handleDelete(reservation.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editingReservation && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h3>Adjust Timeslot</h3>
            <p className="modal-subtitle">
              Update the reservation for {editingReservation.customer.firstName}{' '}
              {editingReservation.customer.lastName}.
            </p>
            <div className="input-grid">
              <label className={editErrors.startTime ? 'field-error' : undefined}>
                Start Time
                <input
                  type="datetime-local"
                  value={editTimes.startTime}
                  onChange={(event) =>
                    setEditTimes((prev) => ({ ...prev, startTime: event.target.value }))
                  }
                />
                {editErrors.startTime && (
                  <span className="field-error__message">{editErrors.startTime}</span>
                )}
              </label>
              <label className={editErrors.endTime ? 'field-error' : undefined}>
                End Time
                <input
                  type="datetime-local"
                  value={editTimes.endTime}
                  onChange={(event) =>
                    setEditTimes((prev) => ({ ...prev, endTime: event.target.value }))
                  }
                />
                {editErrors.endTime && (
                  <span className="field-error__message">{editErrors.endTime}</span>
                )}
              </label>
            </div>
            {editError && <p className="modal-error">{editError}</p>}
            <div className="modal-actions">
              <button type="button" className="btn outline" onClick={closeAdjustModal}>
                Cancel
              </button>
              <button
                type="button"
                className="btn"
                onClick={handleAdjustSave}
                disabled={editSaving}
              >
                {editSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
