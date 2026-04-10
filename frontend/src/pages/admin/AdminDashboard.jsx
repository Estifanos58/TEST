import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  UserCheck,
  Ticket,
  Award,
  Eye,
  RefreshCw,
  ChevronRight,
  Building,
  Mail,
  Phone,
  FileWarning,
  Scale,
  Plus,
  Trash2,
  Send,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { adminCategoryAPI, moderationAPI } from "../../api/client";
import { DashboardCsvDownloadButton } from "../../components/common/DashboardCsvDownloadButton";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export function AdminDashboard() {
  const { user, logout } = useAuth();
  const isSuperAdmin = user?.email === "nexussphere0974@gmail.com";
  const [stats, setStats] = useState({
    total_users: 0,
    total_organizers: 0,
    total_attendees: 0,
    total_events: 0,
    live_events: 0,
    pending_approvals: 0,
    total_revenue: 0,
    total_tickets_sold: 0,
  });
  const [pendingOrganizers, setPendingOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [reports, setReports] = useState([]);
  const [appeals, setAppeals] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [moderationNote, setModerationNote] = useState("");
  const [moderationActionLoading, setModerationActionLoading] = useState(false);
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: "", slug: "" });
  const [categoryCreateLoading, setCategoryCreateLoading] = useState(false);
  const [categoryError, setCategoryError] = useState("");
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoryDeleteLoadingId, setCategoryDeleteLoadingId] = useState(null);
  const [platformFeeDeliveries, setPlatformFeeDeliveries] = useState([]);
  const [platformFeeLoading, setPlatformFeeLoading] = useState(false);
  const [platformFeeActionId, setPlatformFeeActionId] = useState(null);
  const [platformFeeConfig, setPlatformFeeConfig] = useState({
    exact_fee_amount: 500,
  });
  const [platformFeeConfigLoading, setPlatformFeeConfigLoading] =
    useState(false);
  const [platformFeeConfigSaving, setPlatformFeeConfigSaving] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const data = await adminCategoryAPI.getAll();
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const [statsResponse, pendingResponse] = await Promise.all([
        fetch(`${API_URL}/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/admin/pending-organizers`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const statsData = await statsResponse.json();
      const pendingData = await pendingResponse.json();

      if (statsData.success) {
        setStats((prev) => ({
          ...prev,
          total_users: statsData.stats.total_users || 0,
          total_organizers: statsData.stats.total_organizers || 0,
          total_attendees: statsData.stats.total_attendees || 0,
          total_events: statsData.stats.total_events || 0,
          live_events: statsData.stats.live_events || 0,
          total_revenue: statsData.stats.total_revenue || 0,
          total_tickets_sold: statsData.stats.total_tickets_sold || 0,
          pending_approvals: statsData.stats.pending_approvals || 0,
        }));
      }

      if (pendingData.success) {
        const pendingList = pendingData.pending || [];
        setPendingOrganizers(pendingList);
        setStats((prev) => ({
          ...prev,
          pending_approvals: pendingList.length,
        }));
      }

      try {
        const [reportsData, appealsData] = await Promise.all([
          moderationAPI.getAdminReports("pending"),
          moderationAPI.getAdminAppeals("pending"),
        ]);

        setReports(reportsData.reports || []);
        setAppeals(appealsData.appeals || []);
      } catch (moderationError) {
        console.error(
          "Error fetching moderation dashboard data:",
          moderationError,
        );
      }

      await fetchCategories();
      await fetchPlatformFeeDeliveries();
      await fetchPlatformFeeConfig();
    } catch (error) {
      console.error("Error fetching dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlatformFeeConfig = async () => {
    setPlatformFeeConfigLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_URL}/platform-fee/config`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (response.ok && data.success && data.config) {
        setPlatformFeeConfig({
          exact_fee_amount: Number(data.config.exact_fee_amount || 500),
        });
      }
    } catch (error) {
      console.error("Error fetching platform fee config:", error);
    } finally {
      setPlatformFeeConfigLoading(false);
    }
  };

  const handlePlatformFeeConfigSave = async () => {
    if (!isSuperAdmin) {
      alert("Only super admin can update platform fee settings.");
      return;
    }

    const exactFeeAmount = Number(platformFeeConfig.exact_fee_amount);

    if (!Number.isFinite(exactFeeAmount) || exactFeeAmount < 1) {
      alert("Exact platform fee amount must be at least ETB 1.");
      return;
    }

    setPlatformFeeConfigSaving(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_URL}/platform-fee/admin/config`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          exact_fee_amount: exactFeeAmount,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update platform fee");
      }

      if (data.config) {
        setPlatformFeeConfig({
          exact_fee_amount: Number(
            data.config.exact_fee_amount || exactFeeAmount,
          ),
        });
      }

      alert("Platform fee settings updated successfully.");
    } catch (error) {
      alert(error.message || "Failed to update platform fee settings");
    } finally {
      setPlatformFeeConfigSaving(false);
    }
  };

  const fetchPlatformFeeDeliveries = async () => {
    setPlatformFeeLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_URL}/platform-fee/admin/deliveries`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setPlatformFeeDeliveries(data.payments || []);
      }
    } catch (error) {
      console.error("Error fetching platform fee deliveries:", error);
    } finally {
      setPlatformFeeLoading(false);
    }
  };

  const handleConfirmPlatformFeeDelivery = async (paymentId) => {
    if (!paymentId) {
      return;
    }

    if (
      !confirm(
        "Confirm this payment, publish one pending event, and notify the organizer?",
      )
    ) {
      return;
    }

    setPlatformFeeActionId(paymentId);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `${API_URL}/platform-fee/admin/deliveries/${paymentId}/confirm`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to confirm payment delivery");
      }

      setPlatformFeeDeliveries((prev) =>
        prev.filter((payment) => payment.id !== paymentId),
      );
      alert(
        "Payment confirmed, pending event published, and organizer notified.",
      );
    } catch (error) {
      alert(error.message || "Failed to notify organizer");
    } finally {
      setPlatformFeeActionId(null);
    }
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
      await moderationAPI.decideAdminReport(selectedReport.id, {
        action,
        note: moderationNote.trim() || undefined,
      });

      alert(`Report ${action}ed successfully.`);
      setShowReportModal(false);
      setSelectedReport(null);
      setModerationNote("");
      fetchDashboardData();
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
      await moderationAPI.decideAdminAppeal(selectedAppeal.id, {
        action,
        note: moderationNote.trim() || undefined,
      });

      alert(`Appeal ${action}d successfully.`);
      setShowAppealModal(false);
      setSelectedAppeal(null);
      setModerationNote("");
      fetchDashboardData();
    } catch (decisionError) {
      alert(decisionError.message || `Failed to ${action} appeal`);
    } finally {
      setModerationActionLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    if (confirm("Approve this organizer?")) {
      try {
        const token = localStorage.getItem("authToken");
        const response = await fetch(`${API_URL}/admin/approve/${userId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (data.success) {
          setPendingOrganizers((prev) =>
            prev.filter((org) => org.id !== userId),
          );
          setStats((prev) => ({
            ...prev,
            pending_approvals: prev.pending_approvals - 1,
            total_organizers: prev.total_organizers + 1,
          }));
          alert(`Organizer approved! Email sent to ${data.email}`);
          fetchDashboardData();
        }
      } catch {
        alert("Error approving organizer");
      }
    }
  };

  const handleReject = async (userId) => {
    const reason = prompt("Reason for rejection:");
    if (reason) {
      try {
        const token = localStorage.getItem("authToken");
        const response = await fetch(`${API_URL}/admin/reject/${userId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason }),
        });
        const data = await response.json();
        if (data.success) {
          setPendingOrganizers((prev) =>
            prev.filter((org) => org.id !== userId),
          );
          setStats((prev) => ({
            ...prev,
            pending_approvals: prev.pending_approvals - 1,
          }));
          alert(`Organizer rejected. Reason: ${reason}`);
          fetchDashboardData();
        }
      } catch {
        alert("Error rejecting organizer");
      }
    }
  };

  const toSlug = (value) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

  const openCreateCategoryModal = () => {
    setCategoryForm({ name: "", slug: "" });
    setCategoryError("");
    setShowCreateCategoryModal(true);
  };

  const handleCategoryNameChange = (value) => {
    setCategoryForm((prev) => {
      const next = { ...prev, name: value };
      if (!prev.slug || prev.slug === toSlug(prev.name)) {
        next.slug = toSlug(value);
      }
      return next;
    });
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();

    if (!isSuperAdmin) {
      setCategoryError("Only super admin can create categories.");
      return;
    }

    setCategoryError("");

    const name = categoryForm.name.trim();
    const slug = toSlug(categoryForm.slug || categoryForm.name);

    if (!name || !slug) {
      setCategoryError("Name and slug are required.");
      return;
    }

    setCategoryCreateLoading(true);
    try {
      await adminCategoryAPI.create({ name, slug });
      setShowCreateCategoryModal(false);
      alert("Category created successfully.");
      await fetchCategories();
    } catch (error) {
      setCategoryError(error.message || "Failed to create category");
    } finally {
      setCategoryCreateLoading(false);
    }
  };

  const handleDeleteCategory = async (category) => {
    if (!isSuperAdmin) {
      alert("Only super admin can delete categories.");
      return;
    }

    const shouldDelete = confirm(
      `Delete category \"${category.name}\"? This cannot be undone.`,
    );
    if (!shouldDelete) {
      return;
    }

    setCategoryDeleteLoadingId(category.id);
    try {
      await adminCategoryAPI.delete(category.id);
      setCategories((prev) => prev.filter((item) => item.id !== category.id));
      alert("Category deleted successfully.");
    } catch (error) {
      alert(error.message || "Failed to delete category");
    } finally {
      setCategoryDeleteLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin size-12 border-4 border-green-200 border-t-green-600 rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="text-gray-600">
              Welcome back, {user?.full_name?.split(" ")[0] || "Admin"}!
            </p>
          </div>
          <div className="flex flex-wrap w-full sm:w-auto gap-3">
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2 bg-white border rounded-xl flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <RefreshCw className="size-4" /> Refresh
            </button>
            <div className="w-full sm:w-auto">
              <DashboardCsvDownloadButton
                endpoint="/admin/dashboard/csv"
                label="Download CSV"
                loadingLabel="Preparing CSV..."
                filenamePrefix="admin-dashboard"
              />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-green-500">
            <Users className="size-8 text-green-500 mb-2" />
            <p className="text-sm text-gray-600">Total Users</p>
            <p className="text-2xl font-bold">{stats.total_users}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-blue-500">
            <Calendar className="size-8 text-blue-500 mb-2" />
            <p className="text-sm text-gray-600">Events</p>
            <p className="text-2xl font-bold">{stats.total_events}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-yellow-500">
            <Ticket className="size-8 text-yellow-500 mb-2" />
            <p className="text-sm text-gray-600">Tickets Sold</p>
            <p className="text-2xl font-bold">{stats.total_tickets_sold}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-purple-500">
            <DollarSign className="size-8 text-purple-500 mb-2" />
            <p className="text-sm text-gray-600">Revenue</p>
            <p className="text-2xl font-bold">
              ETB {stats.total_revenue.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Pending Approvals Section */}
        <div className="bg-white rounded-2xl shadow-sm mb-8">
          <div className="px-4 sm:px-6 py-4 border-b flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex flex-wrap items-center gap-2">
              <Clock className="size-5 text-orange-500" /> Pending Organizer
              Approvals
              {stats.pending_approvals > 0 && (
                <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs">
                  {stats.pending_approvals}
                </span>
              )}
            </h2>
            <Link
              to="/admin/approvals"
              className="text-sm text-green-600 hover:text-green-700"
            >
              View All
            </Link>
          </div>
          <div className="p-4 sm:p-6">
            {pendingOrganizers.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="size-12 text-green-400 mx-auto mb-3" />
                <p className="text-gray-500">No pending approvals</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingOrganizers.slice(0, 3).map((org) => (
                  <div
                    key={org.id}
                    className="border rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                  >
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {org.organization_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {org.full_name} - {org.email}
                      </p>
                      <p className="text-xs text-gray-400">
                        Submitted:{" "}
                        {new Date(org.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 w-full md:w-auto">
                      <button
                        onClick={() => {
                          setSelectedApp(org);
                          setShowModal(true);
                        }}
                        className="px-3 py-1.5 border rounded-lg text-sm"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleApprove(org.id)}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm flex items-center gap-1"
                      >
                        <CheckCircle className="size-4" /> Approve
                      </button>
                      <button
                        onClick={() => handleReject(org.id)}
                        className="px-3 py-1.5 border border-red-500 text-red-600 rounded-lg text-sm flex items-center gap-1"
                      >
                        <XCircle className="size-4" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm mb-8 overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-bold text-gray-900">
              Platform Fee Settings
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Set the exact organizer system fee amount to be paid.
            </p>
          </div>
          <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Exact Platform Fee (ETB)
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                value={platformFeeConfig.exact_fee_amount}
                onChange={(e) =>
                  setPlatformFeeConfig((prev) => ({
                    ...prev,
                    exact_fee_amount: e.target.value,
                  }))
                }
                disabled={!isSuperAdmin || platformFeeConfigLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <button
              type="button"
              onClick={handlePlatformFeeConfigSave}
              disabled={
                !isSuperAdmin ||
                platformFeeConfigSaving ||
                platformFeeConfigLoading
              }
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 w-full md:w-auto"
            >
              {platformFeeConfigSaving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm mb-8 overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <DollarSign className="size-5 text-emerald-600" /> Platform Fee
              Delivery Confirmations
            </h2>
            <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
              {platformFeeDeliveries.length}
            </span>
          </div>

          {platformFeeLoading ? (
            <div className="px-6 py-8 text-sm text-gray-500">
              Loading platform fee payments...
            </div>
          ) : platformFeeDeliveries.length === 0 ? (
            <div className="px-6 py-8 text-sm text-gray-500">
              No completed platform fee payments waiting for admin confirmation.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {platformFeeDeliveries.slice(0, 8).map((payment) => (
                <div
                  key={payment.id}
                  className="px-4 sm:px-6 py-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      {payment.user?.organizer_profile?.organization_name ||
                        payment.user?.full_name ||
                        "Organizer"}
                    </p>
                    <p className="text-sm text-gray-600">
                      ETB {Number(payment.amount || 0).toLocaleString()} paid
                      via {payment.payment_method || "-"}
                    </p>
                    <p className="text-xs text-gray-400">
                      Completed:{" "}
                      {payment.completed_at
                        ? new Date(payment.completed_at).toLocaleString()
                        : "-"}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={platformFeeActionId === payment.id}
                    onClick={() => handleConfirmPlatformFeeDelivery(payment.id)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 inline-flex items-center justify-center gap-2 w-full sm:w-auto"
                  >
                    <Send className="size-4" />
                    {platformFeeActionId === payment.id
                      ? "Sending..."
                      : "Confirm & Notify"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FileWarning className="size-5 text-orange-500" /> Pending Event
                Reports
              </h2>
              <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700">
                {reports.length}
              </span>
            </div>
            <div className="divide-y">
              {reports.length === 0 ? (
                <p className="px-6 py-8 text-sm text-gray-500">
                  No pending event reports.
                </p>
              ) : (
                reports.slice(0, 5).map((report) => (
                  <div key={report.id} className="px-6 py-4">
                    <p className="text-sm font-semibold text-gray-900">
                      {report.event?.title || "Reported event"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Reason: {report.reason}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Organizer:{" "}
                      {report.subject_user?.organizer_profile
                        ?.organization_name ||
                        report.subject_user?.full_name ||
                        "N/A"}
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
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Scale className="size-5 text-amber-600" /> Pending Organizer
                Appeals
              </h2>
              <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                {appeals.length}
              </span>
            </div>
            <div className="divide-y">
              {appeals.length === 0 ? (
                <p className="px-6 py-8 text-sm text-gray-500">
                  No pending organizer appeals.
                </p>
              ) : (
                appeals.slice(0, 5).map((appeal) => (
                  <div key={appeal.id} className="px-6 py-4">
                    <p className="text-sm font-semibold text-gray-900">
                      {appeal.appellant?.organizer_profile?.organization_name ||
                        appeal.appellant?.full_name ||
                        "Organizer"}
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

        <div className="bg-white rounded-2xl shadow-sm">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-bold">Quick Actions</h2>
          </div>
          <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-3">
            <Link
              to="/admin/approvals"
              className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100"
            >
              <span>Approve Organizers</span>
              <ChevronRight className="size-4" />
            </Link>
            <Link
              to="/admin/users"
              className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100"
            >
              <span> Manage Users</span>
              <ChevronRight className="size-4" />
            </Link>
            <Link
              to="/admin/events"
              className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100"
            >
              <span> Manage Events</span>
              <ChevronRight className="size-4" />
            </Link>
            <button
              type="button"
              onClick={openCreateCategoryModal}
              disabled={!isSuperAdmin}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100"
            >
              <span className="flex items-center gap-2">
                <Plus className="size-4" />
                {isSuperAdmin
                  ? "Create Category"
                  : "Create Category (Super Admin)"}
              </span>
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm mt-8 overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="text-xl font-bold">Category Management</h2>
            <span className="text-xs text-gray-500">
              {categories.length} categories
            </span>
          </div>
          {categoriesLoading ? (
            <div className="px-6 py-8 text-sm text-gray-500">
              Loading categories...
            </div>
          ) : categories.length === 0 ? (
            <div className="px-6 py-8 text-sm text-gray-500">
              No categories found.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      {category.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Slug: {category.slug} • Events: {category.event_count}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={
                      !isSuperAdmin || categoryDeleteLoadingId === category.id
                    }
                    onClick={() => handleDeleteCategory(category)}
                    className="px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50 disabled:opacity-50 inline-flex items-center justify-center gap-1 w-full sm:w-auto"
                  >
                    <Trash2 className="size-4" />
                    {categoryDeleteLoadingId === category.id
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showModal && selectedApp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Application Details</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  X
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Organization
                  </h3>
                  <p>
                    <strong>Name:</strong> {selectedApp.organization_name}
                  </p>
                  <p>
                    <strong>Type:</strong> {selectedApp.organization_type}
                  </p>
                  <p>
                    <strong>Bio:</strong> {selectedApp.bio}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Contact</h3>
                  <p>
                    <strong>Name:</strong> {selectedApp.full_name}
                  </p>
                  <p>
                    <strong>Email:</strong> {selectedApp.email}
                  </p>
                  <p>
                    <strong>Phone:</strong> {selectedApp.phone_number}
                  </p>
                </div>
                {selectedApp.website_url && (
                  <div>
                    <p>
                      <strong>Website:</strong>{" "}
                      <a
                        href={`https://${selectedApp.website_url}`}
                        target="_blank"
                        className="text-green-600"
                      >
                        {selectedApp.website_url}
                      </a>
                    </p>
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => {
                    handleApprove(selectedApp.id);
                    setShowModal(false);
                  }}
                  className="flex-1 py-2 bg-green-600 text-white rounded-lg"
                >
                  Approve
                </button>
                <button
                  onClick={() => {
                    handleReject(selectedApp.id);
                    setShowModal(false);
                  }}
                  className="flex-1 py-2 border border-red-500 text-red-600 rounded-lg"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReportModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Event Report Details
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Review the report and choose to ban organizer or reject.
            </p>

            <div className="space-y-2 text-sm mb-4">
              <p>
                <span className="font-semibold">Event:</span>{" "}
                {selectedReport.event?.title || "N/A"}
              </p>
              <p>
                <span className="font-semibold">Reporter:</span>{" "}
                {selectedReport.reporter?.full_name || "N/A"}
              </p>
              <p>
                <span className="font-semibold">Organizer:</span>{" "}
                {selectedReport.subject_user?.organizer_profile
                  ?.organization_name ||
                  selectedReport.subject_user?.full_name ||
                  "N/A"}
              </p>
              <p>
                <span className="font-semibold">Reason:</span>{" "}
                {selectedReport.reason}
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

            <div className="mt-5 flex flex-col sm:flex-row gap-3">
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
                Reject
              </button>
              <button
                type="button"
                onClick={() => handleReportDecision("ban")}
                disabled={moderationActionLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl disabled:opacity-50"
              >
                Ban Organizer
              </button>
            </div>
          </div>
        </div>
      )}

      {showAppealModal && selectedAppeal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Organizer Appeal Details
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Approve to unban organizer, or reject to keep the ban active.
            </p>

            <div className="space-y-2 text-sm mb-4">
              <p>
                <span className="font-semibold">Organizer:</span>{" "}
                {selectedAppeal.appellant?.organizer_profile
                  ?.organization_name ||
                  selectedAppeal.appellant?.full_name ||
                  "N/A"}
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

            <div className="mt-5 flex flex-col sm:flex-row gap-3">
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

      {showCreateCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Create Category
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Add a new event category for organizers and attendees.
            </p>

            {!isSuperAdmin && (
              <p className="text-sm text-red-600 mb-4">
                Only super admin can create categories.
              </p>
            )}

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => handleCategoryNameChange(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                  placeholder="e.g. Music"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug
                </label>
                <input
                  type="text"
                  value={categoryForm.slug}
                  onChange={(e) =>
                    setCategoryForm((prev) => ({
                      ...prev,
                      slug: toSlug(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-xl"
                  placeholder="music"
                  required
                />
              </div>

              {categoryError && (
                <p className="text-sm text-red-600">{categoryError}</p>
              )}

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateCategoryModal(false)}
                  className="flex-1 px-4 py-2 border rounded-xl"
                  disabled={categoryCreateLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl disabled:opacity-50"
                  disabled={categoryCreateLoading || !isSuperAdmin}
                >
                  {categoryCreateLoading ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Update for: feat(engine): add POST /api/staff/scan check-in validation flow
// Update for: feat(engine): finalize check-in logs and Redis-backed moderation cache flow