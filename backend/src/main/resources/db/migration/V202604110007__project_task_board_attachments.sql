ALTER TABLE public.files
ADD COLUMN IF NOT EXISTS project_task_board_task_id bigint;

ALTER TABLE public.files
DROP CONSTRAINT IF EXISTS fk_files_project_task_board_task;

ALTER TABLE public.files
ADD CONSTRAINT fk_files_project_task_board_task
    FOREIGN KEY (project_task_board_task_id)
    REFERENCES public.project_task_board_tasks(id)
    ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_files_project_task_board_task_id
    ON public.files(project_task_board_task_id);
