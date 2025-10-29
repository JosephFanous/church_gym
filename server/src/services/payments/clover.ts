export interface CloverPaymentInput {
  reservationId: string;
  amountCents: number;
  currency?: string;
  description?: string;
}

export interface CloverPaymentResponse {
  provider: 'clover';
  status: 'pending' | 'failed' | 'authorized';
  checkoutUrl?: string;
  raw?: unknown;
}

export const createCloverCheckout = async (
  input: CloverPaymentInput
): Promise<CloverPaymentResponse> => {
  // TODO: Connect to Clover hosted checkout or in-person payment flows.
  const { reservationId, amountCents } = input;
  const amount = (amountCents / 100).toFixed(2);

  console.info(
    `[payments:clover] Create checkout placeholder -> reservation=${reservationId} amount=${amount}`
  );

  return {
    provider: 'clover',
    status: 'pending',
    checkoutUrl: `https://www.clover.com/pseudo-checkout/${encodeURIComponent(reservationId)}`
  };
};
