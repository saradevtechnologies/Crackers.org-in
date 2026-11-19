/** Build a UPI deep link (encoded into the QR code) for an exact amount and order note. */
export function upiLink(amount: number, orderNo: string) {
  const params = new URLSearchParams({
    pa: process.env.NEXT_PUBLIC_UPI_ID || '',
    pn: process.env.NEXT_PUBLIC_UPI_NAME || 'crackers.org.in',
    am: Number(amount).toFixed(2),
    cu: 'INR',
    tn: orderNo,
  });
  return `upi://pay?${params.toString()}`;
}
