import { digitalTicketCodeFor, orderNumberFor, securityUserIds, staffUserIds } from '../utils/ids';

type CheckInStatus = 'valid' | 'already_scanned' | 'invalid';

export interface CheckInPlanRecord {
  id: string;
  ticket_code: string;
  event_id: string;
  staff_id: string;
  status: CheckInStatus;
  offset_minutes: number;
}

export const checkInPlans: CheckInPlanRecord[] = [
  {
    id: 'checkin_001',
    ticket_code: digitalTicketCodeFor(orderNumberFor(1), 1),
    event_id: 'event_11',
    staff_id: securityUserIds[1],
    status: 'valid',
    offset_minutes: 70
  },
  {
    id: 'checkin_002',
    ticket_code: digitalTicketCodeFor(orderNumberFor(1), 2),
    event_id: 'event_11',
    staff_id: staffUserIds[0],
    status: 'valid',
    offset_minutes: 95
  },
  {
    id: 'checkin_003',
    ticket_code: digitalTicketCodeFor(orderNumberFor(2), 1),
    event_id: 'event_11',
    staff_id: securityUserIds[1],
    status: 'valid',
    offset_minutes: 110
  },
  {
    id: 'checkin_004',
    ticket_code: digitalTicketCodeFor(orderNumberFor(3), 1),
    event_id: 'event_11',
    staff_id: staffUserIds[0],
    status: 'valid',
    offset_minutes: 140
  },
  {
    id: 'checkin_005',
    ticket_code: digitalTicketCodeFor(orderNumberFor(3), 1),
    event_id: 'event_11',
    staff_id: staffUserIds[0],
    status: 'already_scanned',
    offset_minutes: 145
  },
  {
    id: 'checkin_006',
    ticket_code: digitalTicketCodeFor(orderNumberFor(4), 1),
    event_id: 'event_12',
    staff_id: securityUserIds[0],
    status: 'valid',
    offset_minutes: 40
  },
  {
    id: 'checkin_007',
    ticket_code: digitalTicketCodeFor(orderNumberFor(4), 2),
    event_id: 'event_12',
    staff_id: staffUserIds[1],
    status: 'valid',
    offset_minutes: 65
  },
  {
    id: 'checkin_008',
    ticket_code: digitalTicketCodeFor(orderNumberFor(5), 1),
    event_id: 'event_12',
    staff_id: securityUserIds[0],
    status: 'valid',
    offset_minutes: 85
  },
  {
    id: 'checkin_009',
    ticket_code: digitalTicketCodeFor(orderNumberFor(6), 1),
    event_id: 'event_12',
    staff_id: staffUserIds[1],
    status: 'valid',
    offset_minutes: 105
  },
  {
    id: 'checkin_010',
    ticket_code: digitalTicketCodeFor(orderNumberFor(7), 1),
    event_id: 'event_01',
    staff_id: securityUserIds[0],
    status: 'invalid',
    offset_minutes: 60
  },
  {
    id: 'checkin_011',
    ticket_code: digitalTicketCodeFor(orderNumberFor(5), 1),
    event_id: 'event_12',
    staff_id: securityUserIds[0],
    status: 'already_scanned',
    offset_minutes: 95
  },
  {
    id: 'checkin_012',
    ticket_code: digitalTicketCodeFor(orderNumberFor(8), 1),
    event_id: 'event_01',
    staff_id: staffUserIds[0],
    status: 'invalid',
    offset_minutes: 120
  }
];
