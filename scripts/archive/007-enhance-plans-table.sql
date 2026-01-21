-- ============================================
-- Migration: Enhance plans table with additional fields
-- Run: mysql -u root -p karkey < scripts/007-enhance-plans-table.sql
-- ============================================

USE karkey;

-- Add description column
ALTER TABLE plans ADD COLUMN IF NOT EXISTS description TEXT NULL AFTER bid_limit;

-- Add features as JSON array
ALTER TABLE plans ADD COLUMN IF NOT EXISTS features JSON NULL AFTER description;

-- Add popular flag for highlighting
ALTER TABLE plans ADD COLUMN IF NOT EXISTS popular BOOLEAN DEFAULT FALSE AFTER features;

-- Add priority for ordering (higher = first)
ALTER TABLE plans ADD COLUMN IF NOT EXISTS priority INT DEFAULT 0 AFTER popular;

-- Create index for ordering
CREATE INDEX IF NOT EXISTS idx_plans_priority ON plans(priority DESC);

-- Insert default plans if table is empty
INSERT INTO plans (name, price, currency, duration_days, bid_limit, description, features, popular, priority, status)
SELECT * FROM (
  SELECT 
    'Starter' as name,
    199.00 as price,
    'DH' as currency,
    30 as duration_days,
    3 as bid_limit,
    'Perfect for individual sellers looking to list a few vehicles each month' as description,
    '["Up to 3 active auctions", "Up to 5 showroom listings", "Standard listing visibility", "Basic auction analytics", "Email support", "7-day listing duration", "Photo uploads (up to 10 per listing)"]' as features,
    FALSE as popular,
    1 as priority,
    'active' as status
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE name = 'Starter');

INSERT INTO plans (name, price, currency, duration_days, bid_limit, description, features, popular, priority, status)
SELECT * FROM (
  SELECT 
    'Accelerator' as name,
    299.00 as price,
    'DH' as currency,
    30 as duration_days,
    15 as bid_limit,
    'Ideal for dealers and frequent sellers who need more visibility and tools' as description,
    '["Up to 15 active auctions", "Up to 30 showroom listings", "Priority listing placement", "Advanced auction analytics", "Priority email & chat support", "14-day listing duration", "Photo uploads (up to 25 per listing)", "Featured badge on listings", "Bid notifications & alerts"]' as features,
    TRUE as popular,
    2 as priority,
    'active' as status
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE name = 'Accelerator');

INSERT INTO plans (name, price, currency, duration_days, bid_limit, description, features, popular, priority, status)
SELECT * FROM (
  SELECT 
    'Prestige' as name,
    399.00 as price,
    'DH' as currency,
    30 as duration_days,
    NULL as bid_limit,
    'For large dealerships and professionals who need unlimited access and premium support' as description,
    '["Unlimited active auctions", "Unlimited showroom listings", "Top placement in search results", "Full analytics dashboard", "Dedicated account manager", "30-day listing duration", "Unlimited photo uploads", "Verified dealer badge", "Early access to new features", "Custom branding options"]' as features,
    FALSE as popular,
    3 as priority,
    'active' as status
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM plans WHERE name = 'Prestige');

-- Show result
SELECT id, name, price, currency, popular, priority, status FROM plans ORDER BY priority DESC;
