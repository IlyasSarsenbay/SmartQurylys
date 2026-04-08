ALTER TABLE public.participants
ADD COLUMN IF NOT EXISTS is_owner boolean NOT NULL DEFAULT false;

UPDATE public.participants
SET is_owner = false
WHERE is_owner IS DISTINCT FROM false;

INSERT INTO public.participants (
    role,
    user_id,
    project_id,
    is_owner,
    can_upload_documents,
    can_send_notifications
)
SELECT
    'Владелец проекта',
    p.user_id,
    p.id,
    true,
    true,
    true
FROM public.projects p
WHERE NOT EXISTS (
    SELECT 1
    FROM public.participants pt
    WHERE pt.project_id = p.id
      AND pt.user_id = p.user_id
);

UPDATE public.participants pt
SET
    is_owner = true,
    role = CASE
        WHEN pt.role IS NULL OR btrim(pt.role) = '' THEN 'Владелец проекта'
        ELSE pt.role
    END,
    can_upload_documents = true,
    can_send_notifications = true
FROM public.projects p
WHERE pt.project_id = p.id
  AND pt.user_id = p.user_id;

CREATE UNIQUE INDEX IF NOT EXISTS ux_participants_project_user
ON public.participants (project_id, user_id);
