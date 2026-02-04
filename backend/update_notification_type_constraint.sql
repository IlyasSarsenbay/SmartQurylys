-- Удаляем старый constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Добавляем новый constraint с типом STAGE_REACTIVATION
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('INVITATION', 'PROJECT_UPDATE', 'FILE_UPLOAD', 'TASK_ASSIGNMENT', 'MENTION', 'STAGE_REACTIVATION'));
