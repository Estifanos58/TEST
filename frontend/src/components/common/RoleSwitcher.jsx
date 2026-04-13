// This helps test different user roles without backend
import { useState } from 'react';

export function RoleSwitcher() {
  const [currentRole, setCurrentRole] = useState(() => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user).role : 'guest';
  });

  const switchRole = (role) => {
    const mockUsers = {
      attendee: { id: '1', first_name: 'John', last_name: 'Doe', email: 'user@example.com', role: 'attendee' },
      organizer: { id: '2', first_name: 'Abebe', last_name: 'Kebede', email: 'organizer@dems.com', role: 'organizer' },
      admin: { id: '3', first_name: 'Admin', last_name: 'User', email: 'admin@dems.com', role: 'admin' },
      security: { id: '4', first_name: 'Security', last_name: 'Staff', email: 'security@dems.com', role: 'security' }
    };
    
    localStorage.setItem('authToken', 'mock-token-' + role);
    localStorage.setItem('user', JSON.stringify(mockUsers[role]));
    setCurrentRole(role);
    window.location.reload();
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setCurrentRole('guest');
    window.location.reload();
  };

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed top-20 right-4 z-50 bg-gray-900 text-white p-3 rounded-xl shadow-xl text-xs">
      <div className="font-bold mb-2">Test Role: {currentRole}</div>
      <div className="flex flex-wrap gap-1">
        <button onClick={() => switchRole('attendee')} className="px-2 py-1 bg-blue-600 rounded hover:bg-blue-700">Attendee</button>
        <button onClick={() => switchRole('organizer')} className="px-2 py-1 bg-green-600 rounded hover:bg-green-700">Organizer</button>
        <button onClick={() => switchRole('admin')} className="px-2 py-1 bg-red-600 rounded hover:bg-red-700">Admin</button>
        <button onClick={() => switchRole('security')} className="px-2 py-1 bg-yellow-600 rounded hover:bg-yellow-700">Security</button>
        <button onClick={logout} className="px-2 py-1 bg-gray-600 rounded hover:bg-gray-700">Logout</button>
      </div>
    </div>
  );
}
