import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, CheckCircle, XCircle, Clock, Eye, 
  Building, Mail, Phone, Globe, AlertCircle,
  Search, RefreshCw, UserCheck, UserX
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function OrganizerApprovals() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/admin/pending-organizers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setApplications(data.pending || []);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    if (confirm('Approve this organizer?')) {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_URL}/admin/approve/${userId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (data.success) {
          alert(`Organizer approved! Email sent to ${data.email}`);
          fetchApplications();
        }
      } catch (error) {
        alert('Error approving organizer');
      }
    }
  };

  const handleReject = async (userId) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason) {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_URL}/admin/reject/${userId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ reason })
        });
        const data = await response.json();
        if (data.success) {
          alert(`Organizer rejected. Reason: ${reason}`);
          fetchApplications();
        }
      } catch (error) {
        alert('Error rejecting organizer');
      }
    }
  };

  const getDaysAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  };

  const filteredApplications = applications.filter(app =>
    app.organization_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                <UserCheck className="size-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Organizer Approvals</h1>
            </div>
            <p className="text-gray-600 ml-16">Review and approve organizer applications</p>
          </div>
          <button onClick={fetchApplications} className="mt-4 md:mt-0 px-4 py-2 bg-white border rounded-xl flex items-center gap-2">
            <RefreshCw className="size-4" /> Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-yellow-500">
            <p className="text-sm text-gray-600 mb-1">Pending Approvals</p>
            <p className="text-3xl font-bold text-gray-900">{applications.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-green-500">
            <p className="text-sm text-gray-600 mb-1">Approved This Month</p>
            <p className="text-3xl font-bold text-gray-900">12</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-blue-500">
            <p className="text-sm text-gray-600 mb-1">Total Organizers</p>
            <p className="text-3xl font-bold text-gray-900">234</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by organization, name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div className="space-y-4">
          {filteredApplications.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center">
              <CheckCircle className="size-16 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Pending Applications</h3>
              <p className="text-gray-500">All organizer applications have been reviewed.</p>
            </div>
          ) : (
            filteredApplications.map((app) => (
              <div key={app.id} className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{app.organization_name}</h3>
                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                          <Building className="size-4" />
                          {app.organization_type?.replace('_', ' ').toUpperCase() || 'N/A'}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium flex items-center gap-1">
                        <Clock className="size-3" /> Pending
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users className="size-4" /> {app.full_name}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="size-4" /> {app.email}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="size-4" /> {app.phone_number}
                      </div>
                      {app.website_url && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Globe className="size-4" />
                          <a href={`https://${app.website_url}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
                            {app.website_url}
                          </a>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-gray-600 text-sm mt-3 line-clamp-2">{app.bio}</p>
                    <p className="text-xs text-gray-400 mt-2">Submitted {getDaysAgo(app.submitted_at)}</p>
                  </div>
                  
                  <div className="flex flex-row md:flex-col gap-2">
                    <button
                      onClick={() => { setSelectedApp(app); setShowModal(true); }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition flex items-center justify-center gap-2"
                    >
                      <Eye className="size-4" /> View Details
                    </button>
                    <button
                      onClick={() => handleApprove(app.id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="size-4" /> Approve
                    </button>
                    <button
                      onClick={() => handleReject(app.id)}
                      className="px-4 py-2 border border-red-500 text-red-600 rounded-xl hover:bg-red-50 transition flex items-center justify-center gap-2"
                    >
                      <XCircle className="size-4" /> Reject
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showModal && selectedApp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Application Details</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="size-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Building className="size-5 text-green-600" /> Organization Information
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <p><span className="font-medium">Name:</span> {selectedApp.organization_name}</p>
                  <p><span className="font-medium">Type:</span> {selectedApp.organization_type}</p>
                  <p><span className="font-medium">Bio:</span> {selectedApp.bio}</p>
                  {selectedApp.website_url && <p><span className="font-medium">Website:</span> {selectedApp.website_url}</p>}
                  {selectedApp.tax_id_number && <p><span className="font-medium">Tax ID:</span> {selectedApp.tax_id_number}</p>}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Mail className="size-5 text-green-600" /> Contact Information
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <p><span className="font-medium">Contact Person:</span> {selectedApp.full_name}</p>
                  <p><span className="font-medium">Email:</span> {selectedApp.email}</p>
                  <p><span className="font-medium">Phone:</span> {selectedApp.phone_number}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    handleApprove(selectedApp.id);
                    setShowModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700"
                >
                  Approve Application
                </button>
                <button
                  onClick={() => {
                    handleReject(selectedApp.id);
                    setShowModal(false);
                  }}
                  className="flex-1 px-4 py-2 border border-red-500 text-red-600 rounded-xl font-medium hover:bg-red-50"
                >
                  Reject Application
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
