import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  DollarSign,
  Ticket,
  Calendar,
  MapPin,
  ChevronLeft,
  ArrowRight,
  Star,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

export function EventsAnalyticsOverview() {
  useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_events: 0,
    total_tickets_sold: 0,
    total_revenue: 0,
    average_tickets_per_event: 0,
    average_rating: 0,
  });

  useEffect(() => {
    fetchEventsAndStats();
  }, []);

  const fetchEventsAndStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_URL}/events/organizer/my-events`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        const myEvents = data.events || [];

        // Calculate stats from events (REAL DATA)
        let totalTickets = 0;
        let totalRev = 0;
        let totalRating = 0;
        let ratedEvents = 0;

        for (const event of myEvents) {
          if (event.ticket_types && event.ticket_types.length > 0) {
            for (const ticket of event.ticket_types) {
              const sold = ticket.capacity - ticket.remaining_quantity;
              totalTickets += sold;
              totalRev += sold * ticket.price;
            }
          }

          const eventRating = Number(event.avg_rating);
          if (Number.isFinite(eventRating) && eventRating > 0) {
            totalRating += eventRating;
            ratedEvents += 1;
          }
        }

        setEvents(myEvents);
        setStats({
          total_events: myEvents.length,
          total_tickets_sold: totalTickets,
          total_revenue: totalRev,
          average_tickets_per_event:
            myEvents.length > 0
              ? Math.round(totalTickets / myEvents.length)
              : 0,
          average_rating:
            ratedEvents > 0
              ? Number((totalRating / ratedEvents).toFixed(1))
              : 0,
        });
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

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

  const getSoldPercentage = (event) => {
    let totalCapacity = 0;
    let totalSold = 0;

    if (event.ticket_types && event.ticket_types.length > 0) {
      for (const ticket of event.ticket_types) {
        totalCapacity += ticket.capacity;
        totalSold += ticket.capacity - ticket.remaining_quantity;
      }
    }

    return totalCapacity > 0 ? (totalSold / totalCapacity) * 100 : 0;
  };

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

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
<div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate("/organizer/dashboard")}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ChevronLeft className="size-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Event Analytics
            </h1>
            <p className="text-gray-600">
              View performance metrics for all your events
            </p>
          </div>
        </div>

        {/* Summary Stats - REAL DATA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Events</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.total_events}
                </p>
              </div>
              <Calendar className="size-10 text-green-400" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Tickets Sold</p>
                <p className="text-3xl font-bold text-blue-600">
                  {stats.total_tickets_sold.toLocaleString()}
                </p>
              </div>
              <Ticket className="size-10 text-blue-400" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Avg {stats.average_tickets_per_event} per event
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-yellow-600">
                  ETB {stats.total_revenue.toLocaleString()}
                </p>
              </div>
              <DollarSign className="size-10 text-yellow-400" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Average Rating</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.average_rating > 0
                    ? stats.average_rating.toFixed(1)
                    : "N/A"}
                </p>
              </div>
              <Star className="size-10 text-yellow-400 fill-yellow-400" />
            </div>
          </div>
        </div>

        {/* Events List with Analytics - REAL DATA */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              Event Performance
            </h2>
          </div>
          {events.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="size-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No events found</p>
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
                const soldPercentage = getSoldPercentage(event);

                return (
                  <div
                    key={event.id}
                    className="px-6 py-5 hover:bg-gray-50 transition cursor-pointer"
                    onClick={() => navigate(`/organizer/analytics/${event.id}`)}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg">
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
                        </div>

                        {/* Progress bar for tickets sold */}
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>{ticketsSold} tickets sold</span>
                            <span>
                              {Math.round(soldPercentage)}% of capacity
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full transition-all"
                              style={{ width: `${soldPercentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Revenue</p>
                          <p className="text-lg font-bold text-green-600">
                            ETB {revenue.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Tickets</p>
                          <p className="text-lg font-bold text-blue-600">
                            {ticketsSold}
                          </p>
                        </div>
                        <ArrowRight className="size-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Update for: feat(controlroom): create staff management UI and assignment screens
// Update for: feat(controlroom): add organizer management UI and verification states
// Update for: feat(controlroom): add event create/edit/publish APIs under /api/events
// Update for: feat(controlroom): add payout history and reconciliation services