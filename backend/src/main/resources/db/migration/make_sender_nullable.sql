-- Миграция для изменения ограничения NOT NULL на поле sender_id в таблице notifications
-- Это позволит создавать системные уведомления без конкретного отправителя

ALTER TABLE notifications 
ALTER COLUMN sender_id DROP NOT NULL;

-- Обновляем существующие типы уведомлений, добавляя новые типы для лицензий
-- (Hibernate автоматически обновит ENUM, но для справки)
-- Новые типы: LICENSE_APPROVED, LICENSE_REJECTED
