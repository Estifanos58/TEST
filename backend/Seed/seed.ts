import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

import { roles } from './data/roles';
import { users, demoAccounts } from './data/users';
import { organizerProfiles } from './data/organizers';
import { categories } from './data/categories';
import { events } from './data/events';
import { ticketTypes } from './data/tickets';
import { orders } from './data/orders';
import { reviewReplies, reviews } from './data/reviews';
import { staffMembers } from './data/staff';
import { platformFeePayments, payouts } from './data/payments';
import { checkInPlans } from './data/checkins';
import { notifications } from './data/notifications';
import {
  digitalTicketCodeFor,
  digitalTicketIdFor,
  roleNameToIdFallback,
  ticketIdFor,
  type SeedRoleName
} from './utils/ids';
import { addMinutes, clampToEventWindow } from './utils/helpers';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required to run seed script');
}

const runtimeDatabaseUrl = process.env.DATABASE_URL.startsWith('postgres://')
  ? process.env.DATABASE_URL.replace(/^postgres:\/\//, 'postgresql://')
  : process.env.DATABASE_URL;

const pool = new Pool({ connectionString: runtimeDatabaseUrl });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
});

type RoleMap = Record<SeedRoleName, number>;

const eventWindow = events.reduce<Record<string, { start: Date; end: Date }>>((acc, event) => {
  acc[event.id] = { start: event.start_datetime, end: event.end_datetime };
  return acc;
}, {});

const seedRoles = async (): Promise<RoleMap> => {
  await prisma.role.createMany({
    data: roles.map((role_name) => ({ role_name })),
    skipDuplicates: true
  });

  const dbRoles = await prisma.role.findMany({
    where: { role_name: { in: roles } },
    select: { id: true, role_name: true }
  });

  const roleMap = dbRoles.reduce<Record<string, number>>((acc, role) => {
    acc[role.role_name] = role.id;
    return acc;
  }, {});

  return {
    admin: roleMap.admin ?? roleNameToIdFallback.admin,
    organizer: roleMap.organizer ?? roleNameToIdFallback.organizer,
    attendee: roleMap.attendee ?? roleNameToIdFallback.attendee,
    staff: roleMap.staff ?? roleNameToIdFallback.staff,
    security: roleMap.security ?? roleNameToIdFallback.security
  };
};

const seedUsers = async (roleMap: RoleMap): Promise<void> => {
  const hashCache = new Map<string, string>();

  for (const user of users) {
    let password_hash = hashCache.get(user.plainPassword);
    if (!password_hash) {
      password_hash = await bcrypt.hash(user.plainPassword, 10);
      hashCache.set(user.plainPassword, password_hash);
    }

    const role_id = user.email === 'nexussphere0974@gmail.com' ? 1 : roleMap[user.role];

    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        role_id,
        full_name: user.full_name,
        password_hash,
        phone: user.phone,
        user_name: user.user_name,
        status: user.status,
        email_verified: user.email_verified,
        last_login_at: user.last_login_at
      },
      create: {
        id: user.id,
        role_id,
        full_name: user.full_name,
        email: user.email,
        password_hash,
        phone: user.phone,
        user_name: user.user_name,
        status: user.status,
        email_verified: user.email_verified,
        last_login_at: user.last_login_at
      }
    });
  }
};

const seedOrganizerProfiles = async (): Promise<void> => {
  for (const profile of organizerProfiles) {
    await prisma.organizerProfile.upsert({
      where: { user_id: profile.user_id },
      update: {
        organization_name: profile.organization_name,
        organization_type: profile.organization_type,
        website_url: profile.website_url,
        bio: profile.bio,
        tax_id_number: profile.tax_id_number,
        business_registration_number: profile.business_registration_number,
        social_linkedin: profile.social_linkedin,
        social_instagram: profile.social_instagram,
        social_x: profile.social_x,
        work_email: profile.work_email,
        verification_status: profile.verification_status,
        approved_by_admin_id: profile.approved_by_admin_id,
        approved_at: profile.approved_at
      },
      create: {
        user_id: profile.user_id,
        organization_name: profile.organization_name,
        organization_type: profile.organization_type,
        website_url: profile.website_url,
        bio: profile.bio,
        tax_id_number: profile.tax_id_number,
        business_registration_number: profile.business_registration_number,
        social_linkedin: profile.social_linkedin,
        social_instagram: profile.social_instagram,
        social_x: profile.social_x,
        work_email: profile.work_email,
        verification_status: profile.verification_status,
        approved_by_admin_id: profile.approved_by_admin_id,
        approved_at: profile.approved_at,
        created_at: profile.created_at
      }
    });
  }
};

const seedCategories = async (): Promise<void> => {
  await prisma.eventCategory.createMany({
    data: categories,
    skipDuplicates: true
  });
};

const seedEvents = async (): Promise<void> => {
  for (const event of events) {
    await prisma.event.upsert({
      where: { id: event.id },
      update: {
        organizer_id: event.organizer_id,
        title: event.title,
        category_id: event.category_id,
        event_type: event.event_type,
        description: event.description,
        banner_url: event.banner_url,
        status: event.status,
        visibility: event.visibility,
        is_featured: event.is_featured,
        start_datetime: event.start_datetime,
        end_datetime: event.end_datetime,
        city: event.city,
        venue_name: event.venue_name,
        address_line1: event.address_line1
      },
      create: {
        id: event.id,
        organizer_id: event.organizer_id,
        title: event.title,
        category_id: event.category_id,
        event_type: event.event_type,
        description: event.description,
        banner_url: event.banner_url,
        status: event.status,
        visibility: event.visibility,
        is_featured: event.is_featured,
        start_datetime: event.start_datetime,
        end_datetime: event.end_datetime,
        city: event.city,
        venue_name: event.venue_name,
        address_line1: event.address_line1,
        created_at: event.created_at
      }
    });
  }
};

const seedTicketTypes = async (): Promise<void> => {
  for (const ticketType of ticketTypes) {
    await prisma.ticketType.upsert({
      where: { id: ticketType.id },
      update: {
        tier_name: ticketType.tier_name,
        price: ticketType.price,
        currency: ticketType.currency,
        capacity: ticketType.capacity,
        remaining_quantity: ticketType.remaining_quantity,
        benefits: ticketType.benefits,
        is_active: ticketType.is_active
      },
      create: {
        id: ticketType.id,
        event_id: ticketType.event_id,
        tier_name: ticketType.tier_name,
        price: ticketType.price,
        currency: ticketType.currency,
        capacity: ticketType.capacity,
        remaining_quantity: ticketType.remaining_quantity,
        benefits: ticketType.benefits,
        is_active: ticketType.is_active
      }
    });
  }
};

const seedOrders = async (): Promise<void> => {
  for (const order of orders) {
    await prisma.order.upsert({
      where: { order_number: order.order_number },
      update: {
        user_id: order.user_id,
        subtotal: order.subtotal,
        service_fee: order.service_fee,
        total_amount: order.total_amount,
        status: order.status,
        payment_method: order.payment_method,
        tx_ref: order.tx_ref,
        paid_at: order.paid_at,
        created_at: order.created_at
      },
      create: {
        id: order.id,
        user_id: order.user_id,
        order_number: order.order_number,
        subtotal: order.subtotal,
        service_fee: order.service_fee,
        total_amount: order.total_amount,
        status: order.status,
        payment_method: order.payment_method,
        tx_ref: order.tx_ref,
        paid_at: order.paid_at,
        created_at: order.created_at
      }
    });
  }
};

const seedDigitalTickets = async (): Promise<Map<string, { id: string; event_id: string }>> => {
  const codeMap = new Map<string, { id: string; event_id: string }>();

  for (const order of orders.filter((entry) => entry.status === 'paid')) {
    for (let i = 1; i <= order.quantity; i += 1) {
      const ticket_code = digitalTicketCodeFor(order.order_number, i);
      const shouldBeUsed = i <= order.used_ticket_count;

      const window = eventWindow[order.event_id];
      const used_at = shouldBeUsed
        ? clampToEventWindow(window.start, window.end, 30 + i * 15)
        : null;

      const payload = {
        id: digitalTicketIdFor(order.id, i),
        order_id: order.id,
        event_id: order.event_id,
        ticket_type_id: ticketIdFor(order.event_id, order.ticket_tier_key),
        ticket_code,
        is_used: shouldBeUsed,
        used_at,
        created_at: addMinutes(order.created_at, i * 2)
      };

      await prisma.digitalTicket.upsert({
        where: { ticket_code },
        update: {
          event_id: payload.event_id,
          ticket_type_id: payload.ticket_type_id,
          is_used: payload.is_used,
          used_at: payload.used_at
        },
        create: payload
      });

      codeMap.set(ticket_code, { id: payload.id, event_id: payload.event_id });
    }
  }

  return codeMap;
};

const seedStaffMembers = async (): Promise<void> => {
  for (const staffMember of staffMembers) {
    await prisma.staffMember.upsert({
      where: { id: staffMember.id },
      update: {
        organizer_id: staffMember.organizer_id,
        event_id: staffMember.event_id,
        user_id: staffMember.user_id,
        full_name: staffMember.full_name,
        email: staffMember.email,
        phone_number: staffMember.phone_number,
        assigned_role: staffMember.assigned_role,
        staff_badge_id: staffMember.staff_badge_id,
        status: staffMember.status
      },
      create: {
        id: staffMember.id,
        organizer_id: staffMember.organizer_id,
        event_id: staffMember.event_id,
        user_id: staffMember.user_id,
        full_name: staffMember.full_name,
        email: staffMember.email,
        phone_number: staffMember.phone_number,
        assigned_role: staffMember.assigned_role,
        staff_badge_id: staffMember.staff_badge_id,
        status: staffMember.status,
        created_at: staffMember.created_at
      }
    });
  }
};

const seedCheckInLogs = async (ticketCodeMap: Map<string, { id: string; event_id: string }>): Promise<void> => {
  for (const plan of checkInPlans) {
    const ticket = ticketCodeMap.get(plan.ticket_code);

    if (!ticket) {
      throw new Error(`Missing ticket for check-in plan ${plan.id}: ${plan.ticket_code}`);
    }

    const window = eventWindow[plan.event_id];
    const check_in_time = clampToEventWindow(window.start, window.end, plan.offset_minutes);

    await prisma.checkInLog.upsert({
      where: { id: plan.id },
      update: {
        ticket_id: ticket.id,
        staff_id: plan.staff_id,
        event_id: plan.event_id,
        status: plan.status,
        check_in_time
      },
      create: {
        id: plan.id,
        ticket_id: ticket.id,
        staff_id: plan.staff_id,
        event_id: plan.event_id,
        status: plan.status,
        check_in_time
      }
    });
  }
};

const seedReviews = async (): Promise<Map<string, string>> => {
  const persistedReviewIdMap = new Map<string, string>();

  for (const review of reviews) {
    const persisted = await prisma.review.upsert({
      where: {
        user_id_event_id: {
          user_id: review.user_id,
          event_id: review.event_id
        }
      },
      update: {
        rating: review.rating,
        review_text: review.review_text,
        status: review.status,
        created_at: review.created_at
      },
      create: {
        id: review.id,
        user_id: review.user_id,
        event_id: review.event_id,
        rating: review.rating,
        review_text: review.review_text,
        status: review.status,
        created_at: review.created_at
      }
    });

    persistedReviewIdMap.set(review.id, persisted.id);
  }

  return persistedReviewIdMap;
};

const seedReviewReplies = async (reviewIdMap: Map<string, string>): Promise<void> => {
  for (const reply of reviewReplies) {
    const persistedReviewId = reviewIdMap.get(reply.review_id);

    if (!persistedReviewId) {
      throw new Error(`Missing review for reply ${reply.id}: ${reply.review_id}`);
    }

    await prisma.reviewReply.upsert({
      where: { id: reply.id },
      update: {
        review_id: persistedReviewId,
        organizer_id: reply.organizer_id,
        reply_text: reply.reply_text,
        created_at: reply.created_at
      },
      create: {
        id: reply.id,
        review_id: persistedReviewId,
        organizer_id: reply.organizer_id,
        reply_text: reply.reply_text,
        created_at: reply.created_at
      }
    });
  }
};

const seedPlatformFeePayments = async (): Promise<void> => {
  for (const payment of platformFeePayments) {
    await prisma.platformFeePayment.upsert({
      where: { tx_ref: payment.tx_ref },
      update: {
        user_id: payment.user_id,
        amount: payment.amount,
        payment_method: payment.payment_method,
        status: payment.status,
        completed_at: payment.completed_at,
        created_at: payment.created_at
      },
      create: {
        id: payment.id,
        user_id: payment.user_id,
        amount: payment.amount,
        payment_method: payment.payment_method,
        status: payment.status,
        tx_ref: payment.tx_ref,
        completed_at: payment.completed_at,
        created_at: payment.created_at
      }
    });
  }
};

const seedPayouts = async (): Promise<void> => {
  for (const payout of payouts) {
    await prisma.payout.upsert({
      where: { tx_ref: payout.tx_ref },
      update: {
        user_id: payout.user_id,
        amount: payout.amount,
        method: payout.method,
        details: payout.details,
        status: payout.status,
        completed_at: payout.completed_at,
        created_at: payout.created_at
      },
      create: {
        id: payout.id,
        user_id: payout.user_id,
        amount: payout.amount,
        method: payout.method,
        details: payout.details,
        status: payout.status,
        tx_ref: payout.tx_ref,
        completed_at: payout.completed_at,
        created_at: payout.created_at
      }
    });
  }
};

const seedNotifications = async (): Promise<void> => {
  for (const notification of notifications) {
    await prisma.notification.upsert({
      where: { id: notification.id },
      update: {
        user_id: notification.user_id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        created_at: notification.created_at,
        read_at: notification.read_at
      },
      create: {
        id: notification.id,
        user_id: notification.user_id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        created_at: notification.created_at,
        read_at: notification.read_at
      }
    });
  }
};

const syncEventRatings = async (): Promise<void> => {
  for (const event of events) {
    const agg = await prisma.review.aggregate({
      where: {
        event_id: event.id,
        status: 'visible'
      },
      _avg: {
        rating: true
      }
    });

    await prisma.event.update({
      where: { id: event.id },
      data: {
        avg_rating: Number((agg._avg.rating ?? 0).toFixed(2))
      }
    });
  }
};

const printDemoAccounts = (): void => {
  console.log('\n### Demo Accounts\n');
  console.log('Admin:');
  console.log(`- email: ${demoAccounts.admin.email}`);
  console.log(`- password: ${demoAccounts.admin.password}\n`);

  console.log('Organizer:');
  console.log(`- email: ${demoAccounts.organizer.email}`);
  console.log(`- password: ${demoAccounts.organizer.password}\n`);

  console.log('User:');
  console.log(`- email: ${demoAccounts.user.email}`);
  console.log(`- password: ${demoAccounts.user.password}\n`);
};

const printSummary = async (): Promise<void> => {
  const [usersCount, eventsCount, ordersCount, ticketsCount, checkInsCount] = await Promise.all([
    prisma.user.count(),
    prisma.event.count(),
    prisma.order.count(),
    prisma.digitalTicket.count(),
    prisma.checkInLog.count()
  ]);

  console.log('Seed Completed:');
  console.log(`Users: ${usersCount}`);
  console.log(`Events: ${eventsCount}`);
  console.log(`Orders: ${ordersCount}`);
  console.log(`Tickets: ${ticketsCount}`);
  console.log(`CheckIns: ${checkInsCount}`);
};

const seed = async (): Promise<void> => {
  const roleMap = await seedRoles();
  await seedUsers(roleMap);
  await seedOrganizerProfiles();
  await seedCategories();
  await seedEvents();
  await seedTicketTypes();
  await seedOrders();
  const ticketCodeMap = await seedDigitalTickets();
  await seedStaffMembers();
  await seedCheckInLogs(ticketCodeMap);
  const reviewIdMap = await seedReviews();
  await seedReviewReplies(reviewIdMap);
  await seedPlatformFeePayments();
  await seedPayouts();
  await seedNotifications();
  await syncEventRatings();

  printDemoAccounts();
  await printSummary();
};

seed()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
