-- Добавляет столбец для хранения времени подачи запроса на принятие задачи.
-- Используется для вычисления задержек в модальном окне "Сроки".
ALTER TABLE public.tasks
    ADD COLUMN IF NOT EXISTS execution_requested_at TIMESTAMP;
