import 'dotenv/config';

export interface AppConfig {
  port: number;
  databasePath: string;
  adminApiKey: string;
  brevoApiKey: string | undefined;
  brevoSenderEmail: string | undefined;
  brevoSenderName: string | undefined;
  brevoOwnerEmail: string | undefined;
  baseReservationUrl: string;
}

const required = (value: string | undefined, fallback: string): string =>
  value && value.trim().length > 0 ? value : fallback;

const port = Number(process.env.PORT || 4000);

export const config: AppConfig = {
  port: Number.isFinite(port) ? port : 4000,
  databasePath: required(
    process.env.DATABASE_PATH,
    '../data/church_gym.sqlite'
  ),
  adminApiKey: required(process.env.ADMIN_API_KEY, 'change-me'),
  brevoApiKey: process.env.BREVO_API_KEY,
  brevoSenderEmail: process.env.BREVO_SENDER_EMAIL,
  brevoSenderName: process.env.BREVO_SENDER_NAME ?? 'Church Gym',
  brevoOwnerEmail: process.env.BREVO_OWNER_EMAIL,
  baseReservationUrl:
    process.env.BASE_RESERVATION_URL ?? 'http://localhost:5173/book'
};
