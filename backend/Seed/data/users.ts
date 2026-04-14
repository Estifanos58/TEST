import type { SeedRoleName } from '../utils/ids';
import {
  adminUserIds,
  attendeeUserIds,
  organizerUserIds,
  securityUserIds,
  staffUserIds
} from '../utils/ids';
import { daysFromNowAtUtc } from '../utils/helpers';

type SeedUserStatus = 'active' | 'pending' | 'suspended' | 'deleted' | 'rejected';

export interface SeedUserRecord {
  id: string;
  role: SeedRoleName;
  full_name: string;
  email: string;
  user_name: string;
  phone: string | null;
  status: SeedUserStatus;
  plainPassword: string;
  email_verified: boolean;
  last_login_at: Date | null;
}

const adminNames = [
  'Hana Meles',
  'Dawit Bekele',
  'Selamawit Tadesse',
  'Amanuel Getachew',
  'Lulit Bekele',
  'Yared Solomon',
  'Martha Kiros',
  'Tesfaye Hailu'
];
const organizerNames = [
  'Abebe Kassa',
  'Meron Alemu',
  'Eden Teshome',
  'Fikru Assefa',
  'Kalkidan Gebru',
  'Ruth Girma',
  'Nahom Tulu',
  'Liya Dagne',
  'Samuel Hailu',
  'Birtukan Tesfaye'
];
const attendeeNames = [
  'Abel Demissie',
  'Rahel Yohannes',
  'Miki Tesfaye',
  'Saron Mekonnen',
  'Tigist Fikru',
  'Henok Lema',
  'Bethelhem Teshome',
  'Yonas Wondimu',
  'Samiya Ali',
  'Kaleb Tadesse',
  'Martha Getu',
  'Naol Asrat',
  'Ruth Yimam',
  'Blen Bekele',
  'Bereket Haile',
  'Lulit Girma',
  'Yonatan Deresa'
];

const organizerStatuses: SeedUserStatus[] = [
  'active',
  'active',
  'active',
  'active',
  'active',
  'active',
  'pending',
  'pending',
  'rejected',
  'rejected'
];

const toUserName = (email: string): string => email.split('@')[0];

const adminUsers: SeedUserRecord[] = adminNames.map((full_name, index) => {
  const email = `admin${index + 1}@event.com`;
  return {
    id: adminUserIds[index],
    role: 'admin',
    full_name,
    email,
    user_name: toUserName(email),
    phone: `09110000${String(index + 1).padStart(2, '0')}`,
    status: 'active',
    plainPassword: 'Admin123!',
    email_verified: true,
    last_login_at: daysFromNowAtUtc(-(index + 1), 7, 30)
  };
});

const superAdminUser: SeedUserRecord = {
  id: 'user_admin_super_01',
  role: 'admin',
  full_name: 'Super Admin',
  email: 'nexussphere0974@gmail.com',
  user_name: toUserName('nexussphere0974@gmail.com'),
  phone: null,
  status: 'active',
  plainPassword: '12345678',
  email_verified: true,
  last_login_at: daysFromNowAtUtc(-1, 6, 45)
};

const organizerUsers: SeedUserRecord[] = organizerNames.map((full_name, index) => {
  const email = `organizer${index + 1}@event.com`;
  return {
    id: organizerUserIds[index],
    role: 'organizer',
    full_name,
    email,
    user_name: toUserName(email),
    phone: `09220000${String(index + 1).padStart(2, '0')}`,
    status: organizerStatuses[index],
    plainPassword: 'Organizer123!',
    email_verified: true,
    last_login_at: organizerStatuses[index] === 'active' ? daysFromNowAtUtc(-(index + 2), 10, 15) : null
  };
});

const attendeeUsers: SeedUserRecord[] = attendeeNames.map((full_name, index) => {
  const email = `user${index + 1}@event.com`;
  return {
    id: attendeeUserIds[index],
    role: 'attendee',
    full_name,
    email,
    user_name: toUserName(email),
    phone: `09330000${String(index + 1).padStart(2, '0')}`,
    status: 'active',
    plainPassword: 'User123!',
    email_verified: true,
    last_login_at: daysFromNowAtUtc(-(index % 6) - 1, 8, 20)
  };
});

const staffUsers: SeedUserRecord[] = [
  {
    id: staffUserIds[0],
    role: 'staff',
    full_name: 'Kidus Alemayehu',
    email: 'staff1@event.com',
    user_name: 'kidus.staff',
    phone: '0944000001',
    status: 'active',
    plainPassword: 'Staff123!',
    email_verified: true,
    last_login_at: daysFromNowAtUtc(-1, 9, 0)
  },
  {
    id: staffUserIds[1],
    role: 'staff',
    full_name: 'Hiwot Bekele',
    email: 'staff2@event.com',
    user_name: 'hiwot.staff',
    phone: '0944000002',
    status: 'active',
    plainPassword: 'Staff123!',
    email_verified: true,
    last_login_at: daysFromNowAtUtc(-2, 9, 10)
  }
];

const securityUsers: SeedUserRecord[] = [
  {
    id: securityUserIds[0],
    role: 'security',
    full_name: 'Bruk Mamo',
    email: 'security1@event.com',
    user_name: 'bruk.security',
    phone: '0955000001',
    status: 'active',
    plainPassword: 'Security123!',
    email_verified: true,
    last_login_at: daysFromNowAtUtc(-1, 8, 45)
  },
  {
    id: securityUserIds[1],
    role: 'security',
    full_name: 'Eden Hailemariam',
    email: 'security2@event.com',
    user_name: 'eden.security',
    phone: '0955000002',
    status: 'active',
    plainPassword: 'Security123!',
    email_verified: true,
    last_login_at: daysFromNowAtUtc(-3, 8, 50)
  }
];

export const users: SeedUserRecord[] = [
  ...adminUsers,
  superAdminUser,
  ...organizerUsers,
  ...attendeeUsers,
  ...staffUsers,
  ...securityUsers
];

export const demoAccounts = {
  admin: { email: 'admin1@event.com', password: 'Admin123!' },
  super_admin: { email: 'nexussphere0974@gmail.com', password: '12345678' },
  organizer: { email: 'organizer1@event.com', password: 'Organizer123!' },
  user: { email: 'user1@event.com', password: 'User123!' },
  staff: { email: 'staff1@event.com', password: 'Staff123!' },
  security: { email: 'security1@event.com', password: 'Security123!' }
};
