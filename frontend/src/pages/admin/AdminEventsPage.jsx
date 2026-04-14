import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, Trash2, RefreshCw, AlertCircle } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

export function AdminEventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setRefreshing(true);
    setError("");
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_URL}/admin/events`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch events");
      }

      setEvents(data.events || []);
    } catch (fetchError) {
      setError(fetchError.message || "Failed to load events");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDelete = async (eventId, title) => {
    const shouldDelete = confirm(
      `Delete event \"${title}\"? This permanently removes related tickets, orders, check-ins, and reviews.`,
    );

    if (!shouldDelete) {
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_URL}/admin/events/${eventId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete event");
      }

      setEvents((prev) => prev.filter((event) => event.id !== eventId));
      alert("Event deleted successfully.");
    } catch (deleteError) {
      alert(deleteError.message || "Could not delete event");
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
    <div className="min-h-screen bg-gray-50 py-8 px-4">
<div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Events</h1>
            <p className="text-gray-600">
              Admin access to all events on the platform
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={fetchEvents}
              disabled={refreshing}
              className="px-4 py-2 border rounded-xl bg-white hover:bg-gray-50 disabled:opacity-60 flex items-center gap-2"
            >
              <RefreshCw
                className={`size-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
            <Link
              to="/admin/dashboard"
              className="px-4 py-2 rounded-xl bg-white border hover:bg-gray-50"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 flex items-center gap-2">
            <AlertCircle className="size-5" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              All Events ({events.length})
            </h2>
          </div>

          {events.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              No events found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                      Event
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                      Organizer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {events.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {event.title}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <MapPin className="size-3" />
                          <span>{event.city || "-"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {event.organizer_name || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {event.category_name || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <div className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          <span>
                            {event.start_datetime
                              ? new Date(
                                  event.start_datetime,
                                ).toLocaleDateString()
                              : "-"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs ${
                            event.status === "published"
                              ? "bg-green-100 text-green-700"
                              : event.status === "draft"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {event.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(event.id, event.title)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-sm"
                        >
                          <Trash2 className="size-4" />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Update for: feat(engine): add POST /api/reviews and GET /api/reviews/event/:eventId endpoints