import { securityUserIds, staffUserIds } from '../utils/ids';
import { subtractDays } from '../utils/helpers';
import { eventById } from './events';

type StaffAssignedRole = 'staff' | 'security';
type StaffStatus = 'active' | 'inactive';

export interface StaffMemberSeedRecord {
  id: string;
  organizer_id: string;
  event_id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  phone_number: string | null;
  assigned_role: StaffAssignedRole;
  staff_badge_id: string;
  status: StaffStatus;
  created_at: Date;
}

interface StaffAssignmentInput {
  event_id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  phone_number: string | null;
  assigned_role: StaffAssignedRole;
  badge_suffix: string;
  status: StaffStatus;
}

const assignments: StaffAssignmentInput[] = [
  { event_id: 'event_01', user_id: staffUserIds[0], full_name: 'Kidus Alemayehu', email: 'staff1@event.com', phone_number: '0944000001', assigned_role: 'staff', badge_suffix: 'A', status: 'active' },
  { event_id: 'event_01', user_id: null, full_name: 'Mahi Deriba', email: 'mahi.deriba@crew.event.com', phone_number: '0917000101', assigned_role: 'security', badge_suffix: 'B', status: 'active' },
  { event_id: 'event_02', user_id: securityUserIds[0], full_name: 'Bruk Mamo', email: 'security1@event.com', phone_number: '0955000001', assigned_role: 'security', badge_suffix: 'A', status: 'active' },
  { event_id: 'event_02', user_id: null, full_name: 'Kidane Toma', email: 'kidane.toma@crew.event.com', phone_number: '0917000202', assigned_role: 'staff', badge_suffix: 'B', status: 'active' },
  { event_id: 'event_03', user_id: staffUserIds[1], full_name: 'Hiwot Bekele', email: 'staff2@event.com', phone_number: '0944000002', assigned_role: 'staff', badge_suffix: 'A', status: 'active' },
  { event_id: 'event_03', user_id: securityUserIds[1], full_name: 'Eden Hailemariam', email: 'security2@event.com', phone_number: '0955000002', assigned_role: 'security', badge_suffix: 'B', status: 'active' },
  { event_id: 'event_04', user_id: null, full_name: 'Alemayehu Worku', email: 'alemayehu.worku@crew.event.com', phone_number: '0917000401', assigned_role: 'staff', badge_suffix: 'A', status: 'active' },
  { event_id: 'event_04', user_id: null, full_name: 'Saron Desta', email: 'saron.desta@crew.event.com', phone_number: '0917000402', assigned_role: 'security', badge_suffix: 'B', status: 'active' },
  { event_id: 'event_05', user_id: staffUserIds[0], full_name: 'Kidus Alemayehu', email: 'staff1@event.com', phone_number: '0944000001', assigned_role: 'staff', badge_suffix: 'A', status: 'active' },
  { event_id: 'event_05', user_id: null, full_name: 'Fikerte Wolde', email: 'fikerte.wolde@crew.event.com', phone_number: '0917000502', assigned_role: 'security', badge_suffix: 'B', status: 'active' },
  { event_id: 'event_06', user_id: securityUserIds[0], full_name: 'Bruk Mamo', email: 'security1@event.com', phone_number: '0955000001', assigned_role: 'security', badge_suffix: 'A', status: 'active' },
  { event_id: 'event_06', user_id: null, full_name: 'Netsanet Tegegne', email: 'netsanet.tegegne@crew.event.com', phone_number: '0917000602', assigned_role: 'staff', badge_suffix: 'B', status: 'active' },
  { event_id: 'event_07', user_id: staffUserIds[1], full_name: 'Hiwot Bekele', email: 'staff2@event.com', phone_number: '0944000002', assigned_role: 'staff', badge_suffix: 'A', status: 'active' },
  { event_id: 'event_07', user_id: null, full_name: 'Henok Adugna', email: 'henok.adugna@crew.event.com', phone_number: '0917000702', assigned_role: 'security', badge_suffix: 'B', status: 'active' },
  { event_id: 'event_08', user_id: null, full_name: 'Mikias Seifu', email: 'mikias.seifu@crew.event.com', phone_number: '0917000801', assigned_role: 'staff', badge_suffix: 'A', status: 'inactive' },
  { event_id: 'event_08', user_id: null, full_name: 'Liya Gebre', email: 'liya.gebre@crew.event.com', phone_number: '0917000802', assigned_role: 'security', badge_suffix: 'B', status: 'active' },
  { event_id: 'event_11', user_id: securityUserIds[1], full_name: 'Eden Hailemariam', email: 'security2@event.com', phone_number: '0955000002', assigned_role: 'security', badge_suffix: 'A', status: 'active' },
  { event_id: 'event_11', user_id: staffUserIds[0], full_name: 'Kidus Alemayehu', email: 'staff1@event.com', phone_number: '0944000001', assigned_role: 'staff', badge_suffix: 'B', status: 'active' },
  { event_id: 'event_12', user_id: securityUserIds[0], full_name: 'Bruk Mamo', email: 'security1@event.com', phone_number: '0955000001', assigned_role: 'security', badge_suffix: 'A', status: 'active' },
  { event_id: 'event_12', user_id: staffUserIds[1], full_name: 'Hiwot Bekele', email: 'staff2@event.com', phone_number: '0944000002', assigned_role: 'staff', badge_suffix: 'B', status: 'active' }
];

export const staffMembers: StaffMemberSeedRecord[] = assignments.map((assignment, index) => {
  const event = eventById[assignment.event_id];
  return {
    id: `staff_member_${String(index + 1).padStart(3, '0')}`,
    organizer_id: event.organizer_id,
    event_id: assignment.event_id,
    user_id: assignment.user_id,
    full_name: assignment.full_name,
    email: assignment.email,
    phone_number: assignment.phone_number,
    assigned_role: assignment.assigned_role,
    staff_badge_id: `${event.code.toUpperCase()}-${assignment.badge_suffix}`,
    status: assignment.status,
    created_at: subtractDays(event.start_datetime, 5)
  };
});
