-- Проверка текущего ограничения на поле type в таблице notifications
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'notifications'::regclass 
AND contype = 'c';
