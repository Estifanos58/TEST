import { attendeeUserIds, orderIdFor, orderNumberFor, orderTxRefFor, type SeedEventId, type TicketTierKey } from '../utils/ids';
import { addMinutes, subtractDays, withServiceFee } from '../utils/helpers';
import { eventById } from './events';
import { ticketPriceByEventAndTier } from './tickets';

type OrderStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded';

interface OrderScenario {
  user_id: string;
  event_id: SeedEventId;
  ticket_tier_key: TicketTierKey;
  quantity: number;
  status: OrderStatus;
  days_before_start: number;
  payment_method: string;
  used_ticket_count: number;
}

export interface OrderSeedRecord {
  id: string;
  user_id: string;
  order_number: string;
  subtotal: number;
  service_fee: number;
  total_amount: number;
  status: OrderStatus;
  payment_method: string;
  tx_ref: string;
  paid_at: Date | null;
  created_at: Date;
  event_id: SeedEventId;
  ticket_tier_key: TicketTierKey;
  quantity: number;
  unit_price: number;
  used_ticket_count: number;
}

const scenarios: OrderScenario[] = [
  { user_id: attendeeUserIds[0], event_id: 'event_11', ticket_tier_key: 'regular', quantity: 2, status: 'paid', days_before_start: 15, payment_method: 'chapa', used_ticket_count: 2 },
  { user_id: attendeeUserIds[1], event_id: 'event_11', ticket_tier_key: 'vip', quantity: 1, status: 'paid', days_before_start: 14, payment_method: 'chapa', used_ticket_count: 1 },
  { user_id: attendeeUserIds[2], event_id: 'event_11', ticket_tier_key: 'early', quantity: 1, status: 'paid', days_before_start: 13, payment_method: 'chapa', used_ticket_count: 1 },
  { user_id: attendeeUserIds[3], event_id: 'event_12', ticket_tier_key: 'regular', quantity: 2, status: 'paid', days_before_start: 9, payment_method: 'chapa', used_ticket_count: 2 },
  { user_id: attendeeUserIds[4], event_id: 'event_12', ticket_tier_key: 'vip', quantity: 1, status: 'paid', days_before_start: 8, payment_method: 'chapa', used_ticket_count: 1 },
  { user_id: attendeeUserIds[5], event_id: 'event_12', ticket_tier_key: 'early', quantity: 1, status: 'paid', days_before_start: 8, payment_method: 'chapa', used_ticket_count: 1 },
  { user_id: attendeeUserIds[6], event_id: 'event_01', ticket_tier_key: 'early', quantity: 1, status: 'paid', days_before_start: 10, payment_method: 'chapa', used_ticket_count: 0 },
  { user_id: attendeeUserIds[7], event_id: 'event_01', ticket_tier_key: 'regular', quantity: 2, status: 'paid', days_before_start: 7, payment_method: 'chapa', used_ticket_count: 0 },
  { user_id: attendeeUserIds[8], event_id: 'event_02', ticket_tier_key: 'regular', quantity: 1, status: 'paid', days_before_start: 9, payment_method: 'chapa', used_ticket_count: 0 },
  { user_id: attendeeUserIds[9], event_id: 'event_03', ticket_tier_key: 'vip', quantity: 1, status: 'paid', days_before_start: 5, payment_method: 'chapa', used_ticket_count: 0 },
  { user_id: attendeeUserIds[10], event_id: 'event_04', ticket_tier_key: 'regular', quantity: 1, status: 'paid', days_before_start: 14, payment_method: 'chapa', used_ticket_count: 0 },
  { user_id: attendeeUserIds[11], event_id: 'event_05', ticket_tier_key: 'early', quantity: 1, status: 'paid', days_before_start: 8, payment_method: 'chapa', used_ticket_count: 0 },
  { user_id: attendeeUserIds[12], event_id: 'event_06', ticket_tier_key: 'regular', quantity: 2, status: 'paid', days_before_start: 4, payment_method: 'telebirr', used_ticket_count: 0 },
  { user_id: attendeeUserIds[13], event_id: 'event_07', ticket_tier_key: 'regular', quantity: 1, status: 'paid', days_before_start: 2, payment_method: 'telebirr', used_ticket_count: 0 },
  { user_id: attendeeUserIds[14], event_id: 'event_08', ticket_tier_key: 'early', quantity: 1, status: 'pending', days_before_start: 6, payment_method: 'chapa', used_ticket_count: 0 },
  { user_id: attendeeUserIds[15], event_id: 'event_08', ticket_tier_key: 'vip', quantity: 1, status: 'pending', days_before_start: 5, payment_method: 'chapa', used_ticket_count: 0 },
  { user_id: attendeeUserIds[16], event_id: 'event_09', ticket_tier_key: 'regular', quantity: 2, status: 'pending', days_before_start: 9, payment_method: 'chapa', used_ticket_count: 0 },
  { user_id: attendeeUserIds[0], event_id: 'event_03', ticket_tier_key: 'early', quantity: 1, status: 'failed', days_before_start: 4, payment_method: 'chapa', used_ticket_count: 0 },
  { user_id: attendeeUserIds[1], event_id: 'event_04', ticket_tier_key: 'vip', quantity: 1, status: 'failed', days_before_start: 12, payment_method: 'chapa', used_ticket_count: 0 },
  { user_id: attendeeUserIds[2], event_id: 'event_06', ticket_tier_key: 'early', quantity: 1, status: 'failed', days_before_start: 3, payment_method: 'telebirr', used_ticket_count: 0 },
  { user_id: attendeeUserIds[3], event_id: 'event_10', ticket_tier_key: 'regular', quantity: 2, status: 'cancelled', days_before_start: 6, payment_method: 'chapa', used_ticket_count: 0 },
  { user_id: attendeeUserIds[4], event_id: 'event_09', ticket_tier_key: 'vip', quantity: 1, status: 'cancelled', days_before_start: 7, payment_method: 'telebirr', used_ticket_count: 0 },
  { user_id: attendeeUserIds[5], event_id: 'event_11', ticket_tier_key: 'regular', quantity: 1, status: 'refunded', days_before_start: 11, payment_method: 'chapa', used_ticket_count: 0 },
  { user_id: attendeeUserIds[6], event_id: 'event_12', ticket_tier_key: 'regular', quantity: 1, status: 'refunded', days_before_start: 7, payment_method: 'chapa', used_ticket_count: 0 }
];

export const orders: OrderSeedRecord[] = scenarios.map((scenario, index) => {
  const event = eventById[scenario.event_id];
  const unit_price = ticketPriceByEventAndTier[`${scenario.event_id}:${scenario.ticket_tier_key}`];
  const subtotalRaw = unit_price * scenario.quantity;
  const pricing = withServiceFee(subtotalRaw);

  const created_at = subtractDays(event.start_datetime, scenario.days_before_start);
  const paid_at = scenario.status === 'paid' || scenario.status === 'refunded'
    ? addMinutes(created_at, 35)
    : null;

  return {
    id: orderIdFor(index + 1),
    order_number: orderNumberFor(index + 1),
    user_id: scenario.user_id,
    subtotal: pricing.subtotal,
    service_fee: pricing.service_fee,
    total_amount: pricing.total_amount,
    status: scenario.status,
    payment_method: scenario.payment_method,
    tx_ref: orderTxRefFor(index + 1),
    paid_at,
    created_at,
    event_id: scenario.event_id,
    ticket_tier_key: scenario.ticket_tier_key,
    quantity: scenario.quantity,
    unit_price,
    used_ticket_count: scenario.used_ticket_count
  };
});
