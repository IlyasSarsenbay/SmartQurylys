-- Сброс последовательностей идентификаторов для таблиц, в которые
-- в начальных миграциях были вставлены записи с явно заданными ID.
-- Это приводило к тому, что новые записи получали маленькие ID (начиная с 1),
-- меньше уже существующих, и при сортировке по ID ASC отображались первыми.

-- Сброс последовательности для таблицы stages (макс. ID в данных: 35)
SELECT setval(
    pg_get_serial_sequence('stages', 'id'),
    COALESCE((SELECT MAX(id) FROM stages), 1)
);

-- Сброс последовательности для таблицы schedules (макс. ID в данных: 21)
SELECT setval(
    pg_get_serial_sequence('schedules', 'id'),
    COALESCE((SELECT MAX(id) FROM schedules), 1)
);

-- Сброс последовательности для таблицы tasks (макс. ID в данных: 67)
SELECT setval(
    pg_get_serial_sequence('tasks', 'id'),
    COALESCE((SELECT MAX(id) FROM tasks), 1)
);
