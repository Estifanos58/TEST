import { useState, useEffect } from "react";
import {
  Bell,
  BellRing,
  CheckCircle,
  Clock,
  Calendar,
  Ticket,
  Users,
  ShieldAlert,
  FileWarning,
  Scale,
} from "lucide-react";
import { Link } from "react-router-dom";
import { moderationAPI } from "../../api/client";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [selectedBanNotification, setSelectedBanNotification] = useState(null);
  const [banDetails, setBanDetails] = useState(null);
  const [appealMessage, setAppealMessage] = useState("");
  const [submittingAppeal, setSubmittingAppeal] = useState(false);
  const [loadingBanDetails, setLoadingBanDetails] = useState(false);

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`${API_URL}/notifications`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(
          data.notifications?.filter((n) => !n.read_at).length || 0,
        );
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const markAsRead = async (id) => {
    const nowIso = new Date().toISOString();
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id
          ? { ...notif, read_at: notif.read_at || nowIso }
          : notif,
      ),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await fetch(`${API_URL}/notifications/${id}/read`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
    } catch (error) {
      console.error("Error marking as read:", error);
      fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications
      .filter((notif) => !notif.read_at)
      .map((notif) => notif.id);
    if (unreadIds.length === 0) {
      return;
    }

    const nowIso = new Date().toISOString();
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, read_at: notif.read_at || nowIso })),
    );
    setUnreadCount(0);

    try {
      await Promise.allSettled(
        unreadIds.map((id) =>
          fetch(`${API_URL}/notifications/${id}/read`, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
          }),
        ),
      );
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      fetchNotifications();
    }
  };

  const handleBellToggle = () => {
    const nextShow = !showDropdown;
    setShowDropdown(nextShow);

    if (nextShow) {
      markAllAsRead();
    }
  };

  const openBanAppealModal = async (notification) => {
    const metadata = notification?.metadata || {};
    const banId = metadata.ban_id;

    if (!banId) {
      return;
    }

    setSelectedBanNotification(notification);
    setAppealMessage("");
    setShowAppealModal(true);
    setLoadingBanDetails(true);

    try {
      const response = await moderationAPI.getBanById(banId);
      if (response.success) {
        setBanDetails(response.ban);
      }
    } catch (error) {
      console.error("Error loading ban details:", error);
      setBanDetails(null);
    } finally {
      setLoadingBanDetails(false);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.read_at) {
      await markAsRead(notif.id);
    }

    if (notif.type === "ban") {
      setShowDropdown(false);
      await openBanAppealModal(notif);
    }
  };

  const submitAppeal = async () => {
    const message = appealMessage.trim();
    const banId = selectedBanNotification?.metadata?.ban_id;

    if (!banId) {
      alert("Unable to find ban details for this appeal.");
      return;
    }

    if (!message) {
      alert("Please enter your appeal message.");
      return;
    }

    setSubmittingAppeal(true);
    try {
      await moderationAPI.submitAppeal({
        ban_id: banId,
        message,
      });

      alert("Appeal submitted successfully.");
      setShowAppealModal(false);
      setSelectedBanNotification(null);
      setBanDetails(null);
      setAppealMessage("");
      fetchNotifications();
    } catch (error) {
      alert(error.message || "Failed to submit appeal");
    } finally {
      setSubmittingAppeal(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "purchase":
        return <Ticket className="size-4 text-green-500" />;
      case "reminder":
        return <Calendar className="size-4 text-blue-500" />;
      case "approval":
        return <Users className="size-4 text-purple-500" />;
      case "platform_fee_delivery":
        return <CheckCircle className="size-4 text-emerald-500" />;
      case "platform_fee_confirmation_required":
        return <Clock className="size-4 text-amber-500" />;
      case "ban":
        return <ShieldAlert className="size-4 text-red-500" />;
      case "report_submitted":
        return <FileWarning className="size-4 text-orange-500" />;
      case "report_decision":
        return <FileWarning className="size-4 text-blue-500" />;
      case "appeal_submitted":
        return <Scale className="size-4 text-amber-500" />;
      case "appeal_decision":
        return <Scale className="size-4 text-green-500" />;
      default:
        return <Bell className="size-4 text-gray-500" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleBellToggle}
        className="relative p-2 text-gray-600 hover:text-green-600 transition-colors"
      >
        {unreadCount > 0 ? (
          <BellRing className="size-5" />
        ) : (
          <Bell className="size-5" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          <div className="fixed left-4 right-4 top-16 w-auto max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border z-50 max-h-[70vh] overflow-y-auto sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-[calc(100vw-2rem)] sm:max-w-sm sm:max-h-96">
            <div className="p-3 border-b sticky top-0 bg-white">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
            </div>
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Bell className="size-8 mx-auto mb-2 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleNotificationClick(notif)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        handleNotificationClick(notif);
                      }
                    }}
                    className={`p-3 hover:bg-gray-50 transition cursor-pointer ${!notif.read_at ? "bg-blue-50" : ""}`}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0">
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {notif.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {notif.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(notif.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {!notif.read_at && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notif.id);
                          }}
                          className="text-xs text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="size-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="p-2 border-t text-center">
              <Link
                to="/notifications"
                className="text-xs text-green-600 hover:text-green-700"
              >
                View all
              </Link>
            </div>
          </div>
        </>
      )}

      {showAppealModal && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Ban Notice</h3>
            <p className="text-sm text-gray-500 mb-4">
              You can submit an appeal for this moderation decision.
            </p>

            {loadingBanDetails ? (
              <p className="text-sm text-gray-500">Loading ban details...</p>
            ) : (
              <>
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 mb-4">
                  <p className="text-sm text-red-700 font-medium mb-1">
                    {selectedBanNotification?.message ||
                      "Your booking or organizer access has been restricted."}
                  </p>
                  <p className="text-xs text-red-600">
                    Organizer:{" "}
                    {banDetails?.organizer?.organizer_profile
                      ?.organization_name ||
                      banDetails?.organizer?.full_name ||
                      selectedBanNotification?.metadata?.organizer_name ||
                      "N/A"}
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    Reason:{" "}
                    {banDetails?.reason ||
                      selectedBanNotification?.metadata?.reason ||
                      "No reason provided"}
                  </p>
                </div>

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Appeal Message
                </label>
                <textarea
                  rows={5}
                  value={appealMessage}
                  onChange={(e) => setAppealMessage(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                  placeholder="Explain why this ban should be reviewed..."
                />

                <div className="mt-5 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAppealModal(false);
                      setSelectedBanNotification(null);
                      setBanDetails(null);
                      setAppealMessage("");
                    }}
                    className="flex-1 px-4 py-2 border rounded-xl"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={submitAppeal}
                    disabled={submittingAppeal}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl disabled:opacity-50"
                  >
                    {submittingAppeal ? "Sending..." : "Submit Appeal"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
