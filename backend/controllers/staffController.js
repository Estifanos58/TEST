const { prisma } = require('../config/database');
const bcrypt = require('bcryptjs');
const { generateId } = require('../utils/id');
const { sendTemplateEmail } = require('../services/mailService');
const { verifyTicketQrPayload } = require('../utils/crypto');

// Create staff member with custom password
const createStaff = async (req, res) => {
  try {
    const { full_name, email, phone_number, assigned_role, event_id, staff_badge_id, password } = req.body;
    const organizerId = req.user.id;

    if (!['staff', 'security'].includes(assigned_role)) {
      return res.status(400).json({ message: 'Assigned role must be staff or security' });
    }
    
    // Validate password
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    // Hash the provided password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Get event details
    const event = await prisma.event.findUnique({
      where: { id: event_id },
      select: {
        id: true,
        title: true,
        start_datetime: true,
        venue_name: true,
        city: true
      }
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Determine role_id (4 for staff, 5 for security)
    const roleId = assigned_role === 'security' ? 5 : 4;
    
    await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          id: generateId(),
          role_id: roleId,
          full_name,
          email,
          password_hash: hashedPassword,
          user_name: email.split('@')[0],
          status: 'active',
          email_verified: true
        },
        select: { id: true }
      });

      await tx.staffMember.create({
        data: {
          id: generateId(),
          organizer_id: organizerId,
          event_id,
          user_id: createdUser.id,
          full_name,
          email,
          phone_number: phone_number || null,
          assigned_role,
          staff_badge_id: staff_badge_id || null,
          status: 'active'
        }
      });

      return createdUser;
    });

    sendTemplateEmail({
      to: email,
      template: 'staffInvitation',
      payload: {
        fullName: full_name,
        eventName: event.title,
        role: assigned_role,
        eventDate: new Date(event.start_datetime).toLocaleDateString(),
        eventLocation: `${event.venue_name}, ${event.city}`,
        email,
        password,
        loginUrl: `${process.env.FRONTEND_URL}/login`
      }
    })
      .then((result) => {
        if (!result.success) {
          console.error('Staff invitation email failed:', result.error);
        }
      })
      .catch((mailError) => {
        console.error('Staff invitation email failed:', mailError.message || mailError);
    });
    
    res.status(201).json({ 
      success: true, 
      message: `Staff member created successfully! An email has been sent to ${email} with login credentials.`
    });
  } catch (error) {
    console.error('Create staff error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get staff members for organizer
const getStaffMembers = async (req, res) => {
  try {
    const organizerId = req.user.id;

    const staff = await prisma.staffMember.findMany({
      where: { organizer_id: organizerId },
      include: {
        event: {
          select: { title: true }
        },
        user: {
          select: { status: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    res.json({
      success: true,
      staff: staff.map((member) => ({
        id: member.id,
        organizer_id: member.organizer_id,
        event_id: member.event_id,
        user_id: member.user_id,
        full_name: member.full_name,
        email: member.email,
        phone_number: member.phone_number,
        assigned_role: member.assigned_role,
        staff_badge_id: member.staff_badge_id,
        status: member.status,
        created_at: member.created_at,
        updated_at: member.updated_at,
        event_name: member.event?.title || null,
        user_status: member.user?.status || null
      }))
    });
  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get staff dashboard (for staff login)
const getStaffDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    const staff = await prisma.staffMember.findFirst({
      where: { user_id: userId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            start_datetime: true,
            end_datetime: true,
            venue_name: true,
            city: true,
            banner_url: true,
            description: true
          }
        }
      }
    });

    if (!staff) {
      return res.status(404).json({ message: 'No assigned event found' });
    }

    const total_tickets = await prisma.digitalTicket.count({
      where: { event_id: staff.event_id }
    });

    const checked_in = await prisma.digitalTicket.count({
      where: {
        event_id: staff.event_id,
        is_used: true
      }
    });

    res.json({ 
      success: true, 
      staff: {
        id: staff.id,
        organizer_id: staff.organizer_id,
        event_id: staff.event_id,
        user_id: staff.user_id,
        full_name: staff.full_name,
        email: staff.email,
        phone_number: staff.phone_number,
        assigned_role: staff.assigned_role,
        staff_badge_id: staff.staff_badge_id,
        status: staff.status,
        created_at: staff.created_at,
        updated_at: staff.updated_at,
        event_name: staff.event.title,
        start_datetime: staff.event.start_datetime,
        end_datetime: staff.event.end_datetime,
        venue_name: staff.event.venue_name,
        city: staff.event.city,
        banner_url: staff.event.banner_url,
        description: staff.event.description
      },
      stats: { total_tickets, checked_in }
    });
  } catch (error) {
    console.error('Get staff dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const normalizeScanPayload = async (payload) => {
  const normalizeValue = (value) => (typeof value === 'string' ? value.trim() : '');

  const normalizeDecodedPayload = (ticketPayload) => {
    if (!ticketPayload || typeof ticketPayload !== 'object') {
      return null;
    }

    return {
      ticket_id: normalizeValue(ticketPayload.ticket_id),
      event_id: normalizeValue(ticketPayload.event_id),
      attendee_id: normalizeValue(ticketPayload.attendee_id),
      ticket_code: normalizeValue(ticketPayload.ticket_code)
    };
  };

  const hasDecodedMismatch = (verifiedPayload, clientPayload) => {
    const keysToValidate = ['ticket_id', 'event_id', 'attendee_id', 'ticket_code'];

    return keysToValidate.some((key) => {
      const clientValue = clientPayload[key];
      if (!clientValue) {
        return false;
      }

      return clientValue !== verifiedPayload[key];
    });
  };

  if (payload?.qr_token) {
    const decoded = verifyTicketQrPayload(payload.qr_token);

    const verifiedPayload = {
      ticket_id: decoded.ticket_id,
      event_id: decoded.event_id,
      attendee_id: decoded.attendee_id,
      ticket_code: decoded.ticket_code
    };

    if (payload?.ticket_payload !== undefined) {
      const clientDecodedPayload = normalizeDecodedPayload(payload.ticket_payload);

      if (!clientDecodedPayload) {
        return {
          error: 'Invalid decoded ticket payload format'
        };
      }

      if (!clientDecodedPayload.ticket_id || !clientDecodedPayload.event_id || !clientDecodedPayload.attendee_id || !clientDecodedPayload.ticket_code) {
        return {
          error: 'Decoded ticket payload is incomplete'
        };
      }

      if (hasDecodedMismatch(verifiedPayload, clientDecodedPayload)) {
        return {
          error: 'Decoded ticket payload does not match QR token'
        };
      }
    }

    return verifiedPayload;
  }

  if (payload?.ticket_payload) {
    return {
      error: 'QR token is required when sending decoded ticket payload'
    };
  }

  // Backward-compatible fallback for manual entry by ticket code.
  if (payload?.ticket_code) {
    const normalizedTicketCode = normalizeValue(payload.ticket_code);

    if (!normalizedTicketCode) {
      return null;
    }

    const ticket = await prisma.digitalTicket.findUnique({
      where: { ticket_code: normalizedTicketCode },
      include: {
        order: {
          select: { user_id: true }
        }
      }
    });

    if (!ticket) {
      return null;
    }

    return {
      ticket_id: ticket.id,
      event_id: ticket.event_id,
      attendee_id: ticket.order.user_id,
      ticket_code: ticket.ticket_code
    };
  }

  return null;
};

// Scan ticket (for security staff)
const scanTicket = async (req, res) => {
  try {
    const userId = req.user.id;
    const scanData = await normalizeScanPayload(req.body);

    if (scanData?.error) {
      return res.status(400).json({
        success: false,
        status: 'invalid',
        message: scanData.error
      });
    }

    if (!scanData?.ticket_id || !scanData?.event_id || !scanData?.attendee_id) {
      return res.status(400).json({
        success: false,
        status: 'invalid',
        message: 'Invalid QR payload'
      });
    }

    const staff = await prisma.staffMember.findFirst({
      where: {
        user_id: userId,
        event_id: scanData.event_id,
        status: 'active'
      },
      select: {
        event_id: true,
        assigned_role: true
      }
    });

    if (!staff) {
      return res.status(403).json({
        success: false,
        status: 'invalid',
        message: 'Staff member is not assigned to this event'
      });
    }

    const event = await prisma.event.findUnique({
      where: { id: scanData.event_id },
      select: {
        id: true,
        title: true,
        start_datetime: true,
        end_datetime: true
      }
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        status: 'invalid',
        message: 'Event not found'
      });
    }

    const now = new Date();
    if (now < event.start_datetime || now > event.end_datetime) {
      return res.status(400).json({
        success: false,
        status: 'invalid',
        message: 'Event is not currently active for check-in'
      });
    }

    const scanResult = await prisma.$transaction(
      async (tx) => {
        const lockedRows = await tx.$queryRaw`
          SELECT
            dt.id,
            dt.ticket_code,
            dt.event_id,
            dt.is_used,
            dt.used_at,
            o.user_id AS attendee_id,
            o.status AS order_status,
            tt.tier_name
          FROM digital_tickets dt
          INNER JOIN orders o ON o.id = dt.order_id
          INNER JOIN ticket_types tt ON tt.id = dt.ticket_type_id
          WHERE dt.id = ${scanData.ticket_id}
          FOR UPDATE
        `;

        if (!lockedRows.length) {
          return {
            status: 'invalid',
            httpStatus: 404,
            message: 'Ticket not found'
          };
        }

        const lockedTicket = lockedRows[0];
        const alreadyUsed =
          lockedTicket.is_used === true ||
          lockedTicket.is_used === 1 ||
          lockedTicket.is_used === 't' ||
          lockedTicket.is_used === 'true';

        if (lockedTicket.event_id !== scanData.event_id) {
          return {
            status: 'invalid',
            httpStatus: 400,
            message: 'Ticket does not belong to this event'
          };
        }

        if (lockedTicket.attendee_id !== scanData.attendee_id) {
          return {
            status: 'invalid',
            httpStatus: 400,
            message: 'Ticket attendee mismatch'
          };
        }

        if (scanData.ticket_code && lockedTicket.ticket_code !== scanData.ticket_code) {
          return {
            status: 'invalid',
            httpStatus: 400,
            message: 'Ticket code mismatch'
          };
        }

        if (lockedTicket.order_status !== 'paid') {
          return {
            status: 'invalid',
            httpStatus: 400,
            message: 'Ticket payment is not completed'
          };
        }

        if (alreadyUsed) {
          await tx.checkInLog.create({
            data: {
              id: generateId(),
              ticket_id: lockedTicket.id,
              staff_id: userId,
              event_id: scanData.event_id,
              status: 'already_scanned',
              check_in_time: now
            }
          });

          return {
            status: 'already_scanned',
            httpStatus: 409,
            message: 'Ticket already used',
            ticket: {
              id: lockedTicket.id,
              ticket_code: lockedTicket.ticket_code,
              tier_name: lockedTicket.tier_name,
              used_at: lockedTicket.used_at
            }
          };
        }

        await tx.digitalTicket.update({
          where: { id: lockedTicket.id },
          data: {
            is_used: true,
            used_at: now
          }
        });

        await tx.checkInLog.create({
          data: {
            id: generateId(),
            ticket_id: lockedTicket.id,
            staff_id: userId,
            event_id: scanData.event_id,
            status: 'valid',
            check_in_time: now
          }
        });

        return {
          status: 'valid',
          httpStatus: 200,
          message: 'Ticket validated successfully',
          ticket: {
            id: lockedTicket.id,
            ticket_code: lockedTicket.ticket_code,
            tier_name: lockedTicket.tier_name,
            used_at: now
          }
        };
      },
      {
        maxWait: 5000,
        timeout: 10000
      }
    );

    return res.status(scanResult.httpStatus).json({
      success: scanResult.status === 'valid',
      status: scanResult.status,
      message: scanResult.message,
      event: {
        id: event.id,
        title: event.title
      },
      ticket: scanResult.ticket || null
    });
  } catch (error) {
    console.error('Scan ticket error:', error);

    if (error?.name === 'JsonWebTokenError' || error?.name === 'TokenExpiredError') {
      return res.status(400).json({
        success: false,
        status: 'invalid',
        message: 'Invalid or expired QR token'
      });
    }

    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createStaff, getStaffMembers, getStaffDashboard, scanTicket };

// Update for: feat(controlroom): add delivery retry and error handling for notifications
// Update for: feat(controlroom): optimize Prisma indexes for organizer analytics and dashboard queries
// Update for: feat(engine): finalize check-in logs and Redis-backed moderation cache flow
// Update for: feat(engine): build user appeal submission UI and backend
// Update for: feat(controlroom): add organizer management UI and verification states
// Update for: feat(controlroom): build organizer control panel with dashboard UX
// Update for: feat(controlroom): add event list query params and filter persistence for organizer screens
// Update for: feat(engine): finalize check-in logs and Redis-backed moderation cache flow
// Update for: feat(engine): implement scheduled moderation tasks and cron-based maintenance jobs