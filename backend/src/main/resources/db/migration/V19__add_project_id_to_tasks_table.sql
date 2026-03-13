ALTER TABLE tasks
ADD COLUMN project_id bigint,
ALTER COLUMN stage_id DROP NOT NULL;