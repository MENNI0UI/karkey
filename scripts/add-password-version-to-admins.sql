-- Add password_version column to admins table
-- This is used to invalidate sessions when password is changed

ALTER TABLE admins 
ADD COLUMN password_version INT DEFAULT 1 NOT NULL;

-- Update existing admins to have version 1
UPDATE admins SET password_version = 1 WHERE password_version IS NULL;
