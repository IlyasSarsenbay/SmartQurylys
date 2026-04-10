ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'TASK_REVIEW_REQUESTED';

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
    ADD CONSTRAINT notifications_type_check
    CHECK (type::text = ANY (ARRAY[
        'INVITATION'::text,
        'PROJECT_UPDATE'::text,
        'FILE_UPLOAD'::text,
        'TASK_ASSIGNMENT'::text,
        'TASK_REVIEW_REQUESTED'::text,
        'MENTION'::text,
        'STAGE_REACTIVATION'::text,
        'LICENSE_APPROVED'::text,
        'LICENSE_REJECTED'::text,
        'TASK_ACCEPTED'::text,
        'TASK_DECLINED'::text,
        'TASK_RETURNED'::text
    ]));
