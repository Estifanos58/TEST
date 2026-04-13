const { prisma } = require('../config/database');
const crypto = require('crypto');
const { generateId } = require('../utils/id');

// Initialize payout (Organizer receives money)
const initPayout = async (req, res) => {
  try {
    const { amount, method, details } = req.body;
    const userId = req.user.id;

    const tx_ref = `PAYOUT-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;

    await prisma.payout.create({
      data: {
        id: generateId(),
        user_id: userId,
        amount: Number(amount),
        method,
        details: details ? JSON.stringify(details) : null,
        status: 'pending',
        tx_ref
      }
    });
    
    res.json({
      success: true,
      message: 'Payout request initiated',
      tx_ref: tx_ref
    });
  } catch (error) {
    console.error('Init payout error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get payout history
const getPayoutHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const payouts = await prisma.payout.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' }
    });

    res.json({ success: true, payouts });
  } catch (error) {
    console.error('Get payout history error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { initPayout, getPayoutHistory };

// Update for: feat(controlroom): implement multi-step event wizard UI flow
// Update for: feat(controlroom): implement search and filtering UI with state handling