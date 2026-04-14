const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

const baseline = new Date();
baseline.setUTCSeconds(0, 0);

export const daysFromNowAtUtc = (daysFromNow: number, hour = 9, minute = 0): Date => {
  const date = new Date(baseline.getTime() + daysFromNow * DAY_MS);
  date.setUTCHours(hour, minute, 0, 0);
  return date;
};

export const addHours = (date: Date, hours: number): Date => new Date(date.getTime() + hours * HOUR_MS);
export const addMinutes = (date: Date, minutes: number): Date => new Date(date.getTime() + minutes * MINUTE_MS);
export const subtractDays = (date: Date, days: number): Date => new Date(date.getTime() - days * DAY_MS);

export const clampToEventWindow = (start: Date, end: Date, offsetMinutes: number): Date => {
  const proposed = addMinutes(start, offsetMinutes);
  if (proposed < start) {
    return new Date(start);
  }
  if (proposed > end) {
    return addMinutes(end, -5);
  }
  return proposed;
};

export const withServiceFee = (subtotal: number): { subtotal: number; service_fee: number; total_amount: number } => {
  const roundedSubtotal = Number(subtotal.toFixed(2));
  const service_fee = Number((roundedSubtotal * 0.1).toFixed(2));
  const total_amount = Number((roundedSubtotal + service_fee).toFixed(2));
  return { subtotal: roundedSubtotal, service_fee, total_amount };
};
