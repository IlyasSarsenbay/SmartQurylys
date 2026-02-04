# Инструкция по применению миграции для уведомлений о лицензиях

## Проблема 1 (РЕШЕНА)
При попытке одобрить или отклонить лицензию возникала ошибка:
```
ОШИБКА: значение NULL в столбце "sender_id" отношения "notifications" нарушает ограничение NOT NULL
```

## Проблема 2 (ТЕКУЩАЯ)
После исправления первой проблемы возникает новая ошибка:
```
ОШИБКА: новая строка в отношении "notifications" нарушает ограничение-проверку "notifications_type_check"
```

Это означает, что в базе данных есть CHECK constraint, который не включает новые типы уведомлений `LICENSE_APPROVED` и `LICENSE_REJECTED`.

## Решение - Выполните ОБА SQL-запроса

### Шаг 1: Сделать sender_id nullable (УЖЕ ВЫПОЛНЕНО)

```sql
ALTER TABLE notifications 
ALTER COLUMN sender_id DROP NOT NULL;
```

### Шаг 2: Обновить ограничение на поле type (ВЫПОЛНИТЕ СЕЙЧАС)

```sql
-- Удаляем старое ограничение
ALTER TABLE notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Создаем новое ограничение с дополнительными типами
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
```

## Как выполнить миграцию

### Вариант 1: Через psql (РЕКОМЕНДУЕТСЯ)

Выполните оба запроса одной командой:

```bash
psql -U postgres -d smartqurylys << EOF
ALTER TABLE notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

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
EOF
```

### Вариант 2: Через pgAdmin

1. Откройте pgAdmin
2. Подключитесь к базе данных `smartqurylys`
3. Откройте Query Tool (Tools → Query Tool)
4. Скопируйте и выполните SQL из Шага 2 выше
5. Нажмите Execute (F5)

### Вариант 3: Через любой SQL-клиент

Просто выполните оба SQL-запроса из Шага 2 в вашем клиенте PostgreSQL.

## После выполнения миграции

1. ✅ **НЕ НУЖНО** перезапускать backend (изменения применяются сразу)
2. ✅ Попробуйте снова одобрить или отклонить лицензию
3. ✅ Организация должна получить уведомление с отправителем "Система"

## Проверка успешности миграции

Выполните этот запрос, чтобы убедиться, что ограничение обновлено:

```sql
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'notifications'::regclass 
AND contype = 'c';
```

Вы должны увидеть, что `notifications_type_check` включает `LICENSE_APPROVED` и `LICENSE_REJECTED`.

## Что изменилось

- Поле `sender_id` в таблице `notifications` теперь может быть NULL ✅
- CHECK constraint на поле `type` теперь включает новые типы уведомлений ⚠️ (нужно выполнить)
- Это позволяет создавать системные уведомления об одобрении/отклонении лицензий
- В интерфейсе такие уведомления будут отображаться как отправленные "Системой"

