import { organizerUserIds, payoutTxRefFor, platformTxRefFor } from '../utils/ids';
import { addHours, daysFromNowAtUtc } from '../utils/helpers';

type PlatformPaymentStatus = 'pending' | 'completed' | 'failed' | 'cancelled';
type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface PlatformFeePaymentSeedRecord {
  id: string;
  user_id: string;
  amount: number;
  payment_method: string;
  status: PlatformPaymentStatus;
  tx_ref: string;
  created_at: Date;
  completed_at: Date | null;
}

export interface PayoutSeedRecord {
  id: string;
  user_id: string;
  amount: number;
  method: string;
  details: string;
  status: PayoutStatus;
  tx_ref: string;
  created_at: Date;
  completed_at: Date | null;
}

const platformAmounts = [4200, 3800, 4500, 3000, 2750, 3300, 2950, 2600, 2100, 2400, 2250, 2050];
const platformStatuses: PlatformPaymentStatus[] = [
  'completed',
  'completed',
  'completed',
  'completed',
  'completed',
  'completed',
  'completed',
  'completed',
  'pending',
  'pending',
  'pending',
  'pending'
];

export const platformFeePayments: PlatformFeePaymentSeedRecord[] = platformAmounts.map((amount, index) => {
  const created_at = daysFromNowAtUtc(-28 + index * 2, 11, 0);
  const status = platformStatuses[index];

  return {
    id: `platform_fee_${String(index + 1).padStart(3, '0')}`,
    user_id: organizerUserIds[index % organizerUserIds.length],
    amount,
    payment_method: index % 3 === 0 ? 'telebirr' : 'chapa',
    status,
    tx_ref: platformTxRefFor(index + 1),
    created_at,
    completed_at: status === 'completed' ? addHours(created_at, 36) : null
  };
});

export const payouts: PayoutSeedRecord[] = [
  {
    id: 'payout_001',
    user_id: organizerUserIds[2],
    amount: 18000,
    method: 'bank_transfer',
    details: JSON.stringify({ event: 'event_11', bank: 'Commercial Bank of Ethiopia', account: '1000012300456' }),
    status: 'completed',
    tx_ref: payoutTxRefFor(1),
    created_at: daysFromNowAtUtc(-35, 13, 0),
    completed_at: daysFromNowAtUtc(-34, 15, 30)
  },
  {
    id: 'payout_002',
    user_id: organizerUserIds[2],
    amount: 12600,
    method: 'bank_transfer',
    details: JSON.stringify({ event: 'event_11', bank: 'Awash Bank', account: '22013004512' }),
    status: 'completed',
    tx_ref: payoutTxRefFor(2),
    created_at: daysFromNowAtUtc(-30, 11, 0),
    completed_at: daysFromNowAtUtc(-29, 16, 10)
  },
  {
    id: 'payout_003',
    user_id: organizerUserIds[2],
    amount: 9400,
    method: 'bank_transfer',
    details: JSON.stringify({ event: 'event_11', bank: 'Dashen Bank', account: '3004456712' }),
    status: 'processing',
    tx_ref: payoutTxRefFor(3),
    created_at: daysFromNowAtUtc(-24, 10, 20),
    completed_at: null
  },
  {
    id: 'payout_004',
    user_id: organizerUserIds[2],
    amount: 7600,
    method: 'bank_transfer',
    details: JSON.stringify({ event: 'event_11', bank: 'Abay Bank', account: '9400012801' }),
    status: 'pending',
    tx_ref: payoutTxRefFor(4),
    created_at: daysFromNowAtUtc(-17, 9, 45),
    completed_at: null
  },
  {
    id: 'payout_005',
    user_id: organizerUserIds[2],
    amount: 5100,
    method: 'bank_transfer',
    details: JSON.stringify({ event: 'event_11', bank: 'Nib International Bank', account: '660012123' }),
    status: 'failed',
    tx_ref: payoutTxRefFor(5),
    created_at: daysFromNowAtUtc(-12, 12, 20),
    completed_at: null
  },
  {
    id: 'payout_006',
    user_id: organizerUserIds[3],
    amount: 14500,
    method: 'telebirr_settlement',
    details: JSON.stringify({ event: 'event_12', wallet: '0911223344' }),
    status: 'completed',
    tx_ref: payoutTxRefFor(6),
    created_at: daysFromNowAtUtc(-18, 10, 0),
    completed_at: daysFromNowAtUtc(-17, 13, 25)
  },
  {
    id: 'payout_007',
    user_id: organizerUserIds[3],
    amount: 11200,
    method: 'bank_transfer',
    details: JSON.stringify({ event: 'event_12', bank: 'Bank of Abyssinia', account: '500128872' }),
    status: 'completed',
    tx_ref: payoutTxRefFor(7),
    created_at: daysFromNowAtUtc(-14, 9, 30),
    completed_at: daysFromNowAtUtc(-13, 11, 40)
  },
  {
    id: 'payout_008',
    user_id: organizerUserIds[3],
    amount: 9800,
    method: 'bank_transfer',
    details: JSON.stringify({ event: 'event_12', bank: 'Cooperative Bank of Oromia', account: '770044190' }),
    status: 'completed',
    tx_ref: payoutTxRefFor(8),
    created_at: daysFromNowAtUtc(-10, 14, 10),
    completed_at: daysFromNowAtUtc(-9, 16, 30)
  },
  {
    id: 'payout_009',
    user_id: organizerUserIds[3],
    amount: 6400,
    method: 'bank_transfer',
    details: JSON.stringify({ event: 'event_12', bank: 'Wegagen Bank', account: '880332914' }),
    status: 'pending',
    tx_ref: payoutTxRefFor(9),
    created_at: daysFromNowAtUtc(-6, 10, 45),
    completed_at: null
  },
  {
    id: 'payout_010',
    user_id: organizerUserIds[3],
    amount: 5000,
    method: 'bank_transfer',
    details: JSON.stringify({ event: 'event_12', bank: 'Dashen Bank', account: '311004491' }),
    status: 'cancelled',
    tx_ref: payoutTxRefFor(10),
    created_at: daysFromNowAtUtc(-3, 9, 55),
    completed_at: null
  }
];
