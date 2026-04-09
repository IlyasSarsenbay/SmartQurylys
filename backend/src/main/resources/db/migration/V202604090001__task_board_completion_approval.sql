CREATE TYPE project_task_board_completion_status AS ENUM (
    'NONE',
    'PENDING',
    'APPROVED',
    'REJECTED'
);

ALTER TABLE public.project_task_board_tasks
ADD COLUMN completion_status project_task_board_completion_status NOT NULL DEFAULT 'NONE',
ADD COLUMN completion_requested_by_participant_id bigint,
ADD COLUMN completion_requested_at timestamp,
ADD COLUMN completion_reviewed_by_user_id bigint,
ADD COLUMN completion_reviewed_at timestamp,
ADD COLUMN completion_review_reason text;

ALTER TABLE public.project_task_board_tasks
ADD CONSTRAINT fk_project_task_board_task_completion_requested_by
    FOREIGN KEY (completion_requested_by_participant_id)
    REFERENCES public.participants(id)
    ON DELETE SET NULL;

ALTER TABLE public.project_task_board_tasks
ADD CONSTRAINT fk_project_task_board_task_completion_reviewed_by
    FOREIGN KEY (completion_reviewed_by_user_id)
    REFERENCES public.users(id)
    ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_project_task_board_tasks_completion_status
    ON public.project_task_board_tasks(completion_status);
