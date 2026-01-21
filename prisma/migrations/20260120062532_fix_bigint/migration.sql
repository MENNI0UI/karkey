-- CreateTable
CREATE TABLE `_migrations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `executed_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `name`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admins` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(50) NOT NULL,
    `prenom` VARCHAR(50) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` ENUM('ceo', 'verification', 'finance', 'support') NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `password_version` INTEGER NOT NULL DEFAULT 1,
    `email` VARCHAR(255) NULL,
    `recovery_key` VARCHAR(64) NULL,

    INDEX `idx_admins_role`(`role`),
    INDEX `idx_admins_recovery_key`(`recovery_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blacklists` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `admin_id` INTEGER NULL,
    `reason` TEXT NULL,
    `expires_at` DATETIME(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `unique_blacklist_user`(`user_id`),
    INDEX `admin_id`(`admin_id`),
    INDEX `idx_blacklists_expires_at`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `deposits` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `auction_id` INTEGER NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `status` ENUM('pending', 'paid', 'refunded', 'failed') NOT NULL DEFAULT 'pending',
    `method` ENUM('card', 'bank', 'cash', 'other') NOT NULL DEFAULT 'card',
    `reference` VARCHAR(191) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `auction_id`(`auction_id`),
    INDEX `idx_deposits_status`(`status`),
    INDEX `idx_deposits_user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `direct_sale_photos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `direct_sale_id` INTEGER NOT NULL,
    `photo_url` VARCHAR(500) NOT NULL,
    `position_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_direct_sale_photos_direct_sale_id`(`direct_sale_id`),
    INDEX `idx_direct_sale_photos_order`(`direct_sale_id`, `position_order`),
    INDEX `idx_direct_sale_photos_position`(`position_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `direct_sales` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `make` VARCHAR(100) NOT NULL,
    `model` VARCHAR(100) NOT NULL,
    `year` INTEGER NOT NULL,
    `mileage` INTEGER NOT NULL,
    `transmission` ENUM('manual', 'automatic') NOT NULL,
    `fuel_type` ENUM('gasoline', 'diesel', 'electric', 'hybrid') NOT NULL,
    `engine_size` VARCHAR(20) NULL,
    `doors` VARCHAR(10) NULL,
    `vehicle_condition` ENUM('excellent', 'good', 'fair', 'poor') NOT NULL,
    `location` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `price` DECIMAL(12, 2) NOT NULL,
    `carte_grise_url` VARCHAR(500) NULL,
    `service_history_url` VARCHAR(500) NULL,
    `verification_status` ENUM('pending', 'approved', 'rejected') NULL DEFAULT 'pending',
    `rejected_reason` TEXT NULL,
    `reviewed_by` INTEGER NULL,
    `reviewed_at` TIMESTAMP(0) NULL,
    `sale_status` ENUM('available', 'sold', 'reserved', 'cancelled') NULL DEFAULT 'available',
    `buyer_id` INTEGER NULL,
    `sold_at` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `exterior_color` VARCHAR(50) NULL,
    `interior_color` VARCHAR(50) NULL,
    `is_original_paint` BOOLEAN NULL DEFAULT true,
    `special_features` TEXT NULL,
    `auction_consent` BOOLEAN NULL DEFAULT false,
    `auction_reserve_price` DECIMAL(12, 2) NULL,
    `auction_starting_price` DECIMAL(12, 2) NULL,
    `moved_to_auction_at` TIMESTAMP(0) NULL,
    `returned_from_auction_at` TIMESTAMP(0) NULL,
    `auction_bid_count` INTEGER NULL DEFAULT 0,
    `auction_current_bid` DECIMAL(12, 2) NULL,
    `auction_end_date` DATETIME(0) NULL,
    `auction_mode` BOOLEAN NULL DEFAULT false,
    `auction_start_date` DATETIME(0) NULL,
    `auction_status` ENUM('none', 'pending', 'active', 'completed', 'reserve_not_met', 'ended_no_bids') NULL DEFAULT 'none',
    `auction_winner_id` INTEGER NULL,
    `views` INTEGER NOT NULL DEFAULT 0,

    INDEX `buyer_id`(`buyer_id`),
    INDEX `idx_direct_sales_user_id`(`user_id`),
    INDEX `reviewed_by`(`reviewed_by`),
    INDEX `idx_direct_sales_make_model`(`make`, `model`),
    INDEX `direct_sales_make_year_idx`(`make`, `year`),
    INDEX `direct_sales_location_price_idx`(`location`, `price`),
    INDEX `direct_sales_fuel_type_idx`(`fuel_type`),
    INDEX `direct_sales_transmission_idx`(`transmission`),
    INDEX `direct_sales_sale_status_idx`(`sale_status`),
    INDEX `direct_sales_verification_status_idx`(`verification_status`),
    INDEX `direct_sales_created_at_idx`(`created_at`),
    INDEX `direct_sales_auction_consent_idx`(`auction_consent`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `direct_sales_contacts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `direct_sale_id` INTEGER NOT NULL,
    `user_id` INTEGER NULL,
    `name` VARCHAR(255) NULL,
    `email` VARCHAR(255) NULL,
    `phone` VARCHAR(100) NULL,
    `message` TEXT NULL,
    `processed` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_direct_sale_id`(`direct_sale_id`),
    INDEX `idx_user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `direct_sales_saved_searches` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `params` LONGTEXT NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `last_notified_at` DATETIME(0) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `direct_sales_watchlist` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `direct_sale_id` INTEGER NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `unique_user_direct_sale`(`user_id`, `direct_sale_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inspections` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `vehicle_id` INTEGER NOT NULL,
    `requested_by` INTEGER NOT NULL,
    `scheduled_at` DATETIME(0) NULL,
    `status` ENUM('pending', 'scheduled', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    `report_url` VARCHAR(500) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_inspections_status`(`status`),
    INDEX `idx_inspections_vehicle_id`(`vehicle_id`),
    INDEX `requested_by`(`requested_by`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoices` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `subscription_id` INTEGER NULL,
    `deposit_id` INTEGER NULL,
    `total` DECIMAL(12, 2) NOT NULL,
    `status` ENUM('draft', 'issued', 'paid', 'void', 'refunded') NOT NULL DEFAULT 'issued',
    `issued_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `due_at` DATETIME(0) NULL,
    `paid_at` DATETIME(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `deposit_id`(`deposit_id`),
    INDEX `idx_invoices_status`(`status`),
    INDEX `idx_invoices_user_id`(`user_id`),
    INDEX `subscription_id`(`subscription_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `type` ENUM('success', 'error', 'info', 'warning', 'auction_migration', 'auction_return', 'auction_won', 'auction_outbid', 'auction_sold', 'auction_reserve_not_met', 'auction_no_bids') NULL DEFAULT 'info',
    `is_read` BOOLEAN NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `auction_id` INTEGER NULL,
    `showroom_id` INTEGER NULL,

    INDEX `auction_id`(`auction_id`),
    INDEX `idx_notifications_is_read`(`is_read`),
    INDEX `idx_notifications_showroom_id`(`showroom_id`),
    INDEX `idx_notifications_user_created`(`user_id`, `created_at`),
    INDEX `idx_notifications_user_id`(`user_id`),
    INDEX `idx_notifications_user_read`(`user_id`, `is_read`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `invoice_id` INTEGER NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `status` ENUM('pending', 'succeeded', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
    `provider` ENUM('stripe', 'paypal', 'transfer', 'cash', 'other') NOT NULL DEFAULT 'other',
    `provider_ref` VARCHAR(191) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_payments_status`(`status`),
    INDEX `idx_payments_user_id`(`user_id`),
    INDEX `invoice_id`(`invoice_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `plans` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `name_ar` VARCHAR(100) NULL,
    `name_fr` VARCHAR(100) NULL,
    `name_es` VARCHAR(100) NULL,
    `price` DECIMAL(12, 2) NOT NULL,
    `currency` CHAR(3) NOT NULL DEFAULT 'MAD',
    `duration_days` INTEGER NOT NULL,
    `bid_limit` INTEGER NULL,
    `description` TEXT NULL,
    `description_ar` TEXT NULL,
    `description_fr` TEXT NULL,
    `description_es` TEXT NULL,
    `features` LONGTEXT NULL,
    `features_ar` LONGTEXT NULL,
    `features_fr` LONGTEXT NULL,
    `features_es` LONGTEXT NULL,
    `popular` BOOLEAN NULL DEFAULT false,
    `priority` INTEGER NULL DEFAULT 0,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_plans_priority`(`priority`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `requests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `type` ENUM('verification', 'auction', 'withdrawal', 'support', 'other') NOT NULL DEFAULT 'other',
    `status` ENUM('pending', 'approved', 'rejected', 'cancelled', 'in_progress') NOT NULL DEFAULT 'pending',
    `payload` LONGTEXT NULL,
    `admin_notes` TEXT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_requests_status`(`status`),
    INDEX `idx_requests_user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `saved_searches` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `params` LONGTEXT NOT NULL,
    `is_active` BOOLEAN NULL DEFAULT true,
    `last_notified_at` DATETIME(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_created_at`(`created_at`),
    INDEX `idx_is_active`(`is_active`),
    INDEX `idx_user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `showroom` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `make` VARCHAR(50) NOT NULL,
    `model` VARCHAR(100) NOT NULL,
    `year` INTEGER NOT NULL,
    `mileage_km` INTEGER NULL,
    `condition` VARCHAR(20) NOT NULL,
    `fuel_type` VARCHAR(20) NOT NULL,
    `engine_size` DECIMAL(3, 1) NULL,
    `doors` INTEGER NULL,
    `transmission` VARCHAR(20) NOT NULL,
    `location` VARCHAR(100) NOT NULL,
    `description` TEXT NOT NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `exterior_color` VARCHAR(50) NULL,
    `interior_color` VARCHAR(50) NULL,
    `is_original_paint` BOOLEAN NULL DEFAULT true,

    INDEX `fk_showroom_user`(`user_id`),
    INDEX `showroom_make_model_idx`(`make`, `model`),
    INDEX `showroom_make_year_idx`(`make`, `year`),
    INDEX `showroom_location_idx`(`location`),
    INDEX `showroom_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `showroom_interests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `showroom_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_interest_user`(`user_id`),
    UNIQUE INDEX `uniq_interest`(`showroom_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `showroom_photos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `showroom_id` INTEGER NOT NULL,
    `photo_url` VARCHAR(500) NOT NULL,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_showroom_photos_showroom`(`showroom_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `showroom_saved_searches` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `params` LONGTEXT NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `last_notified_at` DATETIME(0) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subscriptions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `plan_id` INTEGER NOT NULL,
    `status` ENUM('pending', 'active', 'expired', 'cancelled') NOT NULL DEFAULT 'pending',
    `start_date` DATETIME(0) NULL,
    `end_date` DATETIME(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_subscriptions_status`(`status`),
    INDEX `idx_subscriptions_user_id`(`user_id`),
    INDEX `plan_id`(`plan_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(20) NOT NULL,
    `first_name` VARCHAR(50) NULL,
    `last_name` VARCHAR(50) NULL,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NULL,
    `phone_number` VARCHAR(20) NULL,
    `profile_picture` VARCHAR(500) NULL,
    `user_type` ENUM('individual', 'dealer', 'company') NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `google_id` VARCHAR(255) NULL,
    `is_profile_complete` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `username`(`username`),
    UNIQUE INDEX `email`(`email`),
    UNIQUE INDEX `google_id`(`google_id`),
    INDEX `idx_users_email`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `auction_reminders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `user_id` INTEGER NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `language` VARCHAR(5) NOT NULL DEFAULT 'en',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `unique_email`(`email`),
    INDEX `idx_user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `verification_log` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `entity_type` ENUM('user', 'vehicle') NOT NULL,
    `entity_id` INTEGER NOT NULL,
    `action` ENUM('approved', 'rejected') NOT NULL,
    `reason` VARCHAR(500) NULL,
    `admin_id` INTEGER NOT NULL,
    `admin_name` VARCHAR(100) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_verification_log_action`(`action`),
    INDEX `idx_verification_log_admin`(`admin_id`),
    INDEX `idx_verification_log_date`(`created_at`),
    INDEX `idx_verification_log_entity`(`entity_type`, `entity_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `karkey_cars` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `make` VARCHAR(100) NOT NULL,
    `model` VARCHAR(100) NOT NULL,
    `year` INTEGER NOT NULL,
    `mileage` INTEGER NOT NULL,
    `transmission` ENUM('manual', 'automatic') NOT NULL,
    `fuel_type` ENUM('gasoline', 'diesel', 'electric', 'hybrid') NOT NULL,
    `engine_size` VARCHAR(20) NULL,
    `doors` VARCHAR(10) NULL,
    `vehicle_condition` ENUM('excellent', 'good', 'fair', 'poor') NOT NULL,
    `location` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `price` DECIMAL(12, 2) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `added_by` INTEGER NOT NULL,
    `exterior_color` VARCHAR(50) NULL,
    `interior_color` VARCHAR(50) NULL,
    `is_original_paint` BOOLEAN NULL DEFAULT true,
    `special_features` TEXT NULL,

    INDEX `idx_karkey_cars_active`(`is_active`),
    INDEX `idx_karkey_cars_added_by`(`added_by`),
    INDEX `karkey_cars_make_model_idx`(`make`, `model`),
    INDEX `karkey_cars_make_year_idx`(`make`, `year`),
    INDEX `karkey_cars_location_price_idx`(`location`, `price`),
    INDEX `karkey_cars_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `karkey_car_photos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `karkey_car_id` INTEGER NOT NULL,
    `photo_url` VARCHAR(500) NOT NULL,
    `position_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_karkey_car_photos_car_id`(`karkey_car_id`),
    INDEX `idx_karkey_car_photos_order`(`karkey_car_id`, `position_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `karkey_car_inquiries` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `karkey_car_id` INTEGER NOT NULL,
    `user_id` INTEGER NULL,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NULL,
    `phone` VARCHAR(100) NULL,
    `message` TEXT NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `is_processed` BOOLEAN NOT NULL DEFAULT false,
    `processed_at` TIMESTAMP(0) NULL,
    `processed_by` INTEGER NULL,

    INDEX `idx_karkey_car_inquiries_car_id`(`karkey_car_id`),
    INDEX `idx_karkey_car_inquiries_processed`(`is_processed`),
    INDEX `idx_karkey_car_inquiries_user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `verification_codes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `code` VARCHAR(6) NOT NULL,
    `type` ENUM('email', 'phone') NOT NULL DEFAULT 'email',
    `expires_at` DATETIME(0) NOT NULL,
    `verified` BOOLEAN NOT NULL DEFAULT false,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_verification_codes_email_type`(`email`, `type`),
    INDEX `idx_verification_codes_code`(`code`),
    INDEX `idx_verification_codes_expires`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `blacklists` ADD CONSTRAINT `blacklists_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `blacklists` ADD CONSTRAINT `blacklists_ibfk_2` FOREIGN KEY (`admin_id`) REFERENCES `admins`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `deposits` ADD CONSTRAINT `deposits_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `direct_sale_photos` ADD CONSTRAINT `direct_sale_photos_ibfk_1` FOREIGN KEY (`direct_sale_id`) REFERENCES `direct_sales`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `direct_sales` ADD CONSTRAINT `direct_sales_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `direct_sales` ADD CONSTRAINT `direct_sales_ibfk_2` FOREIGN KEY (`reviewed_by`) REFERENCES `admins`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `direct_sales` ADD CONSTRAINT `direct_sales_ibfk_3` FOREIGN KEY (`buyer_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `inspections` ADD CONSTRAINT `inspections_ibfk_2` FOREIGN KEY (`requested_by`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_ibfk_2` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_ibfk_3` FOREIGN KEY (`deposit_id`) REFERENCES `deposits`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `fk_notifications_showroom` FOREIGN KEY (`showroom_id`) REFERENCES `showroom`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `requests` ADD CONSTRAINT `requests_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `saved_searches` ADD CONSTRAINT `saved_searches_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `showroom` ADD CONSTRAINT `fk_showroom_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `showroom_interests` ADD CONSTRAINT `fk_interest_showroom` FOREIGN KEY (`showroom_id`) REFERENCES `showroom`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `showroom_interests` ADD CONSTRAINT `fk_interest_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `showroom_photos` ADD CONSTRAINT `fk_showroom_photos_showroom` FOREIGN KEY (`showroom_id`) REFERENCES `showroom`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `showroom_saved_searches` ADD CONSTRAINT `fk_showroom_saved_searches_user_id` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_ibfk_2` FOREIGN KEY (`plan_id`) REFERENCES `plans`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `auction_reminders` ADD CONSTRAINT `auction_reminders_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `karkey_car_photos` ADD CONSTRAINT `karkey_car_photos_karkey_car_id_fkey` FOREIGN KEY (`karkey_car_id`) REFERENCES `karkey_cars`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `karkey_car_inquiries` ADD CONSTRAINT `karkey_car_inquiries_karkey_car_id_fkey` FOREIGN KEY (`karkey_car_id`) REFERENCES `karkey_cars`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
