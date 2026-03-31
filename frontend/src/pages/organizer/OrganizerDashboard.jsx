import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  PlusCircle,
  Ticket,
  Star,
  Eye,
  RefreshCw,
  UserCog,
  Wallet,
  BarChart3,
  Settings,
  LogOut,
  Clock,
  MapPin,
  Award,
  Activity,
  FileWarning,
  Scale,
} from "lucide-react";
import { moderationAPI } from "../../api/client";
import { useAuth } from "../../contexts/AuthContext";
import { DashboardCsvDownloadButton } from "../../components/common/DashboardCsvDownloadButton";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export function OrganizerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total_events: 0,
    total_tickets_sold: 0,
    total_revenue: 0,
    pending_approvals: 0,
    completed_events: 0,
    average_tickets_per_event: 0,
  });
  const [reports, setReports] = useState([]);
  const [appeals, setAppeals] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [moderationNote, setModerationNote] = useState("");
  const [moderationActionLoading, setModerationActionLoading] = useState(false);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        console.log("No auth token found");
        return [];
      }

      const response = await fetch(`${API_URL}/events/organizer/my-events`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        const myEvents = data.events || [];
        const completedEvents = myEvents.filter(
          (e) => new Date(e.end_datetime) < new Date(),
        );

        setEvents(myEvents);
        setStats((prev) => ({
          ...prev,
          total_events: myEvents.length,
          completed_events: completedEvents.length,
        }));
        return myEvents;
      }
      return [];
    } catch (error) {
      console.error("Error fetching events:", error);
      return [];
    }
  };

  const fetchStats = async (myEvents = []) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      // Calculate stats from events if we have them
      if (myEvents.length > 0) {
        let totalTickets = 0;
        let totalRev = 0;

        for (const event of myEvents) {
          if (event.ticket_types && event.ticket_types.length > 0) {
            for (const ticket of event.ticket_types) {
              const sold = ticket.capacity - ticket.remaining_quantity;
              totalTickets += sold;
              totalRev += sold * ticket.price;
            }
          }
        }

        setStats((prev) => ({
          ...prev,
          total_tickets_sold: totalTickets,
          total_revenue: totalRev,
          average_tickets_per_event:
            myEvents.length > 0
              ? Math.round(totalTickets / myEvents.length)
              : 0,
        }));
      } else {
        // Try to fetch from API as fallback
        const response = await fetch(`${API_URL}/analytics/organizer/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (data.success) {
          setStats((prev) => ({
            ...prev,
            total_tickets_sold: data.stats.total_tickets_sold,
            total_revenue: data.stats.total_revenue,
            average_tickets_per_event: data.stats.average_tickets_per_event,
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchModerationData = async () => {
    try {
      const [reportsResponse, appealsResponse] = await Promise.all([
        moderationAPI.getOrganizerReports("pending"),
        moderationAPI.getOrganizerAppeals("pending"),
      ]);

      const pendingReports = reportsResponse.reports || [];
      const pendingAppeals = appealsResponse.appeals || [];

      setReports(pendingReports);
      setAppeals(pendingAppeals);
      setStats((prev) => ({
        ...prev,
        pending_approvals: pendingReports.length + pendingAppeals.length,
      }));
    } catch (moderationError) {
      console.error("Error fetching moderation data:", moderationError);
    }
  };

  const fetchAllData = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const myEvents = await fetchEvents();
      await fetchStats(myEvents);
      await fetchModerationData();
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Set a timeout to prevent infinite loading only if loading is still active.
    const timeoutId = setTimeout(() => {
      setLoading((isStillLoading) => {
        if (isStillLoading) {
          console.log("Loading timeout - forcing completion");
          setError("Loading took too long. Please refresh the page.");
          return false;
        }

        return isStillLoading;
      });
    }, 10000); // 10 second timeout

    fetchAllData();

    return () => clearTimeout(timeoutId);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const openReportModal = (report) => {
    setSelectedReport(report);
    setModerationNote("");
    setShowReportModal(true);
  };

  const openAppealModal = (appeal) => {
    setSelectedAppeal(appeal);
    setModerationNote("");
    setShowAppealModal(true);
  };

  const handleReportDecision = async (action) => {
    if (!selectedReport?.id) {
      return;
    }

    if (!confirm(`Are you sure you want to ${action} this report?`)) {
      return;
    }

    setModerationActionLoading(true);
    try {
      await moderationAPI.decideOrganizerReport(selectedReport.id, {
        action,
        note: moderationNote.trim() || undefined,
      });

      alert(`Report ${action}ed successfully.`);
      setShowReportModal(false);
      setSelectedReport(null);
      setModerationNote("");
      fetchAllData();
    } catch (decisionError) {
      alert(decisionError.message || `Failed to ${action} report`);
    } finally {
      setModerationActionLoading(false);
    }
  };

  const handleAppealDecision = async (action) => {
    if (!selectedAppeal?.id) {
      return;
    }

    if (!confirm(`Are you sure you want to ${action} this appeal?`)) {
      return;
    }

    setModerationActionLoading(true);
    try {
      await moderationAPI.decideOrganizerAppeal(selectedAppeal.id, {
        action,
        note: moderationNote.trim() || undefined,
      });

      alert(`Appeal ${action}d successfully.`);
      setShowAppealModal(false);
      setSelectedAppeal(null);
      setModerationNote("");
      fetchAllData();
    } catch (decisionError) {
      alert(decisionError.message || `Failed to ${action} appeal`);
    } finally {
      setModerationActionLoading(false);
    }
  };

  // Calculate event stats for display
  const getEventStats = (event) => {
    let ticketsSold = 0;
    let revenue = 0;

    if (event.ticket_types && event.ticket_types.length > 0) {
      for (const ticket of event.ticket_types) {
        const sold = ticket.capacity - ticket.remaining_quantity;
        ticketsSold += sold;
        revenue += sold * ticket.price;
      }
    }

    return { ticketsSold, revenue };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin size-12 border-4 border-green-200 border-t-green-600 rounded-full mb-4" />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Ethiopian Tricolor Accent */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Organizer Dashboard
            </h1>
            <p className="text-gray-600">
              Welcome back, {user?.full_name?.split(" ")[0] || "Organizer"}!
            </p>
          </div>
          <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
            <button
              onClick={fetchAllData}
              disabled={refreshing}
              className="px-4 py-2 bg-white border rounded-xl flex items-center gap-2 hover:bg-gray-50 transition disabled:opacity-50"
            >
              <RefreshCw
                className={`size-4 ${refreshing ? "animate-spin" : ""}`}
              />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
            <DashboardCsvDownloadButton
              endpoint="/analytics/organizer/stats/csv"
              label="Download CSV"
              loadingLabel="Preparing CSV..."
              filenamePrefix="organizer-dashboard"
            />
            <Link
              to="/organizer/create-event"
              className="px-5 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold flex items-center gap-2 shadow-md hover:from-green-700 hover:to-green-800 transition"
            >
              <PlusCircle className="size-5" /> Create Event
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-center">
            {error}
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Events</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.total_events}
                </p>
              </div>
              <Calendar className="size-10 text-green-400" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tickets Sold</p>
                <p className="text-3xl font-bold text-blue-600">
                  {stats.total_tickets_sold.toLocaleString()}
                </p>
              </div>
              <Ticket className="size-10 text-blue-400" />
            </div>
            {stats.average_tickets_per_event > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                Avg {stats.average_tickets_per_event} per event
              </p>
            )}
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-yellow-600">
                  ETB {stats.total_revenue.toLocaleString()}
                </p>
              </div>
              <DollarSign className="size-10 text-yellow-400" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.pending_approvals}
                </p>
              </div>
              <Clock className="size-10 text-orange-400" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.completed_events}
                </p>
              </div>
              <Award className="size-10 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Quick Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Link
            to="/staff/management"
            className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition border-l-4 border-blue-500"
          >
            <UserCog className="size-8 text-blue-500 mb-2" />
            <h3 className="font-semibold text-gray-900">Staff Management</h3>
            <p className="text-xs text-gray-500">Manage your team</p>
          </Link>
          <Link
            to="/organizer/payouts"
            className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition border-l-4 border-yellow-500"
          >
            <Wallet className="size-8 text-yellow-500 mb-2" />
            <h3 className="font-semibold text-gray-900">Payout Settings</h3>
            <p className="text-xs text-gray-500">Bank & withdrawals</p>
          </Link>
          <Link
            to="/organizer/events-analytics"
            className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition border-l-4 border-purple-500"
          >
            <BarChart3 className="size-8 text-purple-500 mb-2" />
            <h3 className="font-semibold text-gray-900">Analytics</h3>
            <p className="text-xs text-gray-500">Event performance</p>
          </Link>
          <Link
            to="/profile"
            className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition border-l-4 border-gray-500"
          >
            <Settings className="size-8 text-gray-500 mb-2" />
            <h3 className="font-semibold text-gray-900">Settings</h3>
            <p className="text-xs text-gray-500">Account preferences</p>
          </Link>
        </div>

        {/* My Events Section */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">My Events</h2>
          </div>
          {events.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="size-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No events created yet</p>
              <Link
                to="/organizer/create-event"
                className="mt-4 inline-block text-green-600 hover:underline"
              >
                Create your first event
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {events.map((event) => {
                const { ticketsSold, revenue } = getEventStats(event);

                return (
                  <div
                    key={event.id}
                    className="px-6 py-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {event.title}
                        </h3>
                        <div className="flex flex-wrap gap-4 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="size-3" />
                            {new Date(
                              event.start_datetime,
                            ).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3" />
                            {event.city}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs ${
                              event.status === "published"
                                ? "bg-green-100 text-green-700"
                                : event.status === "draft"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {event.status === "draft"
                              ? "pending fee"
                              : event.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 mt-2 text-xs">
                          <span className="text-blue-600">
                            Sold: {ticketsSold} tickets
                          </span>
                          <span className="text-green-600">
                            Revenue: ETB {revenue.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          to={`/event/${event.id}`}
                          className="px-3 py-1.5 text-green-600 hover:bg-green-50 rounded-lg text-sm flex items-center gap-1"
                        >
                          <Eye className="size-4" /> View
                        </Link>
                        <Link
                          to={`/organizer/analytics/${event.id}`}
                          className="px-3 py-1.5 text-purple-600 hover:bg-purple-50 rounded-lg text-sm flex items-center gap-1"
                        >
                          <BarChart3 className="size-4" /> Stats
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FileWarning className="size-5 text-orange-500" /> Pending User
                Reports
              </h2>
              <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700">
                {reports.length}
              </span>
            </div>
            <div className="divide-y divide-gray-200">
              {reports.length === 0 ? (
                <p className="px-6 py-8 text-sm text-gray-500">
                  No pending reports.
                </p>
              ) : (
                reports.slice(0, 5).map((report) => (
                  <div key={report.id} className="px-6 py-4">
                    <p className="text-sm font-semibold text-gray-900">
                      {report.subject_user?.full_name || "Reported user"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Reason: {report.reason}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Event: {report.event?.title || "N/A"}
                    </p>
                    <button
                      type="button"
                      onClick={() => openReportModal(report)}
                      className="mt-2 text-xs text-green-700 hover:text-green-800"
                    >
                      View Details
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Scale className="size-5 text-amber-600" /> Pending Appeals
              </h2>
              <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                {appeals.length}
              </span>
            </div>
            <div className="divide-y divide-gray-200">
              {appeals.length === 0 ? (
                <p className="px-6 py-8 text-sm text-gray-500">
                  No pending appeals.
                </p>
              ) : (
                appeals.slice(0, 5).map((appeal) => (
                  <div key={appeal.id} className="px-6 py-4">
                    <p className="text-sm font-semibold text-gray-900">
                      {appeal.appellant?.full_name || "User"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {appeal.message}
                    </p>
                    <button
                      type="button"
                      onClick={() => openAppealModal(appeal)}
                      className="mt-2 text-xs text-green-700 hover:text-green-800"
                    >
                      View Appeal
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleLogout}
            className="px-6 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition flex items-center gap-2"
          >
            <LogOut className="size-4" /> Logout
          </button>
        </div>
      </div>

      {showReportModal && selectedReport && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Report Details
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Review the report and choose an action.
            </p>

            <div className="space-y-2 text-sm mb-4">
              <p>
                <span className="font-semibold">Reported user:</span>{" "}
                {selectedReport.subject_user?.full_name || "N/A"}
              </p>
              <p>
                <span className="font-semibold">Reported by:</span>{" "}
                {selectedReport.reporter?.full_name || "N/A"}
              </p>
              <p>
                <span className="font-semibold">Event:</span>{" "}
                {selectedReport.event?.title || "N/A"}
              </p>
              <p>
                <span className="font-semibold">Reason:</span>{" "}
                {selectedReport.reason}
              </p>
              <p>
                <span className="font-semibold">Comment:</span>{" "}
                {selectedReport.review?.review_text || "N/A"}
              </p>
              {selectedReport.details && (
                <p>
                  <span className="font-semibold">Details:</span>{" "}
                  {selectedReport.details}
                </p>
              )}
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Decision Note (optional)
            </label>
            <textarea
              rows={3}
              value={moderationNote}
              onChange={(e) => setModerationNote(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl"
              placeholder="Explain your decision..."
            />

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="flex-1 px-4 py-2 border rounded-xl"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleReportDecision("reject")}
                disabled={moderationActionLoading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-gray-700 disabled:opacity-50"
              >
                Reject Report
              </button>
              <button
                type="button"
                onClick={() => handleReportDecision("ban")}
                disabled={moderationActionLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl disabled:opacity-50"
              >
                Ban User
              </button>
            </div>
          </div>
        </div>
      )}

      {showAppealModal && selectedAppeal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Appeal Details
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Approve to lift the ban, or reject to keep it active.
            </p>

            <div className="space-y-2 text-sm mb-4">
              <p>
                <span className="font-semibold">Appellant:</span>{" "}
                {selectedAppeal.appellant?.full_name || "N/A"}
              </p>
              <p>
                <span className="font-semibold">Current ban status:</span>{" "}
                {selectedAppeal.ban?.status || "N/A"}
              </p>
              <p>
                <span className="font-semibold">Ban reason:</span>{" "}
                {selectedAppeal.ban?.reason || "N/A"}
              </p>
              <p>
                <span className="font-semibold">Appeal:</span>{" "}
                {selectedAppeal.message}
              </p>
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Decision Note (optional)
            </label>
            <textarea
              rows={3}
              value={moderationNote}
              onChange={(e) => setModerationNote(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl"
              placeholder="Explain your decision..."
            />

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setShowAppealModal(false)}
                className="flex-1 px-4 py-2 border rounded-xl"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleAppealDecision("reject")}
                disabled={moderationActionLoading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-gray-700 disabled:opacity-50"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => handleAppealDecision("approve")}
                disabled={moderationActionLoading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl disabled:opacity-50"
              >
                Approve & Unban
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Update for: feat(controlroom): implement multi-step event wizard UI flow