-- Add first_name and last_name columns to users table (if they don't exist)
-- The statements will fail if columns already exist, but that's okay
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(50) NULL AFTER username;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(50) NULL AFTER first_name;

-- Add index for better performance
ALTER TABLE users ADD INDEX IF NOT EXISTS idx_name (first_name, last_name);
