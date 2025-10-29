import { config } from '../config.js';

interface ConfirmationPayload {
  reservationId: string;
  recipientEmail: string;
  recipientName: string;
  sport: string;
  startTime: string;
  endTime: string;
  amountCents: number;
}

const formatDateTime = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
};

export const sendReservationConfirmation = async (payload: ConfirmationPayload) => {
  if (!config.brevoApiKey || !config.brevoSenderEmail) {
    console.warn(
      '[emailService] Skipping confirmation email because Brevo is not configured.'
    );
    return;
  }

  const amount = (payload.amountCents / 100).toFixed(2);
  const textContent = [
    `Reservation Confirmation`,
    ``,
    `Reservation ID: ${payload.reservationId}`,
    `Sport: ${payload.sport}`,
    `Start: ${formatDateTime(payload.startTime)}`,
    `End: ${formatDateTime(payload.endTime)}`,
    `Amount: $${amount}`,
    ``,
    `We look forward to seeing you at the gym!`
  ].join('\n');

  const request = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': config.brevoApiKey
    },
    body: JSON.stringify({
      sender: {
        email: config.brevoSenderEmail,
        name: config.brevoSenderName ?? 'Church Gym'
      },
      to: [
        {
          email: payload.recipientEmail,
          name: payload.recipientName
        }
      ],
      bcc: config.brevoOwnerEmail
        ? [
            {
              email: config.brevoOwnerEmail
            }
          ]
        : undefined,
      subject: 'Your Church Gym reservation confirmation',
      textContent
    })
  });

  if (!request.ok) {
    const message = await request.text();
    console.error('[emailService] Failed to send confirmation email', message);
  }
};
