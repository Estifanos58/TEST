const { prisma } = require('../config/database');
const { generateId } = require('../utils/id');
const { sendTemplateEmail } = require('./mailService');

const sendTicketConfirmation = async (user, order, tickets = []) => {
  const result = await sendTemplateEmail({
    to: user.email,
    template: 'ticketConfirmation',
    payload: {
      fullName: user.full_name,
      orderNumber: order.order_number,
      totalAmount: order.total_amount,
      tickets,
      myTicketsUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/my-tickets`
    }
  });

  try {
    await prisma.notification.create({
      data: {
        id: generateId(),
        user_id: user.id,
        type: 'purchase',
        title: 'Ticket Purchase Confirmed',
        message: `Your order #${order.order_number} has been confirmed. Total: ETB ${order.total_amount}`
      }
    });
  } catch (error) {
    console.error('Failed to save purchase notification:', error.message);
  }

  if (!result.success) {
    console.error('Failed to send ticket confirmation email:', result.error);
  }

  return result;
};

const sendEventReminder = async (user, event) => {
  const result = await sendTemplateEmail({
    to: user.email,
    template: 'eventReminder',
    payload: {
      fullName: user.full_name,
      eventName: event.title,
      eventDateTime: new Date(event.start_datetime).toLocaleString(),
      venueName: event.venue_name,
      city: event.city,
      myTicketsUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/my-tickets`
    }
  });

  if (!result.success) {
    console.error('Failed to send event reminder email:', result.error);
  }

  return result;
};

const sendOrganizerApproval = async (organizer, status, reason = '') => {
  const result = await sendTemplateEmail({
    to: organizer.email,
    template: 'organizerStatus',
    payload: {
      fullName: organizer.full_name,
      status,
      reason,
      dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/organizer/dashboard`
    }
  });

  if (!result.success) {
    console.error('Failed to send organizer status email:', result.error);
  }

  return result;
};

const getUserNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { user_id: req.user.id },
      orderBy: { created_at: 'desc' },
      take: 50
    });

    res.json({ success: true, notifications });
  } catch (error) {
    console.error('Get notifications error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

const markAsRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: {
        id: req.params.id,
        user_id: req.user.id
      },
      data: {
        read_at: new Date()
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Mark notification as read error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { 
  sendTicketConfirmation, 
  sendEventReminder, 
  sendOrganizerApproval,
  getUserNotifications,
  markAsRead
};

// Update for: feat(controlroom): add delivery retry and error handling for notifications
// Update for: feat(controlroom): optimize Prisma indexes for organizer analytics and dashboard queries