-- =====================================================
-- DEMS (Dinkenesh Event Management System) 
-- Complete Database Schema - Version 3.0
-- =====================================================
-- Total Tables: 36+
-- Compatible with: MySQL (MAMP, XAMPP, Production)
-- =====================================================

-- Drop and recreate database
DROP DATABASE IF EXISTS dems_db;
CREATE DATABASE dems_db;
USE dems_db;

-- =====================================================
-- SECTION 1: CORE USER & ACCESS TABLES (5 tables)
-- =====================================================

-- 1.1 Roles table
CREATE TABLE IF NOT EXISTS roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default roles
INSERT IGNORE INTO roles (role_name) VALUES 
('admin'), ('organizer'), ('attendee'), ('staff'), ('security');

-- 1.2 Users table (main user account)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    role_id INT NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    user_name VARCHAR(100),
    status ENUM('active', 'pending', 'suspended', 'deleted') DEFAULT 'active',
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    default_language ENUM('en', 'am') DEFAULT 'en',
    theme_preference ENUM('light', 'dark') DEFAULT 'light',
    last_login_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id),
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_role (role_id)
);

-- 1.3 User Settings
CREATE TABLE IF NOT EXISTS user_settings (
    user_id VARCHAR(36) PRIMARY KEY,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    staff_notifications VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 1.4 Organizer Profiles
CREATE TABLE IF NOT EXISTS organizer_profiles (
    user_id VARCHAR(36) PRIMARY KEY,
    organization_name VARCHAR(255) NOT NULL,
    organization_type ENUM('non_profit', 'corporate', 'individual', 'government') NOT NULL,
    website_url VARCHAR(255),
    bio TEXT,
    logo_url VARCHAR(500),
    tax_id_number VARCHAR(100),
    business_registration_number VARCHAR(100),
    social_linkedin VARCHAR(255),
    social_instagram VARCHAR(255),
    social_x VARCHAR(255),
    work_email VARCHAR(255),
    verification_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    bank_account_name VARCHAR(255),
    bank_account_number VARCHAR(100),
    bank_name VARCHAR(255),
    iban VARCHAR(100),
    swift_code VARCHAR(50),
    payout_currency VARCHAR(3) DEFAULT 'ETB',
    approved_by_admin_id VARCHAR(36),
    approved_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by_admin_id) REFERENCES users(id),
    INDEX idx_verification_status (verification_status)
);

-- 1.5 Attendee Profiles
CREATE TABLE IF NOT EXISTS attendee_profiles (
    user_id VARCHAR(36) PRIMARY KEY,
    interests TEXT,
    loyalty_points INT DEFAULT 0,
    loyalty_tier ENUM('bronze', 'silver', 'gold', 'platinum') DEFAULT 'bronze',
    total_tickets_purchased INT DEFAULT 0,
    total_spent DECIMAL(10, 2) DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================
-- SECTION 2: AUTHENTICATION TABLES (2 tables)
-- =====================================================

-- 2.1 OTP Verifications
CREATE TABLE IF NOT EXISTS otp_verifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    purpose ENUM('signup', 'login', 'reset_password', 'verify_email', 'verify_phone') NOT NULL,
    code_hash VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    attempt_count INT DEFAULT 0,
    verified_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_purpose (user_id, purpose),
    INDEX idx_expires_at (expires_at)
);

-- 2.2 Password Reset Tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    used_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token_hash (token_hash)
);

-- =====================================================
-- SECTION 3: STAFF & SECURITY TABLES (2 tables)
-- =====================================================

-- 3.1 Staff Members
CREATE TABLE IF NOT EXISTS staff_members (
    id VARCHAR(36) PRIMARY KEY,
    organizer_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    assigned_role ENUM('staff', 'security') NOT NULL,
    staff_badge_id VARCHAR(100),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organizer_id) REFERENCES users(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_organizer (organizer_id),
    INDEX idx_email (email)
);

-- 3.2 Security Sessions (for QR scanning)
CREATE TABLE IF NOT EXISTS security_sessions (
    id VARCHAR(36) PRIMARY KEY,
    event_id VARCHAR(36) NOT NULL,
    staff_member_id VARCHAR(36) NOT NULL,
    device_name VARCHAR(255),
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME,
    status ENUM('active', 'closed') DEFAULT 'active',
    FOREIGN KEY (event_id) REFERENCES events(id),
    FOREIGN KEY (staff_member_id) REFERENCES staff_members(id)
);

-- =====================================================
-- SECTION 4: EVENT & CATEGORY TABLES (7 tables)
-- =====================================================

-- 4.1 Event Categories
CREATE TABLE IF NOT EXISTS event_categories (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    icon_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_slug (slug)
);

-- Insert default categories
INSERT IGNORE INTO event_categories (id, name, slug) VALUES 
(REPLACE(UUID(), '-', ''), 'Technology', 'technology'),
(REPLACE(UUID(), '-', ''), 'Music', 'music'),
(REPLACE(UUID(), '-', ''), 'Art & Culture', 'art-culture'),
(REPLACE(UUID(), '-', ''), 'Sports', 'sports'),
(REPLACE(UUID(), '-', ''), 'Educational', 'educational'),
(REPLACE(UUID(), '-', ''), 'Business', 'business');

-- 4.2 Events Main Table
CREATE TABLE IF NOT EXISTS events (
    id VARCHAR(36) PRIMARY KEY,
    organizer_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    category_id VARCHAR(36) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    rich_description_html TEXT,
    banner_url VARCHAR(2048),
    logo_url VARCHAR(500),
    status ENUM('draft', 'published', 'cancelled', 'completed') DEFAULT 'draft',
    visibility ENUM('public', 'private') DEFAULT 'public',
    is_featured BOOLEAN DEFAULT FALSE,
    is_trending BOOLEAN DEFAULT FALSE,
    start_datetime DATETIME NOT NULL,
    end_datetime DATETIME NOT NULL,
    timezone VARCHAR(50) DEFAULT 'Africa/Addis_Ababa',
    sales_start_datetime DATETIME,
    sales_end_datetime DATETIME,
    venue_name VARCHAR(255),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    region VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Ethiopia',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    google_place_id VARCHAR(255),
    online_meeting_url VARCHAR(500),
    location_type ENUM('physical', 'online', 'hybrid') DEFAULT 'physical',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organizer_id) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES event_categories(id),
    INDEX idx_organizer (organizer_id),
    INDEX idx_status (status),
    INDEX idx_city (city),
    INDEX idx_start_datetime (start_datetime),
    INDEX idx_featured (is_featured),
    FULLTEXT INDEX idx_search (title, description)
);

-- 4.3 Event Media Gallery
CREATE TABLE IF NOT EXISTS event_media (
    id VARCHAR(36) PRIMARY KEY,
    event_id VARCHAR(36) NOT NULL,
    media_type ENUM('image', 'video') DEFAULT 'image',
    file_url VARCHAR(500) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    INDEX idx_event (event_id)
);

-- 4.4 Event Tags
CREATE TABLE IF NOT EXISTS event_tags (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4.5 Event Tag Mapping
CREATE TABLE IF NOT EXISTS event_tag_map (
    event_id VARCHAR(36) NOT NULL,
    tag_id VARCHAR(36) NOT NULL,
    PRIMARY KEY (event_id, tag_id),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES event_tags(id) ON DELETE CASCADE
);

-- 4.6 Event Schedule (for recurring events)
CREATE TABLE IF NOT EXISTS event_schedule (
    id VARCHAR(36) PRIMARY KEY,
    event_id VARCHAR(36) NOT NULL,
    schedule_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    capacity INT,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    INDEX idx_event_date (event_id, schedule_date)
);

-- 4.7 Featured Event Banners
CREATE TABLE IF NOT EXISTS featured_event_banners (
    id VARCHAR(36) PRIMARY KEY,
    event_id VARCHAR(36) NOT NULL,
    title_override VARCHAR(255),
    subtitle_override VARCHAR(255),
    banner_image_url VARCHAR(500) NOT NULL,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    INDEX idx_is_active (is_active)
);

-- =====================================================
-- SECTION 5: TICKETING & PROMO TABLES (4 tables)
-- =====================================================

-- 5.1 Ticket Types
CREATE TABLE IF NOT EXISTS ticket_types (
    id VARCHAR(36) PRIMARY KEY,
    event_id VARCHAR(36) NOT NULL,
    tier_name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'ETB',
    capacity INT NOT NULL,
    remaining_quantity INT NOT NULL,
    sales_start_datetime DATETIME,
    sales_end_datetime DATETIME,
    promo_code_required BOOLEAN DEFAULT FALSE,
    promo_code_id VARCHAR(36),
    is_active BOOLEAN DEFAULT TRUE,
    benefits TEXT,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    INDEX idx_event (event_id),
    INDEX idx_active (is_active),
    CHECK (remaining_quantity >= 0 AND remaining_quantity <= capacity)
);

-- 5.2 Promo Codes
CREATE TABLE IF NOT EXISTS promo_codes (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type ENUM('percentage', 'fixed') DEFAULT 'percentage',
    discount_value DECIMAL(10, 2) NOT NULL,
    usage_limit INT,
    used_count INT DEFAULT 0,
    expiry_date DATETIME,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5.3 Ticket Promos (Link promo codes to ticket types)
CREATE TABLE IF NOT EXISTS ticket_promos (
    id VARCHAR(36) PRIMARY KEY,
    ticket_type_id VARCHAR(36) NOT NULL,
    promo_id VARCHAR(36) NOT NULL,
    FOREIGN KEY (ticket_type_id) REFERENCES ticket_types(id),
    FOREIGN KEY (promo_id) REFERENCES promo_codes(id)
);

-- 5.4 Ticket Reservations (Timer-based cart)
CREATE TABLE IF NOT EXISTS ticket_reservations (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    event_id VARCHAR(36) NOT NULL,
    ticket_type_id VARCHAR(36) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    service_fee DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    status ENUM('active', 'expired', 'paid', 'cancelled') DEFAULT 'active',
    reserved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (event_id) REFERENCES events(id),
    FOREIGN KEY (ticket_type_id) REFERENCES ticket_types(id),
    INDEX idx_user_status (user_id, status),
    INDEX idx_expires_at (expires_at)
);

-- =====================================================
-- SECTION 6: SHOPPING CART TABLES (2 tables)
-- =====================================================

-- 6.1 Shopping Cart
CREATE TABLE IF NOT EXISTS carts (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id)
);

-- 6.2 Cart Items
CREATE TABLE IF NOT EXISTS cart_items (
    id VARCHAR(36) PRIMARY KEY,
    cart_id VARCHAR(36) NOT NULL,
    ticket_type_id VARCHAR(36) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    FOREIGN KEY (ticket_type_id) REFERENCES ticket_types(id),
    INDEX idx_cart (cart_id)
);

-- =====================================================
-- SECTION 7: ORDER & PAYMENT TABLES (5 tables)
-- =====================================================

-- 7.1 Orders
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    subtotal DECIMAL(10, 2) NOT NULL,
    service_fee DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'paid', 'failed', 'cancelled', 'refunded') DEFAULT 'pending',
    payment_method VARCHAR(50),
    paid_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user (user_id),
    INDEX idx_order_number (order_number),
    INDEX idx_status (status)
);

-- 7.2 Order Items
CREATE TABLE IF NOT EXISTS order_items (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL,
    ticket_type_id VARCHAR(36) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (ticket_type_id) REFERENCES ticket_types(id),
    INDEX idx_order (order_id)
);

-- 7.3 Transactions
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    gross_amount DECIMAL(10, 2) NOT NULL,
    platform_fee DECIMAL(10, 2) NOT NULL,
    net_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    currency VARCHAR(3) DEFAULT 'ETB',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_order (order_id),
    INDEX idx_status (status)
);

-- 7.4 Payments
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(36) PRIMARY KEY,
    transaction_id VARCHAR(36) NOT NULL,
    provider_name VARCHAR(100) NOT NULL,
    provider_transaction_id VARCHAR(255),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'ETB',
    status ENUM('pending', 'successful', 'failed', 'refunded') DEFAULT 'pending',
    paid_at DATETIME,
    receipt_url VARCHAR(500),
    raw_response_json TEXT,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id),
    INDEX idx_transaction (transaction_id),
    INDEX idx_provider_transaction (provider_transaction_id)
);

-- 7.5 Digital Tickets (Wallet)
CREATE TABLE IF NOT EXISTS digital_tickets (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL,
    event_id VARCHAR(36) NOT NULL,
    ticket_type_id VARCHAR(36) NOT NULL,
    ticket_code VARCHAR(100) NOT NULL UNIQUE,
    qr_payload TEXT NOT NULL,
    qr_image_url VARCHAR(500),
    purchase_date DATETIME NOT NULL,
    seat_number VARCHAR(50),
    is_used BOOLEAN DEFAULT FALSE,
    used_at DATETIME,
    status ENUM('active', 'used', 'cancelled', 'refunded') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (event_id) REFERENCES events(id),
    FOREIGN KEY (ticket_type_id) REFERENCES ticket_types(id),
    INDEX idx_ticket_code (ticket_code),
    INDEX idx_status (status),
    INDEX idx_event (event_id)
);

-- =====================================================
-- SECTION 8: CHECK-IN & ATTENDANCE TABLES (2 tables)
-- =====================================================

-- 8.1 Check-in Logs (Security scanning)
CREATE TABLE IF NOT EXISTS check_in_logs (
    id VARCHAR(36) PRIMARY KEY,
    ticket_id VARCHAR(36) NOT NULL,
    staff_id VARCHAR(36) NOT NULL,
    event_id VARCHAR(36) NOT NULL,
    check_in_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('valid', 'already_scanned', 'invalid') NOT NULL,
    device_id VARCHAR(255),
    location_note VARCHAR(255),
    FOREIGN KEY (ticket_id) REFERENCES digital_tickets(id),
    FOREIGN KEY (staff_id) REFERENCES users(id),
    FOREIGN KEY (event_id) REFERENCES events(id),
    INDEX idx_ticket (ticket_id),
    INDEX idx_event (event_id),
    INDEX idx_staff (staff_id)
);

-- 8.2 Event Attendance Stats (Live)
CREATE TABLE IF NOT EXISTS event_attendance_stats (
    id VARCHAR(36) PRIMARY KEY,
    event_id VARCHAR(36) NOT NULL UNIQUE,
    tickets_sold_total INT DEFAULT 0,
    checked_in_total INT DEFAULT 0,
    normal_sold INT DEFAULT 0,
    vip_sold INT DEFAULT 0,
    vvip_sold INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    INDEX idx_event (event_id)
);

-- =====================================================
-- SECTION 9: FINANCIAL & PAYOUT TABLES (3 tables)
-- =====================================================

-- 9.1 Organizer Balance
CREATE TABLE IF NOT EXISTS organizer_balance (
    organizer_id VARCHAR(36) PRIMARY KEY,
    available_balance DECIMAL(15, 2) DEFAULT 0,
    pending_payout DECIMAL(15, 2) DEFAULT 0,
    lifetime_earnings DECIMAL(15, 2) DEFAULT 0,
    total_refunds DECIMAL(15, 2) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organizer_id) REFERENCES users(id)
);

-- 9.2 Payout Requests
CREATE TABLE IF NOT EXISTS payout_requests (
    id VARCHAR(36) PRIMARY KEY,
    organizer_id VARCHAR(36) NOT NULL,
    gross_amount DECIMAL(15, 2) NOT NULL,
    fee_deducted DECIMAL(15, 2) NOT NULL,
    net_amount DECIMAL(15, 2) NOT NULL,
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    bank_account_ref VARCHAR(255),
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME,
    notes TEXT,
    FOREIGN KEY (organizer_id) REFERENCES users(id),
    INDEX idx_organizer (organizer_id),
    INDEX idx_status (status)
);

-- 9.3 Payout Audit Log
CREATE TABLE IF NOT EXISTS payout_audit_log (
    id VARCHAR(36) PRIMARY KEY,
    payout_id VARCHAR(36) NOT NULL,
    action VARCHAR(100),
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    notes TEXT,
    actor_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payout_id) REFERENCES payout_requests(id),
    FOREIGN KEY (actor_id) REFERENCES users(id)
);

-- =====================================================
-- SECTION 10: ENGAGEMENT & ANALYTICS TABLES (4 tables)
-- =====================================================

-- 10.1 Saved Events (Bookmarks)
CREATE TABLE IF NOT EXISTS saved_events (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    event_id VARCHAR(36) NOT NULL,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_event (user_id, event_id),
    INDEX idx_user (user_id)
);

-- 10.2 Reviews & Ratings
CREATE TABLE IF NOT EXISTS reviews (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    event_id VARCHAR(36) NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    status ENUM('visible', 'hidden', 'pending') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    INDEX idx_event (event_id),
    INDEX idx_rating (rating),
    UNIQUE KEY unique_user_event_review (user_id, event_id)
);

-- 10.3 Review Replies (Organizer responses)
CREATE TABLE IF NOT EXISTS review_replies (
    id VARCHAR(36) PRIMARY KEY,
    review_id VARCHAR(36) NOT NULL,
    organizer_id VARCHAR(36) NOT NULL,
    reply_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
    FOREIGN KEY (organizer_id) REFERENCES users(id)
);

-- 10.4 Event Analytics
CREATE TABLE IF NOT EXISTS event_analytics (
    event_id VARCHAR(36) PRIMARY KEY,
    views INT DEFAULT 0,
    registrations INT DEFAULT 0,
    tickets_sold INT DEFAULT 0,
    avg_rating DECIMAL(3, 2) DEFAULT 0,
    total_revenue DECIMAL(15, 2) DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- =====================================================
-- SECTION 11: NOTIFICATION & SYSTEM TABLES (2 tables)
-- =====================================================

-- 11.1 Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    read_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_read (user_id, read_at),
    INDEX idx_type (type)
);

-- 11.2 System Settings
CREATE TABLE IF NOT EXISTS system_settings (
    id VARCHAR(36) PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_key (setting_key)
);

-- =====================================================
-- INSERT DEFAULT SYSTEM SETTINGS
-- =====================================================

INSERT IGNORE INTO system_settings (id, setting_key, setting_value, setting_type) VALUES
(REPLACE(UUID(), '-', ''), 'platform_fee_percentage', '10', 'number'),
(REPLACE(UUID(), '-', ''), 'checkout_timeout_minutes', '15', 'number'),
(REPLACE(UUID(), '-', ''), 'max_tickets_per_order', '10', 'number'),
(REPLACE(UUID(), '-', ''), 'default_currency', 'ETB', 'string'),
(REPLACE(UUID(), '-', ''), 'site_name', 'DEMS - Dinkenesh Event Management System', 'string'),
(REPLACE(UUID(), '-', ''), 'contact_email', 'support@dems.com', 'string'),
(REPLACE(UUID(), '-', ''), 'contact_phone', '+251-111-234-567', 'string');

-- =====================================================
-- INSERT DEFAULT PROMO CODES
-- =====================================================

INSERT IGNORE INTO promo_codes (id, code, discount_type, discount_value, usage_limit, expiry_date) VALUES 
(REPLACE(UUID(), '-', ''), 'WELCOME10', 'percentage', 10.00, 1000, DATE_ADD(NOW(), INTERVAL 30 DAY)),
(REPLACE(UUID(), '-', ''), 'EARLYBIRD', 'percentage', 15.00, 500, DATE_ADD(NOW(), INTERVAL 15 DAY));

-- =====================================================
-- INSERT ADMIN USER (password: admin123)
-- =====================================================

INSERT IGNORE INTO users (id, role_id, full_name, email, password_hash, user_name, status, email_verified) 
SELECT REPLACE(UUID(), '-', ''), 1, 'System Administrator', 'admin@dems.com', 'admin123', 'admin', 'active', TRUE
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@dems.com');

-- =====================================================
-- CREATE VIEWS FOR COMMON QUERIES
-- =====================================================

-- Event Summary View
CREATE OR REPLACE VIEW event_summary AS
SELECT 
    e.id,
    e.title,
    e.status,
    e.start_datetime,
    e.city,
    ec.name as category_name,
    COUNT(DISTINCT o.id) as total_orders,
    SUM(oi.quantity) as tickets_sold,
    SUM(o.total_amount) as total_revenue,
    COALESCE(AVG(r.rating), 0) as avg_rating
FROM events e
LEFT JOIN event_categories ec ON e.category_id = ec.id
LEFT JOIN ticket_types tt ON e.id = tt.event_id
LEFT JOIN order_items oi ON tt.id = oi.ticket_type_id
LEFT JOIN orders o ON oi.order_id = o.id AND o.status = 'paid'
LEFT JOIN reviews r ON e.id = r.event_id AND r.status = 'visible'
GROUP BY e.id;

-- =====================================================
-- VERIFY DATABASE SETUP
-- =====================================================

SELECT '✅ DEMS Database Setup Complete!' as Status;
SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'dems_db';
SHOW TABLES;
/* Update for: feat(engine): add scan feedback and check-in interaction screens */
/* Update for: feat(engine): add report moderation and dashboard real-time data bridge */
/* Update for: feat(engine): implement QR code scanning UI with camera overlay */
/* Update for: feat(engine): implement anti-duplicate scan logic with row-locking */
/* Update for: feat(engine): implement organizer banning workflow in moderation UI + backend */
/* Update for: feat(engine): build super admin dashboard UI with backend hooks */