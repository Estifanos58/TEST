export const sampleEvent = { id: 'evt-1', title: 'Test Event' };
export const sampleEvents = [
  sampleEvent,
  { id: 'evt-2', title: 'Other Event' },
];

export const sampleStaff = {
  id: 'staff-1',
  full_name: 'John Doe',
  email: 'john@example.com',
  assigned_role: 'staff',
  event_id: 'evt-1',
  event_name: 'Test Event',
  phone_number: '+251912345678',
  staff_badge_id: 'B-123',
};

export const mockGetStaffMembers = (staff = [sampleStaff]) => ({ success: true, staff });

export const mockCreateStaffResponse = (staff) => ({ success: true, staff });
