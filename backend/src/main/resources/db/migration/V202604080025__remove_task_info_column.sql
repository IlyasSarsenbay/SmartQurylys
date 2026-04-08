-- Remove the redundant 'info' column from the tasks table
ALTER TABLE tasks DROP COLUMN IF EXISTS info;
