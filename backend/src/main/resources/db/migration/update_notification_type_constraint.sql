-- Миграция для обновления ограничения на поле type в таблице notifications
-- Добавляем новые типы уведомлений: LICENSE_APPROVED и LICENSE_REJECTED

-- Шаг 1: Удаляем старое ограничение
ALTER TABLE notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Шаг 2: Создаем новое ограничение с дополнительными типами
ALTER TABLE notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
    'INVITATION', 
    'PROJECT_UPDATE', 
    'FILE_UPLOAD', 
    'TASK_ASSIGNMENT', 
    'MENTION', 
    'STAGE_REACTIVATION',
    'LICENSE_APPROVED',
    'LICENSE_REJECTED'
));
