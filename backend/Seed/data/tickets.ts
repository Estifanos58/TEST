import { events } from './events';
import { ticketIdFor, type SeedEventId, type TicketTierKey } from '../utils/ids';

export interface TicketTypeSeedRecord {
  id: string;
  event_id: SeedEventId;
  tier_key: TicketTierKey;
  tier_name: string;
  price: number;
  currency: string;
  capacity: number;
  remaining_quantity: number;
  benefits: string;
  is_active: boolean;
}

const basePriceByEvent: Record<SeedEventId, number> = {
  event_01: 2400,
  event_02: 1800,
  event_03: 1500,
  event_04: 2200,
  event_05: 1300,
  event_06: 900,
  event_07: 700,
  event_08: 1100,
  event_09: 1600,
  event_10: 1400,
  event_11: 2000,
  event_12: 1700
};

const remainingByEvent: Record<SeedEventId, [number, number, number]> = {
  event_01: [0, 32, 8],
  event_02: [0, 25, 5],
  event_03: [5, 40, 10],
  event_04: [15, 70, 18],
  event_05: [20, 55, 12],
  event_06: [10, 60, 15],
  event_07: [12, 95, 22],
  event_08: [30, 130, 45],
  event_09: [70, 180, 55],
  event_10: [60, 200, 55],
  event_11: [0, 0, 0],
  event_12: [0, 0, 0]
};

const capacitiesForEventType = (eventType: string): [number, number, number] => {
  if (eventType === 'Festival') return [150, 350, 90];
  if (eventType === 'Conference') return [120, 260, 70];
  if (eventType === 'Webinar') return [130, 240, 80];
  if (eventType === 'Workshop') return [90, 200, 55];
  return [80, 170, 45];
};

const tierConfig: Array<{ key: TicketTierKey; name: string; multiplier: number; benefits: string }> = [
  {
    key: 'early',
    name: 'Early Bird',
    multiplier: 0.75,
    benefits: 'Discounted entry with access to all core sessions.'
  },
  {
    key: 'regular',
    name: 'Regular',
    multiplier: 1,
    benefits: 'Standard admission with access to keynote and networking.'
  },
  {
    key: 'vip',
    name: 'VIP',
    multiplier: 1.8,
    benefits: 'Priority seating, speaker meet-and-greet, and dedicated support lane.'
  }
];

export const ticketTypes: TicketTypeSeedRecord[] = events.flatMap((event) => {
  const [earlyCapacity, regularCapacity, vipCapacity] = capacitiesForEventType(event.event_type);
  const [earlyRemaining, regularRemaining, vipRemaining] = remainingByEvent[event.id];
  const capacities = [earlyCapacity, regularCapacity, vipCapacity];
  const remaining = [earlyRemaining, regularRemaining, vipRemaining];
  const is_active = event.status === 'published' || event.status === 'completed';

  return tierConfig.map((tier, tierIndex) => ({
    id: ticketIdFor(event.id, tier.key),
    event_id: event.id,
    tier_key: tier.key,
    tier_name: tier.name,
    price: Number((basePriceByEvent[event.id] * tier.multiplier).toFixed(2)),
    currency: 'ETB',
    capacity: capacities[tierIndex],
    remaining_quantity: remaining[tierIndex],
    benefits: tier.benefits,
    is_active
  }));
});

export const ticketPriceByEventAndTier = ticketTypes.reduce<Record<string, number>>((acc, ticket) => {
  acc[`${ticket.event_id}:${ticket.tier_key}`] = ticket.price;
  return acc;
}, {});
