-- ===================================
-- Performance Indexes for Karkey Database
-- Run this script to improve query performance
-- ===================================

-- Indexes for vehicles table (search and filter optimization)
CREATE INDEX IF NOT EXISTS idx_vehicles_make ON vehicles(make);
CREATE INDEX IF NOT EXISTS idx_vehicles_model ON vehicles(model);
CREATE INDEX IF NOT EXISTS idx_vehicles_year ON vehicles(year);
CREATE INDEX IF NOT EXISTS idx_vehicles_fuel_type ON vehicles(fuel_type);
CREATE INDEX IF NOT EXISTS idx_vehicles_transmission ON vehicles(transmission);
CREATE INDEX IF NOT EXISTS idx_vehicles_mileage ON vehicles(mileage);
CREATE INDEX IF NOT EXISTS idx_vehicles_engine_size ON vehicles(engine_size);
CREATE INDEX IF NOT EXISTS idx_vehicles_doors ON vehicles(doors);
CREATE INDEX IF NOT EXISTS idx_vehicles_vehicle_condition ON vehicles(vehicle_condition);

-- Composite indexes for common filter combinations
CREATE INDEX IF NOT EXISTS idx_vehicles_verification_active ON vehicles(verification_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vehicles_make_model ON vehicles(make, model);
CREATE INDEX IF NOT EXISTS idx_vehicles_search_combo ON vehicles(verification_status, make, model, year);

-- Index for location search (first part of location string)
-- Note: For SUBSTRING_INDEX queries, consider adding a computed column
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS city VARCHAR(100) GENERATED ALWAYS AS (TRIM(SUBSTRING_INDEX(location, ',', 1))) STORED;
CREATE INDEX IF NOT EXISTS idx_vehicles_city ON vehicles(city);

-- Indexes for auctions table
CREATE INDEX IF NOT EXISTS idx_auctions_vehicle_status ON auctions(vehicle_id, status);
CREATE INDEX IF NOT EXISTS idx_auctions_status_dates ON auctions(status, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_auctions_active_vehicle ON auctions(status, vehicle_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_auctions_starting_price ON auctions(starting_price);

-- Composite index for common auction queries
CREATE INDEX IF NOT EXISTS idx_auctions_vehicle_active_created ON auctions(vehicle_id, status, created_at DESC);

-- Indexes for direct_sales table
CREATE INDEX IF NOT EXISTS idx_direct_sales_verification_sale ON direct_sales(verification_status, sale_status);
CREATE INDEX IF NOT EXISTS idx_direct_sales_make ON direct_sales(make);
CREATE INDEX IF NOT EXISTS idx_direct_sales_model ON direct_sales(model);
CREATE INDEX IF NOT EXISTS idx_direct_sales_year ON direct_sales(year);
CREATE INDEX IF NOT EXISTS idx_direct_sales_fuel_type ON direct_sales(fuel_type);
CREATE INDEX IF NOT EXISTS idx_direct_sales_transmission ON direct_sales(transmission);
CREATE INDEX IF NOT EXISTS idx_direct_sales_price ON direct_sales(price);
CREATE INDEX IF NOT EXISTS idx_direct_sales_vehicle_condition ON direct_sales(vehicle_condition);

-- Composite index for direct sales filtering
CREATE INDEX IF NOT EXISTS idx_direct_sales_active_combo ON direct_sales(verification_status, sale_status, make, model);

-- Indexes for vehicle_photos table (already has some, but add composite)
CREATE INDEX IF NOT EXISTS idx_vehicle_photos_vehicle_order ON vehicle_photos(vehicle_id, position_order);

-- Indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_verification ON users(verification_status);
CREATE INDEX IF NOT EXISTS idx_users_type_verification ON users(user_type, verification_status);

-- Indexes for notifications table
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);

-- Indexes for bids table (if exists)
CREATE INDEX IF NOT EXISTS idx_bids_auction_created ON bids(auction_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bids_user_auction ON bids(user_id, auction_id);

-- ===================================
-- Analyze tables after adding indexes
-- ===================================
ANALYZE TABLE vehicles;
ANALYZE TABLE auctions;
ANALYZE TABLE direct_sales;
ANALYZE TABLE vehicle_photos;
ANALYZE TABLE users;
ANALYZE TABLE notifications;
