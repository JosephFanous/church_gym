export type PaymentMethod = 'paypal' | 'clover';
export type PaymentStatus = 'pending' | 'authorized' | 'captured' | 'failed';

export interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string;
  createdAt: string;
}

export interface Reservation {
  id: string;
  customerId: number;
  sport: string;
  notes?: string | null;
  startTime: string;
  endTime: string;
  amountCents: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ReservationWithCustomer extends Reservation {
  customer: Customer;
}

export interface AvailabilitySlot {
  startTime: string;
  endTime: string;
}
