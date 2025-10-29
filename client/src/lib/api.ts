import axios from 'axios';

// const api = axios.create({
//   baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api'
// });
const api = axios.create({ baseURL: 'http://localhost:4000/api' });

export interface AvailabilitySlot {
  startTime: string;
  endTime: string;
}

export interface AvailabilityResponse {
  slots: AvailabilitySlot[];
  meta: {
    start: string;
    end: string;
    total: number;
  };
}

export interface ReservationRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string;
  sport: string;
  startTime: string;
  endTime: string;
  amountCents: number;
  notes?: string;
  paymentMethod: 'paypal' | 'clover';
}

export interface ReservationResponse {
  reservation: {
    id: string;
    startTime: string;
    endTime: string;
    sport: string;
    paymentStatus: string;
  };
  payment: {
    provider: string;
    status: string;
    approvalUrl?: string;
    checkoutUrl?: string;
  };
}

export interface AdminReservation {
  id: string;
  startTime: string;
  endTime: string;
  sport: string;
  amountCents: number;
  paymentStatus: string;
  paymentMethod: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}

export const fetchAvailability = async (params: {
  start?: string;
  end?: string;
}): Promise<AvailabilityResponse> => {
  const response = await api.get<AvailabilityResponse>('/availability', {
    params
  });
  return response.data;
};

export const createReservation = async (payload: ReservationRequest): Promise<ReservationResponse> => {
  const response = await api.post<ReservationResponse>('/reservations', payload);
  return response.data;
};

export const fetchReservations = async (adminKey: string): Promise<AdminReservation[]> => {
  const response = await api.get<{ data: AdminReservation[] }>('/admin/reservations', {
    headers: {
      'x-admin-key': adminKey
    }
  });

  return response.data.data;
};

export const deleteReservation = async (id: string, adminKey: string) => {
  await api.delete(`/admin/reservations/${id}`, {
    headers: {
      'x-admin-key': adminKey
    }
  });
};

export const updateReservation = async (
  id: string,
  adminKey: string,
  updates: Partial<{ startTime: string; endTime: string; paymentStatus: string }>
) => {
  await api.patch(
    `/admin/reservations/${id}`,
    { ...updates },
    {
      headers: {
        'x-admin-key': adminKey
      }
    }
  );
};

export default api;
