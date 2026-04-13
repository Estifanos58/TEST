const { prisma } = require('../config/database');
const { buildTicketQrDataUrl, signTicketQrPayload } = require('../utils/crypto');

const mapTicketForClient = async (ticket) => {
  const qr_token = signTicketQrPayload({
    ticket_id: ticket.id,
    event_id: ticket.event_id,
    attendee_id: ticket.order.user_id,
    ticket_code: ticket.ticket_code
  });

  const qr_code_data_url = await buildTicketQrDataUrl(qr_token);

  return {
    id: ticket.id,
    ticket_code: ticket.ticket_code,
    qr_token,
    qr_code_data_url,
    is_used: ticket.is_used,
    used_at: ticket.used_at,
    purchase_date: ticket.order.created_at,
    order_number: ticket.order.order_number,
    event: ticket.event,
    ticket_type: ticket.ticket_type
  };
};

const getMyTickets = async (req, res) => {
  try {
    const userId = req.user.id;

    const tickets = await prisma.digitalTicket.findMany({
      where: {
        order: {
          user_id: userId,
          status: 'paid'
        }
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            banner_url: true,
            city: true,
            venue_name: true,
            start_datetime: true,
            end_datetime: true,
            status: true
          }
        },
        ticket_type: {
          select: {
            id: true,
            tier_name: true,
            price: true,
            currency: true
          }
        },
        order: {
          select: {
            user_id: true,
            order_number: true,
            created_at: true,
            status: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    const payload = await Promise.all(tickets.map(mapTicketForClient));

    return res.json({
      success: true,
      tickets: payload
    });
  } catch (error) {
    console.error('Get my tickets error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getMyTickets
};

// Update for: feat(frontdoor): add OTP verification flow and password reset email endpoints
// Update for: feat(frontdoor): add user profile page with settings and notifications