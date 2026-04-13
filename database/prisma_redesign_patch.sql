-- Prisma redesign patch for runtime/schema drift alignment
-- Safe to run multiple times on MySQL 8+

SET @db_name = DATABASE();

-- 1) users.status: add rejected state used by admin rejection flow
ALTER TABLE users
  MODIFY COLUMN status ENUM('active', 'pending', 'suspended', 'deleted', 'rejected') DEFAULT 'active';

-- 2) staff_members.event_id: required by staff assignment and scanner flows
SET @has_staff_event_id = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'staff_members'
    AND COLUMN_NAME = 'event_id'
);

SET @sql_add_staff_event_id = IF(
  @has_staff_event_id = 0,
  'ALTER TABLE staff_members ADD COLUMN event_id VARCHAR(36) NULL AFTER organizer_id',
  'SELECT 1'
);
PREPARE stmt FROM @sql_add_staff_event_id;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_staff_event_idx = (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'staff_members'
    AND INDEX_NAME = 'idx_staff_event'
);

SET @sql_add_staff_event_idx = IF(
  @has_staff_event_idx = 0,
  'ALTER TABLE staff_members ADD INDEX idx_staff_event (event_id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql_add_staff_event_idx;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_staff_event_fk = (
  SELECT COUNT(*)
  FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'staff_members'
    AND CONSTRAINT_NAME = 'fk_staff_members_event_id'
);

SET @sql_add_staff_event_fk = IF(
  @has_staff_event_fk = 0,
  'ALTER TABLE staff_members ADD CONSTRAINT fk_staff_members_event_id FOREIGN KEY (event_id) REFERENCES events(id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql_add_staff_event_fk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3) orders.tx_ref: required for payment verification callbacks
SET @has_orders_tx_ref = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'tx_ref'
);

SET @sql_add_orders_tx_ref = IF(
  @has_orders_tx_ref = 0,
  'ALTER TABLE orders ADD COLUMN tx_ref VARCHAR(100) NULL AFTER payment_method',
  'SELECT 1'
);
PREPARE stmt FROM @sql_add_orders_tx_ref;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_orders_tx_ref_idx = (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'orders'
    AND INDEX_NAME = 'uq_orders_tx_ref'
);

SET @sql_add_orders_tx_ref_idx = IF(
  @has_orders_tx_ref_idx = 0,
  'ALTER TABLE orders ADD UNIQUE KEY uq_orders_tx_ref (tx_ref)',
  'SELECT 1'
);
PREPARE stmt FROM @sql_add_orders_tx_ref_idx;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4) events.avg_rating: required by review update flow
SET @has_events_avg_rating = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'events'
    AND COLUMN_NAME = 'avg_rating'
);

SET @sql_add_events_avg_rating = IF(
  @has_events_avg_rating = 0,
  'ALTER TABLE events ADD COLUMN avg_rating DECIMAL(3,2) DEFAULT 0.00 AFTER address_line1',
  'SELECT 1'
);
PREPARE stmt FROM @sql_add_events_avg_rating;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5) platform_fee_payments canonical runtime table
CREATE TABLE IF NOT EXISTS platform_fee_payments (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50),
  status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
  tx_ref VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  UNIQUE KEY uq_platform_fee_tx_ref (tx_ref),
  INDEX idx_platform_fee_user (user_id),
  CONSTRAINT fk_platform_fee_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 6) payouts canonical runtime table
CREATE TABLE IF NOT EXISTS payouts (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  method VARCHAR(50),
  details TEXT,
  status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
  tx_ref VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  UNIQUE KEY uq_payout_tx_ref (tx_ref),
  INDEX idx_payout_user (user_id),
  CONSTRAINT fk_payout_user FOREIGN KEY (user_id) REFERENCES users(id)
);

/* Update for: feat(engine): build review form and public review board component */
/* Update for: feat(engine): add POST /api/reviews and GET /api/reviews/event/:eventId endpoints */
/* Update for: feat(engine): implement scheduled moderation tasks and cron-based maintenance jobs */
/* Update for: feat(engine): finalize attendee_reviews and event_access_logs schema */
/* Update for: feat(engine): finalize attendee_reviews and event_access_logs schema */