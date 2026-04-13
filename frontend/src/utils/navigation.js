// Helper to check which routes are available
export const ALL_ROUTES = {
  // Public
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  DISCOVER: '/discover',
  EVENT_DETAIL: '/event/:eventId',
  
  // User
  PROFILE: '/profile',
  SAVED_TICKETS: '/saved-tickets',
  CHECKOUT: '/checkout',
  MY_TICKETS: '/my-tickets',
  
  // Organizer
  ORGANIZER_DASHBOARD: '/organizer/dashboard',
  CREATE_EVENT: '/organizer/create-event',
  STAFF_MANAGEMENT: '/staff/management',
  PAYOUT_SETTINGS: '/organizer/payouts',
  EVENT_ANALYTICS: '/organizer/analytics/:eventId',
  
  // Admin
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_APPROVALS: '/admin/approvals',
  ADMIN_USERS: '/admin/users',
  ADMIN_EVENTS: '/admin/events',
  ADMIN_CATEGORIES: '/admin/categories',
  
  // Staff/Security
  SECURITY_SCANNER: '/security/scanner',
};

// Helper to check if user can access a route
export const canAccessRoute = (role, route) => {
  const roleRoutes = {
    admin: ['/admin', '/profile', '/discover'],
    organizer: ['/organizer', '/profile', '/discover', '/create-event', '/staff', '/payouts', '/analytics'],
    attendee: ['/profile', '/discover', '/saved-tickets', '/my-tickets', '/checkout'],
    security: ['/security', '/scanner'],
    staff: ['/security', '/scanner']
  };
  
  return roleRoutes[role]?.some(r => route.startsWith(r)) || route === '/';
};

// Get user role from localStorage
export const getUserRole = () => {
  const user = localStorage.getItem('user');
  if (user) {
    try {
      return JSON.parse(user).role || 'attendee';
    } catch (e) {
      return 'attendee';
    }
  }
  return null;
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!localStorage.getItem('authToken');
};
