const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { prisma } = require('../config/database');
const { generateId } = require('../utils/id');
const {
  sendWelcomeEmail,
  sendOrganizerApplicationReceivedEmail
} = require('../services/emailService');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'dems-secret-key', {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

const register = async (req, res) => {
  try {
    const { 
      full_name, email, password, phone, user_name, role,
      organization_name, organization_type, website_url, bio,
      tax_id_number, business_registration_number,
      social_linkedin, social_instagram, social_x, work_email
    } = req.body;
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Determine role and status (accept either string role names or numeric role ids)
    const roleByName = {
      admin: 1,
      organizer: 2,
      attendee: 3,
      staff: 4,
      security: 5
    };

    let roleId = 3; // attendee default

    if (typeof role === 'number' || (typeof role === 'string' && /^\d+$/.test(role.trim()))) {
      const parsedRoleId = Number(role);
      if (Number.isInteger(parsedRoleId) && parsedRoleId >= 1 && parsedRoleId <= 5) {
        roleId = parsedRoleId;
      }
    } else if (typeof role === 'string') {
      const normalizedRole = role.trim().toLowerCase();
      if (roleByName[normalizedRole]) {
        roleId = roleByName[normalizedRole];
      }
    }

    const isOrganizer = roleId === 2;
    const status = isOrganizer ? 'pending' : 'active';
    
    const newUser = await prisma.user.create({
      data: {
        id: generateId(),
        role_id: roleId,
        full_name,
        email,
        password_hash: hashedPassword,
        phone: phone || null,
        user_name: user_name || email.split('@')[0],
        status,
        email_verified: true
      },
      select: {
        id: true,
        full_name: true,
        email: true,
        role_id: true,
        status: true
      }
    });

    const userId = newUser.id;
    
    // If organizer, create organizer profile
    if (isOrganizer) {
      await prisma.organizerProfile.create({
        data: {
          user_id: userId,
          organization_name: organization_name || full_name,
          organization_type: organization_type || 'individual',
          website_url: website_url || null,
          bio: bio || null,
          tax_id_number: tax_id_number || null,
          business_registration_number: business_registration_number || null,
          social_linkedin: social_linkedin || null,
          social_instagram: social_instagram || null,
          social_x: social_x || null,
          work_email: work_email || email,
          verification_status: 'pending'
        }
      });
    }

    if (isOrganizer) {
      sendOrganizerApplicationReceivedEmail(newUser).catch((mailError) => {
        console.error('Organizer registration email failed:', mailError.message || mailError);
      });
    } else {
      sendWelcomeEmail(newUser).catch((mailError) => {
        console.error('Welcome email failed:', mailError.message || mailError);
      });
    }
    
    // For attendees, return token immediately
    if (!isOrganizer) {
      const token = generateToken(userId);
      return res.status(201).json({
        success: true,
        token,
        user: newUser
      });
    }
    
    // For organizers, don't return token - they need approval
    res.status(201).json({
      success: true,
      message: 'Registration successful! Your application is pending admin approval. You will receive an email once approved.',
      user: newUser,
      requiresApproval: true
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check if user is pending approval
    if (user.status === 'pending') {
      return res.status(401).json({ 
        message: 'Your account is pending admin approval. You will receive an email once approved.',
        requiresApproval: true 
      });
    }
    
    if (user.status === 'suspended') {
      return res.status(401).json({ message: 'Your account has been suspended. Please contact support.' });
    }

    if (user.status === 'rejected') {
      return res.status(401).json({
        message: 'Your organizer application was rejected. Please contact support for details.'
      });
    }

    if (user.status === 'deleted') {
      return res.status(401).json({ message: 'Your account is not active. Please contact support.' });
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { last_login_at: new Date() }
    });
    
    // Generate token
    const token = generateToken(user.id);
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role_id: user.role_id,
        status: user.status
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { register, login };

// Update for: feat(frontdoor): implement checkout timer display and payment button
// Update for: chore(frontdoor): update frontend flow documentation and API specs
// Update for: feat(frontdoor): add POST /api/auth/register and /api/auth/login endpoints
// Update for: feat(frontdoor): implement POST /api/payments/init with reservation and cart lock checks