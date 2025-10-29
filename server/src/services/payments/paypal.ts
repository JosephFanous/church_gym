export interface PaymentIntentInput {
  reservationId: string;
  amountCents: number;
  currency?: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface PaymentIntentResponse {
  provider: 'paypal';
  status: 'pending' | 'failed' | 'authorized';
  approvalUrl?: string;
  raw?: unknown;
}

export const createPaypalOrder = async (
  input: PaymentIntentInput
): Promise<PaymentIntentResponse> => {
  // TODO: Replace this stub with a PayPal Orders API integration.
  const { reservationId, amountCents } = input;
  const amount = (amountCents / 100).toFixed(2);

  console.info(
    `[payments:paypal] Create order placeholder -> reservation=${reservationId} amount=${amount}`
  );

  return {
    provider: 'paypal',
    status: 'pending',
    approvalUrl: `https://www.paypal.com/checkoutnow?token=${encodeURIComponent(reservationId)}`
  };
};
