-- Add first_name and last_name columns to users table
ALTER TABLE users
ADD COLUMN first_name VARCHAR(50) NULL AFTER username,
ADD COLUMN last_name VARCHAR(50) NULL AFTER first_name;