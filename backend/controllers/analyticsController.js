const { prisma } = require("../config/database");
const { buildCsv } = require("../utils/csv");

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toIsoDate = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10);
};

const getEventViewsFromDb = async (eventId) => {
  try {
    const rows = await prisma.$queryRaw`
      SELECT views
      FROM event_analytics
      WHERE event_id = ${eventId}
      LIMIT 1
    `;

    if (!Array.isArray(rows) || rows.length === 0) {
      return 0;
    }

    return toNumber(rows[0]?.views);
  } catch (error) {
    console.error(
      "Failed to fetch event views from event_analytics:",
      error.message,
    );
    return 0;
  }
};

// Get event analytics for organizer (REAL DATA)
const getEventAnalytics = async (req, res) => {
  try {
    const { eventId } = req.params;
    const organizerId = req.user.id;

    // Verify event belongs to organizer
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        organizer_id: organizerId,
      },
      select: {
        id: true,
        title: true,
      },
    });

    if (!event) {
      return res
        .status(404)
        .json({ message: "Event not found or not authorized" });
    }

    // Get ticket sales by type (REAL DATA)
    const ticketSales = await prisma.ticketType.findMany({
      where: {
        event_id: eventId,
      },
      select: {
        id: true,
        tier_name: true,
        price: true,
        capacity: true,
        remaining_quantity: true,
      },
      orderBy: {
        price: "asc",
      },
    });

    const ticketDistribution = ticketSales.map((ticket) => {
      const sold = Math.max(0, ticket.capacity - ticket.remaining_quantity);
      const price = toNumber(ticket.price);
      const revenue = sold * price;

      return {
        name: ticket.tier_name,
        value: sold,
        price,
        capacity: ticket.capacity,
        revenue,
      };
    });

    const totalTicketsSold = ticketDistribution.reduce(
      (sum, ticket) => sum + ticket.value,
      0,
    );
    const totalRevenue = ticketDistribution.reduce(
      (sum, ticket) => sum + ticket.revenue,
      0,
    );

    // Get daily sales data from paid orders
    const paidOrderItems = await prisma.orderItem.findMany({
      where: {
        event_id: eventId,
        order: {
          status: "paid",
          paid_at: {
            not: null,
          },
        },
      },
      select: {
        quantity: true,
        total_price: true,
        order: {
          select: {
            id: true,
            paid_at: true,
          },
        },
      },
    });

    const dailySalesByDate = new Map();

    for (const item of paidOrderItems) {
      const paidAt = item.order?.paid_at;
      const dateKey = toIsoDate(paidAt);

      if (!dateKey) {
        continue;
      }

      if (!dailySalesByDate.has(dateKey)) {
        dailySalesByDate.set(dateKey, {
          orderIds: new Set(),
          tickets_sold: 0,
          revenue: 0,
        });
      }

      const bucket = dailySalesByDate.get(dateKey);
      bucket.orderIds.add(item.order.id);
      bucket.tickets_sold += item.quantity;
      bucket.revenue += toNumber(item.total_price);
    }

    const dailySales = [...dailySalesByDate.entries()]
      .map(([date, values]) => ({
        date,
        order_count: values.orderIds.size,
        tickets_sold: values.tickets_sold,
        revenue: values.revenue,
      }))
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 7);

    // Get check-in stats (REAL DATA)
    const checkins = await prisma.checkInLog.findMany({
      where: {
        event_id: eventId,
      },
      select: {
        check_in_time: true,
      },
    });

    const totalCheckedIn = checkins.length;
    const checkInRate =
      totalTicketsSold > 0
        ? ((totalCheckedIn / totalTicketsSold) * 100).toFixed(1)
        : 0;

    // Get reviews (REAL DATA)
    const reviews = await prisma.review.findMany({
      where: {
        event_id: eventId,
        status: "visible",
      },
      include: {
        user: {
          select: {
            full_name: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
      take: 5,
    });

    // Get average rating (REAL DATA)
    const avgRating = await prisma.review.aggregate({
      where: {
        event_id: eventId,
        status: "visible",
      },
      _avg: {
        rating: true,
      },
    });

    // Get hourly check-in pattern (REAL DATA)
    const hourlyCheckinsMap = new Map();
    for (const checkin of checkins) {
      const hour = new Date(checkin.check_in_time).getHours();
      hourlyCheckinsMap.set(hour, (hourlyCheckinsMap.get(hour) || 0) + 1);
    }

    // Format hourly data
    const hourlyData = [];
    for (let i = 9; i <= 17; i++) {
      const count = hourlyCheckinsMap.get(i) || 0;
      hourlyData.push({
        hour: `${i} ${i < 12 ? "AM" : "PM"}`,
        count,
      });
    }

    const totalViews = await getEventViewsFromDb(eventId);

    // Format daily sales for chart
    const dailySalesFormatted = dailySales
      .map((d) => ({
        date: new Date(d.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        sales: d.tickets_sold,
        revenue: d.revenue,
      }))
      .reverse();

    // Format reviews
    const reviewsFormatted = reviews.map((r) => ({
      id: r.id,
      user: r.user?.full_name || "Unknown User",
      rating: r.rating,
      comment: r.review_text,
      date: r.created_at,
    }));

    res.json({
      success: true,
      analytics: {
        total_views: totalViews,
        total_tickets_sold: totalTicketsSold,
        total_revenue: totalRevenue,
        check_in_rate: parseFloat(checkInRate),
        average_rating: parseFloat(avgRating._avg.rating || 0).toFixed(1),
        ticket_distribution: ticketDistribution,
        daily_sales: dailySalesFormatted,
        hourly_checkins: hourlyData,
        recent_reviews: reviewsFormatted,
      },
    });
  } catch (error) {
    console.error("Get event analytics error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get organizer dashboard stats (REAL DATA)
const getOrganizerStats = async (req, res) => {
  try {
    const organizerId = req.user.id;

    // Get all events for this organizer
    const events = await prisma.event.findMany({
      where: {
        organizer_id: organizerId,
      },
      select: {
        id: true,
        status: true,
        ticket_types: {
          select: {
            capacity: true,
            remaining_quantity: true,
            price: true,
          },
        },
      },
    });

    let totalTicketsSold = 0;
    let totalRevenue = 0;
    let totalEvents = events.length;
    let completedEvents = 0;

    for (const event of events) {
      for (const ticketType of event.ticket_types) {
        const sold = Math.max(
          0,
          ticketType.capacity - ticketType.remaining_quantity,
        );
        totalTicketsSold += sold;
        totalRevenue += sold * toNumber(ticketType.price);
      }

      if (event.status === "completed") {
        completedEvents++;
      }
    }

    res.json({
      success: true,
      stats: {
        total_events: totalEvents,
        total_tickets_sold: totalTicketsSold,
        total_revenue: totalRevenue,
        completed_events: completedEvents,
        average_tickets_per_event:
          totalEvents > 0 ? Math.round(totalTicketsSold / totalEvents) : 0,
      },
    });
  } catch (error) {
    console.error("Get organizer stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const toIsoDateTime = (value) => {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
};

const exportOrganizerDashboardCsv = async (req, res) => {
  try {
    const organizerId = req.user.id;
    const exportedAt = new Date().toISOString();

    const events = await prisma.event.findMany({
      where: {
        organizer_id: organizerId,
      },
      select: {
        id: true,
        title: true,
        status: true,
        city: true,
        start_datetime: true,
        end_datetime: true,
        created_at: true,
        avg_rating: true,
        category: {
          select: {
            name: true,
          },
        },
        ticket_types: {
          select: {
            capacity: true,
            remaining_quantity: true,
            price: true,
          },
        },
        check_in_logs: {
          select: {
            id: true,
          },
        },
        reviews: {
          where: {
            status: "visible",
          },
          select: {
            rating: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    const rows = events.map((event) => {
      let totalCapacity = 0;
      let ticketsRemaining = 0;
      let ticketsSold = 0;
      let grossRevenue = 0;

      for (const ticketType of event.ticket_types || []) {
        const capacity = Math.max(0, ticketType.capacity || 0);
        const remaining = Math.max(0, ticketType.remaining_quantity || 0);
        const sold = Math.max(0, capacity - remaining);

        totalCapacity += capacity;
        ticketsRemaining += remaining;
        ticketsSold += sold;
        grossRevenue += sold * toNumber(ticketType.price);
      }

      const visibleReviews = event.reviews?.length || 0;
      const ratingFromReviews =
        visibleReviews > 0
          ? event.reviews.reduce(
              (sum, review) => sum + toNumber(review.rating),
              0,
            ) / visibleReviews
          : toNumber(event.avg_rating);

      return {
        generated_at: exportedAt,
        event_id: event.id,
        title: event.title,
        status: event.status,
        category_name: event.category?.name || "",
        city: event.city,
        start_datetime: toIsoDateTime(event.start_datetime),
        end_datetime: toIsoDateTime(event.end_datetime),
        ticket_types_count: event.ticket_types?.length || 0,
        total_capacity: totalCapacity,
        tickets_sold: ticketsSold,
        tickets_remaining: ticketsRemaining,
        gross_revenue_etb: grossRevenue.toFixed(2),
        total_checkins: event.check_in_logs?.length || 0,
        visible_reviews: visibleReviews,
        average_rating: ratingFromReviews.toFixed(2),
        created_at: toIsoDateTime(event.created_at),
      };
    });

    const csv = buildCsv({
      columns: [
        { key: "generated_at", header: "generated_at" },
        { key: "event_id", header: "event_id" },
        { key: "title", header: "title" },
        { key: "status", header: "status" },
        { key: "category_name", header: "category_name" },
        { key: "city", header: "city" },
        { key: "start_datetime", header: "start_datetime" },
        { key: "end_datetime", header: "end_datetime" },
        { key: "ticket_types_count", header: "ticket_types_count" },
        { key: "total_capacity", header: "total_capacity" },
        { key: "tickets_sold", header: "tickets_sold" },
        { key: "tickets_remaining", header: "tickets_remaining" },
        { key: "gross_revenue_etb", header: "gross_revenue_etb" },
        { key: "total_checkins", header: "total_checkins" },
        { key: "visible_reviews", header: "visible_reviews" },
        { key: "average_rating", header: "average_rating" },
        { key: "created_at", header: "created_at" },
      ],
      rows,
    });

    const filename = `organizer-dashboard-export-${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    return res.status(200).send(csv);
  } catch (error) {
    console.error("Export organizer dashboard CSV error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

module.exports = {
  getEventAnalytics,
  getOrganizerStats,
  exportOrganizerDashboardCsv,
};

// Update for: feat(controlroom): add draft/publish screens with validation UX