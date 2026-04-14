import { addHours, daysFromNowAtUtc } from '../utils/helpers';
import { attendeeUserIds, organizerUserIds } from '../utils/ids';

export interface NotificationSeedRecord {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  created_at: Date;
  read_at: Date | null;
}

const purchaseNotifications: NotificationSeedRecord[] = attendeeUserIds.slice(0, 10).map((user_id, index) => {
  const created_at = daysFromNowAtUtc(-14 + index, 12, 0);
  return {
    id: `notif_${String(index + 1).padStart(3, '0')}`,
    user_id,
    type: 'purchase',
    title: 'Order Confirmed',
    message: `Your order ORD-2026-${String(index + 1).padStart(4, '0')} has been confirmed and your digital tickets are available.`,
    created_at,
    read_at: index % 2 === 0 ? addHours(created_at, 4) : null
  };
});

const reminderNotifications: NotificationSeedRecord[] = attendeeUserIds.slice(0, 6).map((user_id, index) => {
  const created_at = daysFromNowAtUtc(-2 + index, 9, 30);
  return {
    id: `notif_${String(index + 11).padStart(3, '0')}`,
    user_id,
    type: 'reminder',
    title: 'Event Reminder',
    message: 'Your upcoming event starts soon. Please keep your digital ticket ready for check-in.',
    created_at,
    read_at: index % 3 === 0 ? addHours(created_at, 2) : null
  };
});

const eventUpdateNotifications: NotificationSeedRecord[] = organizerUserIds.slice(0, 4).map((user_id, index) => {
  const created_at = daysFromNowAtUtc(-6 + index, 15, 10);
  return {
    id: `notif_${String(index + 17).padStart(3, '0')}`,
    user_id,
    type: 'event_update',
    title: 'Event Performance Snapshot',
    message: 'New attendee and ticket analytics are available for your dashboard.',
    created_at,
    read_at: index % 2 === 1 ? addHours(created_at, 5) : null
  };
});

const payoutNotifications: NotificationSeedRecord[] = [
  {
    id: 'notif_021',
    user_id: organizerUserIds[2],
    type: 'payout',
    title: 'Payout Completed',
    message: 'A payout settlement for your completed event has been transferred successfully.',
    created_at: daysFromNowAtUtc(-11, 11, 0),
    read_at: daysFromNowAtUtc(-11, 14, 20)
  },
  {
    id: 'notif_022',
    user_id: organizerUserIds[3],
    type: 'payout',
    title: 'Payout Completed',
    message: 'Your latest payout transfer has been completed and reflected in your payout history.',
    created_at: daysFromNowAtUtc(-9, 13, 0),
    read_at: null
  },
  {
    id: 'notif_023',
    user_id: organizerUserIds[2],
    type: 'payout',
    title: 'Payout Processing',
    message: 'A payout request is currently processing and will update once bank confirmation is received.',
    created_at: daysFromNowAtUtc(-5, 10, 30),
    read_at: null
  },
  {
    id: 'notif_024',
    user_id: organizerUserIds[3],
    type: 'payout',
    title: 'Payout Pending',
    message: 'A payout request is pending review and will be scheduled in the next settlement cycle.',
    created_at: daysFromNowAtUtc(-3, 16, 10),
    read_at: daysFromNowAtUtc(-3, 18, 20)
  }
];

export const notifications: NotificationSeedRecord[] = [
  ...purchaseNotifications,
  ...reminderNotifications,
  ...eventUpdateNotifications,
  ...payoutNotifications
];
