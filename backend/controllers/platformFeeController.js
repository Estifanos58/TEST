const { prisma } = require("../config/database");
const { initializePayment } = require("../services/chapaService");
const crypto = require("crypto");
const { isValidEmail } = require("../utils/helpers");
const { generateId } = require("../utils/id");

const SUPER_ADMIN_EMAIL =
  process.env.SUPER_ADMIN_EMAIL || "nexussphere0974@gmail.com";
const DEFAULT_EXACT_PLATFORM_FEE_AMOUNT = 500;

const ensurePlatformFeeSettingsTable = async () => {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS platform_fee_settings (
      id INT PRIMARY KEY,
      exact_fee_amount DECIMAL(10,2) NOT NULL DEFAULT 500,
      updated_by VARCHAR(36),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE platform_fee_settings
    ADD COLUMN IF NOT EXISTS exact_fee_amount DECIMAL(10,2) NOT NULL DEFAULT 500
  `);

  // Backward compatibility for existing schemas that still require legacy columns.
  await prisma.$executeRawUnsafe(`
    ALTER TABLE platform_fee_settings
    ALTER COLUMN fee_percentage SET DEFAULT 0
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE platform_fee_settings
    ALTER COLUMN min_payment SET DEFAULT 1
  `);
};

const getPlatformFeeSettings = async () => {
  await ensurePlatformFeeSettingsTable();

  const rows = await prisma.$queryRawUnsafe(`
    SELECT id, exact_fee_amount, updated_by, updated_at
    FROM platform_fee_settings
    WHERE id = 1
    LIMIT 1
  `);

  if (!rows || rows.length === 0) {
    return {
      exact_fee_amount: DEFAULT_EXACT_PLATFORM_FEE_AMOUNT,
      updated_by: null,
      updated_at: null,
    };
  }

  const row = rows[0];
  return {
    exact_fee_amount: Number(row.exact_fee_amount),
    updated_by: row.updated_by || null,
    updated_at: row.updated_at || null,
  };
};

const getOrganizerRequiredFeeAmount = async (userId, exactFeeAmount) => {
  const pendingEventsCount = await prisma.event.count({
    where: {
      organizer_id: userId,
      status: "draft",
    },
  });

  return Number((pendingEventsCount * Number(exactFeeAmount || 0)).toFixed(2));
};

const publishPendingEventsForOrganizer = async (dbClient, userId) => {
  const oldestPendingEvent = await dbClient.event.findFirst({
    where: {
      organizer_id: userId,
      status: "draft",
    },
    select: {
      id: true,
      created_at: true,
    },
    orderBy: { created_at: "asc" },
  });

  if (!oldestPendingEvent) {
    return;
  }

  await dbClient.event.update({
    where: { id: oldestPendingEvent.id },
    data: { status: "published" },
  });
};

const notifySuperAdminForPaymentConfirmation = async (payment) => {
  if (!payment?.id || !payment?.user_id) {
    return;
  }

  const superAdmin = await prisma.user.findUnique({
    where: { email: SUPER_ADMIN_EMAIL },
    select: { id: true },
  });

  if (!superAdmin?.id) {
    return;
  }

  const existingAdminNotification = await prisma.notification.findMany({
    where: {
      user_id: superAdmin.id,
      type: "platform_fee_confirmation_required",
    },
    select: {
      metadata: true,
    },
    take: 500,
  });

  const alreadyNotified = existingAdminNotification.some(
    (item) => item?.metadata?.payment_id === payment.id,
  );

  if (alreadyNotified) {
    return;
  }

  await prisma.notification.create({
    data: {
      id: generateId(),
      user_id: superAdmin.id,
      type: "platform_fee_confirmation_required",
      title: "Platform Fee Confirmation Required",
      message: `Organizer payment of ETB ${Number(payment.amount || 0).toLocaleString()} is completed and waiting for your confirmation.`,
      metadata: {
        payment_id: payment.id,
        organizer_id: payment.user_id,
        tx_ref: payment.tx_ref,
        amount: Number(payment.amount || 0),
      },
    },
  });
};

const initPlatformFeePayment = async (req, res) => {
  try {
    const { amount, payment_method } = req.body;
    const userId = req.user.id;

    const settings = await getPlatformFeeSettings();
    const configuredExactFee = Number(
      settings.exact_fee_amount || DEFAULT_EXACT_PLATFORM_FEE_AMOUNT,
    );

    const completedPayments = await prisma.platformFeePayment.aggregate({
      where: { user_id: userId, status: "completed" },
      _sum: { amount: true },
    });

    const requiredFeeAmount = await getOrganizerRequiredFeeAmount(
      userId,
      configuredExactFee,
    );
    const remainingBalance = Number(requiredFeeAmount.toFixed(2));
    const payableNow =
      remainingBalance > 0
        ? Number(Math.min(configuredExactFee, remainingBalance).toFixed(2))
        : 0;

    if (remainingBalance <= 0) {
      return res.status(400).json({
        success: false,
        message: "You have no platform fee balance due right now",
      });
    }

    if (!amount || Number(amount) !== payableNow) {
      return res.status(400).json({
        success: false,
        message: `You must pay the exact fee amount: ETB ${payableNow.toLocaleString()}`,
      });
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        full_name: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Validate email format
    if (!isValidEmail(user.email)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid email format. Please update your profile with a valid email address.",
      });
    }

    const tx_ref = `PLATFORM-${Date.now()}-${crypto.randomBytes(8).toString("hex")}`;

    await prisma.platformFeePayment.create({
      data: {
        id: generateId(),
        user_id: userId,
        amount: Number(payableNow),
        payment_method: payment_method || "telebirr",
        status: "pending",
        tx_ref,
      },
    });

    const nameParts = (user.full_name || "Organizer User").split(" ");
    const first_name = nameParts[0];
    const last_name = nameParts.slice(1).join(" ") || "User";

    // Ensure phone number is valid Ethiopian format
    const phoneNumber = "0912345678";

    const paymentResult = await initializePayment({
      amount: payableNow,
      email: user.email,
      first_name: first_name,
      last_name: last_name,
      phone_number: phoneNumber,
      tx_ref: tx_ref,
      title: "DEMS Platform Fee",
      description: `Platform fee payment of ETB ${payableNow}`,
    });

    if (paymentResult.success && paymentResult.checkout_url) {
      return res.json({
        success: true,
        checkout_url: paymentResult.checkout_url,
        tx_ref: tx_ref,
      });
    } else {
      return res.status(400).json({
        success: false,
        message:
          paymentResult.message ||
          "Payment initialization failed. Please try again.",
      });
    }
  } catch (error) {
    console.error("Init platform fee error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

const verifyPlatformFeePayment = async (req, res) => {
  try {
    const { tx_ref, status } = req.body;

    if (!tx_ref) {
      return res
        .status(400)
        .json({ status: "error", message: "Missing tx_ref" });
    }

    const payment = await prisma.platformFeePayment.findFirst({
      where: { tx_ref },
      select: {
        id: true,
        user_id: true,
        amount: true,
        tx_ref: true,
        status: true,
      },
    });

    if (!payment) {
      return res.status(200).json({ status: "ok" });
    }

    if (status === "success" && payment.status !== "completed") {
      await prisma.platformFeePayment.update({
        where: { id: payment.id },
        data: {
          status: "completed",
          completed_at: new Date(),
        },
      });

      await notifySuperAdminForPaymentConfirmation(payment);
    }

    res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("Platform fee callback error:", error);
    res.status(500).json({ status: "error" });
  }
};

const getPlatformFeeHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const settings = await getPlatformFeeSettings();
    const configuredExactFee = Number(
      settings.exact_fee_amount || DEFAULT_EXACT_PLATFORM_FEE_AMOUNT,
    );

    const payments = await prisma.platformFeePayment.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
    });

    const completedPayments = payments.filter(
      (payment) => payment.status === "completed",
    );
    const pendingPayments = payments.filter(
      (payment) => payment.status === "pending",
    );

    const totalPaid = completedPayments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0,
    );
    const pendingPayment = pendingPayments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0,
    );
    const requiredFeeAmount = await getOrganizerRequiredFeeAmount(
      userId,
      configuredExactFee,
    );

    const remainingBalance = Number(requiredFeeAmount.toFixed(2));
    const payableNow =
      remainingBalance > 0
        ? Number(Math.min(configuredExactFee, remainingBalance).toFixed(2))
        : 0;

    res.json({
      success: true,
      payments,
      summary: {
        total_fee_due: Number(requiredFeeAmount.toFixed(2)),
        total_paid: Number(totalPaid.toFixed(2)),
        pending_payment: Number(pendingPayment.toFixed(2)),
        remaining_balance: Number(remainingBalance.toFixed(2)),
        exact_fee_amount: Number(configuredExactFee.toFixed(2)),
        payable_now: Number(payableNow.toFixed(2)),
      },
    });
  } catch (error) {
    console.error("Get history error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPlatformFeeConfig = async (req, res) => {
  try {
    const settings = await getPlatformFeeSettings();

    return res.json({
      success: true,
      config: {
        exact_fee_amount: Number(settings.exact_fee_amount),
        updated_by: settings.updated_by,
        updated_at: settings.updated_at,
      },
    });
  } catch (error) {
    console.error("Get platform fee config error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load platform fee configuration",
    });
  }
};

const updatePlatformFeeConfig = async (req, res) => {
  try {
    if (req.user?.email !== SUPER_ADMIN_EMAIL) {
      return res.status(403).json({
        success: false,
        message: "Only super admin can update platform fee",
      });
    }

    const { exact_fee_amount } = req.body || {};
    const exactFeeAmount = Number(exact_fee_amount);

    if (!Number.isFinite(exactFeeAmount) || exactFeeAmount < 1) {
      return res.status(400).json({
        success: false,
        message: "Exact platform fee amount must be at least ETB 1",
      });
    }

    await ensurePlatformFeeSettingsTable();

    const existingRows = await prisma.$queryRawUnsafe(
      `SELECT id FROM platform_fee_settings WHERE id = 1 LIMIT 1`,
    );

    if (Array.isArray(existingRows) && existingRows.length > 0) {
      await prisma.$executeRawUnsafe(
        `
          UPDATE platform_fee_settings
          SET exact_fee_amount = $1::DECIMAL(10,2),
              fee_percentage = COALESCE(fee_percentage, 0),
              min_payment = COALESCE(min_payment, 1),
              updated_by = $2,
              updated_at = NOW()
          WHERE id = 1
        `,
        Number(exactFeeAmount.toFixed(2)),
        req.user.id,
      );
    } else {
      await prisma.$executeRawUnsafe(
        `
          INSERT INTO platform_fee_settings (
            id,
            exact_fee_amount,
            fee_percentage,
            min_payment,
            updated_by,
            updated_at
          )
          VALUES (1, $1::DECIMAL(10,2), 0, 1, $2, NOW())
        `,
        Number(exactFeeAmount.toFixed(2)),
        req.user.id,
      );
    }

    const updated = await getPlatformFeeSettings();

    return res.json({
      success: true,
      message: "Platform fee updated successfully",
      config: {
        exact_fee_amount: Number(updated.exact_fee_amount),
        updated_by: updated.updated_by,
        updated_at: updated.updated_at,
      },
    });
  } catch (error) {
    console.error("Update platform fee config error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update platform fee configuration",
    });
  }
};

const getAdminPlatformFeeDeliveries = async (req, res) => {
  try {
    const completedPayments = await prisma.platformFeePayment.findMany({
      where: { status: "completed" },
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            email: true,
            organizer_profile: {
              select: {
                organization_name: true,
              },
            },
          },
        },
      },
      orderBy: { completed_at: "desc" },
      take: 100,
    });

    const deliveryNotifications = await prisma.notification.findMany({
      where: {
        type: "platform_fee_delivery",
      },
      select: {
        metadata: true,
      },
      take: 500,
    });

    const deliveredPaymentIds = new Set(
      deliveryNotifications
        .map((item) => item?.metadata?.payment_id)
        .filter(Boolean),
    );

    const pendingDeliveries = completedPayments.filter(
      (payment) => !deliveredPaymentIds.has(payment.id),
    );

    return res.json({
      success: true,
      payments: pendingDeliveries,
    });
  } catch (error) {
    console.error("Get admin platform fee deliveries error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load platform fee deliveries",
    });
  }
};

const confirmPlatformFeeDelivery = async (req, res) => {
  try {
    if (req.user?.email !== SUPER_ADMIN_EMAIL) {
      return res.status(403).json({
        success: false,
        message: "Only super admin can confirm platform fee delivery",
      });
    }

    const { paymentId } = req.params;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: "Payment ID is required",
      });
    }

    const payment = await prisma.platformFeePayment.findUnique({
      where: { id: paymentId },
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
          },
        },
      },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Platform fee payment not found",
      });
    }

    if (payment.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Only completed payments can be confirmed for delivery",
      });
    }

    const existingDeliveryNotifications = await prisma.notification.findMany({
      where: {
        user_id: payment.user_id,
        type: "platform_fee_delivery",
      },
      select: {
        id: true,
        metadata: true,
      },
      take: 100,
    });

    const alreadyDelivered = existingDeliveryNotifications.some(
      (item) => item?.metadata?.payment_id === paymentId,
    );

    if (alreadyDelivered) {
      return res.json({
        success: true,
        message: "Delivery already confirmed for this payment",
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.notification.create({
        data: {
          id: generateId(),
          user_id: payment.user_id,
          type: "platform_fee_delivery",
          title: "Platform Fee Payment Confirmed",
          message:
            "Super admin confirmed your platform fee payment. Your pending event is now published.",
          metadata: {
            payment_id: payment.id,
            tx_ref: payment.tx_ref,
            amount: Number(payment.amount),
            confirmed_by: req.user.id,
            confirmed_at: new Date().toISOString(),
          },
        },
      });

      await publishPendingEventsForOrganizer(tx, payment.user_id);
    });

    return res.json({
      success: true,
      message: "Payment confirmed, event published, and organizer notified",
    });
  } catch (error) {
    console.error("Confirm platform fee delivery error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to confirm platform fee delivery",
    });
  }
};

module.exports = {
  initPlatformFeePayment,
  verifyPlatformFeePayment,
  getPlatformFeeHistory,
  getAdminPlatformFeeDeliveries,
  confirmPlatformFeeDelivery,
  getPlatformFeeConfig,
  updatePlatformFeeConfig,
};
