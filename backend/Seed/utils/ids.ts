export type SeedRoleName = 'admin' | 'organizer' | 'attendee' | 'staff' | 'security';
export type TicketTierKey = 'early' | 'regular' | 'vip';

export const adminUserIds = [
  'user_admin_01',
  'user_admin_02',
  'user_admin_03',
  'user_admin_04',
  'user_admin_05',
  'user_admin_06',
  'user_admin_07',
  'user_admin_08'
] as const;
export const organizerUserIds = [
  'user_org_01',
  'user_org_02',
  'user_org_03',
  'user_org_04',
  'user_org_05',
  'user_org_06',
  'user_org_07',
  'user_org_08',
  'user_org_09',
  'user_org_10'
] as const;
export const attendeeUserIds = [
  'user_att_01',
  'user_att_02',
  'user_att_03',
  'user_att_04',
  'user_att_05',
  'user_att_06',
  'user_att_07',
  'user_att_08',
  'user_att_09',
  'user_att_10',
  'user_att_11',
  'user_att_12',
  'user_att_13',
  'user_att_14',
  'user_att_15',
  'user_att_16',
  'user_att_17'
] as const;
export const staffUserIds = ['user_staff_01', 'user_staff_02'] as const;
export const securityUserIds = ['user_security_01', 'user_security_02'] as const;

export const eventIds = [
  'event_01',
  'event_02',
  'event_03',
  'event_04',
  'event_05',
  'event_06',
  'event_07',
  'event_08',
  'event_09',
  'event_10',
  'event_11',
  'event_12'
] as const;

export type SeedEventId = (typeof eventIds)[number];

export const eventCodeById: Record<SeedEventId, string> = {
  event_01: 'e01',
  event_02: 'e02',
  event_03: 'e03',
  event_04: 'e04',
  event_05: 'e05',
  event_06: 'e06',
  event_07: 'e07',
  event_08: 'e08',
  event_09: 'e09',
  event_10: 'e10',
  event_11: 'e11',
  event_12: 'e12'
};

export const roleNameToIdFallback: Record<SeedRoleName, number> = {
  admin: 1,
  organizer: 2,
  attendee: 3,
  staff: 4,
  security: 5
};

export const ticketIdFor = (eventId: SeedEventId, tier: TicketTierKey): string =>
  `ticket_${eventCodeById[eventId]}_${tier}`;

export const orderIdFor = (index: number): string => `order_${String(index).padStart(3, '0')}`;
export const orderNumberFor = (index: number): string => `ORD-2026-${String(index).padStart(4, '0')}`;
export const orderTxRefFor = (index: number): string => `TX-ORD-2026-${String(index).padStart(4, '0')}`;
export const platformTxRefFor = (index: number): string => `TX-PF-2026-${String(index).padStart(4, '0')}`;
export const payoutTxRefFor = (index: number): string => `TX-PO-2026-${String(index).padStart(4, '0')}`;

export const digitalTicketIdFor = (orderId: string, ticketIndex: number): string =>
  `dt_${orderId}_${String(ticketIndex).padStart(2, '0')}`;

export const digitalTicketCodeFor = (orderNumber: string, ticketIndex: number): string =>
  `TKT-${orderNumber}-${String(ticketIndex).padStart(2, '0')}`;
