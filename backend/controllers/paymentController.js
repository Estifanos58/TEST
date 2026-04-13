const crypto = require('crypto');

const { prisma } = require('../config/database');
const { initializePayment, verifyPayment: chapaVerifyPayment } = require('../services/chapaService');
const { signTicketQrPayload, buildTicketQrDataUrl } = require('../utils/crypto');
const { generateId } = require('../utils/id');

const SERVICE_FEE_RATE = 0.1;

const parseAmount = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const buildTicketCode = (orderId, orderItemId, index) => {
  const digest = crypto
    .createHash('sha1')
    .update(`${orderId}:${orderItemId}:${index}`)
    .digest('hex')
    .slice(0, 12)
    .toUpperCase();

  return `DEMS-${digest}`;
};

const ensureDigitalTicketsForOrder = async (orderId) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      order_items: {
        orderBy: { id: 'asc' }
      },
      digital_tickets: {
        select: { ticket_code: true }
      }
    }
  });

  if (!order) {
    throw new Error('Order not found while issuing tickets');
  }

  const existingCodes = new Set(order.digital_tickets.map((ticket) => ticket.ticket_code));
  const missingTickets = [];

  for (const item of order.order_items) {
    for (let index = 1; index <= item.quantity; index += 1) {
      const ticket_code = buildTicketCode(order.id, item.id, index);

      if (!existingCodes.has(ticket_code)) {
        missingTickets.push({
          id: generateId(),
          order_id: order.id,
          event_id: item.event_id,
          ticket_type_id: item.ticket_type_id,
          ticket_code
        });
      }
    }
  }

  if (missingTickets.length > 0) {
    await prisma.digitalTicket.createMany({
      data: missingTickets
    });
  }

  return prisma.digitalTicket.findMany({
    where: { order_id: order.id },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          banner_url: true,
          city: true,
          venue_name: true,
          start_datetime: true,
          end_datetime: true
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
    orderBy: { created_at: 'asc' }
  });
};

const mapTicketsForResponse = async (tickets) => {
  return Promise.all(
    tickets.map(async (ticket) => {
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
        event: ticket.event,
        ticket_type: ticket.ticket_type,
        order_number: ticket.order.order_number,
        purchase_date: ticket.order.created_at
      };
    })
  );
};

const createOrUpdateOrderWithItems = async ({
  order_id,
  userId,
  line_items,
  tx_ref,
  subtotal,
  serviceFee,
  totalAmount
}) => {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.upsert({
      where: { order_number: order_id },
      update: {
        user_id: userId,
        subtotal,
        service_fee: serviceFee,
        total_amount: totalAmount,
        status: 'pending',
        tx_ref,
        payment_method: 'chapa'
      },
      create: {
        id: generateId(),
        user_id: userId,
        order_number: order_id,
        subtotal,
        service_fee: serviceFee,
        total_amount: totalAmount,
        status: 'pending',
        tx_ref,
        payment_method: 'chapa'
      },
      select: { id: true }
    });

    await tx.orderItem.deleteMany({
      where: { order_id: order.id }
    });

    await tx.orderItem.createMany({
      data: line_items.map((item) => ({
        id: generateId(),
        order_id: order.id,
        event_id: item.event_id,
        ticket_type_id: item.ticket_type_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.unit_price * item.quantity
      }))
    });
  });
};

// Initialize payment for ticket purchase
const initPayment = async (req, res) => {
  try {
    const { order_id, total_amount, user_email, user_phone, user_name, line_items } = req.body;
    const userId = req.user.id;

    if (!order_id || typeof order_id !== 'string') {
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }

    if (!Array.isArray(line_items) || line_items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'line_items is required and must include at least one ticket item'
      });
    }

    const sanitizedItems = line_items.map((item) => ({
      event_id: item?.event_id,
      ticket_type_id: item?.ticket_type_id,
      quantity: Number(item?.quantity),
      unit_price: parseAmount(item?.unit_price)
    }));

    const hasInvalidItem = sanitizedItems.some(
      (item) => !item.event_id || !item.ticket_type_id || !Number.isInteger(item.quantity) || item.quantity < 1
    );

    if (hasInvalidItem) {
      return res.status(400).json({
        success: false,
        message: 'Each line item must include event_id, ticket_type_id, and quantity >= 1'
      });
    }

    const uniqueTicketTypeIds = [...new Set(sanitizedItems.map((item) => item.ticket_type_id))];
    const ticketTypes = await prisma.ticketType.findMany({
      where: {
        id: { in: uniqueTicketTypeIds },
        is_active: true
      },
      select: {
        id: true,
        event_id: true,
        price: true,
        remaining_quantity: true
      }
    });

    if (ticketTypes.length !== uniqueTicketTypeIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more ticket types are invalid or inactive'
      });
    }

    const ticketTypeMap = new Map(ticketTypes.map((ticketType) => [ticketType.id, ticketType]));
    const uniqueEventIds = [...new Set(sanitizedItems.map((item) => item.event_id))];
    const eventRecords = await prisma.event.findMany({
      where: {
        id: { in: uniqueEventIds }
      },
      select: {
        id: true,
        title: true,
        organizer_id: true,
        organizer: {
          select: {
            full_name: true,
            organizer_profile: {
              select: {
                organization_name: true
              }
            }
          }
        }
      }
    });

    if (eventRecords.length !== uniqueEventIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more selected events are invalid'
      });
    }

    const eventsById = new Map(eventRecords.map((event) => [event.id, event]));
    const organizerIds = [...new Set(eventRecords.map((event) => event.organizer_id))];

    const activeOrganizerBans = await prisma.ban.findMany({
      where: {
        scope: 'organizer_user',
        status: 'active',
        subject_user_id: userId,
        organizer_id: { in: organizerIds }
      },
      select: {
        id: true,
        organizer_id: true,
        reason: true
      }
    });

    if (activeOrganizerBans.length > 0) {
      const blockedBan = activeOrganizerBans[0];
      const blockedEvent = eventRecords.find((event) => event.organizer_id === blockedBan.organizer_id);
      const organizerName = blockedEvent?.organizer?.organizer_profile?.organization_name
        || blockedEvent?.organizer?.full_name
        || 'the organizer';

      return res.status(403).json({
        success: false,
        code: 'BANNED_FROM_ORGANIZER',
        message: `You are banned from booking events by ${organizerName}.`,
        ban: {
          id: blockedBan.id,
          reason: blockedBan.reason,
          organizer_id: blockedBan.organizer_id,
          organizer_name: organizerName,
          event_id: blockedEvent?.id || null,
          event_title: blockedEvent?.title || null
        }
      });
    }

    let subtotal = 0;

    for (const item of sanitizedItems) {
      const ticketType = ticketTypeMap.get(item.ticket_type_id);
      const event = eventsById.get(item.event_id);

      if (!ticketType || ticketType.event_id !== item.event_id) {
        return res.status(400).json({
          success: false,
          message: 'Ticket type does not belong to the provided event'
        });
      }

      if (!event) {
        return res.status(400).json({
          success: false,
          message: 'One or more selected events are invalid'
        });
      }

      if (item.quantity > ticketType.remaining_quantity) {
        return res.status(400).json({
          success: false,
          message: `Not enough tickets available for ticket type ${item.ticket_type_id}`
        });
      }

      item.unit_price = Number(ticketType.price);
      subtotal += item.unit_price * item.quantity;
    }

    const serviceFee = subtotal * SERVICE_FEE_RATE;
    const computedTotal = subtotal + serviceFee;
    const providedTotal = parseAmount(total_amount);

    if (providedTotal > 0 && Math.abs(providedTotal - computedTotal) > 0.01) {
      return res.status(400).json({
        success: false,
        message: 'Total amount does not match line items'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, full_name: true, phone: true }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    const payerEmail = user_email || user.email;

    if (!payerEmail) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const tx_ref = `TICKET-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;

    await createOrUpdateOrderWithItems({
      order_id,
      userId,
      line_items: sanitizedItems,
      tx_ref,
      subtotal,
      serviceFee,
      totalAmount: computedTotal
    });

    const nameParts = (user_name || user.full_name || 'DEMS User').split(' ');
    const first_name = nameParts[0];
    const last_name = nameParts.slice(1).join(' ') || 'User';

    const paymentResult = await initializePayment({
      amount: computedTotal,
      email: payerEmail,
      first_name,
      last_name,
      phone_number: user_phone || user.phone || '0912345678',
      tx_ref,
      title: 'DEMS Tickets',
      description: `Ticket purchase - Order ${order_id}`
    });

    if (paymentResult.success && paymentResult.checkout_url) {
      return res.json({
        success: true,
        checkout_url: paymentResult.checkout_url,
        tx_ref,
        order_total: computedTotal
      });
    }

    return res.status(400).json({
      success: false,
      message: paymentResult.message || 'Payment initialization failed'
    });
  } catch (error) {
    console.error('Init payment error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Verify payment (called from frontend after redirect)
const verifyPayment = async (req, res) => {
  try {
    const { tx_ref } = req.query;

    if (!tx_ref) {
      return res.status(400).json({ success: false, message: 'Transaction reference required' });
    }

    const order = await prisma.order.findUnique({
      where: { tx_ref },
      include: {
        order_items: true
      }
    });

    if (!order) {
      const payment = await prisma.platformFeePayment.findUnique({
        where: { tx_ref }
      });

      if (!payment) {
        return res.json({
          success: false,
          status: 'not_found',
          message: 'Transaction not found'
        });
      }

      if (payment.status === 'completed') {
        return res.json({
          success: true,
          status: 'completed',
          message: 'Payment verified successfully'
        });
      }

      const verification = await chapaVerifyPayment(tx_ref);

      if (verification.success) {
        await prisma.platformFeePayment.update({
          where: { tx_ref },
          data: {
            status: 'completed',
            completed_at: new Date()
          }
        });

        return res.json({
          success: true,
          status: 'completed',
          message: 'Payment verified successfully'
        });
      }

      return res.json({
        success: false,
        status: verification.status,
        message: verification.message || 'Payment verification failed'
      });
    }

    if (!order.order_items.length) {
      return res.status(400).json({
        success: false,
        message: 'Order is missing ticket items. Please retry checkout.'
      });
    }

    let finalOrderStatus = order.status;

    if (order.status !== 'paid') {
      const verification = await chapaVerifyPayment(tx_ref);

      if (!verification.success) {
        return res.json({
          success: false,
          status: 'pending',
          message: 'Payment not completed'
        });
      }

      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { tx_ref },
          data: {
            status: 'paid',
            paid_at: new Date()
          }
        });

        for (const item of order.order_items) {
          await tx.ticketType.update({
            where: { id: item.ticket_type_id },
            data: {
              remaining_quantity: {
                decrement: item.quantity
              }
            }
          });
        }
      });

      finalOrderStatus = 'paid';
    }

    const issuedTickets = await ensureDigitalTicketsForOrder(order.id);
    const ticketPayload = await mapTicketsForResponse(issuedTickets);

    if (finalOrderStatus === 'paid') {
      return res.json({
        success: true,
        status: 'completed',
        message: 'Payment verified successfully',
        order_number: order.order_number,
        tickets: ticketPayload
      });
    }

    return res.json({
      success: false,
      status: 'pending',
      message: 'Payment not completed'
    });
  } catch (error) {
    console.error('Verify payment error:', error);

    if (error?.code === 'P2025') {
      return res.status(409).json({
        success: false,
        message: 'Ticket stock changed while verifying payment. Please retry checkout.'
      });
    }

    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { initPayment, verifyPayment };

// Update for: feat(frontdoor): finalize users, orders, and order_items schema constraints in Prisma
// Update for: feat(frontdoor): align SQL patch for users and orders constraints in database scripts