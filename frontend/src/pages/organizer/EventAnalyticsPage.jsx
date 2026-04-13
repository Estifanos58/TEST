import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  BarChart3, TrendingUp, Users, DollarSign, Ticket, 
  Calendar, MapPin, Clock, Star, Eye,
  ChevronLeft, AlertCircle, Activity
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell,
  AreaChart, Area
} from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function EventAnalyticsPage() {
  const { eventId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    total_views: 0,
    total_tickets_sold: 0,
    total_revenue: 0,
    check_in_rate: 0,
    average_rating: 0,
    ticket_distribution: [],
    daily_sales: [],
    hourly_checkins: [],
    recent_reviews: []
  });

  useEffect(() => {
    if (eventId) {
      fetchEventAndAnalytics();
    }
  }, [eventId]);

  const fetchEventAndAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      
      // Fetch event details
      const eventResponse = await fetch(`${API_URL}/events/${eventId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const eventData = await eventResponse.json();
      if (eventData.success) {
        setEvent(eventData.event);
      }
      
      // Fetch analytics from backend (REAL DATA)
      const analyticsResponse = await fetch(`${API_URL}/analytics/event/${eventId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const analyticsData = await analyticsResponse.json();
      
      if (analyticsData.success) {
        setAnalytics(analyticsData.analytics);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec489a'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin size-12 border-4 border-green-200 border-t-green-600 rounded-full mb-4" />
          <p className="text-gray-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="size-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Event not found</p>
          <Link to="/organizer/dashboard" className="text-green-600 hover:text-green-700 underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
<div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/organizer/dashboard')} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ChevronLeft className="size-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{event.title}</h1>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1"><Calendar className="size-4" />{new Date(event.start_datetime).toLocaleDateString()}</span>
              <span className="flex items-center gap-1"><MapPin className="size-4" />{event.city}</span>
              <span className="flex items-center gap-1"><Ticket className="size-4" />{analytics.total_tickets_sold} tickets sold</span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Views</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.total_views.toLocaleString()}</p>
              </div>
              <Eye className="size-10 text-green-400" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Tickets Sold</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.total_tickets_sold.toLocaleString()}</p>
              </div>
              <Ticket className="size-10 text-blue-400" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">ETB {analytics.total_revenue.toLocaleString()}</p>
              </div>
              <DollarSign className="size-10 text-yellow-400" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Check-in Rate</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.check_in_rate}%</p>
              </div>
              <Users className="size-10 text-purple-400" />
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${analytics.check_in_rate}%` }} />
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Daily Sales Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="size-5 text-green-600" />
              Daily Ticket Sales
            </h2>
            {analytics.daily_sales.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.daily_sales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="sales" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-gray-500">No sales data yet</div>
            )}
          </div>

          {/* Ticket Distribution Pie Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <PieChart className="size-5 text-green-600" />
              Ticket Distribution by Type
            </h2>
            {analytics.ticket_distribution.length > 0 && analytics.ticket_distribution.some(t => t.value > 0) ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.ticket_distribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                    >
                      {analytics.ticket_distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-4">
                  {analytics.ticket_distribution.map((type, idx) => (
                    <div key={type.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                      <span className="text-sm text-gray-600">{type.name}</span>
                      <span className="text-sm font-semibold">{type.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-300 flex items-center justify-center text-gray-500">No ticket sales yet</div>
            )}
          </div>
        </div>

        {/* Revenue Trend */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="size-5 text-green-600" />
            Revenue Trend
          </h2>
          {analytics.daily_sales.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics.daily_sales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-300 flex items-center justify-center text-gray-500">No revenue data yet</div>
          )}
        </div>

        {/* Hourly Check-ins */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="size-5 text-green-600" />
            Hourly Check-in Pattern
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={analytics.hourly_checkins}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#f59e0b" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Ticket Type Breakdown Table */}
        <div className="bg-white rounded-2xl shadow-sm mb-8 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Ticket Type Breakdown</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Ticket Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Sold</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Available</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {analytics.ticket_distribution.map((type) => (
                  <tr key={type.name} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{type.name}</td>
                    <td className="px-6 py-4 text-gray-600">ETB {type.price}</td>
                    <td className="px-6 py-4 text-gray-900">{type.value.toLocaleString()}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">ETB {type.revenue.toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-600">{type.capacity - type.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Reviews */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Star className="size-5 text-yellow-400 fill-yellow-400" />
              Recent Attendee Reviews
              {analytics.average_rating > 0 && (
                <span className="ml-2 text-sm text-gray-500">({analytics.average_rating} avg rating)</span>
              )}
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {analytics.recent_reviews.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">No reviews yet</div>
            ) : (
              analytics.recent_reviews.map((review) => (
                <div key={review.id} className="px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">{review.user}</span>
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`size-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-700">{review.comment}</p>
                      <p className="text-xs text-gray-400 mt-2">{new Date(review.date).toLocaleDateString()}</p>
                    </div>
                    <button className="text-sm text-green-600 hover:text-green-700">Reply</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// Update for: feat(controlroom): build dashboard UI with KPI widgets and summaries
// Update for: feat(controlroom): oversee control room integration and code reviews