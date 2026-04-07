-- Удаление неиспользуемых колонок contractors и resources из таблицы stages.
ALTER TABLE stages DROP COLUMN IF EXISTS contractors;
ALTER TABLE stages DROP COLUMN IF EXISTS resources;
