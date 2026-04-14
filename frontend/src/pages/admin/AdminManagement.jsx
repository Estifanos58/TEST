import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, UserPlus, Shield, Mail, Phone, Trash2, 
  CheckCircle, XCircle, Search, RefreshCw, X,
  Eye, Edit, Award, Crown
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL;

export function AdminManagement() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: ''
  });

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/admin/admins`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      });
      const data = await response.json();
      if (data.success) {
        setAdmins(data.admins || []);
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    
    if (!formData.full_name || !formData.email || !formData.password) {
      alert('Please fill all required fields');
      return;
    }
    
    if (formData.password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/admin/admins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.success) {
        alert(`Admin created successfully!`);
        setShowAddModal(false);
        setFormData({ full_name: '', email: '', password: '', phone: '' });
        fetchAdmins();
      } else {
        alert(data.message || 'Failed to add admin');
      }
    } catch (error) {
      alert('Error adding admin');
    }
  };

  const handleDeleteAdmin = async (adminId, adminEmail) => {
    if (adminEmail === 'nexussphere0974@gmail.com') {
      alert('Cannot delete the super admin account');
      return;
    }
    
    if (confirm('Are you sure you want to remove this admin?')) {
      try {
        const response = await fetch(`${API_URL}/admin/admins/${adminId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        });
        const data = await response.json();
        if (data.success) {
          alert('Admin removed successfully');
          fetchAdmins();
        }
      } catch (error) {
        alert('Error deleting admin');
      }
    }
  };

  const filteredAdmins = admins.filter(admin =>
    admin.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isSuperAdmin = user?.email === 'nexussphere0974@gmail.com';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin size-12 border-4 border-green-200 border-t-green-600 rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
<div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 via-yellow-500 to-red-600 rounded-2xl flex items-center justify-center shadow-md">
                <Shield className="size-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Management</h1>
            </div>
            <p className="text-gray-600 ml-16">Manage system administrators</p>
          </div>
          {isSuperAdmin && (
            <button onClick={() => setShowAddModal(true)} className="mt-4 md:mt-0 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition shadow-md flex items-center gap-2">
              <UserPlus className="size-5" /> Add New Admin
            </button>
          )}
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <input type="text" placeholder="Search admins by name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-xl" />
            </div>
            <button onClick={fetchAdmins} className="px-4 py-2 border rounded-xl flex items-center gap-2"><RefreshCw className="size-4" /> Refresh</button>
          </div>
        </div>

        {/* Admins List */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">Admin</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">Role</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredAdmins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Users className="size-4 text-green-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{admin.full_name}</div>
                          <div className="text-xs text-gray-500">ID: {admin.id?.slice(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">{admin.email}</div>
                      <div className="text-xs text-gray-400">Joined: {new Date(admin.created_at).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${admin.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        <CheckCircle className="size-3" /> {admin.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {admin.email === 'nexussphere0974@gmail.com' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                          <Crown className="size-3" /> Super Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          <Shield className="size-3" /> Admin
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isSuperAdmin && admin.email !== 'nexussphere0974@gmail.com' && (
                        <button onClick={() => handleDeleteAdmin(admin.id, admin.email)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Admin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <UserPlus className="size-5 text-green-600" /> Add New Admin
                </h2>
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                  <XCircle className="size-6" />
                </button>
              </div>
              <form onSubmit={handleAddAdmin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} required className="w-full px-4 py-2 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-2 border rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <input type="password" name="password" value={formData.password} onChange={handleChange} required className="w-full px-4 py-2 border rounded-xl" placeholder="Min 6 characters" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-2 border rounded-xl" />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 border rounded-xl">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl">Create Admin</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Update for: feat(engine): add rating and comment UI with star selector
// Update for: feat(engine): lead engine group architecture and code quality
// Update for: feat(engine): add admin moderation decision endpoints for bans and revocations