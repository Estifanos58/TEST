import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, UserPlus, Shield, Calendar, Mail, Phone, Trash2, CheckCircle, XCircle, Search, UserCog, X, Lock, Send } from 'lucide-react';
import { eventAPI } from '../../api/client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function StaffManagementPage() {
  const [staff, setStaff] = useState([]);
  const [events, setEvents] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('all');
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    assigned_role: 'security',
    event_id: '',
    staff_badge_id: '',
    password: ''
  });

  useEffect(() => {
    fetchEvents();
    fetchStaff();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await eventAPI.getAll();
      if (response.success) {
        setEvents(response.events || []);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/staff/members`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      });
      const data = await response.json();
      if (data.success) {
        setStaff(data.staff || []);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    
    if (!formData.full_name) {
      alert('Please enter full name');
      return;
    }
    if (!formData.email) {
      alert('Please enter email address');
      return;
    }
    if (!formData.event_id) {
      alert('Please select an event');
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/staff/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          full_name: formData.full_name,
          email: formData.email,
          phone_number: formData.phone_number,
          assigned_role: formData.assigned_role,
          event_id: formData.event_id,
          staff_badge_id: formData.staff_badge_id,
          password: formData.password
        })
      });
      const data = await response.json();
      if (data.success) {
        alert(`✓ Staff member added successfully!\n\nAn email has been sent to ${formData.email} with login credentials.\n\nThey can login with:\nEmail: ${formData.email}\nPassword: [the password you set]`);
        setShowAddModal(false);
        setFormData({
          full_name: '',
          email: '',
          phone_number: '',
          assigned_role: 'security',
          event_id: '',
          staff_badge_id: '',
          password: ''
        });
        fetchStaff();
      } else {
        alert(data.message || 'Failed to add staff');
      }
    } catch (error) {
      alert('Error adding staff member');
    }
  };

  const handleDeleteStaff = async (id) => {
    if (confirm('Are you sure you want to remove this staff member?')) {
      setStaff(staff.filter(member => member.id !== id));
    }
  };

  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEvent = selectedEvent === 'all' || member.event_id === selectedEvent;
    return matchesSearch && matchesEvent;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
<div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 via-yellow-500 to-red-600 rounded-2xl flex items-center justify-center shadow-md">
                <UserCog className="size-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
            </div>
            <p className="text-gray-600 ml-16">Add staff members. They will receive an email with login credentials.</p>
          </div>
          <button onClick={() => setShowAddModal(true)} className="mt-4 md:mt-0 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition shadow-md flex items-center gap-2">
            <UserPlus className="size-5" /> Add Staff Member
          </button>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" /><input type="text" placeholder="Search by name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-xl" /></div>
            <select value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)} className="px-4 py-2 border rounded-xl"><option value="all">All Events</option>{events.map(event => <option key={event.id} value={event.id}>{event.title}</option>)}</select>
            <div className="text-right text-sm text-gray-500 pt-2">Total: {filteredStaff.length} staff members</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b"><tr><th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">Staff Member</th><th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">Role</th><th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">Event</th><th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">Status</th><th className="px-6 py-4 text-right text-xs font-semibold text-gray-700">Actions</th></tr></thead>
              <tbody className="divide-y">
                {filteredStaff.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4"><div className="font-semibold text-gray-900">{member.full_name}</div><div className="text-sm text-gray-500">{member.email}</div></td>
                    <td className="px-6 py-4"><span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${member.assigned_role === 'security' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{member.assigned_role}</span></td>
                    <td className="px-6 py-4"><div className="flex items-center gap-2"><Calendar className="size-4 text-gray-400" /><span className="text-sm">{member.event_name}</span></div></td>
                    <td className="px-6 py-4"><span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"><CheckCircle className="size-3" />Active</span></td>
                    <td className="px-6 py-4 text-right"><button onClick={() => handleDeleteStaff(member.id)} className="p-2 text-gray-500 hover:text-red-600 rounded-lg"><Trash2 className="size-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><UserPlus className="size-5 text-green-600" />Add Staff Member</h2>
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600"><XCircle className="size-6" /></button>
              </div>
              <form onSubmit={handleAddStaff} className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label><input type="text" name="full_name" value={formData.full_name} onChange={handleChange} required className="w-full px-4 py-2 border rounded-xl" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label><input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-2 border rounded-xl" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label><input type="tel" name="phone_number" value={formData.phone_number} onChange={handleChange} className="w-full px-4 py-2 border rounded-xl" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Assigned Role *</label><select name="assigned_role" value={formData.assigned_role} onChange={handleChange} className="w-full px-4 py-2 border rounded-xl"><option value="security">Security (Can scan tickets)</option><option value="staff">Staff (General event staff)</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Assign to Event *</label><select name="event_id" value={formData.event_id} onChange={handleChange} required className="w-full px-4 py-2 border rounded-xl"><option value="">Select an event</option>{events.map(event => <option key={event.id} value={event.id}>{event.title}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Staff Badge ID</label><input type="text" name="staff_badge_id" value={formData.staff_badge_id} onChange={handleChange} className="w-full px-4 py-2 border rounded-xl" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Set Password *</label><input type="password" name="password" value={formData.password} onChange={handleChange} required className="w-full px-4 py-2 border rounded-xl" placeholder="Min 6 characters" /><p className="text-xs text-green-600 mt-1">This password will be sent to the staff member via email</p></div>
                <div className="bg-blue-50 p-3 rounded-xl text-sm text-blue-800 flex items-start gap-2"><Send className="size-4 mt-0.5" />The staff member will receive an email with their login credentials and event details.</div>
                <div className="flex gap-3 pt-4"><button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 border rounded-xl">Cancel</button><button type="submit" className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl">Send Invitation</button></div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Update for: feat(controlroom): build dashboard UI with KPI widgets and summaries
// Update for: feat(controlroom): add dashboard navigation and layout coherence