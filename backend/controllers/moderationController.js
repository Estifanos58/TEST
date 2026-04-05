const { prisma } = require('../config/database');
const { generateId } = require('../utils/id');
const { sendTemplateEmail } = require('../services/mailService');

const SUPER_ADMIN_EMAIL = 'nexussphere0974@gmail.com';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const MAX_REASON_LENGTH = 255;

const cleanText = (value) => (typeof value === 'string' ? value.trim() : '');

const ensureDecisionAction = (action, allowedActions) => {
  const normalized = cleanText(action).toLowerCase();
  return allowedActions.includes(normalized) ? normalized : null;
};

const asNullable = (value) => {
  const normalized = cleanText(value);
  return normalized.length ? normalized : null;
};

const runNonBlocking = async (label, task) => {
  try {
    await task();
  } catch (error) {
    console.error(`${label} failed:`, error?.message || error);
  }
};

const isSuperAdmin = (user) => user?.email === SUPER_ADMIN_EMAIL;

const sendModerationEmail = async ({
  to,
  subject,
  heading,
  intro,
  details,
  ctaLabel,
  ctaUrl
}) => {
  if (!to) {
    return;
  }

  const result = await sendTemplateEmail({
    to,
    template: 'moderationNotice',
    payload: {
      subject,
      heading,
      intro,
      details,
      ctaLabel,
      ctaUrl
    }
  });

  if (!result.success) {
    console.error('Moderation email failed:', result.error);
  }
};

const createNotification = async ({ user_id, type, title, message, metadata }) => {
  if (!user_id) {
    return;
  }

  try {
    await prisma.notification.create({
      data: {
        id: generateId(),
        user_id,
        type,
        title,
        message,
        metadata: metadata || undefined
      }
    });
  } catch (error) {
    console.error('Create moderation notification failed:', error.message || error);
  }
};

const addReport = async (req, res) => {
  try {
    const { review_id, reason, details } = req.body;
    const reporterId = req.user.id;
    const normalizedReason = cleanText(reason);

    if (!review_id) {
      return res.status(400).json({ success: false, message: 'review_id is required' });
    }

    if (!normalizedReason) {
      return res.status(400).json({ success: false, message: 'reason is required' });
    }

    if (normalizedReason.length > MAX_REASON_LENGTH) {
      return res.status(400).json({ success: false, message: `reason must be ${MAX_REASON_LENGTH} characters or fewer` });
    }

    const review = await prisma.review.findUnique({
      where: { id: review_id },
      select: {
        id: true,
        user_id: true,
        event: {
          select: {
            id: true,
            title: true,
            organizer_id: true
          }
        }
      }
    });

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    if (review.user_id === reporterId) {
      return res.status(400).json({ success: false, message: 'You cannot report your own comment' });
    }

    if (!review.event?.organizer_id) {
      return res.status(400).json({ success: false, message: 'This review cannot be reported because organizer data is missing' });
    }

    const [reportedUser, organizer] = await Promise.all([
      prisma.user.findUnique({
        where: { id: review.user_id },
        select: {
          id: true,
          full_name: true,
          email: true
        }
      }),
      prisma.user.findUnique({
        where: { id: review.event.organizer_id },
        select: {
          id: true,
          full_name: true,
          email: true,
          organizer_profile: {
            select: {
              organization_name: true
            }
          }
        }
      })
    ]);

    if (!reportedUser) {
      return res.status(400).json({ success: false, message: 'This review cannot be reported because the reported user account is missing' });
    }

    if (!organizer) {
      return res.status(400).json({ success: false, message: 'This review cannot be reported because the organizer account is missing' });
    }

    const existingPending = await prisma.report.findFirst({
      where: {
        scope: 'organizer_user',
        status: 'pending',
        reporter_id: reporterId,
        subject_user_id: review.user_id,
        organizer_id: review.event.organizer_id,
        review_id: review.id
      },
      select: { id: true }
    });

    if (existingPending) {
      return res.status(409).json({
        success: false,
        message: 'You already submitted a pending report for this comment'
      });
    }

    const report = await prisma.report.create({
      data: {
        id: generateId(),
        scope: 'organizer_user',
        reporter_id: reporterId,
        subject_user_id: reportedUser.id,
        organizer_id: organizer.id,
        event_id: review.event.id,
        review_id: review.id,
        reason: normalizedReason,
        details: asNullable(details)
      }
    });

    const reporterName = req.user.full_name || 'A user';

    await createNotification({
      user_id: organizer.id,
      type: 'report_submitted',
      title: 'New user report submitted',
      message: `${reporterName} reported a user comment on ${review.event.title}.`,
      metadata: {
        action: 'open_report',
        report_id: report.id,
        scope: 'organizer_user'
      }
    });

    await createNotification({
      user_id: reporterId,
      type: 'report_submitted',
      title: 'Report submitted',
      message: `Your report about a user comment on ${review.event.title} has been sent to the organizer.`,
      metadata: {
        action: 'open_report',
        report_id: report.id,
        scope: 'organizer_user'
      }
    });

    await runNonBlocking('Send organizer moderation email', async () => {
      await sendModerationEmail({
        to: organizer.email,
        subject: 'New User Report Requires Review',
        heading: 'A new report needs your action',
        intro: `${reporterName} reported a user comment on ${review.event.title}.`,
        details: [
          `Reason: ${normalizedReason}`,
          `Reported user: ${reportedUser.full_name || 'Unknown user'}`,
          `Event: ${review.event.title}`
        ],
        ctaLabel: 'Open Organizer Dashboard',
        ctaUrl: `${FRONTEND_URL}/organizer/dashboard`
      });
    });

    await runNonBlocking('Send reporter moderation email', async () => {
      await sendModerationEmail({
        to: req.user.email,
        subject: 'Your Report Was Submitted',
        heading: 'Report submitted successfully',
        intro: 'Your report was sent to the organizer for review.',
        details: [
          `Event: ${review.event.title}`,
          `Reason: ${normalizedReason}`
        ],
        ctaLabel: 'View Event',
        ctaUrl: `${FRONTEND_URL}/event/${review.event.id}`
      });
    });

    return res.status(201).json({ success: true, report_id: report.id });
  } catch (error) {
    console.error('Add report error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const addEventReport = async (req, res) => {
  try {
    const { event_id, reason, details } = req.body;
    const reporterId = req.user.id;
    const normalizedReason = cleanText(reason);

    if (!event_id) {
      return res.status(400).json({ success: false, message: 'event_id is required' });
    }

    if (!normalizedReason) {
      return res.status(400).json({ success: false, message: 'reason is required' });
    }

    if (normalizedReason.length > MAX_REASON_LENGTH) {
      return res.status(400).json({ success: false, message: `reason must be ${MAX_REASON_LENGTH} characters or fewer` });
    }

    const event = await prisma.event.findUnique({
      where: { id: event_id },
      select: {
        id: true,
        title: true,
        organizer_id: true
      }
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (!event.organizer_id) {
      return res.status(400).json({ success: false, message: 'This event cannot be reported because organizer data is missing' });
    }

    if (event.organizer_id === reporterId) {
      return res.status(400).json({ success: false, message: 'You cannot report your own event' });
    }

    const organizer = await prisma.user.findUnique({
      where: { id: event.organizer_id },
      select: {
        id: true,
        full_name: true,
        email: true,
        organizer_profile: {
          select: {
            organization_name: true
          }
        }
      }
    });

    if (!organizer) {
      return res.status(400).json({ success: false, message: 'This event cannot be reported because organizer account is missing' });
    }

    const existingPending = await prisma.report.findFirst({
      where: {
        scope: 'platform_event',
        status: 'pending',
        reporter_id: reporterId,
        event_id
      },
      select: { id: true }
    });

    if (existingPending) {
      return res.status(409).json({
        success: false,
        message: 'You already submitted a pending report for this event'
      });
    }

    const report = await prisma.report.create({
      data: {
        id: generateId(),
        scope: 'platform_event',
        reporter_id: reporterId,
        subject_user_id: organizer.id,
        organizer_id: organizer.id,
        event_id: event.id,
        reason: normalizedReason,
        details: asNullable(details)
      }
    });

    const superAdmin = await prisma.user.findUnique({
      where: { email: SUPER_ADMIN_EMAIL },
      select: { id: true, email: true, full_name: true }
    });

    if (superAdmin) {
      await createNotification({
        user_id: superAdmin.id,
        type: 'report_submitted',
        title: 'New event report submitted',
        message: `${req.user.full_name || 'A user'} reported event ${event.title}.`,
        metadata: {
          action: 'open_report',
          report_id: report.id,
          scope: 'platform_event'
        }
      });

      await runNonBlocking('Send super admin moderation email', async () => {
        await sendModerationEmail({
          to: superAdmin.email,
          subject: 'New Event Report Requires Review',
          heading: 'A reported event needs review',
          intro: `${req.user.full_name || 'A user'} submitted a report for ${event.title}.`,
          details: [
            `Reason: ${normalizedReason}`,
            `Organizer: ${organizer.organizer_profile?.organization_name || organizer.full_name || 'Unknown organizer'}`
          ],
          ctaLabel: 'Open Admin Dashboard',
          ctaUrl: `${FRONTEND_URL}/admin/dashboard`
        });
      });
    }

    await createNotification({
      user_id: reporterId,
      type: 'report_submitted',
      title: 'Event report submitted',
      message: `Your report for ${event.title} has been sent to the super admin.`,
      metadata: {
        action: 'open_report',
        report_id: report.id,
        scope: 'platform_event'
      }
    });

    await runNonBlocking('Send reporter event-report email', async () => {
      await sendModerationEmail({
        to: req.user.email,
        subject: 'Your Event Report Was Submitted',
        heading: 'Event report submitted',
        intro: 'Your report was sent to super admin for moderation review.',
        details: [
          `Event: ${event.title}`,
          `Reason: ${normalizedReason}`
        ],
        ctaLabel: 'View Event',
        ctaUrl: `${FRONTEND_URL}/event/${event.id}`
      });
    });

    return res.status(201).json({ success: true, report_id: report.id });
  } catch (error) {
    console.error('Add event report error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const listOrganizerReports = async (req, res) => {
  try {
    const status = cleanText(req.query.status).toLowerCase();

    const where = {
      scope: 'organizer_user',
      organizer_id: req.user.id
    };

    if (status === 'pending' || status === 'resolved_ban' || status === 'resolved_rejected') {
      where.status = status;
    }

    const reports = await prisma.report.findMany({
      where,
      include: {
        reporter: {
          select: {
            id: true,
            full_name: true,
            email: true
          }
        },
        subject_user: {
          select: {
            id: true,
            full_name: true,
            email: true
          }
        },
        event: {
          select: {
            id: true,
            title: true
          }
        },
        review: {
          select: {
            id: true,
            review_text: true,
            rating: true,
            created_at: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return res.json({ success: true, reports });
  } catch (error) {
    console.error('List organizer reports error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getOrganizerReportById = async (req, res) => {
  try {
    const report = await prisma.report.findUnique({
      where: { id: req.params.id },
      include: {
        reporter: {
          select: {
            id: true,
            full_name: true,
            email: true
          }
        },
        subject_user: {
          select: {
            id: true,
            full_name: true,
            email: true
          }
        },
        event: {
          select: {
            id: true,
            title: true
          }
        },
        review: {
          select: {
            id: true,
            review_text: true,
            rating: true,
            created_at: true
          }
        }
      }
    });

    if (!report || report.scope !== 'organizer_user' || report.organizer_id !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    return res.json({ success: true, report });
  } catch (error) {
    console.error('Get organizer report by id error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const decideOrganizerReport = async (req, res) => {
  try {
    const action = ensureDecisionAction(req.body.action, ['ban', 'reject']);
    const note = asNullable(req.body.note);

    if (!action) {
      return res.status(400).json({ success: false, message: 'action must be ban or reject' });
    }

    const report = await prisma.report.findUnique({
      where: { id: req.params.id },
      include: {
        reporter: {
          select: {
            id: true,
            full_name: true,
            email: true
          }
        },
        subject_user: {
          select: {
            id: true,
            full_name: true,
            email: true
          }
        },
        event: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    if (!report || report.scope !== 'organizer_user' || report.organizer_id !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (report.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Report is already resolved' });
    }

    if (action === 'ban' && !report.subject_user_id) {
      return res.status(400).json({ success: false, message: 'This report cannot be resolved with a ban because the reported user is missing' });
    }

    let resolvedReport;
    let activeBan = null;

    if (action === 'ban') {
      activeBan = await prisma.ban.findFirst({
        where: {
          scope: 'organizer_user',
          status: 'active',
          subject_user_id: report.subject_user_id,
          organizer_id: req.user.id
        }
      });

      if (!activeBan) {
        activeBan = await prisma.ban.create({
          data: {
            id: generateId(),
            scope: 'organizer_user',
            subject_user_id: report.subject_user_id,
            organizer_id: req.user.id,
            created_by_id: req.user.id,
            reason: note || report.reason,
            details: report.details,
            report_id: report.id
          }
        });
      }

      resolvedReport = await prisma.report.update({
        where: { id: report.id },
        data: {
          status: 'resolved_ban',
          resolution_note: note,
          resolved_by_id: req.user.id,
          resolved_at: new Date()
        }
      });

      await createNotification({
        user_id: report.subject_user_id,
        type: 'ban',
        title: 'Booking access restricted',
        message: `You were banned from booking events by ${req.user.full_name}.`,
        metadata: {
          action: 'open_ban_appeal',
          ban_id: activeBan.id,
          scope: 'organizer_user',
          organizer_id: req.user.id,
          organizer_name: req.user.full_name,
          reason: activeBan.reason
        }
      });

      await createNotification({
        user_id: report.reporter_id,
        type: 'report_decision',
        title: 'Your report was resolved',
        message: `Action taken: the reported user was banned by ${req.user.full_name}.`,
        metadata: {
          action: 'open_report',
          report_id: report.id,
          decision: 'ban'
        }
      });

      await sendModerationEmail({
        to: report.subject_user?.email,
        subject: 'You Were Banned From Organizer Events',
        heading: 'Booking access restricted',
        intro: `The organizer ${req.user.full_name} restricted your ability to book their events.`,
        details: [
          `Reason: ${activeBan.reason}`,
          note ? `Decision note: ${note}` : null,
          'You can appeal this decision from your notification center.'
        ].filter(Boolean),
        ctaLabel: 'Open Notifications',
        ctaUrl: `${FRONTEND_URL}/discover`
      });

      await sendModerationEmail({
        to: report.reporter?.email,
        subject: 'Report Resolved: Action Taken',
        heading: 'Your report has been resolved',
        intro: 'The organizer reviewed your report and took action.',
        details: [
          `Event: ${report.event?.title || 'N/A'}`,
          'Decision: User banned'
        ],
        ctaLabel: 'View Event',
        ctaUrl: report.event?.id ? `${FRONTEND_URL}/event/${report.event.id}` : `${FRONTEND_URL}/discover`
      });

      return res.json({ success: true, report: resolvedReport, decision: 'ban', ban: activeBan });
    }

    resolvedReport = await prisma.report.update({
      where: { id: report.id },
      data: {
        status: 'resolved_rejected',
        resolution_note: note,
        resolved_by_id: req.user.id,
        resolved_at: new Date()
      }
    });

    await createNotification({
      user_id: report.reporter_id,
      type: 'report_decision',
      title: 'Your report was resolved',
      message: `The organizer reviewed your report and rejected it.`,
      metadata: {
        action: 'open_report',
        report_id: report.id,
        decision: 'reject'
      }
    });

    await createNotification({
      user_id: report.subject_user_id,
      type: 'report_decision',
      title: 'Report reviewed',
      message: 'A report against your comment was reviewed and rejected.',
      metadata: {
        action: 'open_report',
        report_id: report.id,
        decision: 'reject'
      }
    });

    await sendModerationEmail({
      to: report.reporter?.email,
      subject: 'Report Resolved: No Ban Applied',
      heading: 'Your report was reviewed',
      intro: 'The organizer reviewed your report and did not apply a ban.',
      details: [
        `Event: ${report.event?.title || 'N/A'}`,
        note ? `Decision note: ${note}` : null
      ].filter(Boolean),
      ctaLabel: 'View Event',
      ctaUrl: report.event?.id ? `${FRONTEND_URL}/event/${report.event.id}` : `${FRONTEND_URL}/discover`
    });

    await sendModerationEmail({
      to: report.subject_user?.email,
      subject: 'Report Reviewed: No Ban Applied',
      heading: 'A report was reviewed',
      intro: 'A report against your comment was reviewed and rejected.',
      details: [
        note ? `Decision note: ${note}` : null
      ].filter(Boolean),
      ctaLabel: 'Browse Events',
      ctaUrl: `${FRONTEND_URL}/discover`
    });

    return res.json({ success: true, report: resolvedReport, decision: 'reject' });
  } catch (error) {
    console.error('Decide organizer report error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const listAdminReports = async (req, res) => {
  try {
    if (!isSuperAdmin(req.user)) {
      return res.status(403).json({ success: false, message: 'Only super admin can access reports' });
    }

    const status = cleanText(req.query.status).toLowerCase();

    const where = {
      scope: 'platform_event'
    };

    if (status === 'pending' || status === 'resolved_ban' || status === 'resolved_rejected') {
      where.status = status;
    }

    const reports = await prisma.report.findMany({
      where,
      include: {
        reporter: {
          select: {
            id: true,
            full_name: true,
            email: true
          }
        },
        subject_user: {
          select: {
            id: true,
            full_name: true,
            email: true,
            organizer_profile: {
              select: {
                organization_name: true
              }
            }
          }
        },
        event: {
          select: {
            id: true,
            title: true,
            status: true,
            city: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return res.json({ success: true, reports });
  } catch (error) {
    console.error('List admin reports error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getAdminReportById = async (req, res) => {
  try {
    if (!isSuperAdmin(req.user)) {
      return res.status(403).json({ success: false, message: 'Only super admin can access reports' });
    }

    const report = await prisma.report.findUnique({
      where: { id: req.params.id },
      include: {
        reporter: {
          select: {
            id: true,
            full_name: true,
            email: true
          }
        },
        subject_user: {
          select: {
            id: true,
            full_name: true,
            email: true,
            organizer_profile: {
              select: {
                organization_name: true
              }
            }
          }
        },
        event: {
          select: {
            id: true,
            title: true,
            status: true,
            city: true,
            start_datetime: true
          }
        }
      }
    });

    if (!report || report.scope !== 'platform_event') {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    return res.json({ success: true, report });
  } catch (error) {
    console.error('Get admin report by id error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const decideAdminReport = async (req, res) => {
  try {
    if (!isSuperAdmin(req.user)) {
      return res.status(403).json({ success: false, message: 'Only super admin can decide reports' });
    }

    const action = ensureDecisionAction(req.body.action, ['ban', 'reject']);
    const note = asNullable(req.body.note);

    if (!action) {
      return res.status(400).json({ success: false, message: 'action must be ban or reject' });
    }

    const report = await prisma.report.findUnique({
      where: { id: req.params.id },
      include: {
        reporter: {
          select: {
            id: true,
            full_name: true,
            email: true
          }
        },
        subject_user: {
          select: {
            id: true,
            full_name: true,
            email: true,
            organizer_profile: {
              select: {
                organization_name: true
              }
            }
          }
        },
        event: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    if (!report || report.scope !== 'platform_event') {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (report.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Report is already resolved' });
    }

    if (action === 'ban' && !report.subject_user_id) {
      return res.status(400).json({ success: false, message: 'This report cannot be resolved with a ban because the organizer account is missing' });
    }

    if (action === 'ban') {
      let activeBan = await prisma.ban.findFirst({
        where: {
          scope: 'platform_organizer',
          status: 'active',
          subject_user_id: report.subject_user_id
        }
      });

      if (!activeBan) {
        activeBan = await prisma.ban.create({
          data: {
            id: generateId(),
            scope: 'platform_organizer',
            subject_user_id: report.subject_user_id,
            organizer_id: report.subject_user_id,
            created_by_id: req.user.id,
            reason: note || report.reason,
            details: report.details,
            report_id: report.id
          }
        });
      }

      await prisma.$transaction(async (tx) => {
        await tx.report.update({
          where: { id: report.id },
          data: {
            status: 'resolved_ban',
            resolution_note: note,
            resolved_by_id: req.user.id,
            resolved_at: new Date()
          }
        });

        await tx.event.updateMany({
          where: {
            organizer_id: report.subject_user_id,
            status: 'published'
          },
          data: {
            status: 'cancelled'
          }
        });
      });

      const organizerDisplayName = report.subject_user?.organizer_profile?.organization_name
        || report.subject_user?.full_name
        || 'Organizer';

      await createNotification({
        user_id: report.subject_user_id,
        type: 'ban',
        title: 'Organization banned by super admin',
        message: `Your organization was banned by super admin. Existing published events were unpublished.`,
        metadata: {
          action: 'open_ban_appeal',
          ban_id: activeBan.id,
          scope: 'platform_organizer',
          organizer_id: report.subject_user_id,
          organizer_name: organizerDisplayName,
          reason: activeBan.reason
        }
      });

      await createNotification({
        user_id: report.reporter_id,
        type: 'report_decision',
        title: 'Your event report was resolved',
        message: 'Action taken: the organizer was banned by super admin.',
        metadata: {
          action: 'open_report',
          report_id: report.id,
          decision: 'ban'
        }
      });

      await sendModerationEmail({
        to: report.subject_user?.email,
        subject: 'Organization Ban Applied',
        heading: 'Your organization was banned',
        intro: 'Super admin reviewed a report and applied a platform ban to your organizer account.',
        details: [
          `Reason: ${activeBan.reason}`,
          note ? `Decision note: ${note}` : null,
          'Existing published events were unpublished.',
          'You can submit an appeal from your notifications.'
        ].filter(Boolean),
        ctaLabel: 'Open Organizer Dashboard',
        ctaUrl: `${FRONTEND_URL}/organizer/dashboard`
      });

      await sendModerationEmail({
        to: report.reporter?.email,
        subject: 'Report Resolved: Action Taken',
        heading: 'Your report has been resolved',
        intro: 'Super admin reviewed your event report and took action.',
        details: [
          `Event: ${report.event?.title || 'N/A'}`,
          'Decision: Organizer banned'
        ],
        ctaLabel: 'Browse Events',
        ctaUrl: `${FRONTEND_URL}/discover`
      });

      return res.json({ success: true, decision: 'ban', ban: activeBan });
    }

    const resolvedReport = await prisma.report.update({
      where: { id: report.id },
      data: {
        status: 'resolved_rejected',
        resolution_note: note,
        resolved_by_id: req.user.id,
        resolved_at: new Date()
      }
    });

    await createNotification({
      user_id: report.reporter_id,
      type: 'report_decision',
      title: 'Your event report was resolved',
      message: 'Super admin reviewed your report and rejected it.',
      metadata: {
        action: 'open_report',
        report_id: report.id,
        decision: 'reject'
      }
    });

    await createNotification({
      user_id: report.subject_user_id,
      type: 'report_decision',
      title: 'Event report reviewed',
      message: 'A report against your event was reviewed and rejected.',
      metadata: {
        action: 'open_report',
        report_id: report.id,
        decision: 'reject'
      }
    });

    await sendModerationEmail({
      to: report.reporter?.email,
      subject: 'Report Resolved: No Ban Applied',
      heading: 'Your report was reviewed',
      intro: 'Super admin reviewed your event report and did not apply a ban.',
      details: [
        `Event: ${report.event?.title || 'N/A'}`,
        note ? `Decision note: ${note}` : null
      ].filter(Boolean),
      ctaLabel: 'Browse Events',
      ctaUrl: `${FRONTEND_URL}/discover`
    });

    await sendModerationEmail({
      to: report.subject_user?.email,
      subject: 'Report Reviewed: No Ban Applied',
      heading: 'A report was reviewed',
      intro: 'A report against your event was reviewed and rejected.',
      details: [
        note ? `Decision note: ${note}` : null
      ].filter(Boolean),
      ctaLabel: 'Open Organizer Dashboard',
      ctaUrl: `${FRONTEND_URL}/organizer/dashboard`
    });

    return res.json({ success: true, decision: 'reject', report: resolvedReport });
  } catch (error) {
    console.error('Decide admin report error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const submitAppeal = async (req, res) => {
  try {
    const { ban_id, message } = req.body;
    const normalizedMessage = cleanText(message);

    if (!ban_id) {
      return res.status(400).json({ success: false, message: 'ban_id is required' });
    }

    if (!normalizedMessage) {
      return res.status(400).json({ success: false, message: 'Appeal message is required' });
    }

    const ban = await prisma.ban.findUnique({
      where: { id: ban_id },
      include: {
        organizer: {
          select: {
            id: true,
            full_name: true,
            email: true,
            organizer_profile: {
              select: {
                organization_name: true
              }
            }
          }
        },
        subject_user: {
          select: {
            id: true,
            full_name: true,
            email: true
          }
        }
      }
    });

    if (!ban || ban.status !== 'active') {
      return res.status(404).json({ success: false, message: 'Active ban not found' });
    }

    if (ban.subject_user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only appeal your own ban' });
    }

    const pendingAppeal = await prisma.appeal.findFirst({
      where: {
        ban_id,
        status: 'pending'
      },
      select: { id: true }
    });

    if (pendingAppeal) {
      return res.status(409).json({ success: false, message: 'You already have a pending appeal for this ban' });
    }

    const appeal = await prisma.appeal.create({
      data: {
        id: generateId(),
        ban_id,
        appellant_user_id: req.user.id,
        message: normalizedMessage
      }
    });

    let reviewer = null;
    if (ban.scope === 'organizer_user') {
      reviewer = ban.organizer;
    } else {
      reviewer = await prisma.user.findUnique({
        where: { email: SUPER_ADMIN_EMAIL },
        select: { id: true, full_name: true, email: true }
      });
    }

    await createNotification({
      user_id: req.user.id,
      type: 'appeal_submitted',
      title: 'Appeal submitted',
      message: 'Your appeal has been submitted and is pending review.',
      metadata: {
        action: 'open_appeal',
        appeal_id: appeal.id,
        ban_id: ban.id
      }
    });

    if (reviewer?.id) {
      await createNotification({
        user_id: reviewer.id,
        type: 'appeal_submitted',
        title: 'New appeal submitted',
        message: `${req.user.full_name || 'A user'} submitted an appeal for moderation review.`,
        metadata: {
          action: 'open_appeal',
          appeal_id: appeal.id,
          ban_id: ban.id,
          scope: ban.scope
        }
      });
    }

    await sendModerationEmail({
      to: req.user.email,
      subject: 'Appeal Submitted Successfully',
      heading: 'Your appeal was submitted',
      intro: 'Your appeal is pending moderation review.',
      details: [
        `Appeal message: ${normalizedMessage}`,
        `Scope: ${ban.scope}`
      ],
      ctaLabel: 'Open Notifications',
      ctaUrl: `${FRONTEND_URL}/discover`
    });

    await sendModerationEmail({
      to: reviewer?.email,
      subject: 'New Moderation Appeal',
      heading: 'A new appeal needs review',
      intro: `${req.user.full_name || 'A user'} submitted a moderation appeal.`,
      details: [
        `Scope: ${ban.scope}`,
        `Appeal message: ${normalizedMessage}`
      ],
      ctaLabel: ban.scope === 'organizer_user' ? 'Open Organizer Dashboard' : 'Open Admin Dashboard',
      ctaUrl: ban.scope === 'organizer_user' ? `${FRONTEND_URL}/organizer/dashboard` : `${FRONTEND_URL}/admin/dashboard`
    });

    return res.status(201).json({ success: true, appeal_id: appeal.id });
  } catch (error) {
    console.error('Submit appeal error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const listOrganizerAppeals = async (req, res) => {
  try {
    const status = cleanText(req.query.status).toLowerCase();

    const where = {
      ban: {
        scope: 'organizer_user',
        organizer_id: req.user.id
      }
    };

    if (status === 'pending' || status === 'approved' || status === 'rejected') {
      where.status = status;
    }

    const appeals = await prisma.appeal.findMany({
      where,
      include: {
        appellant: {
          select: {
            id: true,
            full_name: true,
            email: true
          }
        },
        ban: {
          select: {
            id: true,
            reason: true,
            created_at: true,
            status: true,
            subject_user_id: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return res.json({ success: true, appeals });
  } catch (error) {
    console.error('List organizer appeals error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getOrganizerAppealById = async (req, res) => {
  try {
    const appeal = await prisma.appeal.findUnique({
      where: { id: req.params.id },
      include: {
        appellant: {
          select: {
            id: true,
            full_name: true,
            email: true
          }
        },
        ban: {
          include: {
            organizer: {
              select: {
                id: true
              }
            }
          }
        }
      }
    });

    if (!appeal || appeal.ban.scope !== 'organizer_user' || appeal.ban.organizer_id !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Appeal not found' });
    }

    return res.json({ success: true, appeal });
  } catch (error) {
    console.error('Get organizer appeal by id error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const decideOrganizerAppeal = async (req, res) => {
  try {
    const action = ensureDecisionAction(req.body.action, ['approve', 'reject']);
    const note = asNullable(req.body.note);

    if (!action) {
      return res.status(400).json({ success: false, message: 'action must be approve or reject' });
    }

    const appeal = await prisma.appeal.findUnique({
      where: { id: req.params.id },
      include: {
        appellant: {
          select: {
            id: true,
            full_name: true,
            email: true
          }
        },
        ban: {
          select: {
            id: true,
            scope: true,
            status: true,
            organizer_id: true
          }
        }
      }
    });

    if (!appeal || appeal.ban.scope !== 'organizer_user' || appeal.ban.organizer_id !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Appeal not found' });
    }

    if (appeal.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Appeal is already resolved' });
    }

    if (appeal.ban.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Appeal cannot be decided because the ban is no longer active' });
    }

    if (action === 'approve') {
      await prisma.$transaction(async (tx) => {
        await tx.appeal.update({
          where: { id: appeal.id },
          data: {
            status: 'approved',
            decision_note: note,
            decided_by_id: req.user.id,
            decided_at: new Date()
          }
        });

        await tx.ban.update({
          where: { id: appeal.ban.id },
          data: {
            status: 'lifted',
            lifted_by_id: req.user.id,
            lifted_at: new Date()
          }
        });
      });

      await createNotification({
        user_id: appeal.appellant.id,
        type: 'appeal_decision',
        title: 'Appeal approved',
        message: 'Your appeal was approved and the ban has been lifted.',
        metadata: {
          action: 'open_appeal',
          appeal_id: appeal.id,
          decision: 'approved'
        }
      });

      await sendModerationEmail({
        to: appeal.appellant.email,
        subject: 'Appeal Approved',
        heading: 'Your appeal was approved',
        intro: 'Your organizer ban appeal was approved and your restriction has been removed.',
        details: [
          note ? `Decision note: ${note}` : null
        ].filter(Boolean),
        ctaLabel: 'Browse Events',
        ctaUrl: `${FRONTEND_URL}/discover`
      });

      return res.json({ success: true, decision: 'approved' });
    }

    await prisma.appeal.update({
      where: { id: appeal.id },
      data: {
        status: 'rejected',
        decision_note: note,
        decided_by_id: req.user.id,
        decided_at: new Date()
      }
    });

    await createNotification({
      user_id: appeal.appellant.id,
      type: 'appeal_decision',
      title: 'Appeal rejected',
      message: 'Your appeal was rejected and the ban remains active.',
      metadata: {
        action: 'open_appeal',
        appeal_id: appeal.id,
        decision: 'rejected'
      }
    });

    await sendModerationEmail({
      to: appeal.appellant.email,
      subject: 'Appeal Rejected',
      heading: 'Your appeal was rejected',
      intro: 'Your organizer ban appeal was reviewed and rejected.',
      details: [
        note ? `Decision note: ${note}` : null
      ].filter(Boolean),
      ctaLabel: 'Open Notifications',
      ctaUrl: `${FRONTEND_URL}/discover`
    });

    return res.json({ success: true, decision: 'rejected' });
  } catch (error) {
    console.error('Decide organizer appeal error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const listAdminAppeals = async (req, res) => {
  try {
    if (!isSuperAdmin(req.user)) {
      return res.status(403).json({ success: false, message: 'Only super admin can access appeals' });
    }

    const status = cleanText(req.query.status).toLowerCase();

    const where = {
      ban: {
        scope: 'platform_organizer'
      }
    };

    if (status === 'pending' || status === 'approved' || status === 'rejected') {
      where.status = status;
    }

    const appeals = await prisma.appeal.findMany({
      where,
      include: {
        appellant: {
          select: {
            id: true,
            full_name: true,
            email: true,
            organizer_profile: {
              select: {
                organization_name: true
              }
            }
          }
        },
        ban: {
          select: {
            id: true,
            reason: true,
            status: true,
            created_at: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return res.json({ success: true, appeals });
  } catch (error) {
    console.error('List admin appeals error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getAdminAppealById = async (req, res) => {
  try {
    if (!isSuperAdmin(req.user)) {
      return res.status(403).json({ success: false, message: 'Only super admin can access appeals' });
    }

    const appeal = await prisma.appeal.findUnique({
      where: { id: req.params.id },
      include: {
        appellant: {
          select: {
            id: true,
            full_name: true,
            email: true,
            organizer_profile: {
              select: {
                organization_name: true
              }
            }
          }
        },
        ban: true
      }
    });

    if (!appeal || appeal.ban.scope !== 'platform_organizer') {
      return res.status(404).json({ success: false, message: 'Appeal not found' });
    }

    return res.json({ success: true, appeal });
  } catch (error) {
    console.error('Get admin appeal by id error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const decideAdminAppeal = async (req, res) => {
  try {
    if (!isSuperAdmin(req.user)) {
      return res.status(403).json({ success: false, message: 'Only super admin can decide appeals' });
    }

    const action = ensureDecisionAction(req.body.action, ['approve', 'reject']);
    const note = asNullable(req.body.note);

    if (!action) {
      return res.status(400).json({ success: false, message: 'action must be approve or reject' });
    }

    const appeal = await prisma.appeal.findUnique({
      where: { id: req.params.id },
      include: {
        appellant: {
          select: {
            id: true,
            full_name: true,
            email: true
          }
        },
        ban: {
          select: {
            id: true,
            scope: true,
            status: true,
            subject_user_id: true
          }
        }
      }
    });

    if (!appeal || appeal.ban.scope !== 'platform_organizer') {
      return res.status(404).json({ success: false, message: 'Appeal not found' });
    }

    if (appeal.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Appeal is already resolved' });
    }

    if (appeal.ban.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Appeal cannot be decided because the ban is no longer active' });
    }

    if (action === 'approve') {
      await prisma.$transaction(async (tx) => {
        await tx.appeal.update({
          where: { id: appeal.id },
          data: {
            status: 'approved',
            decision_note: note,
            decided_by_id: req.user.id,
            decided_at: new Date()
          }
        });

        await tx.ban.update({
          where: { id: appeal.ban.id },
          data: {
            status: 'lifted',
            lifted_by_id: req.user.id,
            lifted_at: new Date()
          }
        });
      });

      await createNotification({
        user_id: appeal.appellant.id,
        type: 'appeal_decision',
        title: 'Appeal approved',
        message: 'Your appeal was approved and the organization ban has been lifted.',
        metadata: {
          action: 'open_appeal',
          appeal_id: appeal.id,
          decision: 'approved'
        }
      });

      await sendModerationEmail({
        to: appeal.appellant.email,
        subject: 'Appeal Approved',
        heading: 'Your appeal was approved',
        intro: 'Super admin approved your appeal and removed the platform ban.',
        details: [
          note ? `Decision note: ${note}` : null
        ].filter(Boolean),
        ctaLabel: 'Open Organizer Dashboard',
        ctaUrl: `${FRONTEND_URL}/organizer/dashboard`
      });

      return res.json({ success: true, decision: 'approved' });
    }

    await prisma.appeal.update({
      where: { id: appeal.id },
      data: {
        status: 'rejected',
        decision_note: note,
        decided_by_id: req.user.id,
        decided_at: new Date()
      }
    });

    await createNotification({
      user_id: appeal.appellant.id,
      type: 'appeal_decision',
      title: 'Appeal rejected',
      message: 'Your appeal was rejected and the organization ban remains active.',
      metadata: {
        action: 'open_appeal',
        appeal_id: appeal.id,
        decision: 'rejected'
      }
    });

    await sendModerationEmail({
      to: appeal.appellant.email,
      subject: 'Appeal Rejected',
      heading: 'Your appeal was rejected',
      intro: 'Super admin reviewed your appeal and rejected it.',
      details: [
        note ? `Decision note: ${note}` : null
      ].filter(Boolean),
      ctaLabel: 'Open Notifications',
      ctaUrl: `${FRONTEND_URL}/organizer/dashboard`
    });

    return res.json({ success: true, decision: 'rejected' });
  } catch (error) {
    console.error('Decide admin appeal error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getMyBans = async (req, res) => {
  try {
    const bans = await prisma.ban.findMany({
      where: {
        subject_user_id: req.user.id,
        status: 'active'
      },
      include: {
        organizer: {
          select: {
            id: true,
            full_name: true,
            organizer_profile: {
              select: {
                organization_name: true
              }
            }
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return res.json({ success: true, bans });
  } catch (error) {
    console.error('Get my bans error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getBanById = async (req, res) => {
  try {
    const ban = await prisma.ban.findUnique({
      where: { id: req.params.banId },
      include: {
        organizer: {
          select: {
            id: true,
            full_name: true,
            organizer_profile: {
              select: {
                organization_name: true
              }
            }
          }
        },
        subject_user: {
          select: {
            id: true,
            full_name: true,
            email: true
          }
        }
      }
    });

    if (!ban) {
      return res.status(404).json({ success: false, message: 'Ban not found' });
    }

    const canAccess = ban.subject_user_id === req.user.id
      || ban.organizer_id === req.user.id
      || ban.created_by_id === req.user.id
      || req.user.role_id === 1;

    if (!canAccess) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this ban' });
    }

    return res.json({ success: true, ban });
  } catch (error) {
    console.error('Get ban by id error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  addReport,
  addEventReport,
  listOrganizerReports,
  getOrganizerReportById,
  decideOrganizerReport,
  listAdminReports,
  getAdminReportById,
  decideAdminReport,
  submitAppeal,
  listOrganizerAppeals,
  getOrganizerAppealById,
  decideOrganizerAppeal,
  listAdminAppeals,
  getAdminAppealById,
  decideAdminAppeal,
  getMyBans,
  getBanById
};
// Update for: feat(engine): add rating and comment UI with star selector
// Update for: feat(engine): add scan feedback and check-in interaction screens
// Update for: feat(engine): implement user report submission UI and backend
// Update for: feat(engine): implement QR code scanning UI with camera overlay
// Update for: feat(engine): add report moderation and dashboard real-time data bridge
// Update for: feat(engine): lead engine group architecture and code quality